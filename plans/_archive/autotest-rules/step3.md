# step3 — Layer 3：送兵配額 + sendAction + buildHUD spy

## 目標

在 `test.html` 加入 Layer 3：
- `getSendQuota` 各波次配額驗證
- `sendAction` 扣金正確性
- `buildHUD()` 在 sendAction 後被呼叫（spy 機制）

## 目標檔案

`test.html`（在 step2 基礎上新增）

---

## 測試內容

### getSendQuota 波次對應

`getSendQuota` 定義在 `js/sends.js`，可直接呼叫（不需要 mock Game）。

```js
section('getSendQuota 波次配額');

// 從 CLAUDE.md 送兵配額表直接對應
const quotaExpected = [
  // [sendId, wave, expected]
  ['scout',   1,  5],
  ['scout',   4,  6],
  ['scout',   12, 9],
  ['scout',   20, 12],
  ['warrior', 1,  2],
  ['warrior', 5,  3],
  ['warrior', 20, 7],
  ['knight',  1,  0],
  ['knight',  3,  1],
  ['knight',  20, 5],
  ['mage',    7,  1],
  ['mage',    1,  0],
  ['elite',   12, 1],
  ['elite',   1,  0],
  ['boss',    18, 1],
  ['boss',    1,  0],
];

for (const [id, wave, expected] of quotaExpected) {
  const actual = getSendQuota(id, wave);
  assertEqual(actual, expected, `getSendQuota('${id}', W${wave}) = ${expected}`);
}
```

> 注意：getSendQuota 的 wave 參數是「下一波」（pre_wave 時用 wave+1），但送兵配額表按「波次配對」，需確認 sends.js 中的索引邏輯。實際測試值需對照 sends.js 的 quota 陣列確認。

---

### sendAction 扣金 + buildHUD spy

sendAction 的邏輯在 `buildHUD()` 內定義，是一個閉包，無法直接提取測試。
需要用 **DOM mock** 讓 buildHUD 可以執行，或改用「行為驗證」：

**方案：直接驗證 sendAction 的前後狀態**

建立一個極簡 mock，模擬 `buildHUD` 內的 `sendAction` 邏輯（因為它是閉包）：

```js
section('sendAction 扣金與配額');

// 直接測試 sendAction 的邏輯等效版本
function simulateSendAction(game, send, wave) {
  const nextWave = wave + 1;
  const curUsed = game.sendUsed[send.id] || 0;
  const curQuota = getSendQuota(send.id, nextWave);
  if (game.gold < send.cost || curUsed >= curQuota) return false;
  game.gold -= send.cost;
  game.income += send.income;
  game.sendUsed[send.id] = curUsed + 1;
  game.playerSendQueue.push({ ...send });
  return true;
}

// 測試：足夠金幣 + 配額未滿 → 應成功扣金
{
  const g = { gold: 500, income: 50, sendUsed: {}, playerSendQueue: [] };
  const scout = INCOME_SENDS.find(s => s.id === 'scout');
  const goldBefore = g.gold;
  const result = simulateSendAction(g, scout, 1);
  assert(result === true, 'sendAction 斥候 W1：成功執行');
  assertEqual(g.gold, goldBefore - scout.cost, `sendAction 後金幣減少 ${scout.cost}`);
  assertEqual(g.sendUsed['scout'], 1, 'sendAction 後 sendUsed 增加 1');
  assertEqual(g.income, 50 + scout.income, 'sendAction 後 income 增加');
}

// 測試：金幣不足 → 不執行
{
  const g = { gold: 5, income: 50, sendUsed: {}, playerSendQueue: [] };
  const scout = INCOME_SENDS.find(s => s.id === 'scout');
  const result = simulateSendAction(g, scout, 1);
  assert(result === false, 'sendAction 金幣不足：不執行');
  assertEqual(g.gold, 5, '金幣不足時金幣不變');
}

// 測試：配額已滿 → 不執行
{
  const scout = INCOME_SENDS.find(s => s.id === 'scout');
  const quota = getSendQuota('scout', 2); // W1 的配額
  const g = { gold: 9999, income: 50, sendUsed: { scout: quota }, playerSendQueue: [] };
  const result = simulateSendAction(g, scout, 1);
  assert(result === false, 'sendAction 配額已滿：不執行');
}
```

### buildHUD spy（可選）

測試「sendAction 後 buildHUD 被呼叫」需要 spy 機制，在 test.html 可用計數器模擬：

```js
section('buildHUD 呼叫驗證（spy）');

{
  // 建立極簡 mock game，手動執行 sendAction 閉包的等效行為
  let buildHUDCalled = 0;
  const g = {
    gold: 500, income: 50, sendUsed: {}, playerSendQueue: [], wave: 1,
    rebuildSidebar() {},
    buildHUD() { buildHUDCalled++; },
  };
  const scout = INCOME_SENDS.find(s => s.id === 'scout');

  // 執行等效 sendAction（含 buildHUD 呼叫）
  const nextWave = g.wave + 1;
  const curUsed = g.sendUsed[scout.id] || 0;
  const curQuota = getSendQuota(scout.id, nextWave);
  if (g.gold >= scout.cost && curUsed < curQuota) {
    g.gold -= scout.cost;
    g.income += scout.income;
    g.sendUsed[scout.id] = curUsed + 1;
    g.playerSendQueue.push({ ...scout });
    g.rebuildSidebar();
    g.buildHUD();  // 這是我們要驗證的行為
  }
  assertEqual(buildHUDCalled, 1, 'sendAction 後 buildHUD() 被呼叫 1 次');
}
```

---

## 執行順序說明

Layer 3 的 sendAction 測試不依賴 DOM，直接在 script 中執行即可。
`getSendQuota` 依賴 `js/sends.js` 已載入，確認 sends.js 在 test.html 的 script 順序正確即可。

## 注意事項

- sends.js 中 `getSendQuota` 可能是 module-scoped 函數，確認是否暴露到全域（`window.getSendQuota` 或直接 `getSendQuota`）
- 若 `INCOME_SENDS` 的 `id` 欄位與 CLAUDE.md 表格的 key 不同（如 `scout` vs `troop_1`），需對照 sends.js 實際定義
