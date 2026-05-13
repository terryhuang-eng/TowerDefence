# step1 — 移動 #mobile-hud 至 canvas-wrap 外

## 目標

`#mobile-hud` 從 `position:absolute` 疊層改為 `#game-container` 的 flex 底部列，完全脫離 canvas 事件系統。

## 影響範圍

- `index.html`：HTML 結構搬移 + CSS 修改

---

## HTML 修改

### 移除 canvas-wrap 內的 mobile-hud

```
舊（在 canvas-wrap 內）：
  <div id="canvas-wrap">
    <canvas id="game-canvas"></canvas>
    <!-- 手機底部 HUD -->
    <div id="mobile-hud" style="display:none;">
      <div id="mobile-hud-sends"></div>
      <button id="mobile-hud-ready" class="mobile-hud-ready-btn">開始波次</button>
    </div>
    <div id="tower-action-popup" ...>

新（mobile-hud 移到 canvas-wrap 結束後）：
  <div id="canvas-wrap">
    <canvas id="game-canvas"></canvas>
    <div id="tower-action-popup" ...>
```

### 在 canvas-wrap 結束 `</div>` 之後插入 mobile-hud

canvas-wrap 的 `</div>` 在何處？搜尋 `game-container` 的直接子 `</div>` 結束位置，插入在 canvas-wrap `</div>` 之後、`</div><!-- game-container -->` 之前。

實際上 canvas-wrap 沒有明確的單獨 `</div>`，整個 index.html 的 canvas-wrap 直到最後一個 overlay。需要找到 canvas-wrap 的 `</div>` 並在後面插入：

```html
<!-- 手機底部 HUD（移至 canvas-wrap 外） -->
<div id="mobile-hud" style="display:none;">
  <div id="mobile-hud-sends"></div>
  <button id="mobile-hud-ready" class="mobile-hud-ready-btn">開始波次</button>
</div>
```

---

## CSS 修改（@media 區塊內）

### 舊 #mobile-hud（疊層）
```css
#mobile-hud {
  position: absolute;
  bottom: 44px;
  left: 0; right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(10, 10, 30, 0.88);
  border-top: 1px solid #333;
  z-index: 12;
  min-height: 52px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
}
```

### 新 #mobile-hud（flex 底列）
```css
#mobile-hud {
  flex-shrink: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(10, 10, 30, 0.88);
  border-top: 1px solid #333;
  min-height: 52px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
  box-sizing: border-box;
}
```

移除：`position: absolute`、`bottom: 44px`、`left: 0; right: 0;`、`z-index: 12`
新增：`flex-shrink: 0`、`width: 100%`、`box-sizing: border-box`

---

## 驗證

- 底部 HUD 顯示在 canvas 下方（不再疊在上面）
- canvas 自動縮短（resizeCanvas 重算）
- 點「開始波次」有反應（debug log 出現 readyBtn touchstart + click）
- 橫向模式同樣正常
