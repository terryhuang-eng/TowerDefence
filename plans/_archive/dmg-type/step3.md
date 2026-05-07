# Step 3：js/game.js — doDmg 呼叫改用 dmgType || elem

## 目標

所有 `doDmg()` 呼叫中的 `tw.elem` 改為 `(tw.dmgType || tw.elem)`，
讓有設定 `dmgType` 的塔打出對應元素傷害，無設定則維持現有行為。

## 影響範圍

**檔案：js/game.js**

改動位置：4 處 `doDmg()` 呼叫（L2683, L2701, L2704, L2724）

---

## 修改說明

### 4 處 doDmg 呼叫

**L2683 — pierce 穿透：**
```js
// 目前
targets.forEach((e, i) => this.doDmg(e, Math.floor(effDmg * (1 + i * pUp)), tw.elem, tw));

// 修改後
const twDmgElem = tw.dmgType || tw.elem;
targets.forEach((e, i) => this.doDmg(e, Math.floor(effDmg * (1 + i * pUp)), twDmgElem, tw));
```

**L2701 — AOE 範圍攻擊：**
```js
// 目前
this.getEnemiesNear(p.x, p.y, tw.aoe).forEach(e => this.doDmg(e, effDmg, tw.elem, tw));

// 修改後
this.getEnemiesNear(p.x, p.y, tw.aoe).forEach(e => this.doDmg(e, effDmg, tw.dmgType || tw.elem, tw));
```

**L2704 — 單體攻擊：**
```js
// 目前
this.doDmg(shotTarget, effDmg, tw.elem, tw);

// 修改後
this.doDmg(shotTarget, effDmg, tw.dmgType || tw.elem, tw);
```

**L2724 — chain 彈射：**
```js
// 目前
this.doDmg(e, chainDmg, tw.elem, tw);

// 修改後
this.doDmg(e, chainDmg, tw.dmgType || tw.elem, tw);
```

---

## 實作建議

4 處呼叫中，L2683、L2701、L2704、L2724 在同一個大 for 迴圈內，
可在迴圈頂部宣告一次：

```js
const twDmgElem = tw.dmgType || tw.elem;
```

然後 4 處全部替換 `tw.elem` → `twDmgElem`，避免重複計算。

---

## 對其他視覺元素的影響

傷害元素改變後，以下地方的**顯示顏色**仍用 `tw.elem`（基底元素），**不需改動**：
- 子彈/特效顏色（`tw.elem ? ELEM[tw.elem].color : ...`，L2684/L2702/L2709）
- 塔的外觀顏色（L491-494）

這是設計上的合理選擇：塔看起來是火，但打水屬傷害（視覺是橘色，計算是水）。
若未來需要讓特效顏色也跟 `dmgType` 走，可再另立步驟。

---

## 依賴

- 依賴 step1（towers.js 有 `dmgType` 欄位）
- step2 可獨立（只改 skill-editor UI），不影響 step3
- **可獨立執行**：就算 towers.js 沒有 `dmgType`，`tw.dmgType` 為 `undefined`，`undefined || tw.elem` 仍等於 `tw.elem`，不影響現有行為

## 限制

- 只改 4 處主要 `doDmg` 呼叫
- DOT（灼燒、毒）的元素類型在 `doBurnDot()` 等函數中，如需讓 DOT 也跟 `dmgType` 走，需另立步驟
