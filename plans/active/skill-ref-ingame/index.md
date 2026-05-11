# skill-ref-ingame — 技能說明移入遊戲內 UI

## 現況

| 位置 | 按鈕 | 觸發 | 說明 |
|------|------|------|------|
| 開始畫面 line 457 | 📖 技能說明 | `showSkillRef()` | 38 種技能效果 overlay（`#skill-ref-overlay`）|
| 遊戲 top bar | 📖 說明 | `showInfoOverlay()` | 遊戲規則 4 tab overlay（`#info-overlay`）|
| 遊戲內 | ❌ 無 | — | 技能說明無法在遊戲中查閱 |

## 設計決策

- **移除**開始畫面的「📖 技能說明」按鈕（line 457）
- **新增**遊戲 top bar 一個「🔮 技能」按鈕，觸發同一個 `showSkillRef()`
- `showSkillRef()` 本身已是全域函數，不需任何 game.js 修改

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 移除開始畫面按鈕 + 在 top bar 新增「🔮 技能」按鈕 | ✅ | index.html |
