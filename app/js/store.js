/* store.js — 学習記録の保存層（localStorage のみ、サーバー通信なし）
 *
 * 保存するもの:
 *   settings   : { sessionSize: 5|10|20, fontSize: 'normal'|'large'|'xlarge' }
 *   answers    : { [questionId]: { n, c, lastAt } }        問題ごとの回答集計
 *   itemStats  : { [itemKey]: { n, c } }                    知識項目単位の集計
 *                  itemKey は related_to で集約した元問題ID、または 'TERM:<用語>'
 *   review     : { [itemKey]: { box, due, kind, qid?, term? } }  復習リスト（Leitner）
 *   termMarks  : { [term]: 'know'|'weak' }                  用語カードの自己判定
 *   session    : 進行中セッション（再開用）
 *   hintShown  : 用語リンクのヒント表示済みフラグ
 */
(function (global) {
  'use strict';
  var PREFIX = 'cka_static_v1_';

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      /* 容量超過などは黙って諦める（学習自体は継続できる） */
    }
  }
  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) {}
  }

  var Store = {
    getSettings: function () {
      var s = read('settings', null);
      if (!s) s = { sessionSize: 10, fontSize: 'normal' };
      if ([5, 10, 20].indexOf(s.sessionSize) < 0) s.sessionSize = 10;
      if (['normal', 'large', 'xlarge'].indexOf(s.fontSize) < 0) s.fontSize = 'normal';
      return s;
    },
    saveSettings: function (s) { write('settings', s); },

    getAnswers: function () { return read('answers', {}); },
    getItemStats: function () { return read('itemStats', {}); },
    getReview: function () { return read('review', {}); },
    getTermMarks: function () { return read('termMarks', {}); },

    /* 1問の回答を記録する。itemKey は知識項目キー（問題 or TERM:用語） */
    recordAnswer: function (qid, itemKey, correct, extra) {
      var answers = Store.getAnswers();
      var a = answers[qid] || { n: 0, c: 0, lastAt: 0 };
      a.n += 1; if (correct) a.c += 1; a.lastAt = Date.now();
      answers[qid] = a;
      write('answers', answers);

      var items = Store.getItemStats();
      var it = items[itemKey] || { n: 0, c: 0 };
      it.n += 1; if (correct) it.c += 1;
      items[itemKey] = it;
      write('itemStats', items);

      /* Leitner: 不正解→ボックス1で復習入り、正解→ボックスを上げ間隔を延ばす。
         ボックス5で正解したら卒業（復習リストから外れる）。 */
      var review = Store.getReview();
      var r = review[itemKey];
      var intervals = [1, 3, 7, 14, 30]; // box1..5 の次回までの日数
      if (!correct) {
        review[itemKey] = {
          box: 1, due: Date.now() + intervals[0] * 86400000,
          kind: extra && extra.kind ? extra.kind : 'q',
          qid: extra && extra.qid ? extra.qid : qid,
          term: extra && extra.term ? extra.term : null
        };
      } else if (r) {
        if (r.box >= 5) {
          delete review[itemKey];
        } else {
          r.box += 1;
          r.due = Date.now() + intervals[r.box - 1] * 86400000;
          review[itemKey] = r;
        }
      }
      write('review', review);
    },

    recordTermMark: function (term, mark) {
      var m = Store.getTermMarks();
      m[term] = mark;
      write('termMarks', m);
    },

    getSession: function () { return read('session', null); },
    saveSession: function (s) { if (s) write('session', s); else remove('session'); },
    clearSession: function () { remove('session'); },

    getHintShown: function () { return !!read('hintShown', false); },
    setHintShown: function () { write('hintShown', true); },

    resetAll: function () {
      ['settings', 'answers', 'itemStats', 'review', 'termMarks', 'session', 'hintShown']
        .forEach(remove);
    }
  };

  global.CKAStore = Store;
})(typeof window !== 'undefined' ? window : globalThis);
