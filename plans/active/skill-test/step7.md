# Step 7：場效應技能測試（zone_* / field_* / cycle_*）

## 目標
驗證三種不同觸發時機的場效應技能：
- **zone_***：命中時在目標位置放置圓圈，圓圈內敵人持續維持 stacks
- **field_***：以塔為中心，每幀對射程內所有敵人維持 stacks
- **cycle_***：每次攻擊時，對塔周圍所有敵人施加效果

## zone_slow / zone_shred

### 邏輯（game.js ~2987-3010）
```
命中主目標後：
  zones.push({x: enemy.x, y: enemy.y, radius, timer: 3})
zone tick（每幀）：
  for zone in zones:
    zone.timer -= dt
    for enemy in enemies:
      if dist(enemy, zone) <= zone.radius:
        enemy.chillStacks = max(chillStacks, zone.chillStacks)
        enemy.chillDecay = 0
```

### 測試：zone 建立
```js
const game = new MockGame();
const tower = mkTower([makeSkill('zone_slow', {radius:2, chillStacks:40})], {x:5, y:5});
const enemy = mkEnemy({x:8, y:5}); // 敵人在 (8,5)
game.enemies = [enemy];

game.attackAndSpawnZone(tower, enemy, 50); // 模擬命中 + zone 生成
assertEqual(game.zones.length, 1, 'zone created');
assertEqual(game.zones[0].x, 8, 'zone at enemy x');
assertEqual(game.zones[0].y, 5, 'zone at enemy y');
assertRange(game.zones[0].timer, 2.9, 3.1, 'zone timer = 3s');
```

### 測試：zone 內敵人維持 chillStacks
```js
const game = new MockGame();
game.zones = [{x:8, y:5, radius:2, chillStacks:40, timer:2}];

const insideEnemy  = mkEnemy({x:8, y:5, chillStacks:0});
const outsideEnemy = mkEnemy({x:12, y:5, chillStacks:0});
game.enemies = [insideEnemy, outsideEnemy];

game.tickZones(0.016);

assertEqual(insideEnemy.chillStacks, 40, 'inside zone gets chillStacks');
assertEqual(outsideEnemy.chillStacks, 0, 'outside zone no effect');
```

### 測試：zone 不覆蓋更高的 chillStacks（取 max）
```js
const insideEnemy2 = mkEnemy({x:8, y:5, chillStacks:60});
game.enemies = [insideEnemy2];
game.tickZones(0.016);
assertEqual(insideEnemy2.chillStacks, 60, 'zone doesnt reduce higher stacks');
```

### 測試：zone 過期後被清除
```js
game.zones = [{x:8, y:5, radius:2, chillStacks:40, timer:0.01}];
game.tickZones(0.016); // 超過 timer
assertEqual(game.zones.length, 0, 'expired zone removed');
```

## field_slow / field_shred / field_vuln

### 邏輯（game.js ~2793-2810）
```
每幀 tickTowers：
  for tower with field_slow:
    for enemy in enemies:
      if dist(tower, enemy) <= fSlow.radius:
        enemy.chillStacks = max(current, fSlow.chillStacks)
        enemy.chillDecay = 0
```

### 測試：field_slow 維持 stacks
```js
const game = new MockGame();
const tower = mkTower([makeSkill('field_slow', {radius:2, chillStacks:50})], {x:5, y:5});
const inRange  = mkEnemy({x:5, y:6, chillStacks:0}); // 距 1 格
const outRange = mkEnemy({x:5, y:8, chillStacks:0}); // 距 3 格
game.towers = [tower];
game.enemies = [inRange, outRange];

game.tickTowers(0.016);

assertEqual(inRange.chillStacks, 50, 'in range gets field slow');
assertEqual(outRange.chillStacks, 0, 'out of range no effect');
```

### 測試：field_stun 週期性暈眩
```js
const tower = mkTower([makeSkill('field_stun', {radius:2, dur:0.8, cd:6})], {x:5, y:5});
tower._fieldStunCd = 0;
const enemy = mkEnemy({x:5, y:6});
game.towers = [tower];
game.enemies = [enemy];

game.tickTowers(0.016); // 第一幀觸發
assertEqual(enemy.stunTimer, 0.8, 'field_stun fires');
assertEqual(tower._fieldStunCd, 6, 'field_stun cd set');

// CD 中不再觸發
tower._fieldStunCd = 5;
enemy.stunTimer = 0;
game.tickTowers(0.016);
assertEqual(enemy.stunTimer, 0, 'field_stun blocked by cd');
```

### 測試：field_burn 週期性灼燒
```js
const tower = mkTower([makeSkill('field_burn', {radius:2, dot:0.2, dur:3, interval:1})],
                       {x:5, y:5, damage:50, atkSpd:1});
tower._fieldBurnTimer = 0;
const enemy = mkEnemy({x:5, y:6});
game.towers = [tower];
game.enemies = [enemy];

game.tickTowers(0.016); // 觸發
assert(enemy.burnTimer > 0, 'field_burn applies burn');
```

## cycle_* 攻速同步場效應

### 邏輯（game.js ~2840-2874）
```
每次塔 atkTimer 觸發（有目標時）：
  cycle_stun: 範圍內所有敵人 stunTimer = max(current, dur)
  cycle_chill: 範圍內所有敵人 chillStacks += stacksPerCycle
  cycle_shred: 範圍內所有敵人 shredStacks += stacksPerCycle
  cycle_vuln: 範圍內所有敵人 vulnStacks += stacksPerCycle
  cycle_burn: 範圍內所有敵人施加 burn
```

### 測試：cycle_chill 每次攻擊疊層
```js
const game = new MockGame();
const tower = mkTower([makeSkill('cycle_chill', {radius:2, stacksPerCycle:5})],
                       {x:5, y:5, damage:50, atkSpd:1});
const mainTarget  = mkEnemy({x:7, y:5}); // 距 2 格，剛好在範圍
const nearEnemy   = mkEnemy({x:5, y:6}); // 距 1 格，在範圍
const farEnemy    = mkEnemy({x:5, y:9}); // 距 4 格，超出範圍
game.towers = [tower];
game.enemies = [mainTarget, nearEnemy, farEnemy];

// 模擬一次攻擊觸發
game.triggerCycleSkills(tower, mainTarget);

assertEqual(mainTarget.chillStacks, 5, 'main target gets cycle chill');
assertEqual(nearEnemy.chillStacks, 5, 'nearby enemy gets cycle chill');
assertEqual(farEnemy.chillStacks, 0, 'far enemy no cycle chill');
```

### 測試：cycle_stun dur 上限 2.0s
```js
const tower2 = mkTower([makeSkill('cycle_stun', {radius:2, dur:5.0})], {x:5, y:5});
const enemy2 = mkEnemy({x:5, y:6, stunTimer:0});
game.triggerCycleSkills(tower2, enemy2);
// dur 2.0s 上限（game.js desc 說「dur 上限 2.0s」）
// 實際代碼需確認是否有 Math.min 2.0 截斷
```
