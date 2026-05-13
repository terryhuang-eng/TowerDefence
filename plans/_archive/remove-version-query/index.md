# remove-version-query — 根本修正產檔不完整

## 問題全貌

### 現況（git 狀態）
- **HEAD（已 commit）**：`build.html` 使用**精確字串比對**：
  ```js
  html = html.replace(`<script src="${jsPath}"><\/script>`, ...)
  ```
  → `jsPath = 'js/game.js'` 完全比對不到 `<script src="js/game.js?v=4">`
  → game.js（183KB）**從未被 inline** 進產出

- **Working tree**：已有兩段式修正（Pass 1 normalize + 精確比對 + 驗證），但**未 commit**

### 為什麼「仍然沒變」的三個可能原因

| 原因 | 說明 | 機率 |
|------|------|------|
| **A. 瀏覽器跑舊版 build.html** | 開啟 build.html 的 tab 未重新整理，仍執行 HEAD 版本的精確比對邏輯 | ★★★ 最高 |
| **B. 測試的是舊 game.html** | Downloads 裡有上次產出的 119KB 舊檔，開的是舊檔而非重新建置 | ★★★ 最高 |
| **C. ?v=4 本身** | 只要 index.html 保留 `?v=4`，每次有人改動就可能再次失效 | ★★☆ 根本原因 |

### 實測驗證（Node.js 模擬新版 build）
```
After normalization: all exact tags found ✅
js/config.js: inlined ✅  js/skills.js: inlined ✅  js/sends.js: inlined ✅
js/towers.js: inlined ✅  js/waves.js: inlined ✅   js/game.js: inlined ✅
Remaining local JS script tags: NONE ✅
Final size: 281.2 KB（正確，比舊版 119KB 多了 game.js 的 183KB）
```

## 根本解法：取消版號

**直接從 `index.html` 移除 `?v=4`** 是最乾淨的修法：

- 精確比對（HEAD 版 build.html）立即恢復正常
- 兩段式版本（working tree）也繼續有效
- 未來不會再有這類問題

**開發期間的快取問題**：
- 瀏覽器快取 → 按 **Ctrl+Shift+R** 強制重整
- 或在 DevTools → Network → 勾選 **Disable cache**

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 移除 ?v=4 版本號 | ✅ | index.html 第 632 行 `?v=4` 刪除 | index.html |
