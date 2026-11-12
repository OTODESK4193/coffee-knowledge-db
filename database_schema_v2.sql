-- コーヒー知識データベース スキーマ v2
-- v2: 追加カテゴリ 00,09-13 と、メディア関連付け（地図・図・表・イラスト）を追加
-- 詳細は 調査項目整理_v2.md §3, §3-2, §4 を参照

CREATE TABLE categories (
  id TEXT PRIMARY KEY,          -- 例: '01', '04'
  name_ja TEXT NOT NULL
);

CREATE TABLE geo_places (
  id TEXT PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT,
  name_local TEXT,
  level TEXT NOT NULL CHECK (level IN ('continent','country','region','farm_area')),
  parent_id TEXT REFERENCES geo_places(id),
  latitude REAL,
  longitude REAL,
  boundary_geojson TEXT,
  altitude_min INTEGER,
  altitude_max INTEGER,
  harvest_months TEXT,          -- JSON配列 例: [10,11,12,1]
  coordinate_note TEXT          -- 代表点である旨などの注記
);

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  publisher TEXT,
  year INTEGER,
  url_or_isbn TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('S','A','B'))
);

CREATE TABLE entries (
  id TEXT PRIMARY KEY,          -- 例: '04-02-BR'
  category_id TEXT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  fact_type TEXT NOT NULL CHECK (fact_type IN ('fact','legend','interpretation','contested')),
  tags TEXT,                    -- JSON配列
  geo_place_id TEXT REFERENCES geo_places(id),
  related_entry_ids TEXT,       -- JSON配列
  last_verified_at TEXT,        -- ISO日付
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','verified','needs_update'))
);

CREATE TABLE entry_sources (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  locator_note TEXT,            -- 該当ページ・表番号など
  PRIMARY KEY (entry_id, source_id)
);

CREATE TABLE people (
  id TEXT PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_original TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  geo_place_id TEXT REFERENCES geo_places(id),
  summary TEXT
);

CREATE TABLE varieties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT,                 -- arabica / canephora / liberica / excelsa
  parent_variety_id TEXT REFERENCES varieties(id),
  geo_place_id TEXT REFERENCES geo_places(id),
  summary TEXT
);

CREATE TABLE price_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator TEXT NOT NULL,      -- 例: 'ICO Composite', 'NY Arabica Futures'
  value REAL NOT NULL,
  unit TEXT NOT NULL,           -- 例: 'US cents/lb', 'USD/kg'
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  year_note TEXT,               -- 推定年など
  title TEXT NOT NULL,
  entry_id TEXT REFERENCES entries(id),
  geo_place_id TEXT REFERENCES geo_places(id)
);

-- カテゴリ00 用語集
CREATE TABLE glossary (
  id TEXT PRIMARY KEY,
  term_ja TEXT NOT NULL,
  term_en TEXT,
  reading TEXT,
  definition TEXT NOT NULL,     -- 簡潔な定義。詳細は entry_id 先を参照
  entry_id TEXT REFERENCES entries(id)
);

-- 図・表・イラスト・写真・グラフ等のメディア資産（§3-2）
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('map','diagram','chart','table','illustration','photo')),
  title TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  file_path TEXT,               -- 自前ファイルの場合
  data_table_id INTEGER REFERENCES data_tables(id), -- 表・グラフは構造化データ参照
  geo_place_id TEXT REFERENCES geo_places(id),      -- 地図の場合
  source_id TEXT REFERENCES sources(id),
  license TEXT,                 -- PD / CC BY / CC BY-SA / official-open-data / original / link-only
  license_verified_at TEXT,
  production_note TEXT          -- 自作イラストとして起こす場合の制作指示メモ
);

CREATE TABLE entry_media (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  media_id TEXT NOT NULL REFERENCES media_assets(id),
  role TEXT NOT NULL DEFAULT 'supporting' CHECK (role IN ('main','supporting','thumbnail')),
  necessity TEXT NOT NULL DEFAULT 'optional' CHECK (necessity IN ('required','optional')),
  step_no INTEGER,              -- 手順イラストの場合のステップ番号
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (entry_id, media_id, role)
);

-- 表・グラフの構造化データ（画像化せず保持する）
CREATE TABLE data_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  columns_json TEXT NOT NULL,   -- 列定義（名称・単位・型）
  rows_json TEXT NOT NULL,      -- 行データ
  period_start TEXT,
  period_end TEXT,
  source_id TEXT REFERENCES sources(id)
);
