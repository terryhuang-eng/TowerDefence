# Step 1：標準化 ELEM_BASE 數值

## 目標

修改 `js/towers.js` 的 `ELEM_BASE`，讓 6 種元素的箭底共用同一組基礎數值、砲底共用同一組基礎數值，差異只在 `skills`。

## 影響範圍

**檔案：js/towers.js**
**區塊：ELEM_BASE（L93-130）**

---

## 標準數值設計

### 設計邏輯

| 項目 | 依據 |
|------|------|
| 箭底 baseDPS | 目前 6 種箭底 baseDPS 平均 52，取中位略上 → 63 |
| 砲底 baseDPS | 目前 6 種砲底 baseDPS 平均 41，取中位 → 41.6；群體 ×3 = 124.8 |
| 箭底攻速 1.4 | 比 Lv2（1.9）低，移除「高攻速」優勢，讓技能才是高攻速的來源（ramp） |
| 砲底攻速 0.8 | 與現有砲底相近，保持「低速 AOE」定位 |
| 箭底 aoe 0 | 純單體，技能效果在單體上更突顯 |
| 砲底 aoe 1.0 | 中等 AOE，比 Lv2 砲（1.2）稍收，讓 Lv4+ 才有更強 AOE |

### 標準箭底 Lv3（6 種元素共用）

```js
damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0, cost: 130
baseDPS = 45 × 1.4 = 63.0
```

### 標準砲底 Lv3（6 種元素共用）

```js
damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130
baseDPS = 52 × 0.8 = 41.6  (單體)
       → × (1 + 2×1.0) = × 3 → 群體有效 = 124.8
```

---

## 修改後的 ELEM_BASE 完整規格

Skills 完全不動，只改 damage / atkSpd / range / aoe / desc：

```js
const ELEM_BASE = {
  fire: {
    arrow:  { name: '焰弓手', icon: '🏹🔥', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0,   cost: 130,
      desc: '灼燒射手（burn+ignite+detonate）',
      skills: [makeSkill('burn'), makeSkill('ignite'), makeSkill('detonate')] },
    cannon: { name: '焰砲台', icon: '💣🔥', damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130,
      desc: '灼燒範圍砲（AOE burn+ignite+detonate）',
      skills: [makeSkill('burn'), makeSkill('ignite'), makeSkill('detonate')] },
  },
  water: {
    arrow:  { name: '冰弓手', icon: '🏹💧', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0,   cost: 130,
      desc: '冰冷射手（chill 疊層減速）',
      skills: [makeSkill('chill')] },
    cannon: { name: '潮砲台', icon: '💣💧', damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130,
      desc: '冰冷範圍砲（AOE chill）',
      skills: [makeSkill('chill')] },
  },
  earth: {
    arrow:  { name: '岩射手', icon: '🏹⛰️', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0,   cost: 130,
      desc: '碎甲射手（shred）',
      skills: [makeSkill('shred')] },
    cannon: { name: '岩砲台', icon: '💣⛰️', damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130,
      desc: '碎甲範圍砲（AOE shred）',
      skills: [makeSkill('shred')] },
  },
  wind: {
    arrow:  { name: '風弓手', icon: '🏹🌪️', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0,   cost: 130,
      desc: '連攻加速射手（ramp）',
      skills: [makeSkill('ramp')] },
    cannon: { name: '風砲台', icon: '💣🌪️', damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130,
      desc: '連攻加速範圍砲（AOE ramp）',
      skills: [makeSkill('ramp')] },
  },
  thunder: {
    arrow:  { name: '雷弓手', icon: '🏹⚡', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0,   cost: 130,
      desc: '%HP 真傷射手（hpPct）',
      skills: [makeSkill('hpPct')] },
    cannon: { name: '雷砲台', icon: '💣⚡', damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130,
      desc: '%HP 真傷範圍砲（AOE hpPct）',
      skills: [makeSkill('hpPct')] },
  },
  none: {
    arrow:  { name: '虛空弓', icon: '🏹⬜', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0,   cost: 130,
      desc: '均衡無技能射手（純數值）',
      skills: [] },
    cannon: { name: '虛空砲', icon: '💣⬜', damage: 52, atkSpd: 0.8, range: 3.0, aoe: 1.0, cost: 130,
      desc: '均衡無技能範圍砲（純數值 AOE）',
      skills: [] },
  },
};
```

---

## 各技能在標準數值下的 eDPS 估算

標準敵人：HP 500，護甲 0%

### 箭底（baseDPS = 63，armorMult = 1.0，aoeTargets = 1）

| 元素 | 技能 | 計算 | eDPS |
|------|------|------|------|
| 無 | — | 63.0 | **63** |
| 風 | ramp(cap=0.5) | 63 × 1.25 | **79** |
| 土 | shred | 63 × 1.15 | **72** |
| 水 | chill | 63 × 1.25 | **79** |
| 雷 | hpPct(3%/every3) | 63 + 0.03×500/3×1.4=63+7 | **70** |
| 火 | burn+ignite+detonate | 63 + 0.30×45×3×1.4 + 0.20×45×1.4×0.5 + 0.80×45×1.4×0.3 = 63+56.7+6.3+15.1 | **141** |

### 砲底（baseDPS = 41.6，×3 aoeTargets = 124.8）

| 元素 | 技能 | 計算 | eDPS |
|------|------|------|------|
| 無 | — | 124.8 | **125** |
| 風 | ramp(cap=0.5) | 41.6×1.25×3 | **156** |
| 土 | shred | 41.6×1.15×3 | **144** |
| 水 | chill | 41.6×1.25×3 | **156** |
| 雷 | hpPct | (41.6+0.03×500/3×0.8)×3=(41.6+4)×3 | **137** |
| 火 | burn+ignite+detonate | (41.6 + 0.30×52×3×0.8+0.20×52×0.8×0.5+0.80×52×0.8×0.3)×3=(41.6+37.4+4.2+10)×3 | **282** |

---

## 火系過強的後續問題

標準化後火箭（141）vs 無箭（63）差距 2.2 倍，火砲（282）vs 無砲（125）差距 2.3 倍。

這個差距來自 burn+ignite+detonate 三個技能疊加。是否調整是獨立的平衡決策，在 step2 的技能調整面板中可以即時測試。

---

## 注意事項

- **TOWERS（L38-87）不動**：那是保留的元素參考，不影響遊戲
- **INFUSIONS / TRIPLE / PURE 不動**：它們的 lv4/lv5/lv6 基礎數值獨立定義
- **skills 不動**：只改數值，確保技能行為不變
- **升塔成本不變**：cost 仍為 130g
