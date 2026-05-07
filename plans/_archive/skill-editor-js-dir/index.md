# skill-editor-js-dir：預設 js 資料夾

## 問題分析
目前每個 js 檔（towers.js / waves.js / sends.js / config.js / skills.js）都要分別點「📂」按鈕選取，
瀏覽器對話框預設位置隨機，每次都要手動導航到 `/js` 目錄。

## 解法
File System Access API 的 `showDirectoryPicker()` + `dirHandle.getFileHandle(filename)`：
- 使用者**只需選一次**資料夾（`/js`）
- 自動 resolve 所有 5 個 fileHandles，完全跳過選檔對話框
- 已選資料夾時，export bar 顯示「✅ js/」（綠色），清楚表示狀態

## 步驟清單

| # | 步驟 | 說明 |
|---|------|------|
| 1 | [step1.md](step1.md) | 加入資料夾選取邏輯 + export bar 按鈕 |

## 影響範圍
- 只改 `skill-editor.html`，共 2 處：
  1. 頂部 `fileHandles` 附近加 `jsDirHandle` 變數 + `openJsDir()` 函數
  2. `renderExportBar()` 開頭加「📁 js/」按鈕

## 不改的部分
- `openFileHandle(key)` 保留原邏輯（fallback：若沒有 jsDirHandle 仍可單檔選取）
- 所有寫入邏輯不動（`writeToHandle` / `writeSkillsWithPatch`）
