# step2 — Layer 2：Mock Game + 升級邏輯測試

## 目標

在 `test.html` 加入 Layer 2：
- 建立 minimal mock Game object（只含升級相關的欄位與方法）
- 直接呼叫 `_getMobileUpgradeOptions`、`showTowerActionPopup` click 邏輯
- 斷言：選項數量正確、金幣正確扣除

## 目標檔案

`test.html`（在 step1 基礎上新增）

---

## Mock Game 設計

`game.js` 的升級方法依賴以下 `this` 屬性：
- `this.gold`
- `this.elemPicks[elem]`（每個元素的 pick 次數）
- `this.mode`（'pve' / 'pvp'）
- `this.countLv6Towers()`
- `CONFIG.maxLv6Towers`

Mock 只提供這些，其餘留 null/空：

```js
function makeMockGame(gold = 9999, elemPicks = {}) {
  const allElems = ['fire', 'water', 'earth', 'wind', 'thunder', 'none'];
  return {
    gold,
    elemPicks: Object.fromEntries(allElems.map(e => [e, elemPicks[e] || 0])),
    mode: 'pve',
    towers: [],
    countLv6Towers() { return this.towers.filter(t => t.level === 6).length; },
    getAvailableElements() {
      return Object.entries(this.elemPicks).filter(([, v]) => v > 0).map(([k]) => k);
    },
    getAvailableInjects(baseElem) {
      return Object.entries(this.elemPicks).filter(([, v]) => v > 0).map(([k]) => k);
    },
    getAvailableThirdElems(elem, infuseElem) {
      return Object.entries(this.elemPicks)
        .filter(([e, v]) => v > 0 && e !== elem && e !== infuseElem)
        .map(([k]) => k);
    },
    getTripleKey(e1, e2, e3) { return [e1, e2, e3].sort().join('_'); },
    netSend() {},
    // 綁定 _getMobileUpgradeOptions
    _getMobileUpgradeOptions: Game_getMobileUpgradeOptions,
  };
}
```

> **注意**：`_getMobileUpgradeOptions` 是 `Game.prototype._getMobileUpgradeOptions`，但 game.js 不在 test.html 載入。
> 解法：從 game.js 中把該方法**抽出為獨立函數**後在 test.html 重新定義；或是在 step2 執行時在 test.html 內**複製一份精簡版**專供測試用。

### 取得 _getMobileUpgradeOptions 的方式

在 test.html 最後加入 `<script src="js/game.js"></script>` **後**，再 mock Canvas 防止報錯：

```js
// 在 game.js 載入前 mock Canvas
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect(){}, fillRect(){}, beginPath(){}, arc(){},
  fill(){}, stroke(){}, measureText(){ return {width:0}; },
  drawImage(){}, createLinearGradient(){ return {addColorStop(){}}; },
});
// mock getElementById 的 canvas
const _orig = document.getElementById.bind(document);
document.getElementById = (id) => id === 'canvas' ? document.createElement('canvas') : _orig(id);
```

但這很脆弱。**更好的方案**：把 `_getMobileUpgradeOptions` 提取到 game.js 外部讓 test.html 獨立使用，或在 game.js 執行前攔截 `new Game()`。

**最務實方案（避免改動 game.js）**：test.html 不載入 game.js，改在 test.html 裡**複製 `_getMobileUpgradeOptions` 函數本體**並賦值到 mock game。每次修改 game.js 的該函數後需同步更新 test.html 的複製版。

**更好的長期方案**：抽出 `_getMobileUpgradeOptions` 到 `js/upgrade.js`，讓 game.js 和 test.html 都引用。但這超出目前範圍。

→ **本 step 採用「test.html 複製函數本體」**，保持零侵入。

---

## 測試內容

```js
section('升級選項邏輯 — Lv4 純屬水水塔');

// 水×2 picks（可升 Lv5，不可直升 Lv6）
{
  const g = makeMockGame(9999, { water: 2 });
  const tw = { level: 4, elem: 'water', infuseElem: 'water', thirdElem: null, basicType: 'arrow', totalCost: 380 };
  const opts = g._getMobileUpgradeOptions(tw);
  assertEqual(opts.length, 1, 'Lv4 水水塔，picks=2：選項數 = 1（只有 Lv5）');
  assert(opts[0]?.label?.includes('Lv5'), 'Lv4 水水塔，picks=2：選項為 Lv5');
}

// 水×3 picks（仍應只顯示 Lv5，不同時顯示 Lv6）
{
  const g = makeMockGame(9999, { water: 3 });
  const tw = { level: 4, elem: 'water', infuseElem: 'water', thirdElem: null, basicType: 'arrow', totalCost: 380 };
  const opts = g._getMobileUpgradeOptions(tw);
  assertEqual(opts.length, 1, 'Lv4 水水塔，picks=3：選項數 = 1（只有 Lv5，不顯示 Lv6）');
  assert(opts[0]?.label?.includes('Lv5'), 'Lv4 水水塔，picks=3：選項為 Lv5');
}

section('升級選項邏輯 — Lv5 純屬水水塔');

// 水×2 picks → 不可升 Lv6
{
  const g = makeMockGame(9999, { water: 2 });
  const tw = { level: 5, elem: 'water', infuseElem: 'water', thirdElem: null, basicType: 'arrow', totalCost: 730 };
  const opts = g._getMobileUpgradeOptions(tw);
  assertEqual(opts.length, 0, 'Lv5 水水塔，picks=2：選項數 = 0（未達 picks≥3）');
}

// 水×3 picks → 可升 Lv6
{
  const g = makeMockGame(9999, { water: 3 });
  const tw = { level: 5, elem: 'water', infuseElem: 'water', thirdElem: null, basicType: 'arrow', totalCost: 730 };
  const opts = g._getMobileUpgradeOptions(tw);
  assertEqual(opts.length, 1, 'Lv5 水水塔，picks=3：選項數 = 1（Lv6）');
  assert(opts[0]?.label?.includes('Lv6'), 'Lv5 水水塔，picks=3：選項為 Lv6');
}

section('升級扣金 — showTowerActionPopup 邏輯');

// 模擬 onclick 點擊 Lv1→Lv2
{
  const g = makeMockGame(500);
  const tw = { level: 1, elem: null, infuseElem: null, basicType: 'arrow', totalCost: 50 };
  const opts = g._getMobileUpgradeOptions(tw);
  assert(opts.length === 1, 'Lv1 基礎塔有 1 個選項');
  const goldBefore = g.gold;
  const cost = opts[0].cost;
  // 模擬 showTowerActionPopup 的 onclick 行為：先扣金，再呼叫 action
  g.gold -= cost;
  opts[0].action.call(g);
  assertEqual(g.gold, goldBefore - cost, `Lv1→Lv2 升級後金幣減少 ${cost}（${goldBefore} → ${goldBefore - cost}）`);
  assertEqual(tw.level, 2, 'Lv1→Lv2 升級後 tower.level = 2');
}
```

## 注意事項

- mock game 的 `getAvailableInjects` 須與 game.js 邏輯一致（允許注入任意有 pick 的元素）
- `_getMobileUpgradeOptions` 複製本體時注意 `PURE_TOWERS`、`INFUSIONS`、`ELEM` 等全域變數必須已載入（js/*.js 已 in scope）
- Lv6 上限（`CONFIG.maxLv6Towers`）預設 1，mock game 的 towers 陣列為空，`countLv6Towers()` 回傳 0，所以 lv6Count < maxLv6 成立
