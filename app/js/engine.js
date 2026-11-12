/* engine.js — 出題エンジン（純粋ロジック。DOMに依存しない）
 *
 * - 知識項目キー: 方式Dの関連問題は related_to の元問題に集約する
 * - 出題選択: 知識項目の回答回数が少ない順（未出題が先）＋ランダム
 * - 方式A: 選択肢シャッフルは全問。誤答の再抽選は「短い名詞・語句」型の
 *   正解の問題だけに適用し、文型（命題文）・数値型の正解には決して適用しない。
 *   再抽選プールには R1〜R6 の同質性ガードを掛ける。
 * - 方式B: 用語DBから用語クイズを生成する
 */
(function (global) {
  'use strict';

  var CATEGORIES = [
    { id: '00', name: '用語集・単位' },
    { id: '01', name: '起源・歴史・有名人物' },
    { id: '02', name: '豆の種類・植物学' },
    { id: '03', name: '栽培・収穫・精製' },
    { id: '04', name: '産地・国・地域' },
    { id: '05', name: '産業・経済・社会問題' },
    { id: '06', name: 'コーヒー器具' },
    { id: '07', name: '抽出・焙煎' },
    { id: '08', name: '世界のカフェ文化' },
    { id: '09', name: 'カッピングと味の表現' },
    { id: '10', name: '化学・健康' },
    { id: '11', name: '製品形態（デカフェ／インスタント／RTD）' },
    { id: '12', name: 'バリスタ実技' },
    { id: '13', name: '日本市場' }
  ];
  /* 入門コース: 難易度1を「豆の旅」順に並べるカテゴリ順 */
  var COURSE_ORDER = ['02', '03', '07', '06', '09', '10', '01'];

  function catOf(q) { return (q.subtheme_id || q.id).split('-')[0]; }
  function itemKeyOf(q) { return q.related_to || q.id; }
  function correctText(q) { return q.choices[q.correct_index]; }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- 方式A: 正解文の形態分類 ----------
   * 'statement' = 命題文（〜である／〜した／〜が高い 等で終わる文、または文を含む）
   * 'numeric'   = 数値・値そのもの（数字を含む）
   * 'phrase'    = 短い名詞・語句
   * 再抽選してよいのは 'phrase' のみ。文型の正解に別の文型の誤答を混ぜると
   * 「もう1つの正しい文」が紛れ込む事故が起きるため、判定は安全側に倒す。 */
  var SENT_END = /(である|であった|だった|た|れた|する|した|される|された|られる|られた|なる|なった|ている|ていた|ある|あった|ない|なかった|とされる|と呼ばれる|と呼ぶ|をいう|を指す|として|ため|が高い|が大きい|が小さい|が多い|が少ない|が異なる|が続く|が中心|が主体|が一般的|が重要|に位置づけられる|に分類される|に用いられる|として知られる)$/;
  function classifyAnswer(text) {
    if (/[0-9０-９]/.test(text)) return 'numeric';
    if (text.indexOf('。') >= 0) return 'statement';
    var t = text.replace(/[\s　]+$/g, '');
    if (SENT_END.test(t)) return 'statement';
    if (t.length > 15 && /こと$/.test(t)) return 'statement'; // 名詞化した節
    if (t.indexOf('、') >= 0 && t.length >= 30) return 'statement'; // 長い叙述句
    /* 長い語句は節（文の一部）であることが多く、別話題の節同士が混ざると
       「明らかに無関係な選択肢」になる。20字超は安全側に倒して対象外にする。 */
    if (t.length > 20) return 'statement';
    return 'phrase';
  }
  function isRedrawable(q) { return classifyAnswer(correctText(q)) === 'phrase'; }

  /* 地名サフィックス（R4）: 正解が地名らしい語尾を持つ場合、候補にも同じ語尾を要求する */
  var PLACE_SUFFIXES = ['高原', '地方', '地域', '半島', '山脈', '平野', '盆地', '諸島', '地帯', '地区', '一帯', '州', '県', '島', '市', '町', '村', '国', '港'];
  function placeSuffix(text) {
    for (var i = 0; i < PLACE_SUFFIXES.length; i++) {
      if (text.endsWith(PLACE_SUFFIXES[i])) return PLACE_SUFFIXES[i];
    }
    return null;
  }

  /* 誤答プールの構築（R1〜R6）
   * 元: 同じカテゴリの問題の「正解選択肢」
   * R1 数値性の一致（正解が非数値 → 候補も非数値）
   * R2 文体の一致（候補も短い名詞・語句のみ）
   * R3 長さ比 0.4〜2.5
   * R4 地名サフィックスの一致／国名問題は国名だけから
   * R5 候補が3未満なら再抽選しない（呼び出し側で判定）
   * R6 同一サブテーマの候補を優先
   * 追加の安全策: 同一エントリーの問題の正解はプールに入れない（同義・同一事実の混入防止） */
  function buildDistractorPool(q, questions, countryNames) {
    var correct = correctText(q);
    var cat = catOf(q);
    var suffix = placeSuffix(correct);
    var isCountry = countryNames && countryNames.has(correct);
    var seen = {};
    var pool = [];
    questions.forEach(function (o) {
      if (o.id === q.id) return;
      if (catOf(o) !== cat) return;
      /* 話題の近さを担保するため、プールは同一サブテーマ内に限る。
         カテゴリ横断の抽選は「明らかに無関係な選択肢」の主因になった。 */
      if (o.subtheme_id !== q.subtheme_id) return;
      if (o.entry_id === q.entry_id) return;
      var c = correctText(o);
      if (c === correct || seen[c]) return;
      if (classifyAnswer(c) !== 'phrase') return;      // R2
      if (/[0-9０-９]/.test(c)) return;                  // R1
      var ratio = c.length / correct.length;            // R3
      if (ratio < 0.4 || ratio > 2.5) return;
      if ((suffix || null) !== (placeSuffix(c) || null)) return; // R4（双方向）
      var cIsCountry = countryNames && countryNames.has(c);
      if (!!isCountry !== !!cIsCountry) return;         // R4（国名の対称性）
      seen[c] = true;
      pool.push({ text: c, sameSub: true });
    });
    return pool;
  }

  /* 1問の提示形を作る: { choices: [text...], correctIndex, redrawn } */
  function presentQuestion(q, questions, countryNames, rng) {
    rng = rng || Math.random;
    var correct = correctText(q);
    var originals = q.choices.filter(function (_, i) { return i !== q.correct_index; });
    var distractors = originals;
    var redrawn = false;
    /* 再抽選は現在オフ。プールを厳しく絞っても、国別問題（04-02）のように
       1つのサブテーマ内で種・精製・地域・現地名が混在し、「明らかに無関係な
       選択肢」が残るケースを排除できなかったため。誤答は全問、監査済みの
       作問時の選択肢を使い、シャッフルのみを行う（方式Aの安全側運用）。 */
    if (false && isRedrawable(q)) {
      var pool = buildDistractorPool(q, questions, countryNames);
      if (pool.length >= 3) {                            // R5
        var same = shuffle(pool.filter(function (p) { return p.sameSub; }), rng);
        var rest = shuffle(pool.filter(function (p) { return !p.sameSub; }), rng);
        var ordered = same.concat(rest);                 // R6
        distractors = ordered.slice(0, 3).map(function (p) { return p.text; });
        redrawn = true;
      }
    }
    var choices = shuffle(distractors.concat([correct]), rng);
    return { choices: choices, correctIndex: choices.indexOf(correct), redrawn: redrawn };
  }

  /* ---------- 出題選択 ---------- */
  function itemAttempts(itemStats, key) {
    var s = itemStats[key];
    return s ? s.n : 0;
  }
  /* 知識項目の回答回数が少ない順（未出題が先）に並べ、先頭から count 件。
     選ばれた集合はセッション用にシャッフルして返す */
  function pickSession(candidates, itemStats, count, rng) {
    rng = rng || Math.random;
    var scored = candidates.map(function (q) {
      return { q: q, att: itemAttempts(itemStats, itemKeyOf(q)), r: rng() };
    });
    scored.sort(function (a, b) { return (a.att - b.att) || (a.r - b.r); });
    var picked = scored.slice(0, count).map(function (x) { return x.q; });
    return shuffle(picked, rng);
  }
  /* 入門コース: 豆の旅順カテゴリ × 難易度1。全件を、カテゴリ内は回答回数の少ない順で */
  function courseQuestions(questions, itemStats, rng) {
    rng = rng || Math.random;
    var out = [];
    COURSE_ORDER.forEach(function (cat) {
      var inCat = questions.filter(function (q) {
        return catOf(q) === cat && q.difficulty === 1;
      });
      var scored = inCat.map(function (q) {
        return { q: q, att: itemAttempts(itemStats, itemKeyOf(q)), r: rng() };
      });
      scored.sort(function (a, b) { return (a.att - b.att) || (a.r - b.r); });
      out = out.concat(scored.map(function (x) { return x.q; }));
    });
    return out;
  }
  /* エンドレスの次問: 直近の知識項目を避け、回答回数の少ないものから */
  function pickEndless(questions, itemStats, recentItemKeys, rng) {
    rng = rng || Math.random;
    var pool = questions.filter(function (q) {
      return recentItemKeys.indexOf(itemKeyOf(q)) < 0;
    });
    if (!pool.length) pool = questions;
    var min = Infinity;
    pool.forEach(function (q) {
      var a = itemAttempts(itemStats, itemKeyOf(q));
      if (a < min) min = a;
    });
    var least = pool.filter(function (q) { return itemAttempts(itemStats, itemKeyOf(q)) === min; });
    return least[Math.floor(rng() * least.length)];
  }

  /* ---------- 統計・弱点 ---------- */
  /* サブテーマ別集計: { [subtheme]: {n, c} } */
  function subthemeStats(questions, answers) {
    var byId = {};
    questions.forEach(function (q) { byId[q.id] = q; });
    var out = {};
    Object.keys(answers).forEach(function (qid) {
      var q = byId[qid];
      if (!q) return;
      var s = out[q.subtheme_id] || { n: 0, c: 0 };
      s.n += answers[qid].n; s.c += answers[qid].c;
      out[q.subtheme_id] = s;
    });
    return out;
  }
  /* 苦手サブテーマ: 回答5回以上 かつ 正答率70%未満 */
  function weakSubthemes(questions, answers) {
    var st = subthemeStats(questions, answers);
    return Object.keys(st).filter(function (sub) {
      var s = st[sub];
      return s.n >= 5 && s.c / s.n < 0.7;
    }).map(function (sub) {
      return { subtheme: sub, n: st[sub].n, c: st[sub].c, rate: st[sub].c / st[sub].n };
    }).sort(function (a, b) { return a.rate - b.rate; });
  }

  /* ---------- 方式B: 用語クイズ生成 ---------- */
  function relatedSet(term, glossary) {
    var set = {};
    if (term.related) {
      term.related.split(/[、,／\/]/).forEach(function (t) { set[t.trim()] = true; });
    }
    glossary.forEach(function (g) {
      if (g.related && g.related.indexOf(term.term) >= 0) set[g.term] = true;
    });
    return set;
  }
  function termDistractors(term, glossary, key, rng) {
    var rel = relatedSet(term, glossary);
    var seen = {};
    var cands = glossary.filter(function (g) {
      if (g.term === term.term || rel[g.term]) return false;
      var v = g[key];
      if (!v || v === term[key] || seen[v]) return false;
      seen[v] = true;
      return true;
    });
    var sameField = shuffle(cands.filter(function (g) { return g.field === term.field; }), rng);
    var sameLevel = shuffle(cands.filter(function (g) { return g.field !== term.field && g.level === term.level; }), rng);
    var rest = shuffle(cands.filter(function (g) { return g.field !== term.field && g.level !== term.level; }), rng);
    return sameField.concat(sameLevel, rest);
  }
  /* type: 'def' 定義→用語 / 'reading' 用語→読み / 'hitokoto' 用語→ひとこと */
  function genTermQuiz(term, glossary, type, rng) {
    rng = rng || Math.random;
    var stem, key;
    if (type === 'def') {
      stem = '次の説明に合う用語はどれか。\n' + term.definition;
      key = 'term';
    } else if (type === 'reading') {
      stem = '用語「' + term.term + '」の読みとして正しいのはどれか。';
      key = 'reading';
    } else {
      stem = '用語「' + term.term + '」の意味を、日常の言葉で言い表したものはどれか。';
      key = 'hitokoto';
    }
    var answer = term[key];
    var ds = termDistractors(term, glossary, key, rng).slice(0, 3);
    if (ds.length < 3) return null;
    var choices = shuffle(ds.map(function (g) { return g[key]; }).concat([answer]), rng);
    return {
      kind: 'term', type: type, term: term.term, stem: stem,
      choices: choices, correctIndex: choices.indexOf(answer),
      answerText: answer, itemKey: 'TERM:' + term.term
    };
  }
  var TERM_QUIZ_TYPES = ['def', 'reading', 'hitokoto'];
  function pickTermQuizTerms(glossary, itemStats, count, rng) {
    rng = rng || Math.random;
    var scored = glossary.map(function (t) {
      return { t: t, att: itemAttempts(itemStats, 'TERM:' + t.term), r: rng() };
    });
    scored.sort(function (a, b) { return (a.att - b.att) || (a.r - b.r); });
    return scored.slice(0, count).map(function (x) { return x.t; });
  }

  var Engine = {
    CATEGORIES: CATEGORIES,
    COURSE_ORDER: COURSE_ORDER,
    catOf: catOf,
    itemKeyOf: itemKeyOf,
    correctText: correctText,
    shuffle: shuffle,
    classifyAnswer: classifyAnswer,
    isRedrawable: isRedrawable,
    placeSuffix: placeSuffix,
    buildDistractorPool: buildDistractorPool,
    presentQuestion: presentQuestion,
    pickSession: pickSession,
    courseQuestions: courseQuestions,
    pickEndless: pickEndless,
    subthemeStats: subthemeStats,
    weakSubthemes: weakSubthemes,
    genTermQuiz: genTermQuiz,
    TERM_QUIZ_TYPES: TERM_QUIZ_TYPES,
    pickTermQuizTerms: pickTermQuizTerms
  };

  global.CKAEngine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
