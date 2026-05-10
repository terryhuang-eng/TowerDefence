# Step 6：目標選取技能測試（pierce / chain / multishot）

## 目標
驗證多目標技能的目標篩選、傷害遞增/遞減計算是否正確。

## 注意：這些技能在 game.js 的攻擊迴圈中處理（非 doDmg 內）
pierce、chain、multishot 在 game.js ~2896-2980 行（tower attack 主迴圈），
不在 doDmg 內。MockGame 需要複製攻擊迴圈邏輯，或單獨測試數學計算部分。

**測試策略**：
- 對於 pierce/chain，測試「給定目標清單 + 主目標，計算各目標受到多少傷害」的純函數
- 不需要完整模擬攻擊迴圈，只驗證傷害計算公式

## pierce（直線穿透）

### 邏輯（game.js ~2898-2930）
```
pierceSk = {dmgUp: 0.15}
主目標：doDmg(mainTarget, effDmg)
方向向量：(tx - tower.x, ty - tower.y) normalized

沿方向篩出所有其他敵人（距直線 < 0.6 格）：
  依距離排序（最近主目標的先打）
  pierceHits = 0
  for each enemy in path:
    pierceHits++
    doDmg(e, effDmg * (1 + pierceHits * dmgUp))
```

### 測試：傷害遞增計算
```js
// 直線上 3 個敵人（主目標 + 2 個穿透目標）
// dmgUp = 0.15, effDmg = 100

// 主目標：100
// 第1個穿透（pierceHits=1）：100 * (1 + 1*0.15) = 115
// 第2個穿透（pierceHits=2）：100 * (1 + 2*0.15) = 130

function calcPierceDmg(effDmg, dmgUp, pierceHits) {
  return effDmg * (1 + pierceHits * dmgUp);
}
assertEqual(calcPierceDmg(100, 0.15, 1), 115);
assertEqual(calcPierceDmg(100, 0.15, 2), 130);
assertEqual(calcPierceDmg(100, 0.15, 0), 100); // 主目標不加成
```

### 測試：直線篩選邏輯（距直線 < 0.6 格）
```js
// 需要模擬 game.js 的直線距離計算
// 點 P 到向量 (dx, dy) 的投影距離
function distToLine(px, py, lx, ly, ldx, ldy) {
  // 叉積長度 / 向量長度
  const cross = (px - lx) * ldy - (py - ly) * ldx;
  return Math.abs(cross); // 已假設 ldir 為單位向量
}

// 塔在 (5,5)，主目標在 (8,5)，方向 (1,0)
// 直線路徑上的敵人：(9,5) 距 0 → 符合
// 旁邊的敵人：(9,5.7) 距 0.7 → 不符合 (>0.6)

assert(distToLine(9, 5, 5, 5, 1, 0) < 0.6, 'on-path enemy included');
assert(distToLine(9, 5.7, 5, 5, 1, 0) > 0.6, 'off-path enemy excluded');
assert(distToLine(9, 5.5, 5, 5, 1, 0) < 0.6, 'close enemy included');
```

## chain（連鎖跳躍）

### 邏輯（game.js ~2961-2970）
```
chainSk = {targets: 2, decay: 0.7}
主目標：已由 doDmg 處理
chainTargets = 其他敵人中距主目標最近的 targets 個
chainTargets.forEach((e, i) => {
  chainDmg = floor(effDmg * decay^(i+1))
  doDmg(e, chainDmg)
})
```

### 測試：decay 公式
```js
function calcChainDmg(effDmg, decay, jumpIndex) {
  // jumpIndex 從 1 開始（第1跳 = decay^1, 第2跳 = decay^2）
  return Math.floor(effDmg * Math.pow(decay, jumpIndex));
}

assertEqual(calcChainDmg(100, 0.7, 1), 70, 'first chain jump');
assertEqual(calcChainDmg(100, 0.7, 2), 49, 'second chain jump');
assertEqual(calcChainDmg(100, 0.5, 1), 50);
assertEqual(calcChainDmg(100, 0.5, 2), 25);
```

### 測試：targets 數量限制
```js
// 3 個可跳目標，但 targets=2，只跳前 2 個
const game = new MockGame();
const mainEnemy   = mkEnemy({x:5, y:5});
const chainEnemy1 = mkEnemy({x:5, y:6, hp:200, maxHp:200});
const chainEnemy2 = mkEnemy({x:5, y:7, hp:200, maxHp:200});
const chainEnemy3 = mkEnemy({x:5, y:8, hp:200, maxHp:200}); // 應不被跳到
game.enemies = [mainEnemy, chainEnemy1, chainEnemy2, chainEnemy3];

const tower = mkTower([makeSkill('chain', {targets:2, decay:0.7})], {x:5, y:4});

// 模擬攻擊（主目標 + chain）
game.attackWithChain(tower, mainEnemy, 100);

assert(chainEnemy1.hp < 200, 'chain hit enemy1');
assert(chainEnemy2.hp < 200, 'chain hit enemy2');
assertEqual(chainEnemy3.hp, 200, 'chain does not hit enemy3');
```

## multishot（每 N 次多連射）

### 邏輯（game.js ~2932-2960）
```
multiSk = {every: 3, shots: 3, killBonus: 0.5, killDur: 3}
tower.atkCount % every === 0 時觸發：
  選出最近的 shots 個敵人（含主目標？需確認）
  各目標 doDmg(e, effDmg)
```

### 測試：觸發週期
```js
// atkCount 在 0, 3, 6... 時觸發（every=3）
// 驗證觸發邏輯（純數學）：
for (let i = 0; i < 10; i++) {
  const shouldFire = (i % 3 === 0);
  // atkCount=0: 觸發, 1: 不觸發, 2: 不觸發, 3: 觸發...
}
```

### 測試：killBonus 攻速加成觸發
```js
// multishot 擊殺後：tower._killRushBonus = killBonus, _killRushTimer = killDur
// 模擬擊殺（需 game.js killEnemy 邏輯）
// 相對複雜，考慮在 step8 整合測試中驗證
```
