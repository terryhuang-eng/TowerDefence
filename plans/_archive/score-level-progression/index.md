# score-level-progression

## 問題分析

### 現況
```
LEVEL_SCORE_STD = { lv1: 0, lv2: 0, lv3: 80, lv4: 160, lv5: 160, lv6: 200 }
DPS_REF         = { lv1: 35, lv2: 61, lv3: 63, lv4: 120, lv5: 190, lv6: 290 }
```

| 層級 | 現況 | 問題 |
|------|------|------|
| LV1 | 0 | 無分數，但 arrow DPS ≈ 35 == DPS_REF.lv1，實際應能算分 |
| LV2 | 0 | 同上，arrow DPS ≈ 61 == DPS_REF.lv2 |
| LV3 | 80 | 合理 |
| LV4 | 160 | 合理 |
| LV5 | **160** | 與 LV4 相同！差距 0 |
| LV6 | **200** | 只比 LV5 多 40，但投資額外 +600g |

### 根源
`LEVEL_SCORE_STD` 在 `skill-editor.html:850` 硬編碼，lv5/lv6 數值未更新。
`dps-calc.html` 的 Weight Panel 只有 `lv4Target`，其他層級無 UI 設定點。

### 計分公式說明（skill-editor.html computeScoreBreakdown）
```
dpsScoreActual = effectiveDPS × (target / DPS_REF[lv])
total = dpsScoreActual + skillTotal
balance % = total / target × 100
```
→ 若 target=0，total 永遠是 0（無法顯示 LV1/LV2 平衡度）

## 提案 v1 數值（幾何遞增，依成本比例設計）

| 層級 | 累計成本 | v1 分數 | 倍率 | 說明 |
|------|---------|---------|------|------|
| LV1 | 50g | **20** | — | 純 DPS 基礎，無技能 |
| LV2 | 130g | **45** | ×2.25 | 進化基礎，無技能 |
| LV3 | 260g | **80** | ×1.78 | 元素化，無技能（維持原值）|
| LV4 | 510g | **160** | ×2.0 | 雙屬注入，技能開始（維持原值）|
| LV5 | 910g | **280** | ×1.75 | 三屬，多技能 |
| LV6 | 1510g | **440** | ×1.57 | 純屬終極 |

各層級成本比 ≈ 1.66~2.6，分數比 1.57~2.25，合理遞減的收益遞減曲線。

## 一個設定點的設計方案

**主要設定位置：**
- `skill-editor.html` 的 `LEVEL_SCORE_STD` 常數（標記為「主要調整點」）

**配套設定位置（可調 UI）：**
- `dps-calc.html` 的 Weight Panel 新增 lv1~lv6 全部目標（目前只有 lv4Target）

兩者目前分離，用戶調整時需同步更新兩檔。（後續可考慮提取為共用 JS，但超出本次範圍。）

## 步驟清單

- [ ] Step 1：更新 `skill-editor.html` 的 `LEVEL_SCORE_STD`
- [ ] Step 2：更新 `dps-calc.html` 的 `SCORE_WEIGHT_DEFAULTS` + Weight Panel

## 執行順序

Step 1 → Step 2，互相獨立可任意順序，建議依序執行。
