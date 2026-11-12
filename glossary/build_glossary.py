#!/usr/bin/env python3
"""用語収集ファイル（glossary_G1/G2/G3.md）を統合し、DBテーブルとJSONを生成する。
再実行可能: テーブルは DROP して作り直す。"""
import re, sqlite3, json, os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GDIR = os.path.join(BASE, 'glossary')
DB = os.path.join(BASE, 'coffee_knowledge.db')
FILES = ['glossary_G1.md', 'glossary_G2.md', 'glossary_G3.md', 'glossary_G4.md', 'glossary_G5.md', 'glossary_G6.md', 'glossary_G7.md', 'glossary_G8.md']

def clean_term(t):
    t = t.strip()
    t = re.sub(r'（既存）$', '', t).strip()
    t = t.replace('★', '').strip()
    return t

terms = {}   # term -> record
conflicts = []
order = []
for fn in FILES:
    if not os.path.exists(os.path.join(GDIR, fn)):
        print('skip missing:', fn); continue
    section = ''
    for line in open(os.path.join(GDIR, fn), encoding='utf-8'):
        line = line.rstrip('\n')
        m = re.match(r'^##\s+(.+)', line)
        if m:
            section = re.sub(r'^[A-Z][.．]\s*', '', m.group(1)).strip()
            continue
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 9:
            continue
        if cells[0] in ('用語',) or set(cells[0]) <= set('-: '):
            continue
        term = clean_term(cells[0])
        if not term or term == '用語':
            continue
        rec = dict(term=term, reading=cells[1], english=cells[2], level=cells[3],
                   kind=cells[4], hitokoto=cells[5], definition=cells[6],
                   entry_id=cells[7], related=cells[8], field=section, source_file=fn)
        if term in terms:
            old = terms[term]
            if old['definition'] != rec['definition'] or old['hitokoto'] != rec['hitokoto']:
                conflicts.append((term, old['source_file'], rec['source_file']))
            continue
        terms[term] = rec
        order.append(term)

STARTER30 = ['コーヒーノキ','コーヒーチェリー','アラビカ','カネフォーラ（ロブスタ）','生豆',
 'パーチメント','ウォッシュド','ナチュラル','選択摘み（ピッキング）','ハゼ','1ハゼ','焙煎度',
 'デガス','ブリュー比率','浸漬式','透過式','蒸らし','過抽出','未抽出','グラインダー',
 'ドリッパー','フレンチプレス','クレマ','タンピング','スチーミング','ラテアート',
 'カッピング','酸質','ボディ','カフェイン']
for t in STARTER30:
    assert t in terms, f'STARTER30 missing: {t}'
    terms[t]['starter'] = 1

records = [terms[t] for t in order]
for r in records:
    r.setdefault('starter', 0)
print('unique terms:', len(records))
print('conflicts (same term, different text):', conflicts)
from collections import Counter
print('by level:', Counter(r['level'] for r in records))
print('by kind:', Counter(r['kind'] for r in records))

con = sqlite3.connect(DB)
con.executescript('''
DROP TABLE IF EXISTS glossary_terms;
CREATE TABLE glossary_terms (
  term TEXT PRIMARY KEY,
  reading TEXT, english TEXT, field TEXT,
  level TEXT, kind TEXT,
  hitokoto TEXT, definition TEXT,
  entry_id TEXT, related TEXT,
  source_file TEXT, status TEXT DEFAULT 'draft', starter INTEGER DEFAULT 0
);
''')
for r in records:
    con.execute('INSERT INTO glossary_terms VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                (r['term'], r['reading'], r['english'], r['field'], r['level'], r['kind'],
                 r['hitokoto'], r['definition'], r['entry_id'], r['related'], r['source_file'], 'draft', r['starter']))
con.commit()
print('db rows:', con.execute('SELECT COUNT(*) FROM glossary_terms').fetchone()[0])
con.close()

with open(os.path.join(BASE, 'glossary_export.json'), 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=1)
print('exported glossary_export.json:', len(records))

nyumon = [r['term'] for r in records if r['level'] == '入門']
print('入門 terms (%d):' % len(nyumon), '、'.join(nyumon))
