/* media.js — 解説に付く関連メディア（図解SVG・表・地図・写真）と全画面ビューア
 *
 * 対応付けはワークスペースの media_links.json に従い、問題の entry_id で引く。
 * 写真は同梱せず Wikimedia Commons の原ファイルを直接参照し、帰属表示を付ける。
 */
(function (global) {
  'use strict';

  /* 04-03 地域エントリー → 親国（地図ズーム用） */
  var REGION_COUNTRY = {
    '04-03-SIDAMO': { iso: 'ETH', name: 'シダモ' },
    '04-03-YIRGACHEFFE': { iso: 'ETH', name: 'イルガチェフェ' },
    '04-03-DAKLAK': { iso: 'VNM', name: 'ダクラク' },
    '04-03-HUILA': { iso: 'COL', name: 'ウイラ' },
    '04-03-MINAS-GERAIS': { iso: 'BRA', name: 'ミナスジェライス' },
    '04-03-SUMATRA': { iso: 'IDN', name: 'スマトラ' }
  };

  var state = {
    mediaLinks: null, tables: null, photos: null,
    producerIsos: null, entryToIso: null
  };

  function init(data) {
    state.mediaLinks = data.mediaLinks;
    if (data.svgTexts) {
      Object.keys(data.svgTexts).forEach(function (k) { svgTexts[k] = data.svgTexts[k]; });
    }
    state.tables = {};
    (data.tables.tables || []).forEach(function (t) { state.tables[t.media_id] = t; });
    state.photos = data.photos || [];
    state.producerIsos = new Set();
    state.entryToIso = {};
    (data.producerHighlights.countries || []).forEach(function (c) {
      state.producerIsos.add(c.iso_a3);
      state.entryToIso[c.entry_id] = { iso: c.iso_a3, name: c.name_ja };
    });
  }

  /* ---------- 図解SVG（<img>ではなくインライン埋め込みで表示する） ---------- */
  var svgTexts = {};
  var svgWaiters = {};
  function loadSvg(file, cb) {
    if (svgTexts[file]) { cb(svgTexts[file]); return; }
    if (svgWaiters[file]) { svgWaiters[file].push(cb); return; }
    svgWaiters[file] = [cb];
    fetch('data/' + file).then(function (r) {
      if (!r.ok) throw new Error(file + ' ' + r.status);
      return r.text();
    }).then(function (t) {
      svgTexts[file] = t;
      (svgWaiters[file] || []).forEach(function (f) { f(t); });
      delete svgWaiters[file];
    }).catch(function () { delete svgWaiters[file]; });
  }
  function svgDiv(file) {
    var div = document.createElement('div');
    div.className = 'svg-box';
    loadSvg(file, function (t) { div.innerHTML = t; });
    return div;
  }

  /* ---------- 表の描画 ---------- */
  var CELL_LABELS = { item: '項目', target: '目標値', acceptable_range: '許容範囲', recommended: '推奨' };
  var TABLE_KEY_ORDER = {
    'T-CUPPING-CONDITIONS': ['section', 'item', 'value', 'note'],
    'T-PROCESSING-COMPARISON': ['method', 'fermentation_site', 'drying_form', 'flavor_tendency', 'evidence_note']
  };
  function tableEl(table) {
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    var title = document.createElement('div');
    title.className = 'table-title';
    title.textContent = table.title || table.id;
    wrap.appendChild(title);
    if (table.systems) {
      table.systems.forEach(function (sys) {
        var h = document.createElement('div');
        h.className = 'table-sys-title';
        h.textContent = sys.system + '（' + sys.year + '年）: ' + sys.document;
        wrap.appendChild(h);
        if (sys.scope) {
          var sc = document.createElement('p');
          sc.className = 'table-note';
          sc.textContent = sys.scope;
          wrap.appendChild(sc);
        }
        var keys = ['item', 'target', 'acceptable_range', 'recommended'].filter(function (k) {
          return sys.rows.some(function (r) { return r[k] != null; });
        });
        wrap.appendChild(rowsTable(keys.map(function (k) { return CELL_LABELS[k]; }),
          sys.rows.map(function (r) { return keys.map(function (k) { return r[k] != null ? r[k] : '―'; }); })));
        if (sys.hardness_metric) {
          var hm = document.createElement('p');
          hm.className = 'table-note';
          hm.textContent = '硬度の定義: ' + sys.hardness_metric;
          wrap.appendChild(hm);
        }
        (sys.cautions || []).forEach(function (c) {
          var p = document.createElement('p');
          p.className = 'table-note';
          p.textContent = '※ ' + c;
          wrap.appendChild(p);
        });
      });
    } else if (table.columns && table.rows) {
      var keys2 = TABLE_KEY_ORDER[table.id] || Object.keys(table.rows[0]);
      wrap.appendChild(rowsTable(table.columns,
        table.rows.map(function (r) { return keys2.map(function (k) { return r[k] != null ? r[k] : '―'; }); })));
    }
    if (table.note) {
      var n = document.createElement('p');
      n.className = 'table-note';
      n.textContent = table.note;
      wrap.appendChild(n);
    }
    return wrap;
  }
  function rowsTable(headers, rows) {
    var t = document.createElement('table');
    t.className = 'data-table';
    var thead = document.createElement('thead');
    var trh = document.createElement('tr');
    headers.forEach(function (h) {
      var th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    t.appendChild(thead);
    var tbody = document.createElement('tbody');
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      row.forEach(function (cell) {
        var td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    return t;
  }

  /* ---------- メディアブロックの構築 ---------- */
  function figure(captionText) {
    var fig = document.createElement('figure');
    fig.className = 'media-fig';
    if (captionText) {
      var cap = document.createElement('figcaption');
      cap.textContent = captionText;
      fig.appendChild(cap);
    }
    return fig;
  }

  /* entry_id に紐づくメディア要素を返す（なければ null）。
     viewerOpener(node) をタップ時に呼ぶ。 */
  function buildMedia(entryId, viewerOpener) {
    var items = [];
    var links = (state.mediaLinks && state.mediaLinks.diagrams_tables.links) || [];
    links.forEach(function (l) {
      var hit = (l.entry_ids_primary || []).indexOf(entryId) >= 0
        || (l.entry_ids_secondary || []).indexOf(entryId) >= 0;
      if (!hit) return;
      if (l.type === 'diagram/svg' || l.type === 'chart/svg') {
        items.push({ kind: 'svg', file: l.file, title: l.title, caption: l.caption, alt: l.alt });
      } else if (l.type === 'table/json') {
        var table = state.tables[l.media_id];
        if (table) items.push({ kind: 'table', table: table, title: l.title, caption: l.caption });
      }
    });
    /* 地図 */
    var mapSpec = mapForEntry(entryId);
    if (mapSpec) items.push(mapSpec);
    /* 写真 */
    state.photos.forEach(function (p) {
      if ((p.entry_ids || []).indexOf(entryId) >= 0) {
        items.push({ kind: 'photo', photo: p, title: p.topic_ja, caption: p.topic_ja });
      }
    });
    if (!items.length) return null;

    var box = document.createElement('div');
    box.className = 'media-box';
    var head = document.createElement('div');
    head.className = 'media-head';
    head.textContent = '関連メディア（タップで拡大）';
    box.appendChild(head);
    items.forEach(function (it) {
      var fig = figure(it.caption);
      var holder = document.createElement('div');
      holder.className = 'media-holder';
      if (it.kind === 'svg') {
        holder.appendChild(svgDiv(it.file));
      } else if (it.kind === 'table') {
        holder.appendChild(tableEl(it.table));
      } else if (it.kind === 'map') {
        var div = document.createElement('div');
        div.innerHTML = it.svg;
        holder.appendChild(div);
      } else if (it.kind === 'photo') {
        var pimg = document.createElement('img');
        pimg.src = it.photo.url;
        pimg.alt = it.photo.topic_ja;
        pimg.loading = 'lazy';
        holder.appendChild(pimg);
        var credit = document.createElement('div');
        credit.className = 'photo-credit';
        var a = document.createElement('a');
        a.href = it.photo.page;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = it.photo.credit;
        credit.appendChild(a);
        fig.appendChild(credit);
      }
      holder.addEventListener('click', function () {
        viewerOpener(cloneForViewer(it));
      });
      fig.insertBefore(holder, fig.firstChild);
      box.appendChild(fig);
    });
    return box;
  }

  function cloneForViewer(it) {
    var wrap = document.createElement('div');
    wrap.className = 'viewer-content';
    if (it.kind === 'svg') {
      wrap.appendChild(svgDiv(it.file));
    } else if (it.kind === 'table') {
      wrap.appendChild(tableEl(it.table));
    } else if (it.kind === 'map') {
      wrap.innerHTML = it.svg;
    } else if (it.kind === 'photo') {
      var pimg = document.createElement('img');
      pimg.src = it.photo.url;
      pimg.alt = it.photo.topic_ja;
      wrap.appendChild(pimg);
      var credit = document.createElement('div');
      credit.className = 'photo-credit';
      credit.textContent = it.photo.credit;
      wrap.appendChild(credit);
    }
    return wrap;
  }

  function mapForEntry(entryId) {
    var mapLinks = state.mediaLinks && state.mediaLinks.map_photos
      ? state.mediaLinks.map_photos.map : null;
    if (entryId === '04-01') {
      return { kind: 'map', svg: global.CKAMap.worldMap(state.producerIsos), caption: '主要生産国（USDA等の統計に基づく上位10カ国を着色）' };
    }
    if (state.entryToIso[entryId]) {
      var c = state.entryToIso[entryId];
      return { kind: 'map', svg: global.CKAMap.countryMap(c.iso, c.name), caption: c.name + 'の位置' };
    }
    if (REGION_COUNTRY[entryId]) {
      var r = REGION_COUNTRY[entryId];
      return { kind: 'map', svg: global.CKAMap.countryMap(r.iso, r.name), caption: r.name + '（地域）のある国の位置' };
    }
    if (mapLinks && (mapLinks.entry_ids || []).indexOf(entryId) >= 0) {
      return { kind: 'map', svg: global.CKAMap.worldMap(state.producerIsos), caption: '主要生産国の分布' };
    }
    return null;
  }

  /* ---------- 全画面ビューア ---------- */
  var Viewer = {
    el: null, stage: null, inner: null,
    scale: 1, tx: 0, ty: 0,
    init: function () {
      var el = document.createElement('div');
      el.className = 'viewer';
      el.hidden = true;
      el.innerHTML = '<button class="viewer-close" aria-label="閉じる">×</button>'
        + '<div class="viewer-stage"><div class="viewer-inner"></div></div>'
        + '<div class="viewer-hint">ピンチ／ドラッグ／ダブルタップで拡縮</div>';
      document.body.appendChild(el);
      this.el = el;
      this.stage = el.querySelector('.viewer-stage');
      this.inner = el.querySelector('.viewer-inner');
      var self = this;
      el.querySelector('.viewer-close').addEventListener('click', function () { self.close(); });
      el.addEventListener('click', function (ev) {
        if (ev.target === el || ev.target === self.stage || ev.target === self.inner) self.close();
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && !el.hidden) self.close();
      });
      this.bindGestures();
    },
    apply: function () {
      this.inner.style.transform = 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.scale + ')';
    },
    open: function (node) {
      if (!this.el) this.init();
      this.inner.textContent = '';
      this.inner.appendChild(node);
      this.scale = 1; this.tx = 0; this.ty = 0;
      this.apply();
      this.el.hidden = false;
      document.body.style.overflow = 'hidden';
    },
    close: function () {
      this.el.hidden = true;
      document.body.style.overflow = '';
    },
    bindGestures: function () {
      var self = this;
      var pointers = {};
      var startDist = 0, startScale = 1;
      var lastTap = 0;
      var dragStart = null;
      this.stage.addEventListener('pointerdown', function (ev) {
        pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
        if (Object.keys(pointers).length === 2) {
          var pts = Object.values(pointers);
          startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          startScale = self.scale;
          dragStart = null;
        } else {
          dragStart = { x: ev.clientX - self.tx, y: ev.clientY - self.ty };
        }
        self.stage.setPointerCapture(ev.pointerId);
      });
      this.stage.addEventListener('pointermove', function (ev) {
        if (!pointers[ev.pointerId]) return;
        pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
        var pts = Object.values(pointers);
        if (pts.length === 2 && startDist > 0) {
          var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          self.scale = Math.max(0.5, Math.min(6, startScale * d / startDist));
          self.apply();
        } else if (dragStart && self.scale > 1) {
          self.tx = ev.clientX - dragStart.x;
          self.ty = ev.clientY - dragStart.y;
          self.apply();
        }
      });
      function up(ev) {
        delete pointers[ev.pointerId];
        if (Object.keys(pointers).length === 0) {
          var now = Date.now();
          if (now - lastTap < 300) {
            self.scale = self.scale > 1.2 ? 1 : 2.5;
            if (self.scale === 1) { self.tx = 0; self.ty = 0; }
            self.apply();
            lastTap = 0;
          } else {
            lastTap = now;
          }
          dragStart = null;
        }
      }
      this.stage.addEventListener('pointerup', up);
      this.stage.addEventListener('pointercancel', up);
      this.stage.addEventListener('wheel', function (ev) {
        ev.preventDefault();
        self.scale = Math.max(0.5, Math.min(6, self.scale * (ev.deltaY < 0 ? 1.12 : 0.89)));
        if (self.scale === 1) { self.tx = 0; self.ty = 0; }
        self.apply();
      }, { passive: false });
    }
  };

  var Media = { init: init, buildMedia: buildMedia, Viewer: Viewer, REGION_COUNTRY: REGION_COUNTRY };
  global.CKAMedia = Media;
})(typeof window !== 'undefined' ? window : globalThis);
