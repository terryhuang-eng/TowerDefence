# Step 2：js/game.js — chillDecayRate hardcode 換成 GLOBAL_CAPS

## 目標檔案
`js/game.js`

## 定位

Grep: `chillDecay \* 5` 或 `decayStacks` 找行號（約 2594）

## 修改

舊（約行 2594）：
```js
const decayStacks = Math.floor(e.chillDecay * 5);
```
新：
```js
const decayStacks = Math.floor(e.chillDecay * GLOBAL_CAPS.chillDecayRate);
```

同一區塊下一行（約 2598）：
舊：
```js
e.chillDecay -= decayStacks / 5;
```
新：
```js
e.chillDecay -= decayStacks / GLOBAL_CAPS.chillDecayRate;
```

## 注意
只改這兩處，不動其他 chill 邏輯。
