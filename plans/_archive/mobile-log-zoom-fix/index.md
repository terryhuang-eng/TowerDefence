# mobile-log-zoom-fix — 強化 log 診斷 + 全域防止雙擊放大

## 問題分析

### 問題 1：波次開始仍然沒有作用
目前 log 有兩個盲點：
1. `_dbg()` 只保留最後 12 行，rapid-fire 操作（建 HUD → 初始化 → 其他）容易把按鈕 log 擠掉
2. timestamp 只到秒（`HH:MM:SS`），同一秒的多個事件看起來一樣，順序難以判斷
3. `readyBtn touchstart` 之後沒有 log 確認 `startWave()` 有沒有跑完
4. debug overlay 在 `initGrid()` 才顯示，但 `buildMobileHud()` 在此之前就被呼叫一次，初始 log 丟失

**診斷目標**：確認「按下按鈕 → touchstart 事件觸發 → startWave() 執行 → 狀態切換」這條鏈哪一步斷掉。

### 問題 2：雙擊放大縮小
雙擊（double-tap）縮放是 iOS Safari 瀏覽器層級的手勢，`viewport meta` 的 `maximum-scale` 在 iOS 10+ 被忽略。

根本原因：快速連點送兵按鈕時，兩次點擊間隔 < 300ms，瀏覽器判定為 double-tap 並觸發縮放。

雖然送兵按鈕現在有 `touchstart + e.preventDefault()`，但：
- 第一下 tap → sendAction() → `rebuildSidebar()` → `buildMobileHud()` → DOM 重建，按鈕是全新節點
- 第二下 tap 落在「新建立」的按鈕上，這個節點的 touchstart handler 已附加，但瀏覽器在 DOM 替換前後的 double-tap 偵測可能已在 window 層觸發

**最可靠的全域防止 double-tap zoom 方案**：
- CSS：`touch-action: manipulation` 加在 `html, body`（阻止 double-tap zoom，保留 pan）
- JS：在 document 層追蹤最後 touchend 時間，< 300ms 的第二次 touchend 呼叫 `preventDefault()`

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 強化 debug logging | ✅ | 毫秒時間戳、行數擴增、按鈕/startWave 更詳細 log | js/game.js |
| step2 | 全域防止 double-tap zoom | ✅ | CSS touch-action + JS document touchend 攔截 | index.html + js/game.js |
