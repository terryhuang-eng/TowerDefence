# Step 3：火鏈狀態機測試（burn / ignite / detonate）

## 目標
驗證三步連鎖狀態機的每個階段轉換是否正確。

## 狀態機邏輯（來自 game.js 2415~2450 行）

```
attack enemy（有 burn 技能）：
  1. 若 enemy.burnTimer > 0 且有 ignite：
     → 觸發 ignite（額外傷害 = ignite.flat × ATK）
  2. enemy.burnStacks += 1
  3. 重設 burnDmg = burnCoeff * burn.dot，重設 burnTimer = burn.dur
  4. 若 enemy.burnStacks >= 3 且有 detonate：
     → 觸發 detonate（ratio × ATK 真傷，無視護甲）
     → enemy.burnStacks = 0

DOT tick（tickEnemy 中）：
  if burnTimer > 0: enemy.hp -= burnDmg * dt, burnTimer -= dt
  if burnTimer <= 0: burnStacks = 0（熄火，清層數）
```

## 測試案例

### burn：初次命中設定 DOT
```js
const tower = mkTower([makeSkill('burn', {dot: 0.3, dur: 3})], {damage: 50, atkSpd: 1});
const enemy = mkEnemy();

game.doDmg(enemy, 50, null, tower);

assertEqual(enemy.burnTimer, 3, 'burnTimer');
// burnDmg = tower.damage * tower.atkSpd * dot = 50 * 1 * 0.3 = 15
assertEqual(enemy.burnDmg, 15, 'burnDmg');
assertEqual(enemy.burnStacks, 1, 'burnStacks');
```

### burn：DOT tick 扣血
```js
// 承接上面，模擬 1 秒
game.tickEnemy(enemy, 1.0);

assertRange(enemy.hp, 84, 86, 'hp after 1s burn'); // 100 - 15 = 85
assertEqual(enemy.burnTimer, 2, 'burnTimer after 1s');
```

### burn：重複命中時 burnTimer 重置（不累積）
```js
const enemy = mkEnemy();
game.doDmg(enemy, 50, null, tower); // burnTimer=3
game.tickEnemy(enemy, 1.5);          // burnTimer=1.5
game.doDmg(enemy, 50, null, tower); // 重新命中 → burnTimer 應回到 3
assertEqual(enemy.burnTimer, 3, 'burnTimer reset on reapply');
```

### ignite：重複命中時觸發 ignite 額外傷害
```js
const tower = mkTower([
  makeSkill('burn', {dot: 0.3, dur: 3}),
  makeSkill('ignite', {flat: 0.2})
], {damage: 50, atkSpd: 1});
const enemy = mkEnemy();

game.doDmg(enemy, 50, null, tower);
const hpAfterFirst = enemy.hp; // 無 ignite（第一次 burnTimer=0）

game.doDmg(enemy, 50, null, tower);
// ignite 觸發：額外 = floor(50 * 0.2) = 10
// 直接傷害 50 + ignite 10 = 60 傷害

const hpAfterSecond = enemy.hp;
// 第一次：hp = 100 - 50 = 50
// 第二次：hp = 50 - 50(直接) - 10(ignite) = -10

assert(hpAfterFirst === 50, 'first hit no ignite');
assert(hpAfterSecond === -10, 'second hit ignite fires');
```

### burnStacks 在 burnTimer 歸零後清空
```js
const enemy = mkEnemy();
game.doDmg(enemy, 50, null, mkTower([makeSkill('burn', {dot: 0.1, dur: 1})]));
assertEqual(enemy.burnStacks, 1);

game.tickEnemy(enemy, 1.5); // burnTimer 耗盡
assertEqual(enemy.burnStacks, 0, 'burnStacks cleared after burnout');
```

### detonate：第 3 層時引爆
```js
const tower = mkTower([
  makeSkill('burn', {dot: 0.1, dur: 5}),
  makeSkill('detonate', {ratio: 1.0})
], {damage: 100, atkSpd: 1});
const enemy = mkEnemy({hp: 1000, maxHp: 1000});

// 第1次：burnStacks=1, 無引爆
game.doDmg(enemy, 100, null, tower);
assert(enemy.burnStacks === 1, 'after 1st hit');
const hp1 = enemy.hp; // 1000 - 100 = 900

// 第2次：burnStacks=2, 無引爆
game.doDmg(enemy, 100, null, tower);
assert(enemy.burnStacks === 2, 'after 2nd hit');

// 第3次：burnStacks=3 → detonate 觸發，burnStacks=0
game.doDmg(enemy, 100, null, tower);
assert(enemy.burnStacks === 0, 'burnStacks reset after detonate');
// detonate: ratio=1.0 × damage=100 = 100 真傷（無視護甲）
// 第3次共: 直接100 + detonate100 = 200
// enemy.hp = 900 - 100(2nd) - 200(3rd) = 600
// ⚠️ 注意：detonate 也要確認是真傷（不吃護甲）
// 設 enemy.armor = 0.5 重測：直接傷害 50（吃護甲），detonate 100（真傷）
```

### detonate：確認為真傷（無視護甲）
```js
const tower = mkTower([
  makeSkill('burn', {dot: 0.1, dur: 5}),
  makeSkill('detonate', {ratio: 1.0})
], {damage: 100, atkSpd: 1});
const enemy = mkEnemy({hp: 1000, maxHp: 1000, armor: 0.5});

// 各打3次（armor=0.5，直接傷害各 50）
// 3次直接傷害 = 3*50 = 150
// detonate（真傷）= 100
// 預期 hp = 1000 - 150 - 100 = 750
game.doDmg(enemy, 100, null, tower);
game.doDmg(enemy, 100, null, tower);
game.doDmg(enemy, 100, null, tower);
assertEqual(enemy.hp, 750, 'detonate ignores armor');
```

## 注意事項

執行 step3 前需確認 game.js 中 ignite.flat 的 `baseDmg` 參考是哪個值：
- 2422行：`Math.floor(baseDmg * igniteSk.flat)`
- `baseDmg` 是傳入 doDmg 的第二個參數（原始傷害），非 tower.damage

測試中必須追蹤 baseDmg 的流向（unstable/execute 修改後的 dmg，或原始 baseDmg）。
