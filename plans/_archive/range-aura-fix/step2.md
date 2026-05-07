# Step 2：js/game.js — multishot killBonus 改讀 skill params

> 沿用 skill-audit/step1.md 的分析，整合至本計畫執行

## 目標

擊殺加速觸發由 `elem === 'wind'` 改為 `hasSkill(tower, 'multishot')`，
加速倍率/持續時間改讀 skill params，而非硬編碼。

## 影響範圍

**檔案：js/game.js**

定位方式（執行時 Grep）：
- `_lastHitTower\.elem === 'wind'` → 找到擊殺觸發位置
- `_killRushTimer` → 找到 effAtkSpd 計算位置

---

## 修改說明

### A. 擊殺觸發（L~2599）

```js
// 目前
if (e._lastHitTower && e._lastHitTower.elem === 'wind') {
  e._lastHitTower._killRushTimer = 3;
}

// 修改後
if (e._lastHitTower) {
  const msSk = getSkill(e._lastHitTower, 'multishot');
  if (msSk) {
    e._lastHitTower._killRushBonus = msSk.killBonus;
    e._lastHitTower._killRushTimer = msSk.killDur;
  }
}
```

### B. effAtkSpd 計算（L~2651）

```js
// 目前
const effAtkSpd = tw.atkSpd * (tw._killRushTimer > 0 ? 1.5 : 1) * ...

// 修改後
const effAtkSpd = tw.atkSpd * (tw._killRushTimer > 0 ? (1 + (tw._killRushBonus || 0)) : 1) * ...
```

## 依賴

- 無，可獨立執行
