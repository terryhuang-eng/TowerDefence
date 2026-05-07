# step2 — score-glossary.md 新增射程詞條

## 目標

在 DPS 相關區塊新增 `rangeFactor` 與 `RANGE_FACTOR_K` 詞條。

---

## 修改清單（1 處）

### docs/score-glossary.md

位置：Grep `### .AOE_DENSITY.`，在該詞條後新增：

```markdown
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
```
