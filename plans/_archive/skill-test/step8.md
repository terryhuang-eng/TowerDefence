# Step 8：經濟技能 + 敵人 Passive 測試

## 目標
驗證擊殺/積累型技能的數值計算，以及敵人被動技能的觸發條件。

---

## 經濟技能

### killGold（擊殺獎金）
```js
// 邏輯：game.js ~2751-2754
// if (kgSk) this.gold += floor((enemy.killGold || BASE) * kgSk.bonus)

const game = new MockGame();
game.gold = 100;
const tower = mkTower([makeSkill('killGold', {bonus: 5})]);
const enemy = mkEnemy({killGold: 10});
enemy._lastHitTower = tower;

game.processKill(enemy); // 模擬擊殺處理
// 基礎獎金 10 + killGold 技能 = 10 + floor(10 * 5) = 10 + 50 = 60 金
// game.gold = 100 + 10(基礎) + 50(技能) = 160

assertEqual(game.gold, 160, 'killGold bonus');
```

### permaBuff（永久攻擊力）
```js
const tower = mkTower([makeSkill('permaBuff', {atkPerKill: 0.5})], {damage: 100});
const enemy = mkEnemy();
enemy._lastHitTower = tower;
tower._permaBuff = 0;

game.processKill(enemy);
assertEqual(tower._permaBuff, 0.5, 'permaBuff accumulates');

game.processKill(enemy);
assertEqual(tower._permaBuff, 1.0, 'permaBuff second kill');
// 驗證 _permaBuff 實際用在 damage 計算（需確認 game.js 如何讀取 _permaBuff）
```

### wealthScale（財富積累傷害加成）
```js
// 邏輯（game.js ~2890-2895）
// wsSk = {divisor: 20, cap: 50}
// bonus = min(floor(game.gold / divisor), cap)
// effDmg += bonus

const game = new MockGame();
game.gold = 200;
const tower = mkTower([makeSkill('wealthScale', {divisor: 20, cap: 50})], {damage: 100});

// bonus = min(floor(200/20), 50) = min(10, 50) = 10
// effDmg = 100 + 10 = 110
const effDmg = game.calcWealthBonus(tower);
assertEqual(effDmg, 10, 'wealthScale bonus at 200 gold');

game.gold = 2000;
const effDmg2 = game.calcWealthBonus(tower);
assertEqual(effDmg2, 50, 'wealthScale capped at cap');
```

### interest（利息）
```js
// 邏輯（game.js ~3210-3217）
// 每波結算時：bonus = min(floor(gold * rate), cap)

const game = new MockGame();
game.gold = 500;
const tower = mkTower([makeSkill('interest', {rate: 0.05, cap: 40})]);
game.towers = [tower];

game.processWaveInterest();
// bonus = min(floor(500 * 0.05), 40) = min(25, 40) = 25
assertEqual(game.gold, 525, 'interest adds gold');

game.gold = 1000;
game.processWaveInterest();
// bonus = min(50, 40) = 40（上限）
assertEqual(game.gold, 1040, 'interest capped');
```

---

## 敵人 Passive

### regen（每秒回血）
```js
const enemy = mkEnemy({hp: 50, maxHp: 100, skills: [makeSkill('regen', {pct: 0.02})]});
game.tickEnemy(enemy, 1.0);
// 回復 2% maxHp = 2
assertRange(enemy.hp, 51.9, 52.1, 'regen heals 2%/s');
assertEqual(Math.min(enemy.hp, 100), enemy.hp, 'hp not over maxHp'); // 不超上限
```

### armorStack（護甲成長）
```js
const enemy = mkEnemy({armor: 0.1, skills: [makeSkill('armorStack', {perHit: 0.1, cap: 0.5})]});
const tower = mkTower([]);

// 初始護甲 0.1
game.doDmg(enemy, 100, null, tower);
// armorStacks += 0.1 → 計算護甲時 armor + armorStacks * 0.1 = 0.1 + 0.1*0.1
// ⚠️ 注意：armorStacks 是幾次被打的計數，還是直接護甲加成值？
// 查 game.js 2373行：armor = enemy.armor + (enemy.armorStacks || 0) * 0.1
// 查 armorStack 觸發位置...

assertEqual(enemy.armorStacks, 1, 'armorStack increments');
// 第6次：armorStacks=5 → 額外護甲 = 5*0.1 = 0.5（等於 cap）
```

### enrage（狂暴，HP < 30% 速度翻倍）
```js
const enemy = mkEnemy({hp: 100, maxHp: 100, speed: 2,
  skills: [makeSkill('enrage', {hpThreshold: 0.3, spdMult: 2})]});

// HP 50% → 未觸發
enemy.hp = 50;
const spd1 = game.getEffectiveSpeed(enemy);
assertEqual(spd1, 2, 'no enrage at 50%');

// HP 20% → 觸發
enemy.hp = 20;
const spd2 = game.getEffectiveSpeed(enemy);
assertEqual(spd2, 4, 'enrage at 20%');
```

### shield（護盾：第一次致死後存 1HP）
```js
const enemy = mkEnemy({hp: 10, maxHp: 100, skills: [makeSkill('shield', {})]});

// 造成超過 10 的傷害
game.doDmg(enemy, 50, null, null);
assertEqual(enemy.hp, 1, 'shield saves at 1hp');
assertEqual(enemy._shieldUsed, true, 'shield used flag');

// 再次致死不再救
game.doDmg(enemy, 50, null, null);
assert(enemy.hp <= 0, 'no second shield');
```

### dodge（閃避機率）
```js
// 已在 step2 測試，此處補充：敵方 dodge
const enemy = mkEnemy({skills: [makeSkill('dodge', {chance: 1.0})]});
// chance=100%，每次必閃
const hpBefore = enemy.hp;
game.doDmg(enemy, 100, null, null);
assertEqual(enemy.hp, hpBefore, 'full dodge: no damage');
```

### tenacity（CC 抗性）
```js
// 已在 step4 驗證 freeze 減半，補充：
// warp + tenacity
const enemy = mkEnemy({skills: [makeSkill('tenacity', {ccReduce: 0.3})]});
const tower = mkTower([makeSkill('warp', {dur: 2, cd: 0})]);
game.doDmg(enemy, 50, null, tower);
// stunTimer = 2 * (1 - 0.3) = 1.4
assertRange(enemy.stunTimer, 1.39, 1.41, 'tenacity reduces warp');
```

### blink（低 HP 閃現）
```js
const enemy = mkEnemy({hp: 25, maxHp: 100, pathIdx: 5,
  skills: [makeSkill('blink', {dist: 2, cd: 8, hpTrigger: 0.3})]});

// HP 25% < 30% → 觸發 blink（pathIdx 前進 2）
game.tickEnemy(enemy, 0.016);
assert(enemy.pathIdx > 5, 'blink advances pathIdx');
assertEqual(enemy._blinkCd, 8, 'blink cd set');

// CD 中不再 blink
enemy.pathIdx = 5;
enemy._blinkCd = 7;
game.tickEnemy(enemy, 0.016);
assertEqual(enemy.pathIdx, 5, 'blink blocked by cd');
```

---

## 複合技能互動驗證（高優先級 Bug 預防）

| 互動 | 預期行為 |
|------|---------|
| chill + freeze + tenacity | freeze dur = freeze.dur * (1 - ccReduce) |
| shred + armor | armor = max(0, armor - shredAmt)（不為負）|
| vuln + armor | 先扣護甲，再放大 vuln（順序決定計算結果） |
| burn + detonate + armor | detonate 是真傷，不吃護甲 |
| pierce + execute | execute 判斷在 pierce 每個目標的 doDmg 中獨立觸發 |
| shield + enrage | shield 存活後若 HP 仍 < 30%，enrage 持續有效 |
