# upgrade-gold-hud-fixes

## 問題描述

三個手機介面 bug，全部發生在 `js/game.js`。

---

## Bug 分析

### Bug 1：Lv4 純屬塔升級選項錯誤（`_getMobileUpgradeOptions`）

**1a — Lv4 同時顯示 Lv5 與 Lv6**

`_getMobileUpgradeOptions` 第 1240 / 1249 行：兩個 `if` 各自獨立，picks >= 3 時兩個條件都成立 → 同時加入 Lv5 和 Lv6 選項。
應改為 `if / else if`：Lv4 塔只能升 Lv5，picks >= 3 不代表可以跳過 Lv5 直升 Lv6。

**1b — Lv5 純屬塔顯示「已達最高等級」**

`_getMobileUpgradeOptions` 只有 `lv === 4` 的 pure 分支，無 `lv === 5` 的處理。
picks >= 3 的 Lv5 純屬塔點選後回傳空陣列 → 顯示「已達最高等級」。
應新增 `else if (lv === 5)` 分支，提供 Lv5 → Lv6 選項（條件與桌面版相同）。

---

### Bug 2：手機升級不扣金幣（`showTowerActionPopup`）

`showTowerActionPopup` 的 onclick（第 1310-1317 行）：
```js
if (this.gold < upg.cost) return;
upg.action();           // ← action() 只更新塔屬性，不扣金
this.rebuildSidebar();
```

缺少 `this.gold -= upg.cost;`。
桌面版 `rebuildSidebar` 的每個升級按鈕 onclick 都有內聯扣金，手機版改成分離式 action 後漏掉。

---

### Bug 3：HUD 金幣不更新 + 缺少剩餘配額（`buildHUD`）

**3a — 送兵後金幣顯示不變**

`sendAction()`（第 1169-1178 行）扣金後只呼叫 `this.rebuildSidebar()`，不呼叫 `this.buildHUD()`。
HUD 的 `goldEl` 是 `buildHUD()` 建立的一次性 DOM，只有重建 HUD 才能更新數字。
同樣地，`showTowerActionPopup` 升級後也只呼叫 `rebuildSidebar()`，HUD 金幣同樣不更新。

**3b — 送兵按鈕缺少剩餘配額顯示**

按鈕目前只顯示 icon + cost，`remaining` 計算出來但沒有渲染。
應在按鈕下方加上剩餘次數（如 `3/5`）。

---

## 步驟清單

| 步驟 | 內容 | 目標行 |
|------|------|--------|
| ✅ step1 | 修正 `_getMobileUpgradeOptions`：if→if/else if（1a） + 新增 lv5 分支（1b） | ~1234-1277 |
| ✅ step2 | 在 `showTowerActionPopup` onclick 加 `this.gold -= upg.cost` | ~1310-1317 |
| ✅ step3 | `sendAction` + upgrade onclick 呼叫 `buildHUD()`；按鈕加剩餘配額 | ~1162, 1177, 1314 |

---

## 執行順序

step1 → step2 → step3，各步驟只動 `js/game.js`，互不干擾。
