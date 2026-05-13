# mobile-debug — 手機無法看 console + 縮放未解決

## 現況確認

前幾輪修正（matchMedia、touch-action、maximum-scale）仍然：
1. 開始波次無反應
2. 縮放干擾未解決

手機看不到 DevTools，需要螢幕上的 log 才能診斷 onclick 是否有觸發、`startWave()` 是否有執行、是否有 JS 錯誤。

---

## 問題分析

### 縮放問題

`maximum-scale=1.0` 在 iOS 10+ 基於無障礙設計**被刻意忽略**；`touch-action: manipulation` 防雙擊縮放，但 pinch zoom（雙指）不受影響。

根本解法：
1. **viewport 加 `user-scalable=no`**（這是遊戲，可接受）
2. **JS 阻止雙指 touchstart**（作為補充）

### 開始波次無反應

可能原因（需 log 確認）：

| # | 假設 | 診斷方式 |
|---|------|---------|
| A | `buildMobileHud()` 未執行到 onclick 設置處（matchMedia guard 仍有問題） | log buildMobileHud 入口與 guard 結果 |
| B | onclick 有設置，但 tap 事件沒有到達按鈕（被其他元素攔截） | log 按鈕 touchstart |
| C | `startWave()` 被呼叫但有 early return | log startWave 入口與 this.state |
| D | canvas click handler 在 button onclick 後也觸發，呼叫 rebuildSidebar 重置狀態 | log canvas click 觸發時機 |

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 加螢幕 debug overlay（手機 console） | ✅ | 顯示最近 12 行 log，含按鈕觸發、state 變化、JS 錯誤 | index.html + js/game.js |
| step2 | 強化縮放防止（user-scalable + JS double-tap block） | ✅ | 獨立修正，不等 step1 debug 結果 | index.html |
