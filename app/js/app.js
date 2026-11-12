/* app.js — コーヒー知識学習アプリ（静的版）UI
 *
 * 記録はすべて localStorage（CKAStore）。サーバー通信は一切しない。
 * 画面: ホーム / テーマ選択 / クイズ / 結果 / 用語カード / 用語辞書 / 統計
 * 設定は右上の歯車オーバーレイ。下部バーは置かない。
 */
(function () {
  'use strict';
  var E = window.CKAEngine;
  var Store = window.CKAStore;
  var Terms = window.CKATerms;
  var Media = window.CKAMedia;

  var DATA = null;        // 読み込んだデータ一式
  var termIndex = null;   // 用語リンク用インデックス
  var byId = {};          // question id -> question
  var termByName = {};    // term -> glossary obj
  var countryNames = null;

  var $app = null;
  var currentView = 'home';

  /* ---------- 小物 ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(node) { node.textContent = ''; return node; }
  function catName(id) {
    var c = E.CATEGORIES.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }
  function esc(s) { return String(s == null ? '' : s); }

  /* ---------- 起動 ---------- */
  function boot() {
    $app = document.getElementById('app');
    document.getElementById('gear-btn').addEventListener('click', openSettings);
    document.getElementById('home-btn').addEventListener('click', function () { showHome(); });
    applyFontSize();
    var files = {
      questions: 'data/questions.json',
      glossary: 'data/glossary.json',
      choiceNotes: 'data/choice_notes.json',
      linkGuards: 'data/link_guards.json',
      mediaLinks: 'data/media_links.json',
      tables: 'data/tables.json',
      producerHighlights: 'data/producer_highlights.json',
      photos: 'data/photos.json',
      geojson: 'data/world_countries.geojson'
    };
    var loads = Object.keys(files).map(function (k) {
      return fetch(files[k]).then(function (r) {
        if (!r.ok) throw new Error(files[k] + ' ' + r.status);
        return r.json();
      }).then(function (j) { return [k, j]; });
    });
    Promise.all(loads).then(function (pairs) {
      DATA = {};
      pairs.forEach(function (p) { DATA[p[0]] = p[1]; });
      DATA.questions.forEach(function (q) { byId[q.id] = q; });
      DATA.glossary.forEach(function (t) { termByName[t.term] = t; });
      termIndex = Terms.buildIndex(DATA.glossary);
      countryNames = new Set(DATA.geojson.features.map(function (f) { return f.properties.name_ja; }));
      window.CKAMap.prepare(DATA.geojson);
      Media.init(DATA);
      showHome();
    }).catch(function (err) {
      $app.innerHTML = '';
      var d = el('div', 'load-error');
      d.appendChild(el('p', null, 'データの読み込みに失敗しました。'));
      d.appendChild(el('p', 'load-error-detail', String(err && err.message || err)));
      d.appendChild(el('p', null, '静的サーバー経由で開いているか確認してください（file:// では読み込めません）。'));
      $app.appendChild(d);
    });
  }

  function applyFontSize() {
    var s = Store.getSettings();
    document.documentElement.classList.remove('fs-large', 'fs-xlarge');
    if (s.fontSize === 'large') document.documentElement.classList.add('fs-large');
    if (s.fontSize === 'xlarge') document.documentElement.classList.add('fs-xlarge');
  }

  /* ---------- 用語シート ---------- */
  function openTermSheet(term) {
    Store.setHintShown();
    var sheet = document.getElementById('term-sheet');
    var body = document.getElementById('term-sheet-body');
    clear(body);
    var head = el('div', 'sheet-head');
    var title = el('span', 'sheet-title');
    if (term.reading) {
      var ruby = document.createElement('ruby');
      ruby.textContent = term.term;
      var rt = document.createElement('rt');
      rt.textContent = term.reading;
      ruby.appendChild(rt);
      title.appendChild(ruby);
    } else {
      title.textContent = term.term;
    }
    head.appendChild(title);
    body.appendChild(head);
    if (term.english) body.appendChild(el('div', 'sheet-english', term.english));
    var badges = el('div', 'badge-row');
    badges.appendChild(el('span', 'badge', term.level || ''));
    if (term.kind) badges.appendChild(el('span', 'badge badge-kind', term.kind + (term.kind === '俗語' ? '（俗語です）' : '')));
    if (term.field) badges.appendChild(el('span', 'badge badge-field', term.field));
    body.appendChild(badges);
    if (term.hitokoto) {
      var h = el('div', 'sheet-hitokoto');
      h.appendChild(el('div', 'sheet-label', 'ひとこと'));
      h.appendChild(el('div', null, term.hitokoto));
      body.appendChild(h);
    }
    var def = el('div', 'sheet-def');
    def.appendChild(el('div', 'sheet-label', '定義'));
    def.appendChild(el('div', null, term.definition || ''));
    body.appendChild(def);
    if (term.related) body.appendChild(el('div', 'sheet-related', '関連用語: ' + term.related));
    if (term.entry_id) body.appendChild(el('div', 'sheet-related', 'くわしく: エントリー ' + term.entry_id));
    sheet.hidden = false;
  }
  function closeTermSheet() { document.getElementById('term-sheet').hidden = true; }

  /* ---------- 確認ダイアログ ---------- */
  function confirmDialog(message, buttons) {
    return new Promise(function (resolve) {
      var wrap = document.getElementById('dialog');
      var msg = document.getElementById('dialog-msg');
      var btnBox = document.getElementById('dialog-btns');
      msg.textContent = message;
      clear(btnBox);
      buttons.forEach(function (b) {
        var btn = el('button', 'btn' + (b.primary ? ' btn-primary' : ''), b.label);
        btn.addEventListener('click', function () {
          wrap.hidden = true;
          resolve(b.value);
        });
        btnBox.appendChild(btn);
      });
      wrap.hidden = false;
    });
  }

  /* ---------- 設定オーバーレイ ---------- */
  function openSettings() {
    var s = Store.getSettings();
    var ov = document.getElementById('settings');
    ov.querySelectorAll('input[name="session-size"]').forEach(function (r) {
      r.checked = Number(r.value) === s.sessionSize;
    });
    ov.querySelectorAll('input[name="font-size"]').forEach(function (r) {
      r.checked = r.value === s.fontSize;
    });
    ov.hidden = false;
  }
  function closeSettings() { document.getElementById('settings').hidden = true; }
  function bindStaticUi() {
    document.getElementById('settings-close').addEventListener('click', closeSettings);
    document.getElementById('settings').addEventListener('click', function (ev) {
      if (ev.target === ev.currentTarget) closeSettings();
    });
    document.querySelectorAll('input[name="session-size"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var s = Store.getSettings();
        s.sessionSize = Number(r.value);
        Store.saveSettings(s);
      });
    });
    document.querySelectorAll('input[name="font-size"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var s = Store.getSettings();
        s.fontSize = r.value;
        Store.saveSettings(s);
        applyFontSize();
      });
    });
    document.getElementById('reset-data').addEventListener('click', function () {
      confirmDialog('学習記録と設定をすべて初期化します。よろしいですか？', [
        { label: 'キャンセル', value: false },
        { label: '初期化する', value: true, primary: true }
      ]).then(function (ok) {
        if (ok) {
          Store.resetAll();
          applyFontSize();
          closeSettings();
          showHome();
        }
      });
    });
    document.getElementById('term-sheet-close').addEventListener('click', closeTermSheet);
    document.getElementById('term-sheet').addEventListener('click', function (ev) {
      if (ev.target === ev.currentTarget) closeTermSheet();
    });
  }

  /* ---------- ホーム ---------- */
  function categoryItemTotals() {
    var totals = {};
    DATA.questions.forEach(function (q) {
      var cat = E.catOf(q);
      totals[cat] = totals[cat] || {};
      totals[cat][E.itemKeyOf(q)] = true;
    });
    var out = {};
    Object.keys(totals).forEach(function (cat) { out[cat] = Object.keys(totals[cat]).length; });
    return out;
  }
  function categoryProgress(cat, itemStats) {
    var total = 0, attempted = 0;
    var seen = {};
    DATA.questions.forEach(function (q) {
      if (E.catOf(q) !== cat) return;
      var k = E.itemKeyOf(q);
      if (seen[k]) return;
      seen[k] = true;
      total += 1;
      if (itemStats[k] && itemStats[k].n > 0) attempted += 1;
    });
    return { total: total, attempted: attempted };
  }

  function showHome() {
    currentView = 'home';
    document.getElementById('home-btn').hidden = true;
    clear($app);
    var itemStats = Store.getItemStats();
    var review = Store.getReview();
    var reviewCount = Object.keys(review).length;
    var weak = E.weakSubthemes(DATA.questions, Store.getAnswers());

    var top = el('div', 'home-top');
    top.appendChild(el('h1', 'app-title', 'コーヒー知識学習'));
    top.appendChild(el('p', 'app-sub', '問題 ' + DATA.questions.length + '問 ／ 用語 ' + DATA.glossary.length + '語（静的版・記録はこの端末に保存されます）'));
    $app.appendChild(top);

    var sess = Store.getSession();
    if (sess && !sess.finished) {
      var card = el('div', 'resume-card');
      card.appendChild(el('div', 'resume-title', '前回の続きがあります'));
      var prog;
      if (sess.mode === 'endless') {
        prog = sess.label + '（回答済み ' + (sess.answeredTotal || 0) + '問）';
      } else {
        var total = sess.cards.length;
        var cur = Math.min(sess.pos + 1, total);
        prog = sess.label + '（' + total + '問中 ' + cur + '問目・あと ' + (total - sess.pos - (sess.states[sess.pos] ? 1 : 0)) + '問）';
      }
      card.appendChild(el('div', 'resume-prog', prog));
      var row = el('div', 'resume-btns');
      var resumeBtn = el('button', 'btn btn-primary', '続きから');
      resumeBtn.addEventListener('click', function () { resumeSession(); });
      var discardBtn = el('button', 'btn btn-ghost', '破棄する');
      discardBtn.addEventListener('click', function () {
        confirmDialog('進行中のセッションを破棄しますか？', [
          { label: 'キャンセル', value: false },
          { label: '破棄する', value: true, primary: true }
        ]).then(function (ok) { if (ok) { Store.clearSession(); showHome(); } });
      });
      row.appendChild(resumeBtn);
      row.appendChild(discardBtn);
      card.appendChild(row);
      $app.appendChild(card);
    }

    var status = el('div', 'home-status');
    status.appendChild(el('span', null, '復習リスト ' + reviewCount + '件'));
    status.appendChild(el('span', null, '苦手な小テーマ ' + weak.length + '件'));
    $app.appendChild(status);

    var grid = el('div', 'mode-grid');
    function modeBtn(title, desc, fn, disabled) {
      var b = el('button', 'mode-btn');
      b.appendChild(el('span', 'mode-title', title));
      b.appendChild(el('span', 'mode-desc', desc));
      if (disabled) b.disabled = true;
      else b.addEventListener('click', fn);
      grid.appendChild(b);
    }
    modeBtn('テーマ別クイズ', '14カテゴリから選んで出題', function () { showCategories(); });
    modeBtn('エンドレス', 'テーマ横断で無限に出題', function () { startEndless(); });
    modeBtn('入門コース', '難易度1を「豆の旅」順に（全65問）', function () { startCourse(); });
    modeBtn('苦手・復習', '復習リストと苦手な小テーマから', function () { startReview(); },
      reviewCount === 0 && weak.length === 0);
    modeBtn('用語クイズ', '定義・読み・ひとことを問う', function () { startTermQuiz(); });
    modeBtn('用語カード', 'フラッシュカードで用語を覚える', function () { showFlashcards(); });
    modeBtn('用語辞書', '用語を検索して引く', function () { showDictionary(); });
    modeBtn('統計', '正答率と苦手分野を見る', function () { showStats(); });
    $app.appendChild(grid);
  }

  /* ---------- テーマ選択 ---------- */
  function showCategories() {
    currentView = 'categories';
    document.getElementById('home-btn').hidden = false;
    clear($app);
    var itemStats = Store.getItemStats();
    $app.appendChild(el('h2', 'view-title', 'テーマ別クイズ'));
    var s = Store.getSettings();
    $app.appendChild(el('p', 'view-note', '1セッション ' + s.sessionSize + '問（設定で変更できます）'));
    var list = el('div', 'cat-list');
    E.CATEGORIES.forEach(function (c) {
      var p = categoryProgress(c.id, itemStats);
      var btn = el('button', 'cat-btn');
      var left = el('span', 'cat-name', c.id + ' ' + c.name);
      var right = el('span', 'cat-prog', p.attempted + ' / ' + p.total + ' 項目');
      btn.appendChild(left);
      btn.appendChild(right);
      btn.addEventListener('click', function () { startTheme(c.id); });
      list.appendChild(btn);
    });
    $app.appendChild(list);
  }

  /* ---------- セッション管理 ---------- */
  var session = null; // 進行中セッション（Storeにも保存される）

  function saveSession() {
    if (session) Store.saveSession(session);
  }
  function makeQuestionCard(q) {
    var p = E.presentQuestion(q, DATA.questions, countryNames, Math.random);
    return {
      kind: 'q', qid: q.id, choices: p.choices,
      correctIndex: p.correctIndex, redrawn: p.redrawn
    };
  }
  function makeTermCard(termObj) {
    var type = E.TERM_QUIZ_TYPES[Math.floor(Math.random() * E.TERM_QUIZ_TYPES.length)];
    var card = E.genTermQuiz(termObj, DATA.glossary, type, Math.random);
    return card;
  }
  /* 新規セッション開始（進行中があれば確認ダイアログ） */
  function beginSession(newSession) {
    var existing = Store.getSession();
    if (existing && !existing.finished) {
      return confirmDialog('前回の続きが残っています。どうしますか？', [
        { label: 'キャンセル', value: 'cancel' },
        { label: '続きから', value: 'resume' },
        { label: '新しく始める', value: 'new', primary: true }
      ]).then(function (choice) {
        if (choice === 'resume') { resumeSession(); return false; }
        if (choice === 'new') { session = newSession; saveSession(); return true; }
        return false;
      });
    }
    session = newSession;
    saveSession();
    return Promise.resolve(true);
  }
  function resumeSession() {
    var s = Store.getSession();
    if (!s) { showHome(); return; }
    session = s;
    showQuiz();
  }

  function startTheme(cat) {
    var s = Store.getSettings();
    var candidates = DATA.questions.filter(function (q) { return E.catOf(q) === cat; });
    var picked = E.pickSession(candidates, Store.getItemStats(), s.sessionSize, Math.random);
    var ns = {
      mode: 'theme', label: 'テーマ別: ' + cat + ' ' + catName(cat),
      cards: picked.map(makeQuestionCard), pos: 0, states: {}, answeredTotal: 0, recent: []
    };
    beginSession(ns).then(function (ok) { if (ok) showQuiz(); });
  }
  function startCourse() {
    var qs = E.courseQuestions(DATA.questions, Store.getItemStats(), Math.random);
    var ns = {
      mode: 'course', label: '入門コース',
      cards: qs.map(makeQuestionCard), pos: 0, states: {}, answeredTotal: 0, recent: []
    };
    beginSession(ns).then(function (ok) { if (ok) showQuiz(); });
  }
  function startEndless() {
    var ns = {
      mode: 'endless', label: 'エンドレス',
      cards: [], pos: 0, states: {}, answeredTotal: 0, recent: []
    };
    beginSession(ns).then(function (ok) {
      if (ok) { ensureEndlessCards(); saveSession(); showQuiz(); }
    });
  }
  function ensureEndlessCards() {
    while (session.cards.length - session.pos < 5) {
      var recentKeys = session.cards.slice(-12).map(function (c) {
        return c.kind === 'q' ? E.itemKeyOf(byId[c.qid]) : c.itemKey;
      });
      var q = E.pickEndless(DATA.questions, Store.getItemStats(), recentKeys, Math.random);
      session.cards.push(makeQuestionCard(q));
    }
  }
  function startReview() {
    var review = Store.getReview();
    var keys = Object.keys(review).sort(function (a, b) {
      return (review[a].due || 0) - (review[b].due || 0);
    });
    var cards = [];
    var usedItems = {};
    keys.forEach(function (k) {
      var r = review[k];
      usedItems[k] = true;
      if (r.kind === 'term' && r.term && termByName[r.term]) {
        var tc = makeTermCard(termByName[r.term]);
        if (tc) cards.push(tc);
      } else if (r.qid && byId[r.qid]) {
        cards.push(makeQuestionCard(byId[r.qid]));
      }
    });
    /* 苦手サブテーマの問題を追加（未収録の知識項目から） */
    var weak = E.weakSubthemes(DATA.questions, Store.getAnswers());
    if (weak.length) {
      var weakSubs = {};
      weak.forEach(function (w) { weakSubs[w.subtheme] = true; });
      var cands = DATA.questions.filter(function (q) {
        return weakSubs[q.subtheme_id] && !usedItems[E.itemKeyOf(q)];
      });
      var picked = E.pickSession(cands, Store.getItemStats(), Store.getSettings().sessionSize, Math.random);
      cards = cards.concat(picked.map(makeQuestionCard));
    }
    if (!cards.length) return;
    var ns = {
      mode: 'review', label: '苦手・復習',
      cards: cards, pos: 0, states: {}, answeredTotal: 0, recent: []
    };
    beginSession(ns).then(function (ok) { if (ok) showQuiz(); });
  }
  function startTermQuiz() {
    var s = Store.getSettings();
    var terms = E.pickTermQuizTerms(DATA.glossary, Store.getItemStats(), s.sessionSize, Math.random);
    var cards = [];
    terms.forEach(function (t) {
      var c = makeTermCard(t);
      if (c) cards.push(c);
    });
    var ns = {
      mode: 'termquiz', label: '用語クイズ',
      cards: cards, pos: 0, states: {}, answeredTotal: 0, recent: []
    };
    beginSession(ns).then(function (ok) { if (ok) showQuiz(); });
  }

  /* ---------- クイズ画面 ---------- */
  function showQuiz() {
    currentView = 'quiz';
    document.getElementById('home-btn').hidden = false;
    renderCard();
  }
  function currentCard() { return session.cards[session.pos]; }

  function renderCard() {
    clear($app);
    var card = currentCard();
    if (!card) { finishSession(); return; }
    var state = session.states[session.pos];
    var seen = new Set();
    var ctx = { index: termIndex, guards: DATA.linkGuards, seen: seen };

    var head = el('div', 'quiz-head');
    head.appendChild(el('span', 'quiz-mode', session.label));
    var progText;
    if (session.mode === 'endless') {
      progText = '回答済み ' + (session.answeredTotal || 0) + '問';
    } else {
      progText = (session.pos + 1) + ' / ' + session.cards.length + ' 問';
    }
    head.appendChild(el('span', 'quiz-prog', progText));
    $app.appendChild(head);

    if (!Store.getHintShown()) {
      var hint = el('div', 'hint-banner');
      hint.appendChild(el('span', null, '色の付いた用語をタップすると、その場で意味を確認できます。'));
      var hx = el('button', 'hint-close', '×');
      hx.addEventListener('click', function () { Store.setHintShown(); hint.remove(); });
      hint.appendChild(hx);
      $app.appendChild(hint);
    }

    var q = card.kind === 'q' ? byId[card.qid] : null;
    var badges = el('div', 'badge-row');
    if (q) {
      badges.appendChild(el('span', 'badge', E.catOf(q) + ' ' + catName(E.catOf(q))));
      badges.appendChild(el('span', 'badge', '難易度 ' + q.difficulty));
      if (card.redrawn) badges.appendChild(el('span', 'badge badge-sub', '選択肢シャッフル中'));
    } else {
      badges.appendChild(el('span', 'badge', '用語クイズ'));
    }
    $app.appendChild(badges);

    var stemBox = el('div', 'stem');
    var stemText = q ? q.stem : card.stem;
    stemText.split('\n').forEach(function (line, i) {
      if (i > 0) stemBox.appendChild(document.createElement('br'));
      var span = document.createElement('span');
      Terms.renderInto(span, line, ctx, { annotate: true, onTerm: openTermSheet });
      stemBox.appendChild(span);
    });
    $app.appendChild(stemBox);

    var choicesBox = el('div', 'choices');
    card.choices.forEach(function (text, idx) {
      var b = el('button', 'choice');
      var tspan = document.createElement('span');
      Terms.renderInto(tspan, text, ctx, { annotate: true, linkable: false });
      b.appendChild(tspan);
      if (state) {
        b.disabled = true;
        if (idx === card.correctIndex) {
          b.classList.add('choice-correct');
          var mk = el('span', 'choice-mark mark-ok', '○');
          b.insertBefore(mk, b.firstChild);
        }
        if (idx === state.picked && idx !== card.correctIndex) {
          b.classList.add('choice-wrong');
          var mk2 = el('span', 'choice-mark mark-ng', '✕');
          b.insertBefore(mk2, b.firstChild);
        }
        var note = choiceNote(card, text);
        if (note) b.appendChild(el('span', 'choice-note', note));
      } else {
        b.addEventListener('click', function () { answerCard(idx); });
      }
      choicesBox.appendChild(b);
    });
    $app.appendChild(choicesBox);

    if (state) {
      renderExplanation(card, state, ctx);
    }

    var nav = el('div', 'quiz-nav');
    if (session.mode === 'endless') {
      var endBtn = el('button', 'btn btn-ghost', 'ここでやめる');
      endBtn.addEventListener('click', function () { finishSession(); });
      nav.appendChild(endBtn);
    } else {
      var homeBtn = el('button', 'btn btn-ghost', '中断してホームへ（続きは保存されます）');
      homeBtn.addEventListener('click', function () { showHome(); });
      nav.appendChild(homeBtn);
    }
    $app.appendChild(nav);
    window.scrollTo(0, 0);
  }

  /* 選択肢ごとの解説: 専用ノート → 無ければ用語集の「ひとこと」で代替 → 無ければ出さない */
  function choiceNote(card, choiceText) {
    if (card.kind !== 'q') return null;
    var notes = DATA.choiceNotes[card.qid];
    if (notes && notes[choiceText]) return notes[choiceText];
    var t = termByName[choiceText];
    if (t && t.hitokoto) return t.hitokoto;
    return null;
  }

  function answerCard(idx) {
    var card = currentCard();
    var correct = idx === card.correctIndex;
    session.states[session.pos] = { picked: idx, correct: correct };
    session.answeredTotal = (session.answeredTotal || 0) + 1;
    if (card.kind === 'q') {
      var q = byId[card.qid];
      Store.recordAnswer(card.qid, E.itemKeyOf(q), correct, { kind: 'q', qid: card.qid });
    } else {
      Store.recordAnswer('TERMQUIZ:' + card.term, card.itemKey, correct,
        { kind: 'term', term: card.term });
      if (!correct) Store.recordTermMark(card.term, 'weak');
    }
    if (session.mode === 'endless') ensureEndlessCards();
    saveSession();
    renderCard();
    /* 回答後は問題文が画面上部に来るようスクロール */
    var stemEl = $app.querySelector('.stem');
    if (stemEl) {
      var y = stemEl.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo(0, Math.max(0, y));
    }
  }

  function renderExplanation(card, state, ctx) {
    var box = el('div', 'explain');
    var judge = el('div', 'judge ' + (state.correct ? 'judge-ok' : 'judge-ng'));
    judge.appendChild(el('span', 'judge-mark', state.correct ? '○' : '✕'));
    judge.appendChild(el('span', null, state.correct ? '正解です' : '不正解です'));
    box.appendChild(judge);
    if (card.kind === 'q') {
      var q = byId[card.qid];
      box.appendChild(el('div', 'explain-label', '要点'));
      var short = el('p', 'explain-text');
      Terms.renderInto(short, q.explanation_short, ctx, { annotate: true, onTerm: openTermSheet });
      box.appendChild(short);
      box.appendChild(el('div', 'explain-label', '詳細解説'));
      q.explanation_long.split(/\n{2,}/).forEach(function (para) {
        if (!para.trim()) return;
        var p = el('p', 'explain-text');
        Terms.renderInto(p, para.replace(/\n/g, ''), ctx, { annotate: true, onTerm: openTermSheet });
        box.appendChild(p);
      });
      var media = Media.buildMedia(q.entry_id, function (node) { Media.Viewer.open(node); });
      if (media) box.appendChild(media);
    } else {
      var t = termByName[card.term];
      box.appendChild(el('div', 'explain-label', '解説'));
      if (t) {
        var p1 = el('p', 'explain-text');
        Terms.renderInto(p1, t.definition, ctx, { annotate: true, onTerm: openTermSheet });
        box.appendChild(p1);
        box.appendChild(el('p', 'explain-text explain-sub', 'ひとこと: ' + t.hitokoto + ' ／ 読み: ' + t.reading));
      }
    }
    var next = el('button', 'btn btn-primary btn-next',
      session.mode !== 'endless' && session.pos + 1 >= session.cards.length ? '結果を見る' : '次の問題へ');
    next.addEventListener('click', function () {
      session.pos += 1;
      if (session.mode !== 'endless' && session.pos >= session.cards.length) {
        finishSession();
        return;
      }
      if (session.mode === 'endless') ensureEndlessCards();
      saveSession();
      renderCard();
    });
    box.appendChild(next);
    $app.appendChild(box);
  }

  /* ---------- 結果画面 ---------- */
  function finishSession() {
    if (session) {
      session.finished = true;
      Store.clearSession();
    }
    currentView = 'result';
    document.getElementById('home-btn').hidden = false;
    clear($app);
    var states = session ? Object.values(session.states) : [];
    var total = states.length;
    var correct = states.filter(function (s) { return s.correct; }).length;
    $app.appendChild(el('h2', 'view-title', 'セッション結果'));
    var box = el('div', 'result-box');
    box.appendChild(el('div', 'result-score', correct + ' / ' + total + ' 問正解'));
    if (total) {
      box.appendChild(el('div', 'result-rate', '正答率 ' + Math.round(correct / total * 100) + '%'));
    }
    box.appendChild(el('p', 'result-note',
      session && session.mode === 'endless' ? 'エンドレスを終了しました。' : 'おつかれさまでした。間違えた問題は復習リストに入っています。'));
    $app.appendChild(box);
    var homeBtn = el('button', 'btn btn-primary', 'ホームへ');
    homeBtn.addEventListener('click', showHome);
    $app.appendChild(homeBtn);
    session = null;
  }

  /* ---------- 用語カード ---------- */
  var deckState = { list: [], idx: 0, flipped: false, starterOnly: true };
  function buildDeck() {
    var marks = Store.getTermMarks();
    var list = DATA.glossary.filter(function (t) {
      return !deckState.starterOnly || t.starter === 1;
    });
    var rank = function (t) {
      var m = marks[t.term];
      return m === 'weak' ? 0 : (m === 'know' ? 2 : 1);
    };
    deckState.list = list.slice().sort(function (a, b) { return rank(a) - rank(b); });
    deckState.idx = 0;
    deckState.flipped = false;
  }
  function showFlashcards() {
    currentView = 'flashcards';
    document.getElementById('home-btn').hidden = false;
    buildDeck();
    renderFlashcard();
  }
  function renderFlashcard() {
    clear($app);
    $app.appendChild(el('h2', 'view-title', '用語カード'));
    var toggleRow = el('div', 'toggle-row');
    var tgl = el('button', 'btn ' + (deckState.starterOnly ? 'btn-primary' : ''), '入門30だけ');
    tgl.addEventListener('click', function () {
      deckState.starterOnly = !deckState.starterOnly;
      buildDeck();
      renderFlashcard();
    });
    toggleRow.appendChild(tgl);
    toggleRow.appendChild(el('span', 'toggle-note', deckState.starterOnly ? 'まず覚える30語' : '全' + DATA.glossary.length + '語'));
    $app.appendChild(toggleRow);
    var t = deckState.list[deckState.idx];
    if (!t) { $app.appendChild(el('p', null, 'カードがありません。')); return; }
    $app.appendChild(el('div', 'deck-count', (deckState.idx + 1) + ' / ' + deckState.list.length));
    var card = el('div', 'flashcard' + (deckState.flipped ? ' flipped' : ''));
    if (!deckState.flipped) {
      var termEl = el('div', 'fc-term');
      var ruby = document.createElement('ruby');
      ruby.textContent = t.term;
      var rt = document.createElement('rt');
      rt.textContent = t.reading || '';
      ruby.appendChild(rt);
      termEl.appendChild(ruby);
      card.appendChild(termEl);
      card.appendChild(el('div', 'fc-hint', 'タップで意味を表示'));
    } else {
      card.appendChild(el('div', 'fc-hitokoto', t.hitokoto));
      card.appendChild(el('div', 'fc-def', t.definition));
      card.appendChild(el('div', 'fc-meta', (t.level || '') + ' ／ ' + (t.field || '')));
    }
    card.addEventListener('click', function () {
      deckState.flipped = !deckState.flipped;
      renderFlashcard();
    });
    $app.appendChild(card);
    var marks = Store.getTermMarks();
    var btnRow = el('div', 'fc-btns');
    var weakBtn = el('button', 'btn' + (marks[t.term] === 'weak' ? ' btn-primary' : ''), 'まだ');
    weakBtn.addEventListener('click', function () {
      Store.recordTermMark(t.term, 'weak');
      advanceDeck();
    });
    var knowBtn = el('button', 'btn' + (marks[t.term] === 'know' ? ' btn-primary' : ''), '知っている');
    knowBtn.addEventListener('click', function () {
      Store.recordTermMark(t.term, 'know');
      advanceDeck();
    });
    btnRow.appendChild(weakBtn);
    btnRow.appendChild(knowBtn);
    $app.appendChild(btnRow);
    var navRow = el('div', 'fc-nav');
    var prev = el('button', 'btn btn-ghost', '← 前へ');
    prev.disabled = deckState.idx === 0;
    prev.addEventListener('click', function () {
      if (deckState.idx > 0) { deckState.idx -= 1; deckState.flipped = false; renderFlashcard(); }
    });
    var nextB = el('button', 'btn btn-ghost', '次へ →');
    nextB.disabled = deckState.idx >= deckState.list.length - 1;
    nextB.addEventListener('click', function () { advanceDeck(); });
    navRow.appendChild(prev);
    navRow.appendChild(nextB);
    $app.appendChild(navRow);
  }
  function advanceDeck() {
    if (deckState.idx < deckState.list.length - 1) {
      deckState.idx += 1;
      deckState.flipped = false;
      renderFlashcard();
    } else {
      renderFlashcard();
    }
  }

  /* ---------- 用語辞書 ---------- */
  function showDictionary() {
    currentView = 'dictionary';
    document.getElementById('home-btn').hidden = false;
    clear($app);
    $app.appendChild(el('h2', 'view-title', '用語辞書'));
    var input = el('input', 'search-input');
    input.type = 'search';
    input.placeholder = '用語・読み・意味で検索';
    $app.appendChild(input);
    var count = el('div', 'dict-count');
    $app.appendChild(count);
    var list = el('div', 'dict-list');
    $app.appendChild(list);
    function renderList() {
      var kw = input.value.trim();
      clear(list);
      var hits = DATA.glossary.filter(function (t) {
        if (!kw) return true;
        return t.term.indexOf(kw) >= 0
          || (t.reading || '').indexOf(kw) >= 0
          || (t.hitokoto || '').indexOf(kw) >= 0
          || (t.definition || '').indexOf(kw) >= 0;
      });
      count.textContent = hits.length + '語';
      hits.slice(0, 200).forEach(function (t) {
        var b = el('button', 'dict-item');
        b.appendChild(el('span', 'dict-term', t.term));
        b.appendChild(el('span', 'dict-hito', t.hitokoto || ''));
        b.addEventListener('click', function () { openTermSheet(t); });
        list.appendChild(b);
      });
    }
    input.addEventListener('input', renderList);
    renderList();
  }

  /* ---------- 統計 ---------- */
  function showStats() {
    currentView = 'stats';
    document.getElementById('home-btn').hidden = false;
    clear($app);
    $app.appendChild(el('h2', 'view-title', '統計'));
    var answers = Store.getAnswers();
    var itemStats = Store.getItemStats();
    var totalN = 0, totalC = 0;
    Object.values(itemStats).forEach(function (s) { totalN += s.n; totalC += s.c; });
    var sum = el('div', 'stats-summary');
    sum.appendChild(el('div', 'stats-num', '総回答 ' + totalN + '問'));
    sum.appendChild(el('div', 'stats-num', '正答率 ' + (totalN ? Math.round(totalC / totalN * 100) : 0) + '%'));
    sum.appendChild(el('div', 'stats-num', '復習リスト ' + Object.keys(Store.getReview()).length + '件'));
    $app.appendChild(sum);

    $app.appendChild(el('h3', 'stats-head', 'カテゴリ別'));
    var totals = categoryItemTotals();
    E.CATEGORIES.forEach(function (c) {
      var keys = Object.keys(itemStats).filter(function (k) {
        return byId[k] && E.catOf(byId[k]) === c.id;
      });
      var n = 0, cc = 0, attemptedItems = {};
      DATA.questions.forEach(function (q) {
        if (E.catOf(q) !== c.id) return;
        var k = E.itemKeyOf(q);
        if (itemStats[k] && itemStats[k].n > 0) attemptedItems[k] = true;
      });
      Object.keys(answers).forEach(function (qid) {
        var q = byId[qid];
        if (q && E.catOf(q) === c.id) { n += answers[qid].n; cc += answers[qid].c; }
      });
      var row = el('div', 'stat-row');
      row.appendChild(el('span', 'stat-name', c.id + ' ' + c.name));
      var barWrap = el('span', 'stat-bar');
      var bar = el('span', 'stat-bar-fill');
      bar.style.width = (n ? Math.round(cc / n * 100) : 0) + '%';
      barWrap.appendChild(bar);
      row.appendChild(barWrap);
      row.appendChild(el('span', 'stat-val',
        (n ? Math.round(cc / n * 100) + '%' : '―') + '（' + Object.keys(attemptedItems).length + '/' + (totals[c.id] || 0) + '項目）'));
      $app.appendChild(row);
    });

    var weak = E.weakSubthemes(DATA.questions, answers);
    $app.appendChild(el('h3', 'stats-head', '苦手な小テーマ（5回以上・正答率70%未満）'));
    if (!weak.length) {
      $app.appendChild(el('p', 'view-note', 'まだ判定できる小テーマはありません。'));
    } else {
      weak.forEach(function (w) {
        var row = el('div', 'stat-row stat-weak');
        row.appendChild(el('span', 'stat-name', w.subtheme));
        row.appendChild(el('span', 'stat-val', Math.round(w.rate * 100) + '%（' + w.c + '/' + w.n + '）'));
        $app.appendChild(row);
      });
    }

    var termItems = Object.keys(itemStats).filter(function (k) { return k.indexOf('TERM:') === 0; });
    if (termItems.length) {
      $app.appendChild(el('h3', 'stats-head', '用語クイズの記録'));
      var tn = 0, tc = 0;
      termItems.forEach(function (k) { tn += itemStats[k].n; tc += itemStats[k].c; });
      $app.appendChild(el('p', 'view-note', termItems.length + '語に挑戦 ／ 正答率 ' + Math.round(tc / tn * 100) + '%'));
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    bindStaticUi();
    boot();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  });
})();
