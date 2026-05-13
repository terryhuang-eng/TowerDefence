# remove-wave-start-ui — 移除最外層波次開始按鈕

## 問題診斷

「影響畫面中央點擊蓋塔」的確切原因有兩個：

### 原因 A：canvas 點空格 = 直接觸發 startWave()（最嚴重）
`_handleCanvasAction()` 最末有備援邏輯（game.js 2336-2340）：
```js
// 手機：pre_wave 點空白格 = 開始波次（備援）
if (window.matchMedia(...).matches && this.state === 'pre_wave') {
  this.startWave();
}
```
→ 手機上 pre_wave 狀態點任何空格，**選塔流程還沒完成就立即開始波次**。

### 原因 B：#wave-fab 位置固定覆蓋畫面（z-index:9999）
```html
<button id="wave-fab" style="position:fixed;bottom:72px;right:10px;z-index:9999;width:64px;height:64px;...">
```
→ 全畫面固定浮層，雖在右下角但觸控熱區大，且 z-index 9999 高於一切。

## 移除範圍

### game.js（step1）

| 位置 | 移除內容 |
|------|---------|
| `buildHUD()` 1132 行 | `showStates` 改為只含 `'pre_wave'` |
| `buildHUD()` 1144-1152 行 | fighting/spawning 狀態的 readyBtn 區塊（整個 if 塊） |
| `buildHUD()` 1199-1228 行 | 「Ready 按鈕（升塔/送兵模式皆顯示）」整個區塊 |
| `buildHUD()` 1230-1250 行 | 「FAB 同步」整個區塊 |
| `_handleCanvasAction()` 2336-2340 行 | canvas tap 備援 startWave 整個 if 塊 |

buildHUD 簡化後結構：
```js
buildHUD() {
  const hud = ...;
  if (!hud || !_mq) return;
  if (this.state !== 'pre_wave') { hud.style.display = 'none'; return; }
  hud.style.display = 'flex';
  // 送兵按鈕部分（保留不動）
  // ← 不再有 readyBtn 區塊、不再有 FAB 同步
}
```

### index.html（step2）

| 位置 | 移除內容 |
|------|---------|
| 622 行 | `<button id="mobile-hud-ready">` HTML |
| 1278 行 | `<button id="wave-fab">` HTML |
| 326-341 行 | `.mobile-hud-ready-btn` 和 `.mobile-hud-ready-btn.pulsing` CSS |

## 保留不動

- `#mobile-hud` 整體結構（送兵用）
- `#mobile-hud-sends` 送兵按鈕邏輯（全保留）
- `buildHUD()` 的黃金顯示 + 送兵按鈕建立邏輯
- 側邊欄 `#start-wave-btn`（桌面/主要方式）
- 第 1686-1687 行 `mobileHud.style.display = 'none'`（元素選擇 overlay 期間隱藏 HUD）

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 移除 buildHUD ready/FAB 區塊 + canvas 備援 | ✅ | 5 處刪除 | js/game.js |
| step2 | 移除 HTML/CSS | ✅ | 2 個 HTML 元素 + 2 個 CSS class | index.html |
