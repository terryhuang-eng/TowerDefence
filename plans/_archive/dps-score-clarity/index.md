# dps-score-clarity — 問題分析與計畫總覽

## 問題根因（兩個獨立問題）

### 問題 A：分數面板標籤混淆
`skill-editor.html:663`：
```
h += `<div>DPS 分：<b>${bd.dpsScoreActual}</b>...</div>`;
```

面板只顯示 `dpsScoreActual`（分數），從未顯示 `effectiveDPS`（實際 DPS 值）。
使用者看到「DPS 分：X」，誤以為 X 就是 DPS 數值，調 DPS_SCORE_REF 後 X 改變，
產生「DPS 值怎麼會變」的誤解。

### 問題 B：DPS_SCORE_REF 無說明
help modal 與 score-glossary.md 均無 `DPS_SCORE_REF` 詞條，使用者不知道這個參數的用途。

## 兩個概念的區別

| 名稱 | 意義 | 受哪些參數影響 |
|------|------|--------------|
| `effectiveDPS` | 實際 DPS 值 = damage × atkSpd × (1 + aoe × AOE_DENSITY) | 只受塔的傷害/攻速/AOE 影響 |
| `dpsScore` | DPS 換算出的評分 = effectiveDPS × (DPS_SCORE_REF / DPS_REF) | 受 DPS_SCORE_REF、DPS_REF 影響 |

## 修正方案

### 分數面板（step1）
將現有一行拆為兩行：
```
effectiveDPS: X  （純數值，不受評分參數影響）
dpsScore: Y      （X 換算後的分數）
```
讓使用者明確看到 effectiveDPS 未變，只有 dpsScore 在變。

### help modal + glossary（step2）
- help modal Overview 區塊補充 `DPS_SCORE_REF` 說明段落
- `docs/score-glossary.md` 補充 `DPS_SCORE_REF` 詞條

## 步驟清單

| 步驟 | 說明 | 影響範圍 |
|------|------|---------|
| step1 | 分數面板拆分顯示 effectiveDPS 與 dpsScore | `skill-editor.html` ~663 |
| step2 | help modal 補充 DPS_SCORE_REF 說明；score-glossary.md 補詞條 | `skill-editor.html` ~1601；`docs/score-glossary.md` |

## 執行順序

step1 → step2（獨立，可任意順序；step1 UI 優先）
