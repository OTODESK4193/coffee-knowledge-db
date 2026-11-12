-- コーヒー知識データベース スキーマ v1 (ドラフト)
-- 詳細は 調査項目整理_v1.md §3-§4 を参照

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
