# Step 4：冰系 + 控場技能測試（chill / freeze / warp / knockback / tenacity）

## 目標
驗證疊層系統的累積、衰減、觸發門檻，以及 CD 冷卻機制。

## chill 疊層系統

### 基本疊層
```js
tower = mkTower([makeSkill('chill', {stacksPerHit: 3})]);
enemy = mkEnemy();

game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.chillStacks, 3);

game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.chillStacks, 6);
```

### 上限 chillMaxStacks
```js
// GLOBAL_CAPS.chillMaxStacks = 120
enemy.chillStacks = 119;
game.doDmg(enemy, 50, null, mkTower([makeSkill('chill', {stacksPerHit: 5})]));
assertEqual(enemy.chillStacks, 120, 'capped at chillMaxStacks');
```

### 衰減
```js
enemy.chillStacks = 30;
enemy.chillDecay = 0;
game.tickEnemy(enemy, 1.0);
// decayRate = 15 層/秒
// 預期: chillStacks = 30 - 15 = 15
assertEqual(enemy.chillStacks, 15, 'chill decay after 1s');
```

### 命中後衰減計時重置
```js
enemy.chillStacks = 30;
enemy.chillDecay = 0.9; // 快要觸發衰減
game.doDmg(enemy, 50, null, tower); // 命中 → chillDecay 應重置為 0
assertEqual(enemy.chillDecay, 0, 'chillDecay reset on hit');
```

### 速度減乘公式
```js
// GLOBAL_CAPS.chillPerStack = 0.005, slowPct = 0.8
// chillStacks=40 → slowPct = min(40*0.005, 0.8) = min(0.2, 0.8) = 0.2 → spd * 0.8
// chillStacks=160 → min(160*0.005, 0.8) = min(0.8, 0.8) = 0.8 → spd * 0.2（上限）
// 純數學驗證（不需跑 doDmg）：
const slow40 = Math.min(40 * GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct);
assertEqual(slow40, 0.2, 'chill slow at 40 stacks');

const slow200 = Math.min(200 * GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct);
assertEqual(slow200, 0.8, 'chill slow capped at 80%');
```

## freeze 觸發

### chill 達門檻觸發 freeze
```js
tower = mkTower([
  makeSkill('chill', {stacksPerHit: 20}),
  makeSkill('freeze', {threshold: 30, dur: 2})
]);
enemy = mkEnemy();

// 第1次：chillStacks=20（未達30）
game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.chillStacks, 20);
assertEqual(enemy.stunTimer, 0, 'no freeze yet');

// 第2次：chillStacks=40 → 達門檻 → 觸發 freeze，chillStacks 歸零
game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.chillStacks, 0, 'chillStacks reset after freeze');
assertEqual(enemy.stunTimer, 2, 'freeze duration applied');
```

### tenacity 削減 freeze 時長
```js
tower = mkTower([
  makeSkill('chill', {stacksPerHit: 20}),
  makeSkill('freeze', {threshold: 20, dur: 2})
]);
enemy = mkEnemy({
  skills: [makeSkill('tenacity', {ccReduce: 0.5})]
});

game.doDmg(enemy, 50, null, tower);
// freeze dur = 2 * (1 - 0.5) = 1
assertEqual(enemy.stunTimer, 1, 'tenacity halves freeze');
```

## warp 控場

### warp 直接定身
```js
tower = mkTower([makeSkill('warp', {dur: 1.5, cd: 8})]);
enemy = mkEnemy();

game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.stunTimer, 1.5, 'warp stuns');
assertEqual(tower._warpCd, 8, 'warp cd set');
```

### warp CD 防止重複觸發
```js
// 再次攻擊，CD 未冷卻
tower._warpCd = 7.9;
const prevStun = enemy.stunTimer;
game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.stunTimer, prevStun, 'warp blocked by cd');
```

### warp 不覆蓋更長的 stun
```js
// 敵人已有更長 stunTimer（例如被其他塔凍了 3s）
enemy.stunTimer = 3;
tower._warpCd = 0;
game.doDmg(enemy, 50, null, tower);
// stunTimer = max(3, 1.5) = 3，不應縮短
assertEqual(enemy.stunTimer, 3, 'warp doesnt reduce existing stun');
```

### knockback CD
```js
tower = mkTower([makeSkill('knockback', {dist: 1, cd: 5})]);
enemy = mkEnemy({pathIdx: 10});

game.doDmg(enemy, 50, null, tower);
// 擊退：pathIdx 減少（具體實作需看 game.js knockback 邏輯）
const afterFirst = enemy.pathIdx;
assert(afterFirst < 10, 'knockback reduces pathIdx');
assertEqual(tower._knockbackCd, 5, 'knockback cd set');

// CD 中不再擊退
tower._knockbackCd = 4;
game.doDmg(enemy, 50, null, tower);
assertEqual(enemy.pathIdx, afterFirst, 'knockback blocked by cd');
```
