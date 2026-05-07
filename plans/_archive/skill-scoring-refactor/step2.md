# step2 — shred/vulnerability 改為疊層模型

## 目標

將 shred / vulnerability 從「timer + 絕對值」改為「stacksPerHit + 全域衰減」，對齊 chill 架構。

**改前問題**：
- Lv4(dur:3) 和 Lv5(dur:5) 同時命中同一個敵人時，timer 互相覆蓋，行為不一致
- 技能 cap 參數是死參數（game.js 從未使用，用全域上限代替）
- dur 無法納入評分（不同等級同時存在時沒有意義）

**改後**：所有問題消失，語義與 chill 完全一致。

---

## 影響檔案：4 個

1. `js/skills.js` — GLOBAL_CAPS 新增 + SKILL_DEFS 修改 + 描述函數更新
2. `js/game.js` — enemy 初始狀態、命中處理、衰減、傷害計算、Tooltip（共 7 處）
3. `js/towers.js` — 所有 makeSkill('shred',...) / makeSkill('vulnerability',...)（約 20+ 處）
4. `skill-editor.html` — 如有 shred/vuln 相關顯示邏輯需確認

---

## 改動一：skills.js — GLOBAL_CAPS 新增

在 `chillDecayRate` 後面追加，並移除舊的上限定義：

```js
// 新增（緊接 chill 全域參數）
shredPerStack:  0.02,   // 每層 -2% 護甲穿透（同 chillPerStack，對稱設計）
shredMaxStacks: 37,     // 上限 37 層 = 74%
shredDecayRate: 1.5,    // 每秒 -1.5 層（比 chill 2.5 慢，符合土系持久特性）
vulnPerStack:   0.02,   // 每層 +2% 易傷（同上）
vulnMaxStacks:  37,
vulnDecayRate:  1.5,

// 移除（由上面取代）：
// armorShred: 0.75,
// vulnerability: 0.75,
```

---

## 改動二：skills.js — SKILL_DEFS 修改

```js
// 舊
shred: {
  defaults: { amt:0.05, dur:3, cap:0.5 },
  desc: '護甲 -amt，持續 dur 秒',
  scoreBase: 25, scorePrimary: 'amt', scoreRef: 0.05
}

// 新
shred: {
  defaults: { stacksPerHit:2 },
  desc: '每次攻擊疊 stacksPerHit 層，全域每層 -shredPerStack% 護甲（上限 shredMaxStacks 層，衰減 shredDecayRate 層/秒）',
  scoreBase: 25, scorePrimary: 'stacksPerHit', scoreRef: 1
}

// 舊
vulnerability: {
  defaults: { amt:0.05, dur:3, cap:0.5 },
  desc: '受傷 +amt，持續 dur 秒',
  scoreBase: 25, scorePrimary: 'amt', scoreRef: 0.05
}

// 新
vulnerability: {
  defaults: { stacksPerHit:2 },
  desc: '每次攻擊疊 stacksPerHit 層，全域每層 +vulnPerStack% 易傷（上限 vulnMaxStacks 層）',
  scoreBase: 25, scorePrimary: 'stacksPerHit', scoreRef: 1
}
```

---

## 改動三：skills.js — getSkillDesc / getSkillBrief

```js
// getSkillDesc
case 'shred':
  return `🔩 碎甲：每攻 +${p.stacksPerHit} 層（全域每層 -${GLOBAL_CAPS.shredPerStack * 100}%，衰減 ${GLOBAL_CAPS.shredDecayRate}/s）`;
case 'vulnerability':
  return `💔 易傷：每攻 +${p.stacksPerHit} 層（全域每層 +${GLOBAL_CAPS.vulnPerStack * 100}%，衰減 ${GLOBAL_CAPS.vulnDecayRate}/s）`;

// getSkillBrief
case 'shred':        return `碎甲+${p.stacksPerHit}層`;
case 'vulnerability': return `易傷+${p.stacksPerHit}層`;
```

---

## 改動四：game.js — enemy 初始狀態（約 line 1856）

```js
// 舊
shredAmount: 0, shredTimer: 0,
vulnAmount:  0, vulnTimer:  0,

// 新
shredStacks: 0, shredDecay: 0,
vulnStacks:  0, vulnDecay:  0,
```

---

## 改動五：game.js — 命中處理（約 line 2468）

```js
// 舊
const shredSk = getSkill(tower, 'shred');
if (shredSk) {
  enemy.shredAmount = Math.min(GLOBAL_CAPS.armorShred, (enemy.shredAmount || 0) + shredSk.amt);
  enemy.shredTimer = shredSk.dur;
}
const vulnSk = getSkill(tower, 'vulnerability');
if (vulnSk) {
  enemy.vulnAmount = Math.min(GLOBAL_CAPS.vulnerability, (enemy.vulnAmount || 0) + vulnSk.amt);
  enemy.vulnTimer = vulnSk.dur;
}

// 新（與 chill 處理邏輯完全一致）
const shredSk = getSkill(tower, 'shred');
if (shredSk) {
  enemy.shredStacks = Math.min(GLOBAL_CAPS.shredMaxStacks, (enemy.shredStacks || 0) + (shredSk.stacksPerHit || 1));
  enemy.shredDecay = 0;  // 重置衰減計時（被打到就重新開始衰減）
}
const vulnSk = getSkill(tower, 'vulnerability');
if (vulnSk) {
  enemy.vulnStacks = Math.min(GLOBAL_CAPS.vulnMaxStacks, (enemy.vulnStacks || 0) + (vulnSk.stacksPerHit || 1));
  enemy.vulnDecay = 0;
}
```

---

## 改動六：game.js — 衰減（約 line 2645）

```js
// 舊
if (e.shredTimer > 0) { e.shredTimer -= dt; if (e.shredTimer <= 0) e.shredAmount = 0; }
if (e.vulnTimer  > 0) { e.vulnTimer  -= dt; if (e.vulnTimer  <= 0) e.vulnAmount  = 0; }

// 新（與 chill 衰減邏輯完全一致）
if (e.shredStacks > 0) {
  e.shredDecay = (e.shredDecay || 0) + dt;
  const sd = Math.floor(e.shredDecay * GLOBAL_CAPS.shredDecayRate);
  if (sd > 0) { e.shredStacks = Math.max(0, e.shredStacks - sd); e.shredDecay -= sd / GLOBAL_CAPS.shredDecayRate; }
}
if (e.vulnStacks > 0) {
  e.vulnDecay = (e.vulnDecay || 0) + dt;
  const vd = Math.floor(e.vulnDecay * GLOBAL_CAPS.vulnDecayRate);
  if (vd > 0) { e.vulnStacks = Math.max(0, e.vulnStacks - vd); e.vulnDecay -= vd / GLOBAL_CAPS.vulnDecayRate; }
}
```

---

## 改動七：game.js — 傷害計算（約 line 2372 / 2380）

```js
// 舊
armor = Math.max(0, armor - (enemy.shredAmount || 0));
// ...
if (enemy.vulnAmount > 0) dmg *= (1 + enemy.vulnAmount);

// 新
const shredAmt = (enemy.shredStacks || 0) * GLOBAL_CAPS.shredPerStack;
armor = Math.max(0, armor - shredAmt);
// ...
const vulnAmt = (enemy.vulnStacks || 0) * GLOBAL_CAPS.vulnPerStack;
if (vulnAmt > 0) dmg *= (1 + vulnAmt);
```

---

## 改動八：game.js — Tooltip 顯示（約 line 2275）

```js
// 舊（搜尋 shredAmount）
if (enemy.shredAmount > 0) statusHtml += `...碎甲...`;

// 新（對齊 chill tooltip 格式）
if (enemy.shredStacks > 0) {
  statusHtml += `<span style="color:#fa8">🔩碎甲${enemy.shredStacks}層（-${Math.round(enemy.shredStacks * GLOBAL_CAPS.shredPerStack * 100)}%）</span> `;
}
if (enemy.vulnStacks > 0) {
  statusHtml += `<span style="color:#f88">💔易傷${enemy.vulnStacks}層（+${Math.round(enemy.vulnStacks * GLOBAL_CAPS.vulnPerStack * 100)}%）</span> `;
}
```

---

## 改動九：towers.js — 參數換算

**換算公式**：`stacksPerHit = round(原 amt / shredPerStack)` = `round(amt / 0.02)`

| 原 `makeSkill('shred', {amt, dur, cap})` | 新 `makeSkill('shred', {stacksPerHit})` |
|------------------------------------------|----------------------------------------|
| `{amt:0.04, dur:3, cap:0.4}` | `{stacksPerHit:2}` |
| `{amt:0.05, dur:3, cap:0.3}` | `{stacksPerHit:3}` |
| `{amt:0.05, dur:4, cap:0.4}` | `{stacksPerHit:3}` |
| `{amt:0.06, dur:3, cap:0.4}` | `{stacksPerHit:3}` |
| `{amt:0.06, dur:4, cap:0.5}` | `{stacksPerHit:3}` |
| `{amt:0.08, dur:3, cap:0.4}` | `{stacksPerHit:4}` |
| `{amt:0.08, dur:4, cap:0.5}` | `{stacksPerHit:4}` |
| `{amt:0.10, dur:5, cap:0.5}` | `{stacksPerHit:5}` |
| `{amt:0.12, dur:5, cap:0.6}` | `{stacksPerHit:6}` |

vulnerability 同 shred，相同換算。

---

## 執行前 Grep 確認清單

執行前先確認所有需要改動的位置：
```
Grep "shredAmount"     → game.js（應有 4 處）
Grep "shredTimer"      → game.js（應有 2 處）
Grep "vulnAmount"      → game.js（應有 3 處）
Grep "vulnTimer"       → game.js（應有 2 處）
Grep "armorShred"      → skills.js, game.js（移除/取代）
Grep 'shred'           → towers.js（約 20+ 處）
Grep 'vulnerability'   → towers.js（約 10+ 處）
```
