# Step 1：js/game.js — multishot killBonus 改讀 skill params

## 目標

擊殺加速觸發由 `elem === 'wind'` 改為 `hasSkill(tower, 'multishot')`，
加速倍率/持續時間改讀 skill params（`killBonus`、`killDur`），而非硬編碼。

## 影響範圍

**檔案：js/game.js**

改動位置：L2599-2601（擊殺加速觸發）、L2651（effAtkSpd 計算）

---

## 修改說明

### L2599-2601 — 觸發條件

```js
// 目前（硬編碼風系 + 固定 3 秒）
if (e._lastHitTower && e._lastHitTower.elem === 'wind') {
  e._lastHitTower._killRushTimer = 3;
}

// 修改後（讀 multishot skill params）
if (e._lastHitTower) {
  const msSk = getSkill(e._lastHitTower, 'multishot');
  if (msSk) {
    e._lastHitTower._killRushBonus = msSk.killBonus;
    e._lastHitTower._killRushTimer = msSk.killDur;
  }
}
```

### L2651 — effAtkSpd 計算

```js
// 目前（hardcoded 1.5）
const effAtkSpd = tw.atkSpd * (tw._killRushTimer > 0 ? 1.5 : 1) * ...

// 修改後（讀 _killRushBonus）
const effAtkSpd = tw.atkSpd * (tw._killRushTimer > 0 ? (1 + (tw._killRushBonus || 0)) : 1) * ...
```

---

## 依賴

- 無，可獨立執行
- 修改後風系塔若沒有 multishot skill，擊殺不再觸發加速（符合設計意圖）
- 若希望「所有風系塔都有擊殺加速」，則需在塔定義中加上 multishot skill，或另立獨立 skill
