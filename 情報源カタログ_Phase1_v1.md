# コーヒー知識データベース Phase 1 情報源カタログ v1
作成日: 2026-11-11
対応: 調査項目整理 v2（§1-1、§6 ステップ1）、DBスキーマ v2 の `sources` テーブル
目的: 本格収集（Phase 2以降）で使う S/A級情報源を先に固定する。B級は速報性が必要な価格・市況に限定。
確認方法: 2026-11-11 に各一次・専門機関の公開ページ／報告書をウェブ検索で確認。URLは検索結果で全文が返されたものだけを記載し、返されなかったものは URL欄を「未確認」とし、名称・シリーズ名だけで固定した（収集時にURLを再確認すること）。

## 使い方
- 各エントリーの `sources` にはこのカタログの ID（例: `S-ICO-01`）を使う。
- 数値は原則2系統以上で照合（v2 §1-2）。下の「照合ペア」欄を参照。
- `year` はこのカタログで確認した最新版・最新号の年。エントリー執筆時に最新号へ更新すること。

## S級（一次・公的）

### S-ICO-01 — International Coffee Organization（ICO）統計・市場報告
- tier: S / publisher: International Coffee Organization
- URL（確認済）: https://ico.org/what-we-do/world-coffee-statistics-database/
- 対象カテゴリ: 04（生産国マスター・国別プロファイル）、05-02・05-03（価格・価格高騰）
- カバーするもの: 世界のコーヒー貿易・生産・消費・在庫、ICO Composite Indicator Price（I-CIP）と4グループ指標価格（Colombian Milds / Other Milds / Brazilian Naturals / Robustas）、月次 Coffee Market Report、Coffee Report and Outlook（年2回）
- 最新確認: 2026年9月版 Coffee Market Report で I-CIP 平均 262.18 US cents/lb（8月比 -8.7%）。2025/26年世界生産は過去最高 183.6百万袋（60kg袋）、消費 180.6百万袋、3.0百万袋の黒字（5年ぶり）
- 更新: 月次報告＋年2回の見通し。コーヒー年度は10月〜9月
- アクセス注意（2026-11-11確認の重要変更）: 2026年9月30日、ICOは Coffee Market Intelligence Platform（data.ico.org）を公開。現年度の価格・在庫・集計済み貿易・生産統計は無料で閲覧可。1963年まで遡る履歴データとExcel/CSV抽出は ICOメンバーまたは統計出版物の購読者限定。旧 World Coffee Statistics Database（db.ico.org）も同様にメンバー／購読者限定だった
- 照合ペア: USDA（S-USDA-01）、World Bank Pink Sheet（S-WB-01）、FAOSTAT（S-FAO-01）

### S-FAO-01 — FAO / FAOSTAT 作物統計（Coffee, green）
- tier: S / publisher: Food and Agriculture Organization of the United Nations（FAO）
- URL（確認済）: https://www.fao.org/coffee （FAOコーヒー特設ページ。FAOSTAT本体のURLはこのカタログでは未確認のため記載しない）
- 対象カテゴリ: 04-01・04-02（生産量・国別）、05-03（長期トレンドの裏取り）
- カバーするもの: 国別・暦年別の生豆（Coffee, green）生産量・収穫面積。1961年以降の時系列。2023年世界生産は約11.1百万トン、ブラジルが約30.8%
- 更新: 年次
- 注意: 暦年・トン建てで、品種（アラビカ／ロブスタ）の内訳はない。ICO（コーヒー年度・60kg袋）や USDA（国別マーケティング年度・60kg袋）とは集計基準が違うため、数値を並べる際は基準を必ず併記する。FAOが公式値を持たない国は推計値で補い、フラグが付く場合がある
- 照合ペア: ICO、USDA
- 参考（背景のみ、古いため数値の根拠にしない）: FAO Coffee Pocketbook（2015年、ISBN 978-92-5-108894-4）https://openknowledge.fao.org/3/a-i4985e.pdf

### S-USDA-01 — USDA Foreign Agricultural Service, Coffee: World Markets and Trade
- tier: S / publisher: USDA Foreign Agricultural Service
- URL: 未確認（シリーズ名と発行元で固定。収集時に fas.usda.gov の当該ページで確認すること）
- 対象カテゴリ: 04-01・04-02（生産・輸出・消費・在庫）、05-02・05-03
- カバーするもの: 世界の生産・貿易・消費・在庫の半年報。2026/27年世界生産は過去最高 189.7百万袋（60kg袋）を見込む（2026年7月号）。ブラジル 2026/27年は 71.9百万袋（過去最高、アラビカ回復が主因）、ベトナム 32.5百万袋、エチオピア 12.1百万袋、ウガンダ 7.16百万袋。2025/26年世界生産 178.8百万袋
- 更新: 年2回（6月・12月）。次号は 2026年12月16日予定
- 注意: 国ごとにマーケティング年度が違う（ブラジル 7月〜6月、ベトナム・コロンビア 10月〜9月など）。ICO・FAOSTATとの数値差はこの基準差で説明できる場合が多い。PSD Online データベースも同シリーズの数値源
- 照合ペア: ICO、Conab（S-CONAB-01）、FNC（S-FNC-01）

### S-WB-01 — World Bank, Commodity Markets（Pink Sheet 月次価格＋Commodity Markets Outlook）
- tier: S / publisher: World Bank
- URL: 未確認（シリーズ名で固定。収集時に worldbank.org の Commodity Markets ページで確認すること）
- 対象カテゴリ: 05-02・05-03（価格高騰の時系列・見通し）
- カバーするもの: アラビカ・ロブスタの月次価格（USD/kg、1960年まで遡る長期系列）。アラビカは ICO Other Milds、ロブスタは ICO Robustas 指標が元。2025年平均アラビカ $8.47/kg（2023年1月 $4.54/kg前後からの上昇と整合）、2026年9月 $7.26/kg、ロブスタ同 $3.69/kg。2026年10月版 Outlook はアラビカ 2026年 -13%、ロブスタ -21%の見通しを示す
- 更新: 月次価格＋年4回の Outlook（1・4・7・10月）
- 注意: 名目価格。長期比較では実質化の有無を明記する。見通しは予測であり、事実の数値と分けて記録する
- 照合ペア: ICO（I-CIP）、USDA

### S-UNESCO-01 — UNESCO 無形文化遺産リスト（ICH）
- tier: S / publisher: UNESCO
- URL（確認済）: https://ich.unesco.org/en/lists?term[]=vocabulary_ich-84&secondary_filter=1
- 対象カテゴリ: 08-02（トルコ／アラブ）、08-04（ウィーンの扱いの区別）
- カバーするもの: 「Turkish coffee culture and tradition」（2013年登録）、「Arabic coffee, a symbol of generosity」（2015年登録、UAE・オマーン・カタール・サウジアラビア・ヨルダン）
- 注意: ウィーンのカフェハウス文化は UNESCO本体の世界リストではなくオーストリア国内インベントリ（2011年）である点を v2 §1-2 の通り区別する。各要素の登録年・登録国・原文をこのリストで確認する
- 照合ペア: 各国文化庁・国内インベントリ（収集時に個別確認）

### S-CONAB-01 — Conab（ブラジル国家供給公社）コーヒー作物調査
- tier: S / publisher: Companhia Nacional de Abastecimento（Conab、ブラジル）
- URL: 未確認（シリーズ名で固定）
- 対象カテゴリ: 04-02（ブラジル）、05-03（ブラジル要因の検証）
- カバーするもの: ブラジル公式の生産推計。年数回更新。2026年産は 67.6百万袋（過去最高、アラビカ 48.21百万袋・前年比+34.8%、コニロン 19.39百万袋・同-6.6%）と2026年9月24日改定で示された
- 注意: USDAの 71.9百万袋（2026/27年）とは推計手法・対象年度が違うため、並べる際は出典と年度を分けて記載する
- 照合ペア: USDA、ICO

### S-FNC-01 — Federación Nacional de Cafeteros de Colombia（FNC）統計
- tier: S / publisher: Federación Nacional de Cafeteros de Colombia
- URL: 未確認（団体名・シリーズ名で固定）
- 対象カテゴリ: 04-02（コロンビア）、05-03
- カバーするもの: コロンビアの生産・輸出統計。2025/26年生産は 12.65百万袋（前年比-15%）、輸出 11.78百万袋（同-12%）
- 照合ペア: USDA、ICO

## A級（専門機関・専門書）

### A-SCA-01 — Specialty Coffee Association（SCA）規格・プロトコル
- tier: A / publisher: Specialty Coffee Association
- URL: 未確認（sca.coffee の Value Assessment ページで収集時に確認すること）
- 対象カテゴリ: 07-05（抽出理論・ブリューイングコントロールチャート）、09-01〜09-03（カッピング手順・評価・フレーバーホイール）
- カバーするもの: Coffee Value Assessment（CVA）規格群（Standard 102〜105、2024年版）。2004年の旧カッピングプロトコルは 2024年11月に CVAへ置き換えられた。カッピングの調製は 8.25g／150ml、水温 93±3℃、4分蒸らし等。Golden Cup は TDS 1.15〜1.35%、抽出率 18〜22%が目安。Coffee Taster's Flavor Wheel（2016年版、WCRと共同）
- 注意: 旧2004年式の100点フォームと CVA は別体系。エントリーではどちらの体系の数値かを必ず明記し、混ぜない
- 照合ペア: WCR（A-WCR-01）、査読論文（UC Davis Coffee Center の 2023年版ブリューイングコントロールチャート等、収集時に個別固定）

### A-WCR-01 — World Coffee Research（WCR）品種カタログ
- tier: A / publisher: World Coffee Research
- URL（確認済）: https://varieties.worldcoffeeresearch.org/arabica/varieties
- 対象カテゴリ: 02-02・02-03（品種・系統図）、03-03（耐病性）
- カバーするもの: アラビカ 55品種（15カ国）、ロブスタ 47品種（8カ国）のプロファイル。樹形・収量・さび病感受性・適正標高等。ティピカ／ブルボンは栽培アラビカの二大基盤集団。ゲイシャ（Gesha）はエチオピア起源でパナマ経由で著名化
- 注意: カタログは CC BY-NC-ND 4.0。品種説明の引用は出典明記の上で行い、改変・販売はしない。最新版はサイトで確認する（改訂日 2023年4月17日版が確認された）
- 照合ペア: SCA、品種に関する査読論文（収集時に個別固定）

## B級（報道・業界）— 価格・市況の速報に限定
- B-REUTERS-01 — Reuters ほか信頼できる報道。市況・災害・政策の速報の裏取り用。単独根拠にしない。v2 §1-1 の通り
- 業界団体の年次報告は、収集対象の団体ごとに個別に ID を付与して追加する（現時点で未固定）

## 未固定（Phase 1b で名称・URL・シリーズを確認してから追加すること）
- カテゴリ10（化学・健康）: EFSA のカフェイン目安量、査読レビュー／メタ解析。具体的な文献はエントリーごとに固定し、S級限定のルール（v2 §2 カテゴリ10）を守る。現時点で特定の文献をカタログに入れていない
- カテゴリ13（日本市場）: 財務省貿易統計、全日本コーヒー協会の統計シリーズ。具体的なシリーズ名・URLは未確認のため、カタログには入れていない
- カテゴリ01（歴史・人物）: 専門書・学術書はエントリーごとに書誌を固定する（現時点で特定の書名をカタログに入れていない）

## 照合の要点（収集時のチェックリスト）
1. 生産量は ICO／USDA／FAOSTAT の3系統で単位と年度基準（コーヒー年度10〜9月／国別マーケティング年度／暦年）を併記する。3系統の数値が一致しないのは正常で、差の理由を書く
2. 価格は ICO I-CIP（US cents/lb、日次・月次）と World Bank Pink Sheet（USD/kg、月次・年平均）を使い分け、換算時は単位を明記する
3. 品種は WCR カタログを正とし、マーケティング上の通称（例: Geisha／Gesha の表記ゆれ）は別名として記録する
4. カッピング・評価は CVA（2024年〜）と旧2004年式を区別する
5. UNESCO登録は本体リストと国内インベントリを区別する（ウィーン）
