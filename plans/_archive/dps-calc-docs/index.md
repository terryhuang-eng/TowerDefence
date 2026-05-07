# dps-calc 說明文件計畫

## 問題分析

dps-calc.html 是一個給設計者用的數值平衡工具，功能相當豐富：
- 欄位定義不直觀（eDPS vs Score 差異？score_adj 是什麼？）
- 評分權重 panel 有 30+ 個參數，沒有說明
- 技能 param 可即時編輯，但格式意義不清
- adj 匯出功能用途不明顯

## 決策：HTML 內建說明按鈕 vs 獨立 md 文件

| | HTML 說明按鈕（modal）| 獨立 md 文件 |
|---|---|---|
| 使用中隨時可查 | ✅ | ❌（需切換視窗）|
| 自包含 | ✅ | ❌ |
| 維護成本 | 低（改 HTML 一處）| 高（兩處同步）|
| 設計者習慣 | 工具內查 > 翻文件 | — |

**結論：在 HTML 內加說明按鈕（modal）**，不另建 md 文件。

## 說明內容規劃

### 1. 基本概念
- **DPS**：純攻擊 DPS（damage × atkSpd × armorMult）
- **eDPS**：有效 DPS，含技能加成 × AOE 目標數
- **eDPS/g**：eDPS 除以建造成本，衡量性價比
- **Score**：綜合評分，用於比較各等級塔的平衡性

### 2. eDPS 計算公式
```
baseDPS = damage × atkSpd
armorMult = max(0.1, 1 - armor%)
aoeTargets = aoe > 0 ? 1 + 2×aoe : 1
eDPS = (baseDPS × armorMult × skillMult + addDPS) × aoeTargets
```

技能效果分兩類：
- **addDPS 型**：burn、ignite、detonate、hpPct（疊加額外傷害）
- **skillMult 型**：chill ×1.25、shred ×1.15、chain ×(1+n×decay)、multishot ×n…

### 3. Score 計算公式
```
dpsScore = damage × atkSpd × (range/3) × aoeMod × dpsScaleConst
aoeMod = 1 + aoe × aoeScoreMod
Score = (dpsScore + effectScore) × score_adj
```
- effectScore：各技能依權重換算的分數（不同技能公式不同）
- score_adj：手動微調係數（預設 1.0），排除公式無法捕捉的設計意圖

### 4. 評分顏色
- 🟢 青色：在 lv_Target ±lv4Tolerance% 範圍內（平衡）
- 🟡 黃色：在 ±15% 緩衝區
- 🔴 紅色：超出範圍

### 5. 各技能 eDPS 換算說明
| 技能 | eDPS 計算方式 |
|------|-------------|
| burn | dot × dmg × min(dur,3) × spd × armorMult × aoeTargets |
| ignite | flat × dmg × spd × 0.5 × armorMult × aoeTargets |
| detonate | ratio × dmg × spd × 0.3 × aoeTargets（真實傷害）|
| hpPct | pct × enemyHP × spd / every × aoeTargets |
| chill | baseDPS × 0.25（加速等效）|
| freeze | baseDPS × 0.05 |
| shred | baseDPS × 0.15 |
| vulnerability | baseDPS × cap |
| chain | baseDPS × targets × decay |
| ramp | baseDPS × (cap/2) |
| pierce | baseDPS × 0.10 |
| multishot | baseDPS × (count-1) |
| execute/zone/warp/knockback | baseDPS × 0.10/0.15/0.05/0.10 |
| aura_* / lifedrain / killGold / unstable | 不計入自身 eDPS |

### 6. adj 功能說明
- 點擊 Score 欄的 `adj:x.x` 可即時修改 score_adj
- 修改後顯示橘色底線
- 「匯出 adj 差異」→ 複製成 JS patch 格式，貼入 towers.js 對應塔的 `score_adj` 欄位

### 7. 評分權重 panel
- 展開「評分權重」可調整公式係數
- 調整後即時重算所有 Score
- 「↺ 重置預設」還原所有權重

## 步驟清單

| # | 步驟 | 目標 |
|---|------|------|
| 1 | [step1.md](step1.md) | 在 dps-calc.html 加入說明按鈕與 modal |

## 執行順序

只需一個步驟。

---

**等待使用者審核後執行。**
