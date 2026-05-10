# Step 1：建立測試框架（skill-test.html）

## 目標
建立 `skill-test.html`，包含：
1. MockGame 類別（最小化 doDmg 執行環境）
2. 測試工具函數（assert, assertEqual, assertRange）
3. 測試執行器與 HTML 結果展示

## 影響範圍
- 新建 `skill-test.html`（專案根目錄）
- 不修改任何現有檔案

## 依賴 JS 載入順序
```html
<script src="js/skills.js"></script>   <!-- SKILL_DEFS, GLOBAL_CAPS, makeSkill, getSkill, hasSkill -->
<script src="js/config.js"></script>   <!-- CONFIG.elemAdv -->
<!-- 不載入 game.js，改用 MockGame -->
```

## MockGame 規格

```js
class MockGame {
  constructor() {
    this.hp = 40; this.maxHp = 40; this.gold = 200;
    this.towers = [];
    this.enemies = [];
    this.zones = [];
    this.effects = [];
    this.addBattleLog = () => {};
  }

  // 複製自 game.js Game.prototype.doDmg
  // 保持邏輯完全一致，只移除 SANDBOX/fireDmg 追蹤（與正確性無關）
  doDmg(enemy, baseDmg, elem, tower) { ... }

  // 複製自 game.js 的敵人 tick 邏輯（用於測試 DOT/衰減）
  // tickEnemy(enemy, dt) — 只含 burn/chill decay/shred decay/vuln decay/regen
  tickEnemy(enemy, dt) { ... }

  // 觸發 field/cycle 的每幀更新（用於測試場效應）
  // tickTowers(dt) — 只含 aura 預計算 + field_* + cycle_*
  tickTowers(dt) { ... }
}
```

## 工具函數

```js
// 建立最小化 enemy 物件
function mkEnemy(overrides = {}) {
  return {
    hp: 100, maxHp: 100, armor: 0, resist: {},
    chillStacks: 0, chillDecay: 0, stunTimer: 0,
    burnDmg: 0, burnTimer: 0, burnStacks: 0,
    shredStacks: 0, shredDecay: 0,
    vulnStacks: 0, vulnDecay: 0,
    armorStacks: 0, _resilientReduction: 0, _hpPctCd: 0,
    speed: 2, pathIdx: 0, x: 5, y: 5,
    skills: [],
    ...overrides
  };
}

// 建立最小化 tower 物件
function mkTower(skills = [], stats = {}) {
  return {
    x: 5, y: 5, damage: 50, atkSpd: 1, range: 3, aoe: 0,
    atkCount: 0, atkTimer: 0,
    skills,
    _rampBonus: 0, _rampTarget: null,
    _warpCd: 0, _killRushTimer: 0, _killRushBonus: 0,
    _auraDmgFlat: 0, _auraDmgPct: 0, _auraAtkSpd: 0, _auraRange: 0,
    ...stats
  };
}
```

## 測試執行器

```js
const _tests = [];
let _current_group = 'default';

function group(name) { _current_group = name; }

function test(name, fn) {
  _tests.push({ name, group: _current_group, fn });
}

function runAll() {
  const results = [];
  for (const t of _tests) {
    try {
      t.fn();
      results.push({ ...t, pass: true });
    } catch(e) {
      results.push({ ...t, pass: false, error: e.message });
    }
  }
  renderResults(results);
}

// assert 失敗時 throw Error（含期望/實際訊息）
function assertEqual(actual, expected, label = '') {
  if (actual !== expected) throw new Error(`${label} expected ${expected} got ${actual}`);
}
function assertRange(actual, lo, hi, label = '') {
  if (actual < lo || actual > hi) throw new Error(`${label} expected [${lo},${hi}] got ${actual}`);
}
function assert(cond, label = '') {
  if (!cond) throw new Error(`${label} assertion failed`);
}
```

## HTML 輸出格式

```html
<div class="group">
  <h3>🔥 火鏈（burn/ignite/detonate）</h3>
  <div class="test pass">✅ burn：命中後 burnTimer = 3</div>
  <div class="test fail">❌ detonate：burnStacks 觸發後未歸零 | expected 0 got 1</div>
</div>
<div class="summary">12 passed / 1 failed</div>
```

## 具體修改

### 新建 `skill-test.html`（根目錄）

內容結構：
1. `<head>` — 基本樣式（暗色主題，符合現有風格）
2. `<body>` — `<div id="results">` + `<button onclick="runAll()">Run Tests</button>`
3. `<script src="js/skills.js">`
4. `<script src="js/config.js">`
5. `<script>` — MockGame 定義（從 game.js 複製 doDmg/tickEnemy/tickTowers）
6. `<script>` — 工具函數 + 測試執行器
7. `<script>` — 所有測試案例（step2～8 逐步填入）
8. `<script>autoInvoke: runAll()</script>` — 載入後自動執行

## 完成標準
- 開啟 skill-test.html 後頁面顯示「0 passed / 0 failed（無測試案例）」
- MockGame 可呼叫 `doDmg`，enemy.hp 確實減少
- 斷言失敗時 error 訊息包含 expected/actual
