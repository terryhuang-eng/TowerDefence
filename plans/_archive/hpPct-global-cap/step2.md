# Step 2：game.js — hpPct 觸發邏輯改讀 GLOBAL_CAPS.hpPctCap

## 目標
將 hpPct 的 cap 判斷從讀取 `hpPctSk.cap`（per-tower）改為讀取 `GLOBAL_CAPS.hpPctCap`（全域）。

## 影響範圍
- 唯一修改：`js/game.js` 1 行
- 此步驟完成後，所有塔（包含原本沒有 cap 的兩支）都自動套用全域封頂

## 具體修改

**定位**：Grep `hpPctSk.cap` → 找到觸發邏輯

**修改前**：
```js
const hpDmg = hpPctSk.cap ? Math.min(rawHpDmg, hpPctSk.cap) : rawHpDmg;
```

**修改後**：
```js
const hpDmg = Math.min(rawHpDmg, GLOBAL_CAPS.hpPctCap);
```

**說明**：
- 移除條件式：`GLOBAL_CAPS.hpPctCap` 永遠存在（step1 已定義），不需 null guard
- 語義更清晰：全域上限，不依賴個別 skill params

## 定位流程
1. `Grep "hpPctSk.cap"` in game.js → 找行號（應只有 1 筆）
2. `Read ±3 行` 確認 context
3. `Edit` 替換該行
