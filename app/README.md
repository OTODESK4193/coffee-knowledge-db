# コーヒー知識学習アプリ（静的版）

現行アプリ（サーバー型）と同等の学習機能を、素の HTML/CSS/JavaScript だけで
実装した静的PWA試作です。ビルド不要で、そのまま静的ホスティングに置けます。

## 動かし方

PWA（Service Worker / fetch）の制約上、`file://` では動きません。
任意の静的サーバーでこのフォルダを配信してください。

```bash
cd app
python3 -m http.server 8000
# → http://localhost:8000/
```

GitHub Pages 等にそのまま置くこともできます（このフォルダ一式が配信単位です）。

## 構成

| パス | 内容 |
|---|---|
| `index.html` / `style.css` | 画面の骨格と配色（深い茶色＋クリーム） |
| `js/store.js` | 学習記録の保存（localStorage のみ） |
| `js/engine.js` | 出題選択・方式A（選択肢シャッフル／誤答再抽選 R1〜R6）・方式B（用語クイズ生成）・弱点判定 |
| `js/terms.js` | 用語リンク（最長一致・多義語ガード・初出注釈） |
| `js/map.js` | 世界地図／国別ズーム地図のSVG描画 |
| `js/media.js` | 図解・表・地図・写真の表示と全画面ビューア |
| `js/app.js` | 画面遷移とクイズ進行 |
| `data/` | `sync-data.py` で同期した問題・用語・メディアデータ |
| `manifest.json` / `sw.js` | PWA（オフライン動作） |
| `icon.svg` / `icon-*.png` | アイコン |

## データの更新

ワークスペース側（`coffee-knowledge-db/`）が正本です。データを直したら:

```bash
python3 sync-data.py   # app/data/ を再生成
```

方式Dの関連問題（バッチK）の `related_to` は、バッチKの対応表から
自動で付与されます。写真6枚はバイナリのため同梱せず、
Wikimedia Commons の原ファイルURLを直接参照します（帰属表示付き、
オンライン時のみ表示）。データ更新時は `sw.js` の `CACHE_VERSION` を
上げること（利用者側のキャッシュを切り替えるため）。

## 学習記録について

- 回答履歴・復習リスト（Leitner）・設定・進行中セッションはすべて
  この端末の localStorage に保存されます。サーバー通信は一切しません。
- 現行アプリからの記録引き継ぎは実装していません（ユーザー決定）。
- 記録の消去は設定（右上の歯車）→「学習記録と設定を初期化」から。
