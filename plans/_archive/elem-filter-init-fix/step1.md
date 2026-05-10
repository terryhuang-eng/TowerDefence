# Step 1：修正 editData 初始化 activeElems

## 目標檔案
`skill-editor.html`

## 影響範圍
- `editData` 物件的初始化（L112）：activeElems 改為讀取 CONFIG 值

---

## 修改說明

**定位**：`const editData = {`（約 L102）開始的 config 欄位（約 L112）

修改前：
```javascript
config: { ...JSON.parse(JSON.stringify(CONFIG)), activeElems: [...ELEM_KEYS] },
```

修改後：
```javascript
config: {
  ...JSON.parse(JSON.stringify(CONFIG)),
  activeElems: (CONFIG.activeElems && CONFIG.activeElems.length > 0)
    ? [...CONFIG.activeElems]
    : [...ELEM_KEYS],
},
```

> **說明**：
> - `{ ...spread, key: val }` 中後者會覆蓋 spread 的同名 key，所以必須明確判斷
> - `CONFIG.activeElems && CONFIG.activeElems.length > 0` 同 `getActiveKeys()` 的邏輯，null/空陣列均 fallback 至全開
> - 使用 `[...CONFIG.activeElems]` 而非直接參照，防止 editData 與 CONFIG 共用同一陣列實例

---

## 驗證

1. config.js 有 `activeElems: ["fire","water","earth","wind"]`
   → 開啟 skill-editor → 設定頁：火水土風打勾，雷/無未打勾 ✅

2. config.js 有 `activeElems: null`
   → 開啟 skill-editor → 設定頁：6 元素全打勾 ✅

3. 在 skill-editor 取消勾選 thunder/none → 匯出 config.js → 重開
   → 設定頁狀態與匯出一致 ✅
