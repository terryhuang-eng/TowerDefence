# Tower Defense Prototype v6.2

## 專案概述
塔防遊戲網頁原型，用於驗證核心玩法與數值平衡。LTW（送兵）+ 元素塔防。

## 技術
- 純 HTML + Canvas + JS 單檔（index.html）
- PeerJS 實現 N 人 PVP（Host relay, ring chain）
- 所有數值集中在頂部 CONFIG / BASIC_TOWERS / ELEM_BASE / INFUSIONS / WAVES / INCOME_SENDS
- v5 備份：index-v5-backup.html

## 兩個獨立節奏系統

### 1. 章節結構（防守壓力節奏）：5 章 × 4 波 = 20 波
- 每章 4 波固定節奏：🟢群體波 → 🔵測試波 → 🟡精銳波 → ⭐Boss 波
- Boss 波（W4/W8/W12/W16/W20）：少量高 HP 單體怪，考驗集火 DPS
- Boss 韌性（bossTenacity）：所有 CC 效果減半
- Boss 前一波 pre_wave 顯示⚠️警告預告
- 章節計算：`Math.floor((wave - 1) / 4)`

| 章 | 波次 | Boss | Boss HP | 設計意圖 |
|----|------|------|---------|---------|
| Ch1 | W1-4 | 🐻 鐵甲衛士 ×2 | 400 | 基礎塔 DPS 檢查 |
| Ch2 | W5-8 | 🐲 熔岩巨像 ×2 | 1000 | 元素塔集火測試 |
| Ch3 | W9-12 | 👿 深淵領主 ×1 | 2500 | 注入塔 DPS 測試 |
| Ch4 | W13-16 | 🦾 鋼鐵巨獸 ×1 | 4000 | 全面被動高壓 |
| Ch5 | W17-20 | 💀 終焉之王 ×1 | 7000 | 終極 DPS 檢查 |

### 2. 元素獲取（成長進度系統）：每 3 波一次
- `ELEM_WAVES = [3, 6, 9, 12]` — 共 4 次 pick
- 與章節 Boss 獨立（W12 同時是 Boss 和元素選擇波）
- 可能 pick 組合：3+1（純路線+混搭）、2+2、2+1+1

| 段落 | 波次 | 元素 pick | 可用塔力 |
|------|------|----------|---------|
| 基礎塔期 | W1-3 | W3 後選第 1 元素 | 箭塔/砲塔 Lv1-2 |
| 1 元素期 | W4-6 | W6 後選第 2 元素 | 元素 Lv3 |
| 2 元素期 | W7-9 | W9 後選第 3 元素 | 元素 Lv3-4 |
| 3 元素期 | W10-12 | W12 後選第 4 元素 | 元素 Lv4 |
| 全開期 | W13-20 | — | 元素 Lv4-5 |

## 升級路徑（6 階）
```
箭塔 Lv1 (50g) → 箭塔 Lv2 (+80g=130g)
                      ↓ 需要 1 元素 pick
                 元素塔 Lv3 (+130g=260g)（ELEM_BASE，箭/砲基底不同）
                      ↓ 需要第 2 元素 pick（注入）
                 雙屬塔 Lv4 (+250g, INFUSIONS，36 分支）
                    ╠═ 路線A：選第 3 個元素（異屬）→ 三屬塔 Lv5
                    ╚═ 路線B：同屬雙注（base==infuse）→ 直升 Lv6

                 三屬塔 Lv5 (+400g=910g, TRIPLE_TOWERS，20 種）
                      不需要三同屬；第 3 元素只需 1+ pick

                 純屬終極塔 Lv6 (+600g, PURE_TOWERS，6 種）
                      僅限路線B，需要 3 同元素 picks + 精華閾值
```

## ELEM_BASE（Lv3 元素塔，依基底分化）
每元素 × 箭/砲 = 6 種 Lv3 塔，cost: 130：
- 火：焰弓手 🏹🔥（單體）/ 焰砲台 💣🔥（AOE）
- 水：冰弓手 🏹💧（單體）/ 潮砲台 💣💧（AOE）
- 土：岩射手 🏹⛰️（單體）/ 岩砲台 💣⛰️（AOE）
- 風：風弓手 🏹🌪️（單體）/ 風砲台 💣🌪️（AOE）
- 雷：雷弓手 🏹⚡（單體）/ 雷砲台 💣⚡（AOE）
- 無：虛空弓 🏹⬜（單體）/ 虛空砲 💣⬜（AOE）

**LV3 設計規則**：
- `skills: []`（無任何技能）—— 技能從 LV4 雙屬注入開始
- 元素身份只透過 `dmgType` 體現（元素三角加成 ×1.3 / ×0.7）
- LV3 只提升 DPS；元素差異可透過 damage/atkSpd 數值體現（各元素目前相同，可依需求差異化）

## 經濟核心數值
- startGold: 230, startHP: 40, baseIncome: 50
- towerCost: 50（基礎塔 Lv1）
- killGold: 每隻怪獨立定義在 WAVES（killGold 欄位）
  - 一般怪: 3~16g/隻（隨章節遞增）
  - Boss: 30/60/100/150/200g（高額獎勵）
- killGoldAiSend: 3（固定）

## 送兵數值
| 兵種 | 費用 | income | count | HP | 護甲 | dmgToBase | 被動 |
|------|------|--------|-------|----|------|-----------|------|
| 斥候 🏃 | 10 | +3 | 3 | 90 | 0 | 1 | — |
| 戰士 ⚔️ | 35 | +5 | 2 | 350 | 10% | 2 | — |
| 騎士 🛡️ | 120 | +14 | 2 | 700 | 20% | 3 | — |
| 法師 🔮 | 200 | +20 | 1 | 1200 | 0 | 5 | regen |
| 精銳 💀 | 320 | +28 | 1 | 1900 | 15% | 8 | enrage |
| 霸者 👑 | 520 | +40 | 1 | 2800 | 20% | 12 | shield |

## 送兵配額（每波重置，每 2 波調整一次，共 10 階）
| 兵種(費用) | W1-2 | W3-4 | W5-6 | W7-8 | W9-10 | W11-12 | W13-14 | W15-16 | W17-18 | W19-20 | 總增幅 |
|-----------|------|------|------|------|-------|--------|--------|--------|--------|--------|--------|
| 斥候(10g) | 5 | 6 | 7 | 8 | 8 | 9 | 10 | 10 | 11 | 12 | +7 |
| 戰士(35g) | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 | 6 | 7 | +5 |
| 騎士(120g) | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | +5 |
| 法師(200g) | 0 | 0 | 0 | 1 | 1 | 1 | 2 | 2 | 3 | 4 | +4 |
| 精銳(320g) | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 2 | 3 | +3 |
| 霸者(520g) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 2 | +2 |

## 送兵取消
- pre_wave 階段可取消已排隊的送兵
- 退還 80% 金幣，扣回 income
- PVP 同步通知對手（cancelTroop 訊息）

## 地圖敵人圖示
- 波次怪物用 WAVES 中定義的 icon（emoji）繪製
- 送兵用兵種 icon 繪製
- 大小根據 maxHp 縮放（log2 scale），Boss 額外加大
- Boss 有金色脈動光環

## PVP 功能
- 玩家 ID 輸入（加入前填寫）
- 隨機配對順序（ring chain shuffle）
- 狀態面板：所有玩家 HP / income / 元素 picks
- 頂部準備按鈕（脈動動畫）
- Host 廣播 waveStart 同步波次開始

## 怪物被動
- regen：每秒回復 2% HP
- armorStack：每次被攻擊 +0.1 護甲（最多 +0.5）
- enrage：HP < 30% 時速度 ×2
- charge：前半路程速度 ×2
- shield：第一次致死後剩 1 HP
- isBoss：CC 效果減半（bossTenacity），金色光環，加大顯示

## 塔傷害機制三元素身份
- 🔥 火系「集中火力」：連續攻擊同目標增傷 → Boss Killer
- 🌪️ 風系「精準狩獵」：低HP增傷、擊殺加速 → Finisher
- 💧 水系「群體控場」：AOE+slow/freeze → Group Handler
- **基礎塔**：箭塔高攻速（單體強）、砲塔 AOE（群體強）

## 關鍵結構
- `CONFIG`：所有可調數值（經濟、網格、AI、難度倍率）
- `BASIC_TOWERS`：箭塔/砲塔定義（Lv1-2）
- `ELEM_BASE`：Lv3 元素塔（依基底分化，6 種）
- `INFUSIONS`：元素注入分支（lv4），36 分支（6×6，Lv4 雙屬注入使用）
- `TRIPLE_TOWERS`：Lv5 三屬塔（20 種，三元素組合，from Lv4 混屬路線）
- `PURE_TOWERS`：Lv6 純屬終極塔（6 種，需 3 同元素 picks + 精華，from Lv4 同屬雙注路線）
- `WAVES`：20 波定義，含 icon / isBoss / hp / count / armor / resist / passives / elem
- `INCOME_SENDS`：6 階送兵，quota 為 5 章陣列
- `AI_SENDS`：AI 送兵定義（與玩家同數值）
- `pvpNet`：N 人 PVP 網路物件（Host relay, ring chain）
- `CONFIG.elemAdv`：元素三角（火克風 ×1.3、水克火 ×1.3、風克水 ×1.3、被克制 ×0.7）
- `ELEM_WAVES`：`[3, 6, 9, 12]` — 元素選擇時機（4 次，與 Boss 獨立）

## 運作模式規範 (Operational Modes)

- **思考模式 (THINK Mode)**：觸發關鍵字 `think XXX`
  - **目標**：純分析與規劃，不執行任何動作，不改任何原始碼。
  - **行動**：
    1. 掃描相關檔案
    2. 更新 `.claudeignore` 的 `# Task Specific` 區塊（收窄視線）
    3. 在 `plans/active/XXX/` 資料夾建立計畫，結構如下：
       - `plans/active/XXX/index.md`：總覽（問題分析、步驟清單、執行順序）
       - `plans/active/XXX/step1.md`、`step2.md`…：每個步驟一個獨立 md，含目標、影響範圍、具體修改說明
  - **限制**：寫完所有 md 後立即停止，等待使用者審核。
  - **無例外**：無論任務大小，THINK 模式一律建立 plans/active/XXX/ 計畫文件後停止，不在聊天中直接輸出分析取代計畫文件。

- **執行模式 (EXECUTE Mode)**：觸發關鍵字 `execute XXX/stepN.md`
  - **目標**：精準實作，嚴格依照指定步驟 md 執行。
  - **行動**：僅讀取 `plans/active/XXX/stepN.md` 與其中指定的目標檔案，分析需求並執行該步驟。
  - **限制**：一次只動一個檔案。
  - **⚠️ 強制 — 步驟完成提醒**：
    - **一般步驟**：完成後提醒「可繼續 `execute XXX/stepN+1.md`，或輸入 `/clear` 清除對話。」
    - **最後一步**：執行前讀取 `plans/active/XXX/index.md`，確認當前 stepN 為步驟表最後一個 step。執行完畢後輸出：`✅ 所有步驟完成。測試通過後請執行 /saveclear 封存計畫並同步 git。`
  - **⚠️ 強制 — 程式碼定位流程**：Grep 找行號 → Read ±10 行確認 context → Edit。**禁止 Read 整個大型檔案**。
  - **⚠️ 強制 — .claudeignore 更新**：每次 THINK 或 EXECUTE 開始前，必須先更新 `.claudeignore` 的 `# Task Specific` 區塊，只列本步驟需要的檔案。
  - **⚠️ 強制 — 回饋格式**：步驟完成後只輸出「原因」＋「結果」，不輸出程式碼變更細節、diff 或逐行說明。

## 設計文件
- Obsidian: `Projects/TowerDefense/`
- 原始設計 docs: `tmp/TowerDefense/TowerDefense/`
