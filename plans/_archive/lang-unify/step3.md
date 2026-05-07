# step3 — skill-editor.html UI 英文化 + help modal 更新

## 影響範圍

`skill-editor.html` 三處：
1. `renderScoreDefsPanel` — 群組名稱、段落標題、GLOBAL_CAPS 標籤
2. `renderScorePanel`（分數面板）— 技能列標籤
3. help modal HTML — 章節標題、表格欄位名稱

## 定位方式

Grep 以下關鍵字逐一定位，不需 Read 整個檔案：

- `groupNames` → 群組名稱物件（傷害/控制/弱化/增益/特殊）
- `等級目標分數` → LEVEL_SCORE_STD 段落標題
- `DPS 參考值` → DPS_REF 段落標題
- `capLabels` → GLOBAL_CAPS 標籤物件
- `技能分` → 分數面板標籤
- `score-help-box` → help modal HTML 起點

## 修改清單

### renderScoreDefsPanel

| 現況（中文） | 改後（英文） |
|------------|------------|
| `傷害` | `damage` |
| `控制` | `control` |
| `弱化` | `debuff` |
| `增益` | `buff` |
| `特殊` | `special` |
| `等級目標分數（LEVEL_SCORE_STD）` | `LEVEL_SCORE_STD` |
| `DPS 參考值（DPS_REF）` | `DPS_REF` |
| capLabels 各值（減速上限 → slowPct cap 等） | 見下表 |

capLabels 對照：

| key | 現況 | 改後 |
|-----|------|------|
| `slowPct` | 減速上限 | slowPct cap |
| `atkSpdBonus` | 攻速加成上限 | atkSpdBonus cap |
| `shredPerStack` | 碎甲每層值 | shredPerStack |
| `shredMaxStacks` | 碎甲最大層數 | shredMaxStacks |
| `shredDecayRate` | 碎甲衰減率(層/s) | shredDecayRate (stacks/s) |
| `vulnPerStack` | 易傷每層值 | vulnPerStack |
| `vulnMaxStacks` | 易傷最大層數 | vulnMaxStacks |
| `vulnDecayRate` | 易傷衰減率(層/s) | vulnDecayRate (stacks/s) |
| `procMinInterval` | Proc 最小間隔(s) | procMinInterval (s) |
| `hpPctCd` | %HP CD(s) | hpPctCd (s) |

### renderScorePanel

Grep `技能分` 確認分數面板標籤位置，將中文標籤改為：

| 現況 | 改後 |
|------|------|
| `技能分` | `skillTotal` |
| `目標分` | `target` |
| `DPS 剩餘` | `dpsRemaining` |
| `balance` | 保留（已是英文） |

### help modal

| 現況章節標題 | 改後 |
|------------|------|
| `整體架構` | `Overview` |
| `技能分計算公式` | `Skill Score Formula` |
| `⚡ conditionalFactor（條件折扣）` | `⚡ conditionalFactor` |
| `🏃 atkSpdSensitive（攻速正規化）` | `🏃 atkSpdSensitive` |
| `score_adj（塔個別係數）` | `score_adj` |
| `balance% 解讀` | `balance% reference` |

表格欄位名稱：

| 現況 | 改後 |
|------|------|
| `欄位` | `param` |
| `說明` | `description` |
| `意義` | `value / meaning` |
| `等級` | `level` |
| `技能` | `skill` |
| `預設值` | `default` |
| `數值` | `value` |

## 注意

- 中文解說文字（表格 description 欄位內的說明句）保留，因為有解說必要性
- help modal 的 `.tip` 提示框內容可保留中文（使用者操作建議）
