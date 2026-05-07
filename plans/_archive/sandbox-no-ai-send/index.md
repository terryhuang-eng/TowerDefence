# Plan: sandbox-no-ai-send

## 問題
sandbox 模式下 AI 仍會派兵，干擾純防守測試（想單獨測試特定波次時 AI 兵種會混入）。

## 目標
sandbox panel 加一個「AI 派兵」開關，關閉後 AI 不再執行 `aiDecideSends()`。

## 觸發點
`game.js:1569`：`if (this.mode === 'pve') { aiSends = this.aiDecideSends(); }`
只需在此加一個 sandbox 守衛即可，改動極小。

## 步驟清單

| 步驟 | 檔案 | 說明 |
|------|------|------|
| step1 | `js/game.js` | `aiDecideSends()` 呼叫前加 sandbox.noAiSend 守衛 |
| step2 | `index.html` | sandbox 初始化加 noAiSend 欄位 + panel 加切換按鈕 |

## 執行順序
step1 → step2（順序可互換，但 step1 邏輯簡單先做）
