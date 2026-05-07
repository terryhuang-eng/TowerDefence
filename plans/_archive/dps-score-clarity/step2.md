# step2 — help modal 補充 DPS_SCORE_REF 說明；score-glossary.md 補詞條

## 影響範圍

- `skill-editor.html`：help modal Overview 區塊（~line 1601）
- `docs/score-glossary.md`：DPS 相關區塊

## 定位方式

```
Grep `effectiveDPS score` → 找 help modal Overview li 列表
Grep `DPS_REF` (score-glossary.md) → 找插入點
```

## 修改內容

### 1. help modal — Overview li 列表

現況（line 1601）：
```html
<li><b>effectiveDPS score</b>：DPS（damage × atkSpd）× AOE 乘數，對照 DPS_REF 換算為分數</li>
```

改為（拆成兩個 li）：
```html
<li><b>effectiveDPS</b>：damage × atkSpd × (1 + aoe × AOE_DENSITY)；純 DPS 數值，不受評分參數影響</li>
<li><b>dpsScore</b>：effectiveDPS × (DPS_SCORE_REF / DPS_REF)；DPS 換算出的分數貢獻</li>
```

並將 Overview 公式同步更新：
```
balance% = (dpsScore + skillTotal) / target × 100
```

### 2. help modal — 新增 DPS_SCORE_REF 說明段落

在 `<h3>score_adj</h3>` 之前插入：

```html
<h3>DPS_SCORE_REF</h3>
<p>DPS 換算為分數的基準點：當 effectiveDPS = DPS_REF 時，dpsScore = DPS_SCORE_REF。</p>
<p>與 LEVEL_SCORE_STD 獨立——調整目標分不影響 dpsScore；調整 DPS_SCORE_REF 不影響 target。</p>
<p>預設值與 LEVEL_SCORE_STD 相同，表示「DPS 達標時貢獻等於整體目標分」；可調低以給技能更多分數空間。</p>
```

### 3. score-glossary.md — DPS 相關區塊補詞條

在 `### DPS_REF` 後插入：

```markdown
### `DPS_SCORE_REF`
**DPS 換算為分數的基準點，與 LEVEL_SCORE_STD 獨立。**
當 effectiveDPS = DPS_REF 時，dpsScore = DPS_SCORE_REF。
預設值與 LEVEL_SCORE_STD 相同；調低此值可壓縮 DPS 分的佔比，給技能分更多空間。
```
