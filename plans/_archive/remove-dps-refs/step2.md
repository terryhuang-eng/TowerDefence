# step2 — score-glossary.md 移除 DPS_REF 詞條

## 目標

將 `DPS_REF` 詞條從 DPS 相關區塊移至廢棄區。

## 修改清單（1 處）

### docs/score-glossary.md

**移除**（約 L70–71）：
```markdown
### `DPS_REF`
Expected DPS by level；用於換算 effectiveDPS 分數。
```

**在廢棄區補充**（接在現有廢棄詞條後）：
```markdown
### `DPS_REF` / `DPS_SCORE_REF` ⛔ deprecated (removed remove-dps-refs)
兩個等級假設與 LEVEL_SCORE_STD 重複。校正基準來自實測（LV1 曲線 + LV4 風塔 W8），
不需要額外換算參數。移除後 dpsScoreActual = effectiveDPS 直接使用。
```
