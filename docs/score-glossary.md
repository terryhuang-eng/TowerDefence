# Score Glossary

術語名稱與程式碼一致（英文）。有混淆風險者附中文解說；無混淆風險者只給一行簡述。

---

## 計分核心

### `scoreBase`
Base score at reference param value.

### `scoreRef`
**ref = reference value（基準值），不是 object reference。**
當目標參數等於 scoreRef 時，score 貢獻 = scoreBase × 1.0。

### `scorePrimary`
**field name of the primary scaling param，不是技能主要功能。**
例：`scorePrimary: "damage"` → 以 damage 為主要縮放參數，score ∝ damage / scoreRef。

### `scoreFactors`
**Secondary multipliers。**
格式：`[{ param, ref }, ...]`。每個 factor 的乘數 = 實際值 / ref。
多個 factor 相乘後再乘以 scoreBase。

### `weight`
**Per-skill row weight，乘在 score 最後。**
不代表技能整體強度；是使用者手動微調旋鈕，用於調整同塔多技能間的分數比重。

### `score_adj`
**Per-unit target multiplier。**
`autoTarget = LEVEL_SCORE_STD × score_adj`。
用於讓特定塔的目標分數偏離 level 標準值（例：Boss Killer 塔設更高目標）。

### `scoreTarget`
Override autoTarget；0 = use autoTarget（由 score_adj 計算）。

### `balance%`
`(effectiveDPS score + skillTotal) / target × 100`

---

## 條件與正規化

### `conditionalFactor`
**Trigger probability assumption（條件觸發達成率假設）。**
- `ignite = 0.75`：burn uptime 假設 75%
- `detonate = 0.5`：3-stack 達成率假設 50%
- `0`：prerequisite missing（前置技能缺失，條件無法成立）

### `atkSpdSensitive`
**Proc-rate normalization。**
`score × (unit.atkSpd / ATKSPD_REF[lv])`
反映每秒實際觸發次數；攻速高於基準點時 score 等比提升，反之降低。

### `ATKSPD_REF`
**Reference atkSpd by level（基準點 = ×1.0）。**
- lv3–5：1.2
- lv6：1.5

### `requires`
Prerequisite skill type string.

---

## DPS 相關

### `effectiveDPS`
`damage × atkSpd × (1 + aoe × AOE_DENSITY)`

### `AOE_DENSITY`
**Assumed enemy density in AOE（假設 AOE 範圍內的目標密度）。**
預設 0.5（不假設滿場密度，避免高估 AOE 塔）。

### `rangeFactor` / `RANGE_FACTOR_K`
**射程對 DPS 分的影響係數。**

```
rangeFactor = 1.0 + (range - 4) × RANGE_FACTOR_K
dpsScoreActual = effectiveDPS × rangeFactor
```

設計射程區間為 3～5，以 range=4 為基準（×1.0）：

| range | rangeFactor（K=0.2） |
|-------|---------------------|
| 3 | 0.8× |
| 4 | 1.0× |
| 5 | 1.2× |

超出區間的塔不依賴評分系統控制平衡，改由建造難度限制。`RANGE_FACTOR_K` 可在 ⚙️ 面板調整。

---

## 廢棄術語

### `DPS_REF` / `DPS_SCORE_REF` ⛔ deprecated (removed remove-dps-refs)
兩個等級假設與 LEVEL_SCORE_STD 重複。校正基準來自實測（LV1 曲線 + LV4 風塔 W8），不需要額外換算參數。移除後 `dpsScoreActual = effectiveDPS` 直接使用。

### `foldedIntoDPS` ⛔ deprecated (removed step7)
Burn score 原本折入 effectiveDPS 以避免重複計分，但導致「有傷害技能顯示 0 分」的顯示問題。移除後 burn 回歸正常計分流程。
