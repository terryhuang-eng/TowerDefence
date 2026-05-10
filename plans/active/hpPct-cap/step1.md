# Step 1：水×水 Lv4 + 純水 Lv5 hpPct 補 cap:120

## 目標
在 `js/towers.js` 兩處 hpPct makeSkill 補上 `cap:120`，消除與純水 Lv6 及其他塔的不一致。

## 影響範圍
- 唯一修改：`js/towers.js` 2 行（各加 `,cap:120`）
- 不影響：game.js、skills.js、其他塔

## 具體修改

### 修改 1：水×水 Lv4（INFUSIONS[water][water].lv4）

```js
// 修改前
skills: [makeSkill('chill',{stacksPerHit:8}), makeSkill('hpPct',{pct:0.04,every:2,cd:0})]

// 修改後
skills: [makeSkill('chill',{stacksPerHit:8}), makeSkill('hpPct',{pct:0.04,every:2,cd:0,cap:120})]
```

### 修改 2：純水 Lv5（PURE_TOWERS[water].lv5）

```js
// 修改前
skills: [makeSkill('chill',{stacksPerHit:12}), makeSkill('hpPct',{pct:0.04,every:2,cd:0})]

// 修改後
skills: [makeSkill('chill',{stacksPerHit:12}), makeSkill('hpPct',{pct:0.04,every:2,cd:0,cap:120})]
```

## 定位流程（執行時必做）
1. `Grep "hpPct.*every:2.*cd:0\}"` → 找到無 cap 的兩行（應命中且僅命中這兩處）
2. `Read ±2 行` 確認分別是水×水 Lv4 和純水 Lv5
3. 兩次 `Edit` 各加 `,cap:120`

## 驗收
- `Grep "hpPct.*every:2.*cd:0\}"` 應回傳 0 筆（兩處都已補 cap）
- `Grep "hpPct.*cd:0,cap:120"` 應命中 2 筆（水×水 Lv4 + 純水 Lv5）
