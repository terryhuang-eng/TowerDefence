# Step 3：config.js 預設值 + game.js getActiveKeys() + 元素選卡過濾

## 目標檔案
1. `js/config.js`
2. `js/game.js`

## 影響範圍
- config.js：加入 `activeElems` 預設值（全部元素，向後相容）
- game.js：新增 `getActiveKeys()` 模組層 helper（非 class method）
- game.js：元素選卡 UI（L1329）改用 `getActiveKeys()`

---

## 修改說明

### A. js/config.js — 加入 activeElems 預設

**定位**：`CONFIG` 物件結尾的 `essenceMilestoneBonus` 之後，`};` 之前

插入：
```javascript
  // 啟用元素（由 skill-editor 匯出，預設全開）
  // 若未定義則遊戲自動 fallback 至 ELEM_KEYS（全部元素）
  activeElems: null,   // null = 全開（等同 ELEM_KEYS）
```

> **說明**：設為 `null` 而非 `[...ELEM_KEYS]` 的原因：config.js 在 towers.js 之前還是之後載入需確認。用 `null` + runtime fallback 可完全避免載入順序問題。

### B. js/game.js — 新增模組層 helper getActiveKeys()

**定位**：game.js 最頂部，`class Game {` 之前（約 L1-10 的常數/工具區）

插入：
```javascript
/**
 * 回傳目前啟用的元素 key 陣列。
 * CONFIG.activeElems 為 null/undefined 時 fallback 全部元素。
 */
function getActiveKeys() {
  return (CONFIG.activeElems && CONFIG.activeElems.length > 0)
    ? CONFIG.activeElems
    : ELEM_KEYS;
}
```

> 模組層（非 class method）的原因：AI 邏輯（step4）和 UI 邏輯都需要呼叫，放頂層可共用。

### C. js/game.js — 元素選卡 UI 過濾（L1329）

**定位**：`showElemPick()` 方法內的 `for (const ek of ELEM_KEYS)` 迴圈（L1329）

修改前：
```javascript
for (const ek of ELEM_KEYS) {
```
修改後：
```javascript
for (const ek of getActiveKeys()) {
```

> 其餘迴圈內容（card 渲染、onclick）完全不動。

---

## 驗證
- 開啟 config.js：看到 `activeElems: null`
- 不修改 config.js 直接開遊戲：元素選卡顯示全部 6 個（向後相容 ✅）
- 手動將 config.js 改成 `activeElems: ['fire', 'water', 'wind']`：元素選卡只出現 3 個
- 元素卡點擊後遊戲流程正常（picks 累積、塔可升級）
