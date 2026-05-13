# step2 — 移除 HTML/CSS

## 目標檔案
`index.html`

## 修改 1：移除 #mobile-hud-ready 按鈕（622 行）

```html
<!-- 舊 -->
  <div id="mobile-hud" style="display:none;">
    <div id="mobile-hud-sends"></div>
    <button id="mobile-hud-ready" class="mobile-hud-ready-btn">開始波次</button>
  </div>

<!-- 新 -->
  <div id="mobile-hud" style="display:none;">
    <div id="mobile-hud-sends"></div>
  </div>
```

## 修改 2：移除 #wave-fab 按鈕（1278 行）

整行刪除：
```html
<button id="wave-fab" style="display:none;position:fixed;bottom:72px;right:10px;z-index:9999;...">▶<br><span id="wave-fab-label">W1</span></button>
```

## 修改 3：移除 .mobile-hud-ready-btn CSS（326-341 行）

整段刪除：
```css
  .mobile-hud-ready-btn {
    flex-shrink: 0;
    padding: 12px 18px;
    background: #4ecdc4;
    color: #000;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    white-space: nowrap;
    min-height: 44px;
  }
  .mobile-hud-ready-btn.pulsing {
    animation: readyPulse 1.2s ease-in-out infinite;
  }
```

## 定位流程
1. Grep `mobile-hud-ready` 找修改1 行號
2. Grep `wave-fab` 找修改2 行號
3. Grep `mobile-hud-ready-btn` 找修改3 CSS 起始行號
4. 各自 Read ±3 行確認後 Edit
