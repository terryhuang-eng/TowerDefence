# Step 1：skills.js — 新增 cycle_* 技能定義

## 目標
在 `SKILL_DEFS` 新增 5 個 cycle_* 攻速同步型技能，並更新 `getSkillDesc` switch-case。

## 影響範圍
- 檔案：`js/skills.js`
- 不改動 game.js（留給 step2）

## 具體修改

### 1. SKILL_DEFS 新增 cycle 群組（在 field_* 群組之後，或 killGold 行前）

若 field_* 尚未合入（range-skills 計畫未執行），可插在 `killGold` 之前。

```js
  // ── 塔：攻速同步型（cycle_*）——每次攻擊冷卻完成且有目標時，對範圍內所有敵人施加效果 ──
  cycle_stun  : { category: 'tower', group: 'cycle', name: '攻速暈眩', defaults: {radius:2, dur:0.6},           desc: '每次攻擊時，塔周圍 radius 格內所有敵人暈眩 dur 秒（dur 上限 2.0s）。需有攻擊目標才觸發。', scoreBase: 45, scorePrimary: 'dur', scoreRef: 0.6 },
  cycle_chill : { category: 'tower', group: 'cycle', name: '攻速冰冷', defaults: {radius:2, stacksPerCycle:5}, desc: '每次攻擊時，塔周圍 radius 格內所有敵人疊 stacksPerCycle 層冰冷。', scoreBase: 20, scorePrimary: 'stacksPerCycle', scoreRef: 5 },
  cycle_shred : { category: 'tower', group: 'cycle', name: '攻速碎甲', defaults: {radius:2, stacksPerCycle:3}, desc: '每次攻擊時，塔周圍 radius 格內所有敵人疊 stacksPerCycle 層碎甲。', scoreBase: 25, scorePrimary: 'stacksPerCycle', scoreRef: 3 },
  cycle_vuln  : { category: 'tower', group: 'cycle', name: '攻速易傷', defaults: {radius:2, stacksPerCycle:2}, desc: '每次攻擊時，塔周圍 radius 格內所有敵人疊 stacksPerCycle 層易傷。', scoreBase: 25, scorePrimary: 'stacksPerCycle', scoreRef: 2 },
  cycle_burn  : { category: 'tower', group: 'cycle', name: '攻速灼燒', defaults: {radius:2, dot:0.2, dur:3},   desc: '每次攻擊時，塔周圍 radius 格內所有敵人施加/覆寫灼燒（dot×DPS，持續 dur 秒）。', scoreBase: 28, scorePrimary: 'dot', scoreRef: 0.2 },
```

### 2. getSkillDesc switch-case 新增（在 field_* case 之後，或 zone_shred 之後）

```js
      case 'cycle_stun':  return '⚡ 攻速暈眩：半徑 ' + p.radius + ' 格，每次攻擊暈眩 ' + p.dur + 's';
      case 'cycle_chill': return '❄️ 攻速冰冷：半徑 ' + p.radius + ' 格，每次攻擊 +' + p.stacksPerCycle + ' 層冰冷';
      case 'cycle_shred': return '🔩 攻速碎甲：半徑 ' + p.radius + ' 格，每次攻擊 +' + p.stacksPerCycle + ' 層碎甲';
      case 'cycle_vuln':  return '💔 攻速易傷：半徑 ' + p.radius + ' 格，每次攻擊 +' + p.stacksPerCycle + ' 層易傷';
      case 'cycle_burn':  return '🔥 攻速灼燒：半徑 ' + p.radius + ' 格，每次攻擊施加灼燒 ' + Math.round(p.dot*100) + '% ATK × ' + p.dur + 's';
```

### 3. getSkillBrief 同步新增（若有）

```js
      case 'cycle_stun':  return '攻速暈眩 ' + p.dur + 's';
      case 'cycle_chill': return '攻速冰冷 ×' + p.stacksPerCycle;
      case 'cycle_shred': return '攻速碎甲 ×' + p.stacksPerCycle;
      case 'cycle_vuln':  return '攻速易傷 ×' + p.stacksPerCycle;
      case 'cycle_burn':  return '攻速灼燒 r' + p.radius;
```

## 完成標準
- SKILL_DEFS 包含 5 個 cycle_* 技能，group 為 'cycle'
- 每個有正確 defaults / desc / scoreBase
- getSkillDesc 有 5 個新 case
- 不修改 game.js
