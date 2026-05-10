# se-panel-refresh-fix

## 問題

`openSEHandle()` 選取檔案後面板顯示仍是「評分參數：未選取」。

## 根因

| | 函數 | 作用 |
|--|------|------|
| 實際渲染 LEVEL_SCORE_STD 區塊 | `renderScoreDefsPanel()` | 寫入 `#score-defs-body` |
| `openSEHandle()` 呼叫的 | `renderPanel()` | 檢查 `currentTab !== 'towers'` → 立即 return |

`seFileHandle` 雖然已設定，但面板 HTML 從未重新產生，`seLabel` 仍顯示「未選取」。

## 修改

單一步驟，修改 `skill-editor.html` 一行：

| # | 步驟 |
|---|------|
| 1 | [step1.md](step1.md) |
