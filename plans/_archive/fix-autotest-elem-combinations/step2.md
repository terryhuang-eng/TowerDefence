# Step 2: 新增 C 組三屬代表性策略

## 目標
新增 `group: 'C'`，覆蓋代表性 TRIPLE_TOWERS 路線，使 Lv5 三屬塔能被 autotest 測到。

## 影響範圍
- **檔案 1**：`autotest.js` — STRATEGIES 新增 C 組、runGroup/runAll 加入 C 組
- **檔案 2**：`index.html` — autotest 面板新增 `autotest-c` 按鈕

## 三屬策略的 elemPicks 規則
需要 3 種不同元素且各有至少 1 個 pick，才能走 TRIPLE_TOWERS Lv5：
- 格式：`[elemA, elemB, elemC, elemA]` → elemA=2, elemB=1, elemC=1

## 新增 5 個代表性策略

```js
// ═══ C 組：三屬代表（5 種）═══
triple_fire_water_earth: {
  name: '♨️ 溫泉（火水土）',
  group: 'C',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['fire', 'water', 'earth', 'fire'],
  // 對應：TRIPLE_TOWERS['earth_fire_water'] 溫泉塔
},
triple_fire_water_wind: {
  name: '🌀 颶風（火水風）',
  group: 'C',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['fire', 'water', 'wind', 'fire'],
  // 對應：TRIPLE_TOWERS['fire_water_wind'] 颶風塔
},
triple_earth_thunder_wind: {
  name: '🧲 磁力（土雷風）',
  group: 'C',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['earth', 'thunder', 'wind', 'earth'],
  // 對應：TRIPLE_TOWERS['earth_thunder_wind'] 磁力塔
},
triple_water_thunder_wind: {
  name: '⛈️ 暴風（水雷風）',
  group: 'C',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['water', 'thunder', 'wind', 'water'],
  // 對應：TRIPLE_TOWERS['thunder_water_wind'] 暴風塔
},
triple_earth_fire_thunder: {
  name: '🌋 火山（土火雷）',
  group: 'C',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['earth', 'fire', 'thunder', 'earth'],
  // 對應：TRIPLE_TOWERS['earth_fire_thunder'] 火山塔
},
```

## runGroup / runAll 修改

`runGroup` 的 `groupName` 需加 C 組判斷：
```js
const groupName = group === 'A' ? '經濟分配' : group === 'B' ? '塔型強度' : '三屬組合';
```

`runAll` 的 `bIds` 改為 B+C 合併，或分別收集後分組顯示。

## index.html 新增按鈕

在 autotest 面板的按鈕區加入：
```html
<button id="autotest-c">C 三屬</button>
```

並在 `bindTestBtn` 區塊加入：
```js
bindTestBtn('autotest-c', () => AutoTest.runGroup('C'));
```

`btnIds` 陣列和 `btnLabels` 物件也需加入 `'autotest-c': 'C 三屬'`。
