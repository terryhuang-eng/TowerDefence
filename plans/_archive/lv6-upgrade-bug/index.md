# lv6-upgrade-bug — Lv6 純屬塔升級顯示「已到最高級」

## 問題描述

純屬路線塔（base == infuseElem，如火×火 Lv5）在升級面板顯示「已達目前最高等級」，
無法看到 Lv6 升級選項，即使玩家已有 3 個同元素 pick。

---

## 根本原因

`maxTowerLevel(t)` 函數（`js/game.js` line 361）判斷 Lv6 上限時，
把「精華門檻檢查」也納入 `canLv6`：

```js
// 現有（錯誤）
const canLv6 = picks >= 3 &&
               (this.essencePerElem[t.elem] || 0) >= CONFIG.essenceLv6Threshold &&
               PURE_TOWERS[t.elem];
if (canLv6) return 6;

const canLv5 = picks >= 2 && PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5;
if (canLv5) return 5;   // ← 精華不足時落到這裡
```

### 觸發路徑

| 條件 | 狀態 |
|------|------|
| 塔等級 | Lv5（純屬路線，infuseElem === elem，thirdElem = null）|
| elemPicks | >= 3（符合 Lv6 解鎖）|
| essencePerElem | < 100（未達精華門檻）|

**執行流程：**
1. `maxTowerLevel(t)` 計算 `canLv6`：picks OK，但 essence 不足 → **false**
2. 接著 `canLv5`：picks >= 2 → **true** → **return 5**
3. UI：`t.level (5) >= maxLv (5)` → 觸發「已達目前最高等級」分支 ❌
4. **Lv6 升級按鈕（line 1044）完全被跳過，從未渲染**

### 為什麼精華不該在這裡檢查

`maxTowerLevel` 的職責是回答「這座塔理論上能升到幾級」，用於決定 UI 是否顯示升級面板。
精華是升級**按鈕**的啟用條件，已在 line 1059 的按鈕 opacity 和 line 1069 的 onclick 守衛中處理。
在 `maxTowerLevel` 中加入精華判斷，導致「有 Lv6 路線但精華不足」被誤判為「已到頂」。

---

## 影響範圍

| 場景 | 受影響 |
|------|--------|
| Lv5 純屬塔，picks >= 3，精華 < 100 | ✅ 確認觸發 |
| Lv4 純屬塔，picks >= 3，精華 < 100 | ⚠️ 部分：maxLevel 回傳 5，but Lv4 UI 仍顯示 Lv5 按鈕（不同分支）|
| AI 升塔邏輯（line 467）| 相同判斷模式，需確認 |

---

## 步驟清單

| # | 步驟 | 狀態 |
|---|------|------|
| step1 | ✅ 分析根本原因 | 見本 index.md |
| step2 | ⬜ 修復 `maxTowerLevel` 中的 canLv6 條件 | step1.md |

---

## 修復方向（step1.md 執行）

`maxTowerLevel` 的 `canLv6` 條件移除精華門檻，僅保留：

```js
// 修正後
const canLv6 = picks >= 3 && PURE_TOWERS[t.elem];
if (canLv6) return 6;
```

精華門檻已由升級按鈕（line 1059 opacity + line 1069 onclick）正確處理，不需重複。
修復後，Lv5 純屬塔（picks >= 3）能看到 Lv6 按鈕，精華不足時按鈕顯示為半透明鎖定狀態。
