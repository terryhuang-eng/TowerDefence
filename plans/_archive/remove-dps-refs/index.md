# remove-dps-refs — 問題分析與計畫總覽

## 移除原因

`DPS_REF` 和 `DPS_SCORE_REF` 是兩個重複的等級假設：
- `LEVEL_SCORE_STD` 已定義每級目標分（假設）
- `DPS_REF` 另外定義每級典型 DPS（假設）
- `DPS_SCORE_REF` 與 `LEVEL_SCORE_STD` 數值完全相同（多餘）

兩組等級假設做同一件事，且校正基準來自實測（LV1 曲線 + LV4 風塔 W8），不需要額外的換算參數。

## 修正後公式

```
// 移除前
dpsScoreActual = effectiveDPS × (DPS_SCORE_REF[lv] / DPS_REF[lv])

// 移除後
dpsScoreActual = effectiveDPS
```

## 影響範圍

| 檔案 | 項目 |
|------|------|
| `skill-editor.html` | 常數定義、handler 函數、面板 UI、計算公式、help modal 兩處 |
| `docs/score-glossary.md` | `DPS_REF` 詞條移至廢棄區 |
| `dps-calc.html` | 無影響（無 DPS_REF 使用） |

## ⚠️ 注意：LEVEL_SCORE_STD 可能需要重新校正

移除後 dpsScoreActual 從換算值（約等於目標分）變為原始 effectiveDPS。

範例（LV4）：
- 移除前：dpsScoreActual = 120 × (160/120) = **160**
- 移除後：dpsScoreActual = **120**

balance% 會下降（DPS 分減少），`LEVEL_SCORE_STD` 可能需要依實測重新校正。
這不在本計畫範圍內，執行後需另行驗證。

## 步驟清單

| 步驟 | 說明 | 影響範圍 |
|------|------|---------|
| step1 | 移除常數、handler、面板 UI、修正計算公式、更新 help modal | `skill-editor.html` |
| step2 | `DPS_REF` 詞條移至廢棄區 | `docs/score-glossary.md` |

## 執行順序

step1 → step2（step2 獨立，可任意順序；step1 先做避免 UI 殘留）
