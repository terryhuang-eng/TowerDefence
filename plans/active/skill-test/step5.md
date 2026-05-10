# Step 5：強化類技能測試（ramp / aura_dmg / aura_atkSpd / aura_range）

## 目標
驗證 ramp 的積累/切換扣層邏輯，以及 aura 的範圍增益應用。

## ramp（越攻越快）

### 同目標連攻積累
```js
const tower = mkTower([makeSkill('ramp', {perHit: 0.05, cap: 0.6, switchLoss: 3})]);
tower._rampBonus = 0;
tower._rampTarget = null;
const enemy = mkEnemy();

// ramp 在「攻擊迴圈」中更新（game.js ~2880 行）
// 測試方式：直接模擬 ramp 的 state machine
// 連攻4次同目標：
function simulateRamp(tower, target, hits) {
  for (let i = 0; i < hits; i++) {
    if (tower._rampTarget === target) {
      tower._rampBonus = Math.min(tower._rampBonus + 0.05, 0.6);
    } else {
      tower._rampTarget = target;
      tower._rampBonus = Math.max(0, tower._rampBonus - 3 * 0.05);
    }
  }
}

simulateRamp(tower, enemy, 4);
assertEqual(tower._rampBonus, 0.2, 'ramp after 4 hits');

simulateRamp(tower, enemy, 8); // 繼續 8 次（共 12 次）
assertEqual(tower._rampBonus, 0.6, 'ramp capped');
```

### 切換目標扣層（不歸零）
```js
const tower = mkTower([makeSkill('ramp', {perHit: 0.05, cap: 0.6, switchLoss: 3})]);
const enemyA = mkEnemy();
const enemyB = mkEnemy();

// 先攻 A 積累 10 層 = 0.5
simulateRamp(tower, enemyA, 10);
assertEqual(tower._rampBonus, 0.5);

// 切換到 B：扣 3 * 0.05 = 0.15，剩 0.35
simulateRamp(tower, enemyB, 1);
assertEqual(tower._rampBonus, 0.35, 'ramp switch loss');

// 再切回 A：再扣 0.15，剩 0.2
simulateRamp(tower, enemyA, 1);
assertRange(tower._rampBonus, 0.19, 0.21, 'ramp switch back');

// 驗證不歸零：如果之前只有 0.1 bonus，切換後不應該變負
const tower2 = mkTower([makeSkill('ramp', {perHit: 0.05, cap: 0.6, switchLoss: 3})]);
simulateRamp(tower2, enemyA, 2); // bonus = 0.1
simulateRamp(tower2, enemyB, 1); // 切換，0.1 - 0.15 = max(0, -0.05) = 0
assertEqual(tower2._rampBonus, 0, 'ramp no negative bonus');
```

## aura 範圍增益

### 前置說明
aura 在 game.js 的 `tickTowers`（每幀更新）中計算：
遍歷所有有 aura 技能的塔（src），對範圍內的友軍（tw）應用 `_auraDmgFlat/_auraDmgPct/_auraAtkSpd/_auraRange`。

### aura_dmg 在射程內有效、射程外無效
```js
const game = new MockGame();
const aurasrc = mkTower([makeSkill('aura_dmg', {radius: 2, flat: 5, pct: 0.15})], {x: 5, y: 5});
const nearby  = mkTower([], {x: 5, y: 6}); // 距離 = 1，在半徑 2 內
const faraway = mkTower([], {x: 5, y: 9}); // 距離 = 4，超出半徑 2
game.towers = [aurasrc, nearby, faraway];

game.tickTowers(0.016); // 模擬一幀

assertEqual(nearby._auraDmgFlat, 5, 'nearby gets flat aura');
assertRange(nearby._auraDmgPct, 0.14, 0.16, 'nearby gets pct aura');
assertEqual(faraway._auraDmgFlat, 0, 'faraway no flat aura');
assertEqual(faraway._auraDmgPct, 0, 'faraway no pct aura');
```

### aura 光環塔自己不受益（或受益？）
```js
// 確認 game.js 的 aura 計算是否把 aurasrc 自己排除
// game.js 2784行：for (const tw of this.towers) → 含自己
// 2785行：dist = distance(src, tw) → src 到自己 = 0，在半徑內
// → aurasrc 也會受到自己的 aura 增益

assertEqual(aurasrc._auraDmgPct, 0.15, 'source also gets own aura');
```

### aura_atkSpd 上限 GLOBAL_CAPS.atkSpdBonus
```js
const src1 = mkTower([makeSkill('aura_atkSpd', {radius: 3, bonus: 1.5})], {x:5, y:5});
const src2 = mkTower([makeSkill('aura_atkSpd', {radius: 3, bonus: 1.5})], {x:5, y:6});
const target = mkTower([], {x:5, y:5});
game.towers = [src1, src2, target];

game.tickTowers(0.016);
// 兩個 aura 疊加 = 3.0，但上限 GLOBAL_CAPS.atkSpdBonus = 2
assertEqual(target._auraAtkSpd, GLOBAL_CAPS.atkSpdBonus, 'atkSpd aura capped');
```

### aura_range 累加
```js
const src1 = mkTower([makeSkill('aura_range', {radius: 3, bonus: 0.5})], {x:5, y:5});
const src2 = mkTower([makeSkill('aura_range', {radius: 3, bonus: 0.5})], {x:5, y:6});
const target = mkTower([], {x:5, y:5});
game.towers = [src1, src2, target];

game.tickTowers(0.016);
assertEqual(target._auraRange, 1.0, 'aura_range stacks from 2 sources');
```
