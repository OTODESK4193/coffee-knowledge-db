#!/usr/bin/env python3
"""問題バッチファイル（A〜M）から coffee_knowledge.db の questions を更新する。

- 既存問題: stem/選択肢/正解/難易度がDBと一致することを検証したうえで、解説（要点・詳細＋出典）のみをファイル内容で更新する。
- 新規問題（バッチK・L等、DBに無いID）: 行を挿入する。
- 形式検証: 選択肢4つ・★ちょうど1つ・重複IDなし・根拠エントリー実在。
使い方: python3 update_questions.py
"""
import json
import re
import sqlite3
import sys
from pathlib import Path

BASE = Path(__file__).parent
BATCHES = [
    "questions_batch_A.md", "questions_batch_B.md", "questions_batch_C.md",
    "questions_batch_D1.md", "questions_batch_D2.md", "questions_batch_D3.md",
    "questions_batch_E.md", "questions_batch_F.md", "questions_batch_G.md",
    "questions_batch_H.md", "questions_batch_I.md", "questions_batch_J.md",
    "questions_batch_K.md", "questions_batch_L.md", "questions_batch_M.md",
]
EXPECTED = {"questions_batch_A.md": 30, "questions_batch_B.md": 36, "questions_batch_C.md": 32,
            "questions_batch_D1.md": 22, "questions_batch_D2.md": 24, "questions_batch_D3.md": 40,
            "questions_batch_E.md": 10, "questions_batch_F.md": 2, "questions_batch_G.md": 4,
            "questions_batch_H.md": 20, "questions_batch_I.md": 8, "questions_batch_J.md": 2,
            "questions_batch_K.md": 24, "questions_batch_L.md": 8,
            "questions_batch_M.md": 20}

# 監査対応で承認済みの選択肢修正: 2026-11-11 分（Q-13-03-02 並記外し、選択肢同種性監査の6件）に加え、
# 2026-11-12 総点検の軽微指摘対応分（留保表現・根拠整合のための正解肢/誤答肢の文言修正5件）
APPROVED_CHOICES = {"Q-13-03-02", "Q-04-02-BR-01", "Q-04-02-ID-01",
                    "Q-04-03-YIRGACHEFFE-01", "Q-05-01-01", "Q-13-03-01", "Q-01-03-01",
                    "Q-09-02-04", "Q-07-08-02", "Q-07-02-04", "Q-07-01-03", "Q-06-02-WAVE-02"}
# 承認済みの問題文修正（2026-11-12 総点検対応: エントリーにない年齢括弧の削除）
APPROVED_STEM = {"Q-10-04-04"}

FIELD_RE = re.compile(r"^- (問題文|選択肢|解説（要点）|詳細解説|出典|関連|関連問題ID|メディア|メディアID|id|entry_id)\s*[:：]\s*(.*)$")
CHOICE_LINE_RE = re.compile(r"^\s*(\d)\.\s+(.*\S)\s*$")
INLINE_SPLIT_RE = re.compile(r"\s/\s(?=\d\.\s)")


def parse_batch(path: Path):
    text = path.read_text(encoding="utf-8")
    blocks = re.split(r"^#{2,3} (Q-\S+)\s*$", text, flags=re.M)
    # blocks: [prefix, id1, body1, id2, body2, ...]
    questions = []
    for i in range(1, len(blocks), 2):
        qid, body = blocks[i], blocks[i + 1]
        q = {"id": qid, "choices": [], "_fields": {}}
        current = None
        for line in body.splitlines():
            m = FIELD_RE.match(line)
            if m:
                current = m.group(1)
                val = m.group(2).strip()
                if current == "entry_id":
                    segments = [s.strip() for s in val.split("/")]
                    if segments and ":" not in segments[0]:
                        q["entry_id"] = segments[0]
                        segments = segments[1:]
                    for part in segments:
                        if part.startswith("entry_id:"):
                            q["entry_id"] = part.split(":", 1)[1].strip()
                        elif part.startswith("subtheme_id:"):
                            q["subtheme_id"] = part.split(":", 1)[1].strip()
                        elif part.startswith("difficulty:"):
                            q["difficulty"] = int(part.split(":", 1)[1].strip())
                        elif part.startswith("fact_type:"):
                            q["fact_type"] = part.split(":", 1)[1].strip()
                    current = None
                elif current == "選択肢":
                    if val:
                        # inline form: "1. a / 2. b ★ / 3. c / 4. d"
                        if re.match(r"^1\.\s", val) and INLINE_SPLIT_RE.search(val):
                            for piece in INLINE_SPLIT_RE.split(val):
                                cm = CHOICE_LINE_RE.match(piece.strip())
                                if cm:
                                    q["choices"].append(cm.group(2).strip())
                            current = None
                        else:
                            q["_fields"].setdefault("選択肢", []).append(val)
                            current = "選択肢"
                    else:
                        current = "選択肢"
                else:
                    q["_fields"].setdefault(current, []).append(val)
            elif current == "選択肢":
                cm = CHOICE_LINE_RE.match(line)
                if cm:
                    q["choices"].append(cm.group(2).strip())
                elif line.strip():
                    # continuation or stray: treat as field continuation end
                    current = None
            elif current:
                if line.strip():
                    q["_fields"][current].append(line.strip())
        def field(name):
            return "\n".join(q["_fields"].get(name, [])).strip()
        q["stem"] = field("問題文")
        q["explanation_short"] = field("解説（要点）")
        long_body = field("詳細解説")
        source = field("出典")
        q["explanation_long"] = long_body + ("\n\n出典: " + source if source else "")
        # correct index from ★
        stars = [j for j, c in enumerate(q["choices"]) if "★" in c]
        q["choices"] = [c.replace("★", "").strip() for c in q["choices"]]
        q["correct_index"] = stars[0] if len(stars) == 1 else -1
        q["n_stars"] = len(stars)
        del q["_fields"]
        questions.append(q)
    return questions


def main():
    con = sqlite3.connect(BASE / "coffee_knowledge.db")
    con.row_factory = sqlite3.Row
    entry_ids = {r[0] for r in con.execute("SELECT id FROM entries")}
    existing = {r["id"]: dict(r) for r in con.execute("SELECT * FROM questions")}
    problems = []
    all_q = {}
    for name in BATCHES:
        qs = parse_batch(BASE / "questions" / name)
        if len(qs) != EXPECTED[name]:
            problems.append(f"{name}: parsed {len(qs)} != expected {EXPECTED[name]}")
        for q in qs:
            if q["id"] in all_q:
                problems.append(f"duplicate id {q['id']}")
            all_q[q["id"]] = q
            if len(q["choices"]) != 4:
                problems.append(f"{q['id']}: {len(q['choices'])} choices")
            if q["n_stars"] != 1:
                problems.append(f"{q['id']}: {q['n_stars']} stars")
            if q.get("entry_id") not in entry_ids:
                problems.append(f"{q['id']}: entry {q.get('entry_id')} missing")
            if not q["stem"] or not q["explanation_short"] or not q["explanation_long"]:
                problems.append(f"{q['id']}: empty field")
    # consistency vs existing rows (stem/choices/correct/difficulty must be unchanged)
    for qid, old in existing.items():
        if qid not in all_q:
            problems.append(f"{qid}: in DB but not in batch files")
            continue
        new = all_q[qid]
        if new["stem"] != old["stem"] and qid not in APPROVED_STEM:
            problems.append(f"{qid}: stem mismatch")
        if json.loads(old["choices_json"]) != new["choices"]:
            if qid not in APPROVED_CHOICES:
                problems.append(f"{qid}: choices mismatch")
        if new["correct_index"] != old["correct_index"]:
            problems.append(f"{qid}: correct_index mismatch")
        if new["difficulty"] != old["difficulty"]:
            problems.append(f"{qid}: difficulty mismatch")
    if problems:
        print("PROBLEMS:", len(problems))
        for p in problems[:40]:
            print(" -", p)
        sys.exit(1)
    updated = inserted = 0
    for qid, q in all_q.items():
        if qid in existing:
            if qid in APPROVED_CHOICES and qid in APPROVED_STEM:
                con.execute("UPDATE questions SET explanation_short=?, explanation_long=?, choices_json=?, stem=? WHERE id=?",
                            (q["explanation_short"], q["explanation_long"],
                             json.dumps(q["choices"], ensure_ascii=False), q["stem"], qid))
            elif qid in APPROVED_CHOICES:
                con.execute("UPDATE questions SET explanation_short=?, explanation_long=?, choices_json=? WHERE id=?",
                            (q["explanation_short"], q["explanation_long"],
                             json.dumps(q["choices"], ensure_ascii=False), qid))
            elif qid in APPROVED_STEM:
                con.execute("UPDATE questions SET explanation_short=?, explanation_long=?, stem=? WHERE id=?",
                            (q["explanation_short"], q["explanation_long"], q["stem"], qid))
            else:
                con.execute("UPDATE questions SET explanation_short=?, explanation_long=? WHERE id=?",
                            (q["explanation_short"], q["explanation_long"], qid))
            updated += 1
        else:
            con.execute(
                "INSERT INTO questions (id, entry_id, subtheme_id, stem, choices_json, correct_index,"
                " explanation_short, explanation_long, difficulty, fact_type, status)"
                " VALUES (?,?,?,?,?,?,?,?,?,?, 'draft')",
                (qid, q["entry_id"], q["subtheme_id"], q["stem"], json.dumps(q["choices"], ensure_ascii=False),
                 q["correct_index"], q["explanation_short"], q["explanation_long"], q["difficulty"], q["fact_type"]))
            inserted += 1
    con.commit()
    total = con.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
    print(f"updated={updated} inserted={inserted} total={total}")
    print("problems: []")


if __name__ == "__main__":
    main()
