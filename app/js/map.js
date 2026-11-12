/* map.js — world_countries.geojson から SVG 地図を描く
 *
 * - 04-01（生産国マスター）: 世界地図に主要生産国10カ国をハイライト
 * - 04-02-XX（国別）/ 04-03（地域）: 対象国にズームし、その国だけを濃く表示。
 *   周辺国はベージュ、海は淡い青灰色。対象国の中心にピンと「〜はココ」ラベル、
 *   周辺国には小さな国名ラベルを付ける。
 * 投影は単純な正距円筒（経緯度をそのまま座標にする）。
 */
(function (global) {
  'use strict';

  var SEA = '#c7d3d8';
  var LAND = '#e9ddc4';
  var BORDER = '#8a6d4f';
  var PRODUCER = '#c08552';
  var TARGET = '#5d3a1a';

  var cache = {}; // iso_a3 -> { d, bbox, cx, cy, name_ja }

  function ringPath(ring) {
    var s = '';
    for (var i = 0; i < ring.length; i++) {
      s += (i === 0 ? 'M' : 'L') + ring[i][0].toFixed(2) + ' ' + (-ring[i][1]).toFixed(2);
    }
    return s + 'Z';
  }
  function featurePath(geom) {
    var polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    var s = '';
    polys.forEach(function (poly) {
      poly.forEach(function (ring) { s += ringPath(ring); });
    });
    return s;
  }
  function prepare(geojson) {
    geojson.features.forEach(function (f) {
      var p = f.properties;
      var coords = [];
      var polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      polys.forEach(function (poly) {
        poly.forEach(function (ring) { ring.forEach(function (pt) { coords.push(pt); }); });
      });
      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      coords.forEach(function (pt) {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      });
      cache[p.iso_a3] = {
        d: featurePath(f.geometry),
        bbox: [minX, minY, maxX, maxY],
        cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
        name_ja: p.name_ja || p.name
      };
    });
  }
  function get(iso) { return cache[iso]; }

  function svgWrap(viewBox, inner) {
    return '<svg class="map-svg" viewBox="' + viewBox + '" xmlns="http://www.w3.org/2000/svg" role="img">'
      + '<rect x="' + viewBox.split(' ')[0] + '" y="' + viewBox.split(' ')[1]
      + '" width="' + viewBox.split(' ')[2] + '" height="' + viewBox.split(' ')[3]
      + '" fill="' + SEA + '"/>' + inner + '</svg>';
  }
  function pathEl(iso, fill) {
    var c = cache[iso];
    if (!c) return '';
    return '<path d="' + c.d + '" fill="' + fill + '" stroke="' + BORDER + '" stroke-width="0.25" stroke-linejoin="round"/>';
  }

  /* 世界地図（生産国ハイライト） */
  function worldMap(producerIsos) {
    var inner = '';
    Object.keys(cache).forEach(function (iso) {
      inner += pathEl(iso, producerIsos.has(iso) ? PRODUCER : LAND);
    });
    producerIsos.forEach(function (iso) {
      var c = cache[iso];
      if (!c) return;
      inner += '<text x="' + c.cx + '" y="' + (-c.cy) + '" class="map-label map-label--producer" '
        + 'font-size="4.2" text-anchor="middle">' + c.name_ja + '</text>';
    });
    return svgWrap('-180 -88 360 176', inner);
  }

  /* 対象国ズーム地図。label は「〜はココ」の主語（国名または地域名） */
  function countryMap(targetIso, label) {
    var c = cache[targetIso];
    if (!c) return '';
    var spanLon = Math.max((c.bbox[2] - c.bbox[0]) * 1.7, 13);
    var spanLat = Math.max((c.bbox[3] - c.bbox[1]) * 1.7, 9);
    var minLon = Math.max(-180, Math.min(180 - spanLon, c.cx - spanLon / 2));
    var maxLat = Math.min(88, Math.max(spanLat - 60, c.cy + spanLat / 2));
    var viewBox = minLon.toFixed(1) + ' ' + (-maxLat).toFixed(1) + ' ' + spanLon.toFixed(1) + ' ' + spanLat.toFixed(1);
    var inner = '';
    var minLat = maxLat - spanLat;
    Object.keys(cache).forEach(function (iso) {
      if (iso === targetIso) return;
      var o = cache[iso];
      // ビューポートと重なる国だけ描く
      if (o.bbox[2] < minLon || o.bbox[0] > minLon + spanLon || o.bbox[3] < minLat || o.bbox[1] > maxLat) return;
      inner += pathEl(iso, LAND);
    });
    inner += pathEl(targetIso, TARGET);
    /* 周辺国の小さな国名ラベル（中心がビューポート内にあり、ある程度大きい国だけ） */
    var fs = spanLon / 58;
    Object.keys(cache).forEach(function (iso) {
      if (iso === targetIso) return;
      var o = cache[iso];
      var inX = o.cx >= minLon && o.cx <= minLon + spanLon;
      var inY = o.cy <= maxLat && o.cy >= maxLat - spanLat;
      var big = (o.bbox[2] - o.bbox[0]) >= 2.2 || (o.bbox[3] - o.bbox[1]) >= 2.2;
      if (inX && inY && big) {
        inner += '<text x="' + o.cx + '" y="' + (-o.cy) + '" class="map-label" font-size="'
          + fs.toFixed(2) + '" text-anchor="middle">' + o.name_ja + '</text>';
      }
    });
    /* ピン＋「〜はココ」 */
    var pinScale = spanLon / 60;
    inner += '<g transform="translate(' + c.cx + ' ' + (-c.cy) + ') scale(' + pinScale.toFixed(3) + ')">'
      + '<path d="M0 0 C -4.5 -6 -6.5 -9 -6.5 -12.5 A 6.5 6.5 0 1 1 6.5 -12.5 C 6.5 -9 4.5 -6 0 0 Z" fill="#b3392e" stroke="#fff" stroke-width="1.2"/>'
      + '<circle cx="0" cy="-12.5" r="2.6" fill="#fff"/></g>';
    inner += '<text x="' + c.cx + '" y="' + (-c.cy + fs * 2.4) + '" class="map-label map-label--target" '
      + 'font-size="' + (fs * 1.25).toFixed(2) + '" text-anchor="middle">' + label + 'はココ</text>';
    return svgWrap(viewBox, inner);
  }

  var MapMod = { prepare: prepare, get: get, worldMap: worldMap, countryMap: countryMap };
  global.CKAMap = MapMod;
  if (typeof module !== 'undefined' && module.exports) module.exports = MapMod;
})(typeof window !== 'undefined' ? window : globalThis);
