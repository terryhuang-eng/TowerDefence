# range-score — 射程納入 DPS 評分

## 設計決策

射程是構成塔的四個基本元素之一（damage / atkSpd / range / aoe），
不可能 range 3 與 range 5 的塔總分相同。

### 公式

```
rangeFactor = 1.0 + (range - 4) × RANGE_FACTOR_K
dpsScoreActual = effectiveDPS × rangeFactor
```

### 參數

| 參數 | 值 | 說明 |
|------|-----|------|
| `RANGE_FACTOR_K` | 0.2 | 每單位射程差的 DPS 分數增幅 |
| 基準射程 | 4 | rangeFactor = 1.0 的中間值 |
| 有效區間 | 3～5 | range < 3 或 > 5 視為超出設計範圍，仍可套公式但依建造難度控制平衡 |

### 各 range 結果

| range | rangeFactor |
|-------|-------------|
| 3 | 0.8× |
| 4 | 1.0× |
| 5 | 1.2× |

## 影響範圍

| 檔案 | 項目 |
|------|------|
| `skill-editor.html` | 常數、handler、面板 UI、計算公式、分數顯示、help modal |
| `docs/score-glossary.md` | 新增 `rangeFactor` / `RANGE_FACTOR_K` 詞條 |

## 步驟清單

| 步驟 | 說明 | 影響範圍 |
|------|------|---------|
| step1 | 常數、handler、面板 UI、公式修改、分數面板顯示、help modal | `skill-editor.html` |
| step2 | 新增詞條 | `docs/score-glossary.md` |

## 執行順序

step1 → step2
