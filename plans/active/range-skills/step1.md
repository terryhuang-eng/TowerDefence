# Step 1：skills.js — 新增 field_* 技能定義

## 目標
在 `SKILL_DEFS` 新增 6 個 field 系列技能，並更新 `getSkillDesc` switch-case。

## 影響範圍
- 檔案：`js/skills.js`
- 不改動 game.js（留給 step2）

## 具體修改

### 1. SKILL_DEFS 新增 field 群組（在 `zone_shred` 行後、`killGold` 行前）

```js
  // ── 塔：場效應類（field_*）——以塔為中心，對射程內所有敵人持續施加效果 ──
  field_slow  : { category: 'tower', group: 'field', name: '範圍減速場', defaults: {radius:2, chillStacks:40},        desc: '以塔為中心半徑 radius 格，範圍內所有敵人持續維持 chillStacks 層冰冷。離開後自然衰退。',     scoreBase: 25, scorePrimary: 'chillStacks', scoreRef: 40 },
  field_shred : { category: 'tower', group: 'field', name: '範圍碎甲場', defaults: {radius:2, shredStacks:15},        desc: '以塔為中心半徑 radius 格，範圍內所有敵人持續維持 shredStacks 層碎甲。',                     scoreBase: 35, scorePrimary: 'shredStacks', scoreRef: 15 },
  field_vuln  : { category: 'tower', group: 'field', name: '範圍易傷場', defaults: {radius:2, vulnStacks:10},         desc: '以塔為中心半徑 radius 格，範圍內所有敵人持續維持 vulnStacks 層易傷。',                     scoreBase: 35, scorePrimary: 'vulnStacks', scoreRef: 10 },
  field_stun  : { category: 'tower', group: 'field', name: '範圍暈眩脈衝', defaults: {radius:2, dur:0.8, cd:6},       desc: '每 cd 秒對塔周圍 radius 格內所有敵人暈眩 dur 秒。',                                         scoreBase: 50, scorePrimary: 'dur', scoreRef: 0.8 },
  field_burn  : { category: 'tower', group: 'field', name: '範圍灼燒場', defaults: {radius:2, dot:0.2, dur:3, interval:1}, desc: '每 interval 秒對塔周圍 radius 格內所有敵人施加/覆寫灼燒（dot×DPS，持續 dur 秒）。', scoreBase: 30, scorePrimary: 'dot', scoreRef: 0.2 },
  field_dmg   : { category: 'tower', group: 'field', name: '範圍傷害脈衝', defaults: {radius:2, flat:0.5, cd:2},      desc: '每 cd 秒對塔周圍 radius 格內所有敵人造成 flat×ATK 傷害（吃護甲）。',                       scoreBase: 40, scorePrimary: 'flat', scoreRef: 0.5 },
```

### 2. getSkillDesc switch-case 新增（在 zone_shred case 之後）

```js
      case 'field_slow':  return '🌀 範圍減速場：半徑 ' + p.radius + ' 格，維持 ' + p.chillStacks + ' 層冰冷';
      case 'field_shred': return '🟤 範圍碎甲場：半徑 ' + p.radius + ' 格，維持 ' + p.shredStacks + ' 層碎甲';
      case 'field_vuln':  return '🟣 範圍易傷場：半徑 ' + p.radius + ' 格，維持 ' + p.vulnStacks + ' 層易傷';
      case 'field_stun':  return '⚡ 範圍暈眩：半徑 ' + p.radius + ' 格，每 ' + p.cd + 's 暈眩 ' + p.dur + 's';
      case 'field_burn':  return '🔥 範圍灼燒：半徑 ' + p.radius + ' 格，每 ' + p.interval + 's 施加灼燒 ' + Math.round(p.dot*100) + '% ATK × ' + p.dur + 's';
      case 'field_dmg':   return '💥 範圍傷害：半徑 ' + p.radius + ' 格，每 ' + p.cd + 's 造成 ' + Math.round(p.flat*100) + '% ATK';
```

### 3. getSkillBrief 新增（若有 brief 函數，同步新增）
```js
      case 'field_slow':  return '減速場 r' + p.radius;
      case 'field_shred': return '碎甲場 r' + p.radius;
      case 'field_vuln':  return '易傷場 r' + p.radius;
      case 'field_stun':  return '暈眩脈衝 ' + p.dur + 's/cd' + p.cd;
      case 'field_burn':  return '灼燒場 r' + p.radius;
      case 'field_dmg':   return '傷害脈衝 r' + p.radius;
```

## 完成標準
- `SKILL_DEFS` 包含 field_slow / field_shred / field_vuln / field_stun / field_burn / field_dmg
- 每個有正確的 category / group / name / defaults / desc / scoreBase
- getSkillDesc switch 有 6 個新 case
- 不修改任何其他邏輯
