# zone-score-fix / step2 — zone 拆分為 zone_slow + zone_shred

## 設計決策

將 `zone` 拆成兩個獨立技能，讓參數語義直接對應效果。

### 改前
```js
zone: { defaults: {radius:1.5, effect:"slow", value:0.2} }
// value 語義不明：0.2 = 20%，但換算分母視 effect 而異
```

### 改後
```js
zone_slow:  { defaults: {radius:1.5, chillStacks:40} }
// chillStacks:40 = 圓圈內維持 40 層冰冷 = 20% 減速（直接對應 e.chillStacks）

zone_shred: { defaults: {radius:1.5, shredStacks:10} }
// shredStacks:10 = 圓圈內維持 10 層碎甲 = 20% 穿甲（直接對應 e.shredStacks）
```

---

## 影響範圍

| 檔案 | 改動 |
|------|------|
| `js/skills.js` | 移除 `zone`，新增 `zone_slow` + `zone_shred` |
| `js/game.js` | zone 建立邏輯改讀 `zone_slow` / `zone_shred`（2885-2891） |
| `js/towers.js` | 7 處 `makeSkill('zone',...)` → `makeSkill('zone_slow',{radius:1.5, chillStacks:40})` |
| `skill-editor.html` | `getSkillDesc`/`getSkillBrief` 的 zone case 更新 |

---

## 各檔案具體修改

### skills.js — 移除 zone，新增兩個

```js
// 移除：
// zone: { ... scoreBase: 25, scorePrimary: null ... }

// 新增：
zone_slow:  {
  category: 'tower', group: 'special', name: '減速領域',
  defaults: {radius:1.5, chillStacks:40},
  desc: '命中後在目標位置留下圓圈（半徑 radius 格，持續 3 秒），圓圈內敵人冰冷層數維持在 chillStacks',
  scoreBase: 20, scorePrimary: 'chillStacks', scoreRef: 40,
  scoreFactors: [{param:'radius', ref:1.5}]
},
zone_shred: {
  category: 'tower', group: 'special', name: '碎甲領域',
  defaults: {radius:1.5, shredStacks:10},
  desc: '命中後在目標位置留下圓圈（半徑 radius 格，持續 3 秒），圓圈內敵人碎甲層數維持在 shredStacks',
  scoreBase: 30, scorePrimary: 'shredStacks', scoreRef: 10,
  scoreFactors: [{param:'radius', ref:1.5}]
},
```

**評分依據**：
- 基準（radius:1.5）下，slow 20 分 / shred 30 分（shred 強於 slow）
- 與 step1 的 scorePrimary/scoreFactors 框架一致

### game.js — 建立 zone 物件（約 2881-2891）

```js
// 現況
const zoneSk = getSkill(tw, 'zone');
if (zoneSk) {
  this.zones.push({
    x:tp.x, y:tp.y, r:zoneSk.radius, type:'puddle',
    slowAmt: zoneSk.effect === 'slow' ? zoneSk.value : 0,
    shredTarget: zoneSk.effect === 'shred' ? Math.round(zoneSk.value / GLOBAL_CAPS.shredPerStack) : 0,
    dur:3, t:0
  });
}

// 改為
const zSlowSk  = getSkill(tw, 'zone_slow');
const zShredSk = getSkill(tw, 'zone_shred');
if (zSlowSk) {
  this.zones.push({
    x:tp.x, y:tp.y, r:zSlowSk.radius, type:'puddle',
    slowAmt: zSlowSk.chillStacks,    // 直接是層數，不需換算
    shredTarget: 0,
    dur:3, t:0
  });
}
if (zShredSk) {
  this.zones.push({
    x:tp.x, y:tp.y, r:zShredSk.radius, type:'puddle',
    slowAmt: 0,
    shredTarget: zShredSk.shredStacks,  // 直接是層數，不需換算
    dur:3, t:0
  });
}
```

### towers.js — 7 處替換

```js
// 全部：
makeSkill('zone',{radius:1.5, effect:"slow", value:0.2})
// 改為：
makeSkill('zone_slow',{radius:1.5, chillStacks:40})
```

### skill-editor.html — desc/brief case 更新

```js
// 現況（約 130+ 行）
case 'zone': return '🟣 領域：半徑 ' + p.radius + '（' + p.effect + ' ' + p.value + '）';

// 改為（兩個 case）
case 'zone_slow':  return '🔵 減速領域：半徑 ' + p.radius + '，冰冷 ' + p.chillStacks + ' 層';
case 'zone_shred': return '🟤 碎甲領域：半徑 ' + p.radius + '，碎甲 ' + p.shredStacks + ' 層';
```

---

## 執行順序建議

step1（skills.js 評分）可單獨執行。
step2 需要同時動 4 個檔案，建議一次執行完（否則中間狀態會報錯）。
