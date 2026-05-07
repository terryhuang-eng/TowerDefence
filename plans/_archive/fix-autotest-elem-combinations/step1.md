# Step 1: 補全 B 組缺失的 10 種混屬策略

## 目標
在 `autotest.js` STRATEGIES B 組補齊所有 15 種雙屬組合，目前只有 5 種。

## 影響範圍
- **檔案**：`autotest.js`
- **位置**：STRATEGIES 物件，`mix_thunder_fire` 定義結束後（約 111 行）
- **不影響**：升塔邏輯、AI、index.html

## 缺失的 10 種組合

### none 相關混屬（5 種）

```js
mix_fire_none: {
  name: '🔥⬜ 火無',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['fire', 'none', 'fire', 'none'],
},
mix_water_none: {
  name: '💧⬜ 水無',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['water', 'none', 'water', 'none'],
},
mix_earth_none: {
  name: '⛰️⬜ 土無',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['earth', 'none', 'earth', 'none'],
},
mix_wind_none: {
  name: '🌪️⬜ 風無',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['wind', 'none', 'wind', 'none'],
},
mix_thunder_none: {
  name: '⚡⬜ 雷無',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['thunder', 'none', 'thunder', 'none'],
},
```

### 非相鄰非 none 雙屬（5 種）

```js
mix_fire_earth: {
  name: '🔥⛰️ 火土',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['fire', 'earth', 'fire', 'earth'],
},
mix_fire_wind: {
  name: '🔥🌪️ 火風',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['fire', 'wind', 'fire', 'wind'],
},
mix_water_wind: {
  name: '💧🌪️ 水風',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['water', 'wind', 'water', 'wind'],
},
mix_water_thunder: {
  name: '💧⚡ 水雷',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['water', 'thunder', 'water', 'thunder'],
},
mix_earth_thunder: {
  name: '⛰️⚡ 土雷',
  group: 'B',
  towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
  elemPicks: ['earth', 'thunder', 'earth', 'thunder'],
},
```

## 插入位置
`autotest.js` 約 111 行，`mix_thunder_fire` 結束的 `},` 後面，`};` 結束 STRATEGIES 之前。

## 注意事項
- elemPicks 格式統一 `[baseElem, infuseElem, baseElem, infuseElem]`（交替 4 次）
- 對應的 INFUSION 路線：`INFUSIONS[baseElem][infuseElem].lv4` 需確認存在（均已在 towers.js 定義）
