# Step 1：js/skills.js — GLOBAL_CAPS + display 修正

## 目標檔案
`js/skills.js`

## 修改 1：GLOBAL_CAPS 新增 chillDecayRate

位置：行 9（`chillMaxStacks` 之後）

舊：
```
chillMaxStacks: 38,  // = ceil(slowPct / chillPerStack)，達上限需要的層數
```
新：
```
chillMaxStacks: 38,  // = ceil(slowPct / chillPerStack)，達上限需要的層數
chillDecayRate: 5,   // 冰冷衰減速率：每秒 -N 層
```

---

## 修改 2：skillDesc chill display（行 116）

舊：
```js
case 'chill':    return '❄️ 冰冷：每攻擊 -' + Math.round(p.perStack * 100) + '% 速度（最多 ' + p.cap + ' 層）';
```
新：
```js
case 'chill':    return '❄️ 冰冷：每攻擊 +' + (p.stacksPerHit||1) + ' 層（衰減 ' + GLOBAL_CAPS.chillDecayRate + ' 層/秒，全域每層 -2%）';
```

---

## 修改 3：short desc chill（行 165）

舊：
```js
case 'chill':    return '冰冷' + Math.round(p.perStack * 100) + '%×' + p.cap;
```
新：
```js
case 'chill':    return '冰冷 +' + (p.stacksPerHit||1) + '層';
```
