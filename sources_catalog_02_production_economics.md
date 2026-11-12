# 情報源カタログ 02： 生産・産地・経済（カテゴリ03・04・05）

作成日: 2026-11-11（Phase 1）
担当範囲: 03 栽培・収穫・精製 / 04 産地・国・地域・地図 / 05 産業・経済・社会問題
準拠方針: 調査項目整理_v2.md §1-1（情報源の優先順位 S/A/B）、§1-2（データと主張を分ける）

## 読み方
- **Tier**: S=一次・公的 / A=専門機関・専門研究 / B=報道・業界（単独根拠にしない）
- **種別（05のみ）**: `データ系`＝統計・調査そのもの / `制度・主張系`＝基準設定や提言を行う主体の刊行物。後者は「その主体がそう定めた／そう主張する」という形でのみ引用し、事実として無主語で書かない
- URL・発行年は Web検索で実在を確認できたものだけを記した。確認できなかったものは「未確認」と明記し、推測の書誌は作っていない
- 確認日はすべて 2026-11-11

---

## A. カテゴリ03（栽培・収穫・精製）の情報源

| ID | 情報源 | 発行主体 | Tier | 確認できた内容・URL | 用途と注意 |
|---|---|---|---|---|---|
| 03-S1 | Arabica / Robusta Varieties Catalog（オンライン品種カタログ） | World Coffee Research (WCR) | A | https://varieties.worldcoffeeresearch.org/ （品種ごとに系統、育種機関、適標高、収量性、さび病・ベリー病・線虫への耐性、農学的注意を掲載。随時更新） | 03-01〜03-03、02-03品種系統の裏取り。品種単位の一次参照として最優先。カタログの評価は WCR の試験条件に基づく点に注意 |
| 03-S2 | Cenicafé の技術刊行物群（Revista Cenicafé、Avances Técnicos、Guía Más Agronomía, Más Productividad, Más Calidad 等） | Cenicafé（Centro Nacional de Investigaciones de Café、FNC の研究部門、1938年設立） | A | ポータル www.cenicafe.org から技術刊行物が公開されていることを研究論文経由で確認。具体的な各刊行物の URL は未確認 | 03-02 栽培管理、03-03 病害虫（さび病耐性品種 Castillo 等の育種元）、03-05 洗浄式精製（beneficio）の標準資料。スペイン語。コロンビアの条件に最適化された内容である点に注意 |
| 03-S3 | コーヒー研究プログラム（品種改良、接ぎ木、アグロフォレストリー、気候適応） | CIRAD（フランス農業開発研究国際協力センター） | A | CIRAD がコーヒーの品種・病害・気候適応研究を行うこと、EU Horizon プロジェクト BOLERO 等を主導することを EU 公式プロジェクトページで確認。CIRAD 公式のコーヒー専用ページ URL は未確認 | 03-01 栽培条件、03-03 病害虫、05-08 気候適応。研究機関としての位置づけで引用 |
| 03-S4 | Central Coffee Research Institute (CCRI) の研究・統計 | Coffee Board of India（インド商工省傘下の法定機関） | S | Coffee Board が年次報告（Annual Report、2024-25版の存在を確認）や産地情報を https://coffeeboard.gov.in で公開していることをインド政府広報（PIB）経由で確認 | 03 全般（インドのシェード栽培等）＋04 インド国別データ。インド固有情報に限定 |
| 03-S5 | FAOSTAT（下記 04-S4 と同一） | FAO | S | 生産量に加え、栽培面積・単収（収穫量/面積）の時系列が国別に取れる | 03-01 の単収比較等に使用。種別（アラビカ/ロブスタ）の内訳はない |

※ 03 で未確認のもの: エチオピア Jimma Agricultural Research Center (JARC) の公式刊行物（存在は業界誌・研究資料で言及されるが公式 URL 未確認）、インドネシア ICCRI、ペルー等の各国研究機関。§F に残課題として記録。

---

## B. カテゴリ04（産地・国・地域）の統計情報源

| ID | 情報源 | 発行主体 | Tier | 確認できた内容・URL | 用途と注意 |
|---|---|---|---|---|---|
| 04-S1 | Coffee: World Markets and Trade（サーキュラー、年2回刊行） | USDA Foreign Agricultural Service | S | https://apps.fas.usda.gov/psdonline/circulars/coffee.pdf （最新版 PDF。2026年7月版の存在と、次回が2026年12月16日予定であることを同 PDF 内で確認）。アーカイブは FAS サイト内 | 世界・国別の生産、輸出、消費、在庫を 60kg袋単位で提示する標準ソース。**国ごとにマーケティングイヤーが異なる**（ブラジル7月〜、エチオピア10月〜等）ため年度の単純比較に注意 |
| 04-S2 | PSD Online（Production, Supply and Distribution データベース） | USDA FAS | S | https://apps.fas.usda.gov/psdonline/ （FAO 2025年レポートの引用でも確認） | 04-S1 の元データ。時系列を自前で抽出して data_tables 化する際の正本 |
| 04-S3 | GAIN レポート "Coffee Annual"（国別年次報告） | USDA FAS（各国駐在農務官） | S | 例: Vietnam Coffee Annual, Report Number VM2025-0018, 2025年5月19日公表（apps.fas.usda.gov で PDF 確認）。ブラジル、インドネシア、エチオピア等の国別版も同シリーズで存在 | 国別プロファイル（04-02）の骨格。現地統計（ベトナム GSO・税関等）を引用しつつ USDA が評価した形なので、原統計への遡及も可能 |
| 04-S4 | FAOSTAT — Crops and livestock products（品目 "Coffee, green"） | FAO | S | https://www.fao.org/faostat （UNdata 経由でも同データを確認）。1961年〜の暦年・トン単位・国別生産量 | 長期推移と国別生産の第2系統（照合用）。推計（インプテーション）フラグ付きの値が含まれる点、種別内訳がない点に注意。ICO/USDA と集計基準（暦年 vs コーピーイヤー、トン vs 袋）が違うため値は一致しないのが正常 |
| 04-S5 | FAOSTAT — Food Balances (2010-)（品目 "Coffee and products"） | FAO | S | ライセンス CC BY 4.0 で再配布されていることを二次利用サイトで確認。1人当たり供給量（kg/人/年）が取れる | 04-05 消費国・消費形態の基礎データ。「供給量＝実際の飲用量ではない」という留保を必ず付ける |
| 04-S6 | Coffee Market Report（月刊）＋ ICO 統計（指標価格・輸出統計） | International Coffee Organization (ICO) | S | 公式 PDF の URL 形式を確認: 例 https://www.ico.org/documents/cy2025-26/cmr-0426-e.pdf （2026年4月版）。ICO Composite Indicator Price (I-CIP) と 4グループ（Colombian Milds / Other Milds / Brazilian Naturals / Robustas）の指標価格、緑豆輸出、国別動向を掲載 | 04・05 の中核。コーヒーイヤーは10月〜9月。2026年9月に新データ基盤 "Coffee Market Intelligence Platform"（data.ico.org）が始動したとの業界報道あり（二次情報のため詳細は未確認 §F） |
| 04-S7 | Acompanhamento da Safra Brasileira de Café（ブラジル作柄調査、年4回程度の levantamento） | Conab（Companhia Nacional de Abastecimento、ブラジル農務省系公社） | S | 2014年創刊、ISSN 2318-7913 を公式 PDF で確認。例: Safra 2026 第3回調査（2026年9月、v.13 n.3）は https://www.gov.br/conab から公表。州別（ミナスジェライス、エスピリトサント等）の面積・単収・生産量、アラビカ／コニロン（ロブスタ）別 | 04 ブラジル国別・地域別の正本。USDA/ICO のブラジル数値としばしば乖離する（推計方法の違い）ため、併記時は出典を必ず区別する。ポルトガル語 |
| 04-S8 | Estadísticas Cafeteras（生産・輸出・国内基準価格の統計ファイル群）＋ 月次報告 | Federación Nacional de Cafeteros de Colombia (FNC) | A（業界連合だが FoNC 管理者として公的統計の性格を持つ） | FNC が「価格・面積・生産」ファイル、輸出ファイル、月次報告を公表していることを報道・同ファイル引用で確認。公式ポータルの正確な URL は未確認（§F）。単位は輸出統計＝60kg袋（生豆換算）、生産者向け国内価格＝125kg carga（乾燥パーチメント）と異なる | 04 コロンビア国別・地域別の正本。確定統計は DANE/DIAN の数値とずれる場合がある旨 FNC 自身が注記している |
| 04-S9 | Monthly Coffee Report（月刊輸出レポート） | Uganda Coffee Development Authority (UCDA、現 MAAIF 傘下) | S | https://ugandacoffee.go.ug から月次 PDF が公開されていることを確認（例: Coffee Year 2025/26 Issue 9 = 2026年6月版）。輸出量・金額、グレード別単価、輸出先、ファームゲート価格を含む | 04 ウガンダ国別データの正本。アフリカ最大級のロブスタ輸出国の一次統計 |
| 04-S10 | Coffee Board of India 年次報告・データベース | Coffee Board of India | S | 04 ではなく 03-S4 と同一主体。年次報告 2024-25 で生産 363,500 t（アラビカ 105,700 t / ロブスタ 257,800 t）等を公表していることを報道経由で確認 | インド国別（04-02）。数値は Phase 3 で原典 PDF から直接取ること |
| 04-S11 | ベトナム側統計: General Statistics Office (GSO) の栽培面積・輸出統計、Vietnam Customs の輸出データ | ベトナム政府機関 | S（位置づけ） | GSO 統計と税関データが実在し USDA GAIN が引用していることまで確認。**GSO 公式ポータルの直接 URL・英語版の提供形態は未確認**（§F） | 04 ベトナム国別。当面は 04-S3（GAIN）を経由して使い、原統計は Phase 3 で直接確認する |
| 04-S12 | VICOFA（Vietnam Coffee and Cocoa Association）発表資料 | ベトナムコーヒー・カカオ協会 | B（業界団体） | 作柄年度の生産・輸出見通しを発表していることをベトナム国営系メディア経由で確認。公式サイト URL は未確認 | 速報性の手がかり専用。数値の根拠には使わず GSO/税関/USDA で裏取りする |
| 04-S13 | Ethiopian Coffee and Tea Authority (ECTA) の輸出統計 | エチオピア農業省傘下機関 | S（位置づけ） | 月次・年次の輸出量・収入を公表していることを二次資料で確認。公式サイトの統計ページの直接確認は未了（§F）。会計年度が暦年と一致しない点に注意 | 04 エチオピア国別。当面は USDA/ICO で代替し、ECTA は要追加確認 |

---

## C. カテゴリ05（産業・経済）— データ系情報源

| ID | 情報源 | 発行主体 | Tier | 確認できた内容・URL | 用途と注意 |
|---|---|---|---|---|---|
| 05-D1 | Commodity Price Data (The Pink Sheet)（月刊、価格時系列） | World Bank | S | 公式 PDF を確認: 例 https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-November-2026.pdf 。アラビカ＝ICO "Other Milds" 指標、ロブスタ＝ICO Robustas 指標（いずれも $/kg、ex-dock） | **価格推移グラフ（chart）の正本**。名目価格であり実質価格ではない。§E のメモ参照 |
| 05-D2 | Commodity Markets Outlook（年2回、4月・10月）＋関連ブログ | World Bank | S | 2025年4月版に基づく公式ブログ "Beverage prices soften but risks are brewing"（2025年5月20日、blogs.worldbank.org）を確認。予測値を含む | 05-02/05-03 の見通し部分。**予測は予測として明示**し実績と混ぜない |
| 05-D3 | Global Coffee Market and Recent Price Developments（2025年3月14日） | FAO（著者: Amrouk, Palmeri, Magrini） | S | https://openknowledge.fao.org で原典 PDF を確認。FAO 公式ニュース https://www.fao.org/north-america/news/details/adverse-climatic-conditions-drive-coffee-prices-to-highest-level-in-years/en も確認 | 05-03 価格高騰の分析の正本の一つ。ICO/USDA/World Bank を横断して使う構成で、価格の小売への転嫁（pass-through）の推計も含む |
| 05-D4 | Price Dynamics in Global Beverage Markets: Trends, Drivers, and Consequences（2026年7月14日公表） | FAO | S | FAO 公式ニュースルームで公表を確認（原典 PDF の直接 URL は未確認）。「短期の価格変動の90%以上は需給ショックで説明できる」との分析を含む | 05-D3 の後継分析。05-03 の要因分解（天候・在庫・物流 vs 投機・マクロ要因）の検証に使う |
| 05-D5 | Coffee Development Report 2020: "The Value of Coffee — Sustainability, Inclusion and Resilience of the Global Coffee Value Chain" | ICO（独 BMZ/GIZ 支援） | S | 2021年1月28日公表を ICO 公式プレスリリース https://ico.org/documents/cy2020-21/pr-314e-welcome-united-kingdom.pdf で確認 | 05-01 サプライチェーンと付加価値配分の基礎資料（輸出額が1991年 84億ドル→2018年 356億ドル、焙煎豆輸出の96%以上が高所得地域、等の構造データ）。2018年までのデータである点に注意 |
| 05-D6 | Coffee "C" 先物 契約仕様 | ICE Futures U.S. | S（取引所一次情報） | 契約単位 37,500 lb、呼値 US cents/lb、限月 3・5・7・9・12月、受渡対象は指定産地のウォッシュドアラビカ（産地によりプレミアム/ディスカウント）であることを ICE 仕様を引く複数資料で確認。ICE 公式仕様ページの直接 URL は未確認（§F） | 05-02「価格の決まり方」の定義確認専用。**2025年に後継のメトリック建て契約（Coffee "C" Metric、2028年5月限〜、旧契約は2028年3月限が最終）への移行が発表されたとの二次情報あり**。Phase 3 で ICE 公式発表を必ず確認してから書く |
| 05-D7 | Robusta Coffee 先物 契約仕様 | ICE Futures Europe（ロンドン） | S（同上） | 契約単位 10 t、呼値 US $/t、限月 1・3・5・7・9・11月であることを ICE 仕様を引く複数資料で確認。公式ページ直接 URL は未確認 | 05-D6 と対で使用 |
| 05-D8 | List of Goods Produced by Child Labor or Forced Labor（TVPRA リスト）＋ List of Products Produced by Forced or Indentured Child Labor (EO 13126 リスト) | U.S. Department of Labor, Bureau of International Labor Affairs (ILAB) | S | https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods でコーヒーが複数国（例: ブラジル＝児童労働・強制労働、コロンビア、ケニア＝児童労働、ベトナム＝児童労働等）で掲載されていることを確認。EO リストは2024年9月5日時点で33製品・25か国 | 05-06 労働・人権の「公的データ系」の柱。あくまで米国政府の認定リストであり、掲載＝その国全体のコーヒーが該当するという意味ではない、という留保必須 |
| 05-D9 | ウガンダのコーヒー・茶サプライチェーンにおける児童労働と労働安全衛生に関する調査（2023年調査 "Identifying productive strategies..."、2025年5月 概要ブリーフ）＋ CLEAR Supply Chains プロジェクト（2023〜2027、EU 共同資金、FAO/ITC/UNICEF 連携） | ILO | S | ILO 公式サイト ilo.org のプロジェクト・ニュースページで確認 | 05-06 の国別実態データ。ウガンダのコーヒーバリューチェーンで児童労働の地域別 prevalence 20〜75%等の調査値を含む（調査設計の留保つきで引用） |
| 05-D10 | Living Income Benchmark レポート群（Anker Methodology）: Rural Oromia, Ethiopia（調査時点2023年7月、ICO 委託）、Rural Chiapas, Mexico（2023年11月、コーヒー産地対象）、インドネシア Lampung 等 | Anker Research Institute / Global Living Wage Coalition（GLWC） | A（学術的方法論に基づくデータ系） | エチオピア編の原典 PDF を ICO サイト内 https://ico.org/global-knowledge-hub/wp-content/uploads/2025/03/Ethiopia.pdf で確認。ICO がエチオピア、インドネシア、メキシコ、ベトナムの4か国でベンチマーク調査を委託したことを確認 | 05-04 living income の「ものさし」側。ベンチマーク（必要額）と実収入は別データであり混同しない。為替・インフレで古びやすいので調査時点を必須併記 |
| 05-D11 | Global Market Report: Coffee（2019）／ Global Market Report: Coffee Sustainability（2026年8月） | IISD（International Institute for Sustainable Development）, State of Sustainability Initiatives | A（研究機関の分析） | https://www.iisd.org/publications/report/global-market-report-coffee-sustainability を確認（2026年版 PDF あり）。自主的持続可能性基準（VSS）適合生産のシェア（2023年で世界生産の24〜42%、認証されても認証品として売れるのは約51%）等の集計を含む | 05-07 認証制度の市場データ。元データは FAOSTAT/ICO/各認証機関の二次集計である点に注意 |

---

## D. カテゴリ05 — 制度・主張系情報源（主体を明示して使う）

| ID | 情報源 | 主体と立場 | Tier | 確認できた内容・URL | 扱い方 |
|---|---|---|---|---|---|
| 05-C1 | Fairtrade Minimum Price & Premium 表、Living Income Reference Price (LIRP) レポート群、Annual Report | Fairtrade International（認証制度の運営主体） | A（制度系） | Annual Report 2025 の存在、コーヒーの LIRP が国別に公表されていること（例: ホンジュラス有機アラビカ編レポート、2022年データ、fairtrade 系ドメインの PDF）を確認。公式の価格表ページ URL は未確認（§F） | 「Fairtrade が最低価格を X と定めている」「LIRP（生活所得に必要な参照価格）を X と算定している」という**制度事実・算定結果として**引用。LIRP は市場価格でも実支払額でもない |
| 05-C2 | 2020 Sustainable Agriculture Standard（Farm Requirements 等）＋ Coffee Certification Data Report 2020（2021年5月） | Rainforest Alliance（認証制度の運営主体、2018年に UTZ と統合） | A（制度系） | データレポート原典 PDF を確認: https://www.rainforest-alliance.org/business/wp-content/uploads/2020/05/Coffee-Certification-Data-Report-2020.pdf 。認証生産量、農家数、プレミアム等の自己集計を含む | 基準の内容は制度事実として引用可。インパクトの主張は「Rainforest Alliance の集計によれば」と主体明示。第三者評価（05-D11 等）と突き合わせる |
| 05-C3 | Coffee Barometer 2023（Ethos Agriculture、Conservation International、Solidaridad による NGO コンソーシアム） | NGO 側の分析・提言 | B寄りの A（分析系だが提言色が強い） | 2023年9月14日公表、58ページ。主要生産国10か国中8か国でコーヒー所得が living income 水準以下、等の指摘と企業評価（Coffee Brew Index）を含むことを報道・解説で確認。公式サイト coffeebarometer.org の直接確認は未了（§F） | 数値は「Barometer の推計によれば」と主体明示で使う。反対側の文脈として ICO/業界側資料（05-D5 等）と併置する |
| 05-C4 | （参考・要確認）"Grounds for Sharing" 価値配分研究（2024） | Global Coffee Platform / IDH / Solidaridad | 未確認 | 二次引用でのみ存在を確認。原典の入手先・方法論は未確認のため、現時点では引用候補に入れない | Phase 3 で原典を確認できたら 05-04 の配分データ候補に追加する |

---

## E. 価格高騰メモ（2021–2025、確認できた数値のみ）

出典はすべて World Bank Pink Sheet（ICO 指標価格、名目 $/kg、年平均。2021・2022年は2023年2月版 Pink Sheet 公式 PDF、2023〜2025年は2026年11月版 Pink Sheet 公式 PDF で確認）。

| 年 | アラビカ（Other Milds 指標） | ロブスタ（Robustas 指標） |
|---|---|---|
| 2021 | $4.51/kg | $1.98/kg |
| 2022 | $5.63/kg | $2.29/kg |
| 2023 | $4.54/kg | $2.63/kg |
| 2024 | $5.62/kg | $4.41/kg |
| 2025 | $8.47/kg | $4.86/kg |

読み取り（数値からの事実のみ）:
- 第1波: 2021→2022 にアラビカが上昇（2022年平均が当時の高水準）。FAO（05-D3）は主因を供給側の攪乱とし、ブラジルの干ばつ・霜害（2021）とコロンビアの天候不良を挙げる
- 2023 はアラビカが反落する一方、ロブスタは上昇を継続（需給の主役がロブスタ側へ移る）
- 第2波: 2024 に世界価格が前年比 +38.8%（FAO）。2024年12月時点でアラビカ前年同月比 +58%、ロブスタ +70%（FAO 公式発表）。ベトナムの減産（干ばつ）、インドネシアの減産、ブラジルの天候、輸送コスト上昇が FAO の挙げる要因
- 2025年2〜3月にアラビカは月次で約 $9/kg、ロブスタは約 $6/kg 近辺に達した（World Bank 2025年4月版 CMO 解説ブログ）。2025年平均はアラビカ $8.47/kg で Pink Sheet 系列上の高水準
- ICO Composite Indicator Price (I-CIP) の月平均が2025年2月に 354.32 US cents/lb と過去最高だったとの数値は、ICO Coffee Market Report（2025年2月版）を引く二次資料で確認した。**原典 CMR での直接確認は Phase 3 の宿題**とし、それまではこの値を単独で使わない
- 注意: 上記はすべて名目価格。実質（インフレ調整後）では2025年の高騰も1990年代や2011年の水準を大きくは超えない、という FAO（05-D4 系）の留保がある。要因の「投機」の寄与については、FAO 2026年分析が「短期変動の90%以上は需給要因」とする一方で異なる見解もあり、05-03 では `contested` として扱う

---

## F. 地図データ供給源（カテゴリ04・§3 対応）

| ID | 供給源 | ライセンス（確認済み） | 内容と用途 | 注意 |
|---|---|---|---|---|
| MAP-1 | Natural Earth | **パブリックドメイン**（公式 Terms of Use: 全てのラスタ・ベクタデータは public domain、クレジット不要・商用可） | 国境ポリゴン（ne_110m / 50m / 10m_admin_0_countries）、地名・都市（populated places）等。geo_places の国レベル境界と代表点座標の第一候補 | 解像度は地図表現用であり、行政境界の法的正確性は担保されない。帰属表示は任意だが慣例として付ける |
| MAP-2 | geoBoundaries（gbOpen） | **CC BY 4.0** を基本とするが、レイヤー（国×階層）ごとに原典ライセンスが異なり、メタデータの `boundaryLicense` フィールドで個別確認が必要 | ADM0〜ADM2（国により下位も）の行政界 GeoJSON を API で取得可能。地域（リージョン）レベルの boundary_geojson の第一候補 | 取り込み時に国・階層ごとにライセンスを media_assets へ記録すること（v2 §3-2 のルール）。出典: Runfola et al. (2020)、William & Mary |
| MAP-3 | OpenStreetMap | **ODbL 1.0**（© OpenStreetMap contributors の帰属必須、派生データベースの公開時は同一ライセンスでの共有＝シェアアライク）。地図タイルには別途タイル利用ポリシーあり | 町村・農園エリアレベルの地名、道路・地形の参照。座標の目安取得 | ODbL データを自前 DB に混ぜると派生 DB 全体にシェアアライクが及ぶ論点があるため、**座標の参照用途に限定し、ポリゴンの取り込みは行わない**方針を推奨。geo_places の座標は原則 MAP-1/2 と公的統計の地名情報から作る |
| MAP-4 | GADM | **未確認**（今回の調査でライセンス条文を直接確認できなかった） | 行政界データとして著名だが、条項を確認するまで採用しない | Phase 4（地図整備）までに公式サイトでライセンスを確認し、商用アプリでの利用可否を判定してから採否を決める |

産地の代表点座標そのもの（地域レベルの緯度経度）は、上記ポリゴンの重心または MAP-1 の地名データから機械的に作れる。国・地域の「産地としての範囲」は行政界と一致しない（例: イルガチェフェは行政区画とほぼ重なるが、ブラジルの産地呼称は州をまたぐ場合がある）ため、boundary は行政界を流用しつつ、産地固有の範囲表現は別途 `production_note` として持つ設計が要る（Phase 4 で検討）。

---

## G. 未確認・残課題リスト（Phase 1 継続分）

1. ICO の新データ基盤 data.ico.org（Coffee Market Intelligence Platform）の収録範囲・利用条件（業界報道のみで確認、公式ページ未確認）。従来の World Coffee Statistics Database との関係も未確認
2. FNC 公式統計ポータルの正確な URL とファイル一覧（存在は確認済み）
3. Fairtrade 公式の Minimum Price / LIRP 一覧ページの URL（個別レポート PDF は確認済み）
4. ICE 公式の契約仕様ページ URL、および Coffee "C" Metric への移行に関する ICE 公式発表（移行スケジュールは二次情報のみ）
5. ベトナム GSO 公式ポータルの直接 URL・英語データの範囲。VICOFA 公式サイト
6. ECTA（エチオピア）公式サイトの統計ページ。JARC の公式刊行物リスト
7. Coffee Barometer 公式サイト（coffeebarometer.org）からの原典 PDF 取得
8. FAO "Price Dynamics in Global Beverage Markets"（2026）の原典 PDF の所在
9. 未着手の国別公的統計: ペルー、ホンジュラス、メキシコ（AMECAFE 等）、インドネシア（BPS / ICCRI）、ケニア（Coffee Directorate）— Phase 3 の国別収集時に個別確認する
10. GADM のライセンス条文（MAP-4）
11. UN Comtrade のコーヒー貿易データ（HS 0901）の利用条件 — 今回は未調査。貿易量の第3系統として要否を Phase 3 で判断

---

## 採用件数サマリ
- カテゴリ03: 5件（うち S 2件、A 3件）
- カテゴリ04: 統計系 13件（公的・S相当 11件＝うち GSO・ECTA は主体と刊行物の存在まで確認し原典直接確認は残課題、A 1件、B 1件）
- カテゴリ05 データ系: 11件（S 9件、A 2件）
- カテゴリ05 制度・主張系: 3件採用＋1件要確認
- 地図データ: 3件採用（ライセンス確認済み）＋1件保留
- 合計: **採用 35件**（＋価格メモ＝World Bank Pink Sheet 年次系列 2021–2025 を検証済み）
