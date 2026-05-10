# 計畫：elem-filter 初始化讀取修正

## 問題

`skill-editor.html` 啟動時，`editData` 的初始化寫死了 `activeElems: [...ELEM_KEYS]`：

```javascript
// L112（現行）
config: { ...JSON.parse(JSON.stringify(CONFIG)), activeElems: [...ELEM_KEYS] },
```

`{ ...spread, activeElems: [...ELEM_KEYS] }` 的後者**明確覆蓋**了 spread 帶入的 `CONFIG.activeElems`。
→ 即使 config.js 已匯出 `activeElems: ["fire","water","earth","wind"]`，重開 skill-editor 後仍顯示全 6 元素，設定無效。

## 根本原因

| 流程 | 現況 | 期望 |
|------|------|------|
| skill-editor 開啟，讀取 CONFIG.activeElems | 被 `[...ELEM_KEYS]` 覆蓋，丟棄 | 保留 CONFIG.activeElems |
| 使用者勾選元素、匯出 config.js | activeElems 寫入 config.js ✅ | 同 |
| 重開 skill-editor | 再次被覆蓋，設定消失 ❌ | 應讀回 config.js 的值 |

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | skill-editor.html | 修正 editData 初始化，讀取 CONFIG.activeElems |

## 驗證清單
- [ ] config.js 已有 `activeElems: ["fire","water","earth","wind"]` → 開啟 skill-editor → 設定頁只有 4 個元素勾選
- [ ] config.js `activeElems: null` → 開啟 skill-editor → 設定頁 6 個元素全勾
- [ ] 在 skill-editor 取消勾選 thunder/none → 匯出 config.js → 重開 skill-editor → 仍只有 4 個勾選
