# UI Editor + Mobile Preview

## 問題摘要

| 面向 | 現狀 | 目標 |
|------|------|------|
| UI 調整 | 所有佈局數值（bar 高度、sidebar 寬度、按鈕大小）寫死在 CSS/JS，改一個值需找多處 | 浮動面板即時調整、即時預覽，不用重新編譯 |
| 手機版面預覽 | 必須用實機或 DevTools 縮視窗才能看手機版面 | PC 上一鍵切換，用固定寬度框模擬手機視窗 |

---

## 兩大功能

### 功能 A：UI Layout Editor
- 快捷鍵 `Alt+E` 開關浮動編輯面板
- 可調參數：Top bar 高度、Bottom bar 高度、Sidebar 寬度、Mobile 按鈕最小高度
- 修改即時生效（CSS custom property → resizeCanvas）
- 支援重置為預設值

### 功能 B：Mobile Preview（PC 上看手機版面）
- 面板內一個 toggle 開關
- 開啟後：canvas-wrap 縮為指定手機寬度（375/390/414px 可選）、強制套用手機 CSS 規則、JS mobile 偵測也回傳 `true`
- 關閉後：恢復正常桌機版面

---

## 步驟清單

| # | 步驟 | 檔案 | 風險 |
|---|------|------|------|
| 1 | ✅ [CSS Custom Properties](step1.md) | `index.html` (CSS) | 低：只改 CSS，不動 JS |
| 2 | ✅ [Mobile Preview Mode](step2.md) | `index.html` (CSS) + `js/game.js` | 中：需替換 3 處 matchMedia 呼叫 |
| 3 | ✅ [UI Editor Panel](step3.md) | `index.html` (HTML+JS) | 中：新增 DOM，需接 resizeCanvas |

---

## 執行順序

Step 1 → Step 2 → Step 3（有依賴，Step 2 依賴 Step 1 的 CSS 變數，Step 3 依賴 Step 2 的 toggle 函式）

---

## 驗證目標

- [ ] `Alt+E` 開關面板不影響正常遊戲流程
- [ ] 改變 top bar 高度後 canvas 格子大小即時重算
- [ ] Mobile Preview 開啟後：`#mobile-hud` 顯示、sidebar 變抽屜、canvas 寬度受限
- [ ] Mobile Preview 關閉後：完全恢復桌機版面
- [ ] 手機實機測試不受影響（editor panel 僅 PC 顯示）
