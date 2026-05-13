# step1 — 底部 HUD HTML + CSS 骨架

## 目標

在 `#canvas-wrap` 內新增 `#mobile-hud` overlay，建立手機版底部常駐 HUD 的 HTML 結構與 CSS 樣式。此步驟只建立骨架，不連接任何遊戲邏輯。

## 影響範圍

- **唯一修改**：`index.html`（HTML 結構 + CSS 樣式區塊）

---

## HTML 修改

在 `#canvas-wrap` 內、canvas 標籤之後，新增：

```html
<!-- 手機底部 HUD (手機限定, step1) -->
<div id="mobile-hud" style="display:none;">
  <div id="mobile-hud-sends">
    <!-- 送兵模式：動態由 JS 填入 -->
  </div>
  <div id="mobile-hud-upgrade" style="display:none;">
    <!-- 升塔模式：動態由 JS 填入 -->
  </div>
  <button id="mobile-hud-ready" class="mobile-hud-ready-btn">開始波次</button>
</div>
```

---

## CSS 修改

在 `@media (max-width: 768px)` 區塊內新增：

```css
/* 底部 HUD */
#mobile-hud {
  position: absolute;
  bottom: 44px; /* info-bar 高度，避開 ai-bar */
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
}

#mobile-hud-sends,
#mobile-hud-upgrade {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.mobile-hud-ready-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  background: #4ecdc4;
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}

.mobile-hud-ready-btn.pulsing {
  animation: readyPulse 1.2s ease-in-out infinite;
}

.mobile-hud-send-btn {
  flex-shrink: 0;
  padding: 5px 8px;
  background: #1a1a3a;
  border: 1px solid #444;
  border-radius: 5px;
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  text-align: center;
  min-width: 42px;
}

.mobile-hud-send-btn.cannot-afford {
  opacity: 0.45;
}

.mobile-hud-upgrade-btn {
  flex-shrink: 0;
  padding: 6px 10px;
  background: #2a2a4a;
  border: 1px solid #556;
  border-radius: 5px;
  color: #ffd93d;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.mobile-hud-upgrade-btn.sell {
  border-color: #e94560;
  color: #e94560;
}
```

---

## 驗證

- 手機模擬器（DevTools）：canvas 底部出現深色 HUD 條，Ready 按鈕可見
- 桌機：`#mobile-hud` 維持 `display:none`（CSS 預設只在媒體查詢內顯示）
- HUD 按鈕目前點擊無動作（step2 接入邏輯）
