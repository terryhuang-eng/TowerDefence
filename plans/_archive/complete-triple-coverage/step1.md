# Step 1: 新增 15 種缺失的 C 組三屬策略

## 目標
在 autotest.js STRATEGIES 物件的 C 組段落，新增 15 個缺失的三屬策略，使全部 20 種 TRIPLE_TOWERS 都有對應測試。

## 影響範圍
- **檔案**：`autotest.js`
- **位置**：STRATEGIES 物件，C 組最後一個策略 `triple_earth_fire_thunder` 之後
- **不影響**：A 組、B 組策略、Bot 升塔邏輯、game.js

## elemPicks 設計原則

格式：`[base, infuse, third, base]`（第 4 pick 重複 base，給予 Lv6 純屬可能性）

- `base` → picks[0]：決定 Lv3 元素塔底（ELEM_BASE[base]）
- `infuse` → picks[1]：決定 Lv4 注入（INFUSIONS[base][infuse]）
- `third` → picks[2]：決定 Lv5 第三元素（TRIPLE_TOWERS key）
- 三個元素排序後 join('_') 必須吻合 TRIPLE_TOWERS 的 key

## 待新增的 15 個策略

### 非無 ×5（missing from 10 non-none triples）

| Strategy ID | 塔名 | TRIPLE_TOWERS key | elemPicks | base→infuse Lv4 塔 |
|-------------|------|-------------------|-----------|-------------------|
| `triple_fire_thunder_water` | 間歇塔 🌋 | `fire_thunder_water` | `['fire', 'water', 'thunder', 'fire']` | INFUSIONS[fire][water] = 蒸汽塔 |
| `triple_earth_fire_wind` | 熔爐塔 🏭 | `earth_fire_wind` | `['earth', 'fire', 'wind', 'earth']` | INFUSIONS[earth][fire] = 熔蝕塔 |
| `triple_fire_thunder_wind` | 雷焰塔 ⚡🔥 | `fire_thunder_wind` | `['fire', 'thunder', 'wind', 'fire']` | INFUSIONS[fire][thunder] = 電漿塔 |
| `triple_earth_water_wind` | 沼澤塔 🌿 | `earth_water_wind` | `['earth', 'water', 'wind', 'earth']` | INFUSIONS[earth][water] = 泥沼塔 |
| `triple_earth_thunder_water` | 腐蝕塔 ☠️ | `earth_thunder_water` | `['earth', 'thunder', 'water', 'earth']` | INFUSIONS[earth][thunder] = 震盪塔 |

### 反克制 ×5（none + X + 克X）

| Strategy ID | 塔名 | TRIPLE_TOWERS key | elemPicks | base→infuse Lv4 塔 |
|-------------|------|-------------------|-----------|-------------------|
| `triple_fire_none_thunder` | 逆風塔 🌬️ | `fire_none_thunder` | `['fire', 'none', 'thunder', 'fire']` | INFUSIONS[fire][none] = 混沌焰 |
| `triple_fire_none_water` | 逆雷塔 🔌 | `fire_none_water` | `['fire', 'none', 'water', 'fire']` | INFUSIONS[fire][none] = 混沌焰 |
| `triple_earth_none_water` | 逆焰塔 🧊 | `earth_none_water` | `['earth', 'none', 'water', 'earth']` | INFUSIONS[earth][none] = 重力塔 |
| `triple_earth_none_wind` | 逆潮塔 🏜️ | `earth_none_wind` | `['earth', 'none', 'wind', 'earth']` | INFUSIONS[earth][none] = 重力塔 |
| `triple_none_thunder_wind` | 逆岩塔 💨 | `none_thunder_wind` | `['thunder', 'wind', 'none', 'thunder']` | INFUSIONS[thunder][wind] = 雷暴塔 |

### 非相鄰無 ×5

| Strategy ID | 塔名 | TRIPLE_TOWERS key | elemPicks | base→infuse Lv4 塔 |
|-------------|------|-------------------|-----------|-------------------|
| `triple_earth_fire_none` | 隕石塔 ☄️ | `earth_fire_none` | `['fire', 'earth', 'none', 'fire']` | INFUSIONS[fire][earth] = 熔蝕塔 |
| `triple_fire_none_wind` | 燎原塔 🔥🌪️ | `fire_none_wind` | `['fire', 'wind', 'none', 'fire']` | INFUSIONS[fire][wind] = 焰息塔 |
| `triple_none_water_wind` | 迷霧塔 🌫️ | `none_water_wind` | `['water', 'wind', 'none', 'water']` | INFUSIONS[water][wind] = 暴雨塔 |
| `triple_none_thunder_water` | 吞噬塔 🕳️ | `none_thunder_water` | `['thunder', 'water', 'none', 'thunder']` | INFUSIONS[thunder][water] = 感電塔 |
| `triple_earth_none_thunder` | 混沌塔 🎲 | `earth_none_thunder` | `['earth', 'none', 'thunder', 'earth']` | INFUSIONS[earth][none] = 重力塔 |

## key 驗證（JavaScript .sort() 字典序）

```
[fire, water, thunder].sort()  → ['fire', 'thunder', 'water'] → fire_thunder_water ✓
[earth, fire, wind].sort()     → ['earth', 'fire', 'wind']    → earth_fire_wind ✓
[fire, thunder, wind].sort()   → ['fire', 'thunder', 'wind']  → fire_thunder_wind ✓
[earth, water, wind].sort()    → ['earth', 'water', 'wind']   → earth_water_wind ✓
[earth, thunder, water].sort() → ['earth', 'thunder', 'water']→ earth_thunder_water ✓

[fire, none, thunder].sort()   → ['fire', 'none', 'thunder']  → fire_none_thunder ✓
[fire, none, water].sort()     → ['fire', 'none', 'water']    → fire_none_water ✓
[earth, none, water].sort()    → ['earth', 'none', 'water']   → earth_none_water ✓
[earth, none, wind].sort()     → ['earth', 'none', 'wind']    → earth_none_wind ✓
[thunder, wind, none].sort()   → ['none', 'thunder', 'wind']  → none_thunder_wind ✓

[fire, earth, none].sort()     → ['earth', 'fire', 'none']    → earth_fire_none ✓
[fire, wind, none].sort()      → ['fire', 'none', 'wind']     → fire_none_wind ✓
[water, wind, none].sort()     → ['none', 'water', 'wind']    → none_water_wind ✓
[thunder, water, none].sort()  → ['none', 'thunder', 'water'] → none_thunder_water ✓
[earth, none, thunder].sort()  → ['earth', 'none', 'thunder'] → earth_none_thunder ✓
```

## 注意事項

1. **反克制組中，火底 none 注入出現 3 次**（fire_none_thunder / fire_none_water / fire_none_wind）
   - 三個策略的 Lv4 塔都是「混沌焰 🔥⬜」，差別在 Lv5 third 元素不同
   - 測試結果會顯示相同 Lv4 塔名，但 Lv5 應不同

2. **`triple_none_thunder_wind` 的 base 是 thunder，infuse 是 wind**
   - 這使 Lv4 走 INFUSIONS[thunder][wind] = 雷暴塔
   - none 作為 third 元素，三屬 key = none_thunder_wind ✓

3. **新增位置**：緊接現有 C 組最後一個策略 `triple_earth_fire_thunder` 之後，保持結構一致

## 新增程式碼片段（在 `triple_earth_fire_thunder` 後插入）

```js
    // ═══ C 組：三屬 非無 補完（5 種）═══
    triple_fire_thunder_water: {
      name: '🌋 間歇（火水雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'water', 'thunder', 'fire'],
    },
    triple_earth_fire_wind: {
      name: '🏭 熔爐（土火風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'fire', 'wind', 'earth'],
    },
    triple_fire_thunder_wind: {
      name: '⚡🔥 雷焰（火雷風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'thunder', 'wind', 'fire'],
    },
    triple_earth_water_wind: {
      name: '🌿 沼澤（土水風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'water', 'wind', 'earth'],
    },
    triple_earth_thunder_water: {
      name: '☠️ 腐蝕（土雷水）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'thunder', 'water', 'earth'],
    },
    // ═══ C 組：三屬 反克制（含 none）×5 ═══
    triple_fire_none_thunder: {
      name: '🌬️ 逆風（火無雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'none', 'thunder', 'fire'],
    },
    triple_fire_none_water: {
      name: '🔌 逆雷（火無水）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'none', 'water', 'fire'],
    },
    triple_earth_none_water: {
      name: '🧊 逆焰（土無水）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'water', 'earth'],
    },
    triple_earth_none_wind: {
      name: '🏜️ 逆潮（土無風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'wind', 'earth'],
    },
    triple_none_thunder_wind: {
      name: '💨 逆岩（雷風無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'wind', 'none', 'thunder'],
    },
    // ═══ C 組：三屬 非相鄰無 ×5 ═══
    triple_earth_fire_none: {
      name: '☄️ 隕石（火土無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'earth', 'none', 'fire'],
    },
    triple_fire_none_wind: {
      name: '🔥🌪️ 燎原（火風無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'wind', 'none', 'fire'],
    },
    triple_none_water_wind: {
      name: '🌫️ 迷霧（水風無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'wind', 'none', 'water'],
    },
    triple_none_thunder_water: {
      name: '🕳️ 吞噬（雷水無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'water', 'none', 'thunder'],
    },
    triple_earth_none_thunder: {
      name: '🎲 混沌（土無雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'thunder', 'earth'],
    },
```
