# mobile-touchstart-fix — 放棄修補 onclick，改用 touchstart

## 根本問題確認

**iOS Safari 的兩個已知 bug，不可修補：**

1. `overflow: hidden` 在父容器上，**不能**阻止子元素 touch event 超出容器邊界
   → canvas.style.height=699px 蓋住 HUD 按鈕，onclick 永遠被 canvas 截走

2. `maximum-scale=1.0` / `user-scalable=no` 被 iOS 10+ 無障礙功能忽略
   → viewport meta 無法可靠阻止縮放

**與其對抗 iOS 系統行為，改用正確的行動端事件：**

| 問題 | 錯誤做法（已試過） | 正確做法 |
|------|------|------|
| 按鈕 click 不觸發 | 修正 z-index / overflow / 移出 canvas-wrap | **改用 touchstart，不依賴 click 合成** |
| 縮放干擾 | viewport meta / touch-action CSS | **touchstart 的 `e.preventDefault()` 可靠阻止** |

---

## 解決方案

### Step 1：canvas CSS — `max-height: 100%`

作為 canvas 高度超出 canvas-wrap 問題的 CSS 層防護。
iOS 中 `max-height` **確實**限制元素的 touch target 範圍（與 `overflow:hidden` 的效果不同）。

### Step 2：canvas touchstart 接管所有行動端互動

- 在 `setupEvents()` 加 `canvas.addEventListener('touchstart', handler, {passive: false})`
- handler 內 `e.preventDefault()` → 一律阻止縮放、長按選取、click 合成
- 抽取現有 click 邏輯到 `_handleCanvasAction(pos)` 共用
- touchstart 用 `e.touches[0]` 取座標呼叫相同邏輯

### Step 3：HUD 按鈕改用 touchstart

- `buildMobileHud()` 中 `readyBtn.onclick` 改為 `readyBtn.addEventListener('touchstart', ...)`
- 同樣 `e.preventDefault()` → 同時解決縮放和 click 不觸發

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | canvas max-height:100% CSS | ✅ | 立即限制 canvas touch target 不超出 canvas-wrap | index.html |
| step2 | canvas click 邏輯抽出 + touchstart 接管 | ⬜ | 手機所有 canvas 互動改 touchstart，阻止縮放 | js/game.js |
| step3 | HUD 按鈕改 touchstart | ✅ | readyBtn / 送兵按鈕改用 touchstart | js/game.js |
