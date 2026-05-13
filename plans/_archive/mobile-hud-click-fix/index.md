# mobile-hud-click-fix — 開始波次無效 + 按鈕縮放干擾

## 根本原因分析

### 問題一：開始波次點擊無效

**根本原因：media query `(max-width: 768px)` 無法涵蓋手機橫向模式**

手機橫向時寬度 > 768px（iPhone 14 Pro Max 橫向 = 932px），導致：

1. JS guard `!window.matchMedia('(max-width: 768px)').matches` = `true` → `buildMobileHud()` 直接 return，Ready 按鈕的 `onclick` 永遠不會設置
2. CSS `@media (max-width: 768px)` 不生效 → `#mobile-hud` 失去 `position: absolute; bottom: 44px` 等定位，HUD 跑進文件流導致顯示異常
3. `showTowerActionPopup()` 同樣有此 guard，塔 popup 也不會出現

**影響位置（三處 JS + 一處 CSS）：**
- `initGrid()` line ~558：`matchMedia('(max-width: 768px)')`
- `buildMobileHud()` line ~1105：同上
- `showTowerActionPopup()` line ~1285：同上
- `index.html`：`@media (max-width: 768px)` 整個區塊

### 問題二：點按鈕觸發頁面縮放

**根本原因：HUD 與 popup 按鈕缺少 `touch-action: manipulation`**

iOS Safari 在元素沒有 `touch-action: manipulation` 時，快速點擊會觸發「雙擊縮放」手勢：
- 縮放發生 → click 事件不觸發 → 按鈕無反應
- 即使 click 觸發，畫面也因縮放而位移

目前 `canvas` 有設 `touch-action: manipulation`，但 `#mobile-hud`、`#tower-action-popup` 的按鈕沒有。

---

## 修正策略

### media query 條件

目前：`(max-width: 768px)`

新增：`(max-height: 430px) and (orientation: landscape)`

組合：`(max-width: 768px), (max-height: 430px) and (orientation: landscape)`

邏輯：手機橫向時 height 通常 360–430px（iPad 最小 600px+），此條件精確涵蓋橫向手機而不影響平板。

### touch-action

在 CSS 對 `#mobile-hud`、`#tower-action-popup`、及其按鈕加 `touch-action: manipulation`。
同時加 `viewport` `maximum-scale=1.0` 作為全域防護。

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 擴展 mobile media query 涵蓋橫向 | ✅ | 修正橫向手機 HUD/popup 完全失效 | index.html + js/game.js |
| step2 | 加 touch-action + viewport max-scale | ✅ | 防止點擊觸發縮放 | index.html |
