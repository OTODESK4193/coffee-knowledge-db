-- コーヒー知識学習アプリ用スキーマ拡張 v1
-- 前提: database_schema_v2.sql のテーブル（entries, sources, media_assets 等）が存在すること
-- 詳細は アプリ計画_v1.md §3, §5 を参照

-- 4択問題
CREATE TABLE questions (
  id TEXT PRIMARY KEY,                    -- 例: 'Q-01-01-001'
  entry_id TEXT NOT NULL REFERENCES entries(id),   -- 根拠エントリー
  subtheme_id TEXT NOT NULL,              -- 調査項目ID 例: '01-01'
  stem TEXT NOT NULL,                     -- 問題文
  choices_json TEXT NOT NULL,             -- 選択肢4件のJSON配列
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation_short TEXT NOT NULL,        -- 答え合わせ直下の要点
  explanation_long TEXT NOT NULL,         -- 詳細解説（DB本文ベース）
  difficulty INTEGER NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  tags TEXT,                              -- JSON配列
  fact_type TEXT NOT NULL DEFAULT 'fact' CHECK (fact_type IN ('fact','legend','interpretation','contested')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','checked','published'))
);

-- 問題 × 出典（出典のない問題は公開しないルールの担保）
CREATE TABLE question_sources (
  question_id TEXT NOT NULL REFERENCES questions(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (question_id, source_id)
);

-- 問題 × メディア（図解・表・地図等）
CREATE TABLE question_media (
  question_id TEXT NOT NULL REFERENCES questions(id),
  media_id TEXT NOT NULL REFERENCES media_assets(id),
  placement TEXT NOT NULL DEFAULT 'explanation' CHECK (placement IN ('stem','explanation')),
  PRIMARY KEY (question_id, media_id, placement)
);

-- 関連問題（「関連問題に挑戦」の導線）
CREATE TABLE question_relations (
  question_id TEXT NOT NULL REFERENCES questions(id),
  related_question_id TEXT NOT NULL REFERENCES questions(id),
  relation TEXT NOT NULL DEFAULT 'same_subtheme' CHECK (relation IN ('same_entry','same_subtheme','same_tag','confusable')),
  PRIMARY KEY (question_id, related_question_id, relation)
);

-- 学習セッション（エンドレスは1回の起動〜終了を1セッションとして記録）
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT NOT NULL CHECK (mode IN ('theme','endless','weakness','review')),
  theme_id TEXT,                          -- テーマ別モードの場合のカテゴリ/小テーマ
  started_at TEXT NOT NULL,
  ended_at TEXT
);

-- 回答ログ（統計の正本）
CREATE TABLE answers_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES sessions(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  selected_index INTEGER NOT NULL CHECK (selected_index BETWEEN 0 AND 3),
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  elapsed_ms INTEGER,
  answered_at TEXT NOT NULL
);

-- 問題ごとの習得度（Leitner方式の間隔反復）
CREATE TABLE question_mastery (
  question_id TEXT PRIMARY KEY REFERENCES questions(id),
  leitner_box INTEGER NOT NULL DEFAULT 1 CHECK (leitner_box BETWEEN 1 AND 5),
  next_review_at TEXT,                    -- 次回復習期限（ISO日付）
  last_result INTEGER CHECK (last_result IN (0,1)),
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0
);

-- ブックマーク
CREATE TABLE bookmarks (
  question_id TEXT PRIMARY KEY REFERENCES questions(id),
  created_at TEXT NOT NULL
);

-- 日次集計（統計画面の高速表示用。answers_log から再計算可能）
CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY,                  -- YYYY-MM-DD
  answered INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0
);
