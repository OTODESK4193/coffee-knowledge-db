/* terms.js — 用語リンク（最長一致＋文単位の多義語ガード＋初出注釈）
 *
 * segmentText() は純粋関数（DOM非依存）で、テキストを
 *   { type:'text', text } / { type:'term', text, term, annotate }
 * の列に分解する。renderInto() がそれをDOMに描く。
 *
 * ルール:
 * - 用語は最長一致でマッチする（ランドレース が レース に誤マッチしない）
 * - 多義語ガード（link_guards.json）: ガード対象語は、同じ文の中に
 *   require_any のキーワードがある場合だけリンク・注釈の対象にする
 * - 基礎・発展レベルの用語は、ブロック内の初出にだけ ルビ＋ひとこと を付ける
 */
(function (global) {
  'use strict';

  function buildIndex(glossary) {
    var byTerm = {};
    var byFirst = {};
    glossary.forEach(function (t) {
      byTerm[t.term] = t;
      var f = t.term.charAt(0);
      (byFirst[f] = byFirst[f] || []).push(t.term);
    });
    Object.keys(byFirst).forEach(function (f) {
      byFirst[f].sort(function (a, b) { return b.length - a.length; });
    });
    return { byTerm: byTerm, byFirst: byFirst };
  }

  function splitSentences(text) {
    /* '。' を文の区切りとして保持したまま分割する */
    var parts = [];
    var cur = '';
    for (var i = 0; i < text.length; i++) {
      cur += text.charAt(i);
      if (text.charAt(i) === '。') { parts.push(cur); cur = ''; }
    }
    if (cur) parts.push(cur);
    return parts;
  }

  function guardPasses(sentence, termText, guards) {
    var g = guards && guards.guards ? guards.guards[termText] : null;
    if (!g) return true;
    return (g.require_any || []).some(function (kw) { return sentence.indexOf(kw) >= 0; });
  }

  /* ctx: { index, guards, seen:Set(注釈済み用語), annotate:bool }
     annotate=false のとき注釈は付けない（選択肢内など） */
  function segmentText(text, ctx) {
    var segments = [];
    var sentences = splitSentences(text);
    sentences.forEach(function (sentence) {
      var i = 0;
      var buf = '';
      function flush() {
        if (buf) { segments.push({ type: 'text', text: buf }); buf = ''; }
      }
      while (i < sentence.length) {
        var cands = ctx.index.byFirst[sentence.charAt(i)];
        var matched = null;
        if (cands) {
          for (var k = 0; k < cands.length; k++) {
            if (sentence.substr(i, cands[k].length) === cands[k]) { matched = cands[k]; break; }
          }
        }
        if (matched) {
          if (guardPasses(sentence, matched, ctx.guards)) {
            flush();
            var termObj = ctx.index.byTerm[matched];
            var annotate = false;
            if (ctx.annotate && (termObj.level === '基礎' || termObj.level === '発展') && !ctx.seen.has(matched)) {
              annotate = true;
              ctx.seen.add(matched);
            }
            segments.push({ type: 'term', text: matched, term: termObj, annotate: annotate });
          } else {
            buf += matched; /* ガード不通過: そのまま素通し（内部の短い語も拾わない） */
          }
          i += matched.length;
        } else {
          buf += sentence.charAt(i);
          i += 1;
        }
      }
      flush();
    });
    return segments;
  }

  /* DOM描画: el の中身を text のリンク化結果で置き換える。
     opts: { annotate, linkable, onTerm(termObj) }
     linkable=false のときは装飾のみ（タップは親側の選択肢クリックに流れる） */
  function renderInto(el, text, ctx, opts) {
    opts = opts || {};
    var localCtx = {
      index: ctx.index, guards: ctx.guards,
      seen: ctx.seen || new Set(),
      annotate: opts.annotate !== false
    };
    var segments = segmentText(text, localCtx);
    el.textContent = '';
    segments.forEach(function (seg) {
      if (seg.type === 'text') {
        el.appendChild(document.createTextNode(seg.text));
        return;
      }
      var span = document.createElement('span');
      span.className = 'term-link' + (opts.linkable === false ? ' term-link--plain' : '');
      span.setAttribute('data-term', seg.term.term);
      if (seg.annotate) {
        var ruby = document.createElement('ruby');
        ruby.textContent = seg.term.term;
        var rt = document.createElement('rt');
        rt.textContent = seg.term.reading || '';
        ruby.appendChild(rt);
        span.appendChild(ruby);
        var note = document.createElement('span');
        note.className = 'term-note';
        note.textContent = '（' + (seg.term.hitokoto || '') + '）';
        span.appendChild(note);
      } else {
        span.textContent = seg.term.term;
      }
      if (opts.linkable !== false && opts.onTerm) {
        (function (t) {
          span.addEventListener('click', function (ev) {
            ev.stopPropagation();
            opts.onTerm(t);
          });
        })(seg.term);
      }
      el.appendChild(span);
    });
    return localCtx.seen;
  }

  var Terms = {
    buildIndex: buildIndex,
    splitSentences: splitSentences,
    guardPasses: guardPasses,
    segmentText: segmentText,
    renderInto: renderInto
  };
  global.CKATerms = Terms;
  if (typeof module !== 'undefined' && module.exports) module.exports = Terms;
})(typeof window !== 'undefined' ? window : globalThis);
