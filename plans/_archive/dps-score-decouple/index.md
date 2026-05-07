# dps-score-decouple — 問題分析與計畫總覽

## 問題根因

`skill-editor.html:1021`：

```
dpsScoreActual = effectiveDPS × (lvStd / dpsRef)
              = effectiveDPS × (LEVEL_SCORE_STD[lv] / DPS_REF[lv])
```

`LEVEL_SCORE_STD` 同時扮演兩個角色：
1. **目標分分母**（balance% 的基準）
2. **DPS 分換算比例**（effectiveDPS → score 的轉換係數）

結果：調高 LEVEL_SCORE_STD → target 提高（正確），但 dpsScoreActual 也等比提高（非預期），導致 balance% 實際上不變，失去調整目標分的意義。

## 設計意圖釐清

| 參數 | 應控制的事 | 目前問題 |
|------|----------|---------|
| `LEVEL_SCORE_STD` | 該等級的目標總分（target） | 同時影響 DPS 分換算 |
| `DPS_REF` | 參考 DPS 基準點 | 正確，只影響 DPS 分 |
| `DPS_SCORE_REF`（新增） | DPS_REF 對應的參考分數 | 不存在，由 LEVEL_SCORE_STD 隱式代替 |

## 修正方案

新增獨立常數 `DPS_SCORE_REF`（每 lv 一個值），初始值從當前隱式值推算（= 現有 LEVEL_SCORE_STD），讓 DPS 分換算與目標分完全解耦。

修正公式：
```
dpsScoreActual = effectiveDPS × (DPS_SCORE_REF[lv] / DPS_REF[lv])
```

target 維持：
```
target = LEVEL_SCORE_STD[lv] × score_adj
```

## 步驟清單

| 步驟 | 說明 | 影響範圍 |
|------|------|---------|
| step1 | 新增 `DPS_SCORE_REF` 常數，修正 `computeScoreBreakdown` 公式 | `skill-editor.html` 947–1028 |
| step2 | `renderScoreDefsPanel` 新增 `DPS_SCORE_REF` 輸入列 + `updateDpsScoreRef` handler | `skill-editor.html` 193–272 |

## 執行順序

step1 → step2（step2 依賴 step1 新增的常數）
