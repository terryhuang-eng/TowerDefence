# Step 2：修正 skill-test.html MockGame + 測試斷言

## 目標檔案
`skill-test.html`

## 修正一：MockGame.tickEnemy burn DOT（~第 262 行）

```js
// 改前
if (enemy.burnTimer > 0) {
  enemy.hp -= enemy.burnDmg * dt;
  enemy.burnTimer -= dt;
}

// 改後
if (enemy.burnTimer > 0) {
  const burnDt = Math.min(dt, enemy.burnTimer);
  enemy.hp -= enemy.burnDmg * burnDt;
  enemy.burnTimer -= dt;
}
```

## 修正二：測試斷言加精確範圍（~第 994 行）

```js
// 改前
game.tickEnemy(enemy, 2.0);  // 超過 burnTimer
assert(enemy.hp >= 89, `hp=${enemy.hp} should stop burning after timer`);

// 改後
game.tickEnemy(enemy, 2.0);  // 超過 burnTimer：只燒 1.0s → 扣 10 血
assertRange(enemy.hp, 89.9, 90.1, 'burn stops at timer=0: hp=90');
```

## 驗證
語法驗證所有 script blocks：
```bash
node -e "
const fs=require('fs');
const html=fs.readFileSync('skill-test.html','utf8');
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{
  try{new Function(m[1]);console.log('Script',i+1,'OK');}
  catch(e){console.log('Script',i+1,'ERROR:',e.message);}
});
"
```
