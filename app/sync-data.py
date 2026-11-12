#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静的PWA版アプリのデータ同期スクリプト。

ワークスペース側（coffee-knowledge-db/）が正本。ここで app/data/ へ
アプリが必要とする JSON / SVG / geojson のコピーを生成する。

生成物:
  data/questions.json        questions_export.json + 方式Dの related_to を付与
                             （対応表は questions/questions_batch_K.md から抽出）
  data/glossary.json         glossary_export.json のコピー
  data/choice_notes.json     choice_notes_cat02.json + cat03.json を統合
  data/link_guards.json      glossary/link_guards.json のコピー
  data/media_links.json      media_assets/media_links.json のコピー
  data/tables.json           media_assets/tables.json のコピー
  data/producer_highlights.json
  data/world_countries.geojson
  data/*.svg                 図解SVG 4点
  data/svg_texts.json        図解SVGのテキスト埋め込み（ビューア表示を読み込み経路に依存させないため）
  data/photos.json           写真の遠隔URLと帰属表示（バイナリは同梱しない。
                             photos_licences.md の Commons ファイルページから
                             Special:FilePath URL を組み立てる）

使い方: python3 sync-data.py
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
ROOT = APP_DIR.parent
DATA = APP_DIR / "data"


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dump_json(obj, p):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  -> {p.relative_to(APP_DIR)} ({p.stat().st_size:,} bytes)")


def extract_related_to():
    """バッチKの対応表（新規問題ID → 元の問題ID）から related_to を抽出する。
    元の問題が複数ある場合は先頭のものを知識項目キーとする。"""
    text = (ROOT / "questions" / "questions_batch_K.md").read_text(encoding="utf-8")
    mapping = {}
    for line in text.splitlines():
        m = re.match(r"\|\s*(Q-[0-9A-Z-]+)\s*\|\s*(Q-[^|]+)\|", line)
        if not m:
            continue
        new_id, originals = m.group(1), m.group(2)
        first = re.split(r"[,、]", originals)[0].strip()
        if re.fullmatch(r"Q-[0-9A-Z-]+", first):
            mapping[new_id] = first
    return mapping


def build_questions():
    qs = load_json(ROOT / "questions_export.json")
    rel = extract_related_to()
    attached = 0
    for q in qs:
        q["related_to"] = rel.get(q["id"])
        if q["related_to"]:
            attached += 1
    print(f"questions: {len(qs)} 件 / related_to 付与 {attached} 件")
    dump_json(qs, DATA / "questions.json")


def build_choice_notes():
    merged = {}
    for name in ("choice_notes_cat02.json", "choice_notes_cat03.json"):
        part = load_json(ROOT / "questions" / name)
        for qid, notes in part.items():
            merged.setdefault(qid, {}).update(notes)
    total = sum(len(v) for v in merged.values())
    print(f"choice_notes: {len(merged)} 問 / {total} 件")
    dump_json(merged, DATA / "choice_notes.json")


def parse_photo_licences():
    """photos_licences.md の表から、ローカルファイル名 → {page, credit} を得る。"""
    text = (ROOT / "media_assets" / "photos_licences.md").read_text(encoding="utf-8")
    out = {}
    for line in text.splitlines():
        if not line.startswith("|") or ".jpg" not in line:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 7:
            continue
        local = cells[1]
        page = cells[3]
        credit = cells[6]
        if local.endswith(".jpg") and page.startswith("http"):
            out[local] = {"page": page, "credit": credit}
    return out


def build_photos():
    ml = load_json(ROOT / "media_assets" / "media_links.json")
    licences = parse_photo_licences()
    photos = []
    for ph in ml["map_photos"]["photos"]:
        local = Path(ph["file"]).name
        lic = licences.get(local, {})
        page = lic.get("page", "")
        m = re.search(r"/wiki/File:(.+)$", page)
        commons_name = m.group(1) if m else ""
        # Special:FilePath は upload.wikimedia.org の実ファイルへリダイレクトされる安定URL
        url = (
            "https://commons.wikimedia.org/wiki/Special:FilePath/"
            + commons_name
            + "?width=1600"
            if commons_name
            else ""
        )
        photos.append(
            {
                "file": local,
                "topic_ja": ph.get("topic_ja", ""),
                "entry_ids": ph.get("entry_ids", []),
                "url": url,
                "page": page,
                "credit": lic.get("credit", ""),
            }
        )
    print(f"photos: {len(photos)} 件（遠隔参照のみ、同梱なし）")
    dump_json(photos, DATA / "photos.json")


def build_svg_texts():
    """図解SVGのテキストを JSON に埋め込む。アプリ側はこれを同期的に
    インライン描画するので、ビューア表示が個別ファイルの取得成否に左右されない。"""
    texts = {}
    for name in (
        "cherry-cross-section.svg",
        "processing-flows.svg",
        "roast-curve.svg",
        "variety-lineage.svg",
    ):
        texts[name] = (ROOT / "media_assets" / name).read_text(encoding="utf-8")
    print(f"svg_texts: {len(texts)} 件")
    dump_json(texts, DATA / "svg_texts.json")


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    print("== 静的アプリ用データ同期 ==")
    build_questions()
    dump_json(load_json(ROOT / "glossary_export.json"), DATA / "glossary.json")
    build_choice_notes()
    dump_json(load_json(ROOT / "glossary" / "link_guards.json"), DATA / "link_guards.json")
    dump_json(load_json(ROOT / "media_assets" / "media_links.json"), DATA / "media_links.json")
    dump_json(load_json(ROOT / "media_assets" / "tables.json"), DATA / "tables.json")
    dump_json(
        load_json(ROOT / "media_assets" / "producer_highlights.json"),
        DATA / "producer_highlights.json",
    )
    for name in (
        "world_countries.geojson",
        "cherry-cross-section.svg",
        "processing-flows.svg",
        "roast-curve.svg",
        "variety-lineage.svg",
    ):
        src = ROOT / "media_assets" / name
        dst = DATA / name
        shutil.copyfile(src, dst)
        print(f"  -> data/{name} ({dst.stat().st_size:,} bytes)")
    build_svg_texts()
    build_photos()
    print("完了")


if __name__ == "__main__":
    sys.exit(main())
