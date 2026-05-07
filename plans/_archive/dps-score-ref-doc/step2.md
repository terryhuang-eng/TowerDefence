# step2 — score-glossary.md 補 DPS_SCORE_REF 詞條

## 影響範圍

`docs/score-glossary.md`：DPS 相關區塊，`### DPS_REF` 後插入

## 定位方式

```
Grep `### .DPS_REF.` (score-glossary.md) → 找插入點
```

## 修改內容

在 `### \`DPS_REF\`` 段落後插入：

```markdown
### `DPS_SCORE_REF`
**達到 DPS_REF 時的分數貢獻值（分數單位，非 DPS 單位）。**
`dpsScore = effectiveDPS × (DPS_SCORE_REF / DPS_REF)`

兩個參數分工：
- `DPS_REF`：校準「參考 DPS 值」是多少（DPS 單位，隨塔的數值調整）
- `DPS_SCORE_REF`：決定 DPS 在分數預算中佔幾分（分數單位，控制 DPS vs 技能的比重）

預設 `DPS_SCORE_REF == LEVEL_SCORE_STD`：達到參考 DPS 即拿滿目標分，技能為額外加分。
若設為 `LEVEL_SCORE_STD × 0.6`：DPS 只貢獻 60% 預算，需技能補足剩餘 40%。
```
