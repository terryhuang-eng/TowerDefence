# step2 — 塔選取 popup（canvas 附近 overlay）

## 目標

點塔後在**塔的畫面位置附近**顯示一個 `position:absolute` 的 HTML popup，包含升塔/賣塔按鈕（高度 ≥ 44px）。升塔按鈕直接觸達，不需視線移到底部。

## 影響範圍

- `index.html`：新增 `#tower-action-popup` HTML + CSS
- `js/game.js`：
  - 新增 `showTowerActionPopup(tw)` 方法
  - 新增 `hideTowerActionPopup()` 方法
  - canvas click handler：選塔時呼叫 `showTowerActionPopup()`，取消時呼叫 `hideTowerActionPopup()`

---

## HTML（加在 `#canvas-wrap` 內，`#mobile-hud` 之後）

```html
<div id="tower-action-popup" style="display:none;">
  <div id="tower-action-btns"></div>
</div>
```

---

## CSS（加在 `@media (max-width: 768px)` 內）

```css
#tower-action-popup {
  position: absolute;
  z-index: 30;
  background: rgba(10, 10, 30, 0.95);
  border: 1px solid #556;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
  max-width: 260px;
}
#tower-action-btns {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tower-popup-btn {
  padding: 10px 14px;
  background: #2a2a4a;
  border: 1px solid #556;
  border-radius: 6px;
  color: #ffd93d;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  min-height: 44px;
  white-space: nowrap;
}
.tower-popup-btn.sell {
  border-color: #e94560;
  color: #e94560;
}
.tower-popup-btn.cannot-afford {
  opacity: 0.45;
  cursor: not-allowed;
}
.tower-popup-btn.close-btn {
  color: #888;
  border-color: #444;
  font-size: 18px;
  text-align: center;
  padding: 8px;
  min-height: 36px;
}
.tower-popup-label {
  color: #aaa;
  font-size: 11px;
  padding: 2px 4px;
  border-bottom: 1px solid #333;
  margin-bottom: 2px;
}
```

---

## 新增方法：`showTowerActionPopup(tw)`

計算塔的 canvas 位置 → 轉換為 CSS 座標 → 定位 popup：

```js
showTowerActionPopup(tw) {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  const popup = document.getElementById('tower-action-popup');
  const btns = document.getElementById('tower-action-btns');
  if (!popup || !btns) return;

  // 計算塔在畫面上的 CSS 座標
  const cs = this.cellSize;
  const canvasRect = this.canvas.getBoundingClientRect();
  const wrapRect = document.getElementById('canvas-wrap').getBoundingClientRect();
  // canvas getBoundingClientRect 相對 viewport；popup 相對 canvas-wrap
  const towerCssX = (this.offsetX + tw.x * cs + cs / 2) + (canvasRect.left - wrapRect.left);
  const towerCssY = (this.offsetY + tw.y * cs + cs / 2) + (canvasRect.top - wrapRect.top);

  btns.innerHTML = '';

  // 標題
  const label = document.createElement('div');
  label.className = 'tower-popup-label';
  label.textContent = `${tw.icon || '🏰'} Lv${tw.level} ${tw.name || ''}`;
  btns.appendChild(label);

  // 升塔按鈕
  const upgrades = this._getMobileUpgradeOptions(tw);
  for (const upg of upgrades) {
    const btn = document.createElement('button');
    btn.className = 'tower-popup-btn' + (this.gold < upg.cost ? ' cannot-afford' : '');
    btn.textContent = `${upg.label}　💰${upg.cost}g`;
    btn.onclick = (e) => {
      e.stopPropagation();
      if (this.gold < upg.cost) return;
      upg.action();
      this.rebuildSidebar();
      // 升完後刷新 popup（可能有新選項）
      if (this.selectedTower) this.showTowerActionPopup(this.selectedTower);
      else this.hideTowerActionPopup();
    };
    btns.appendChild(btn);
  }
  if (upgrades.length === 0) {
    const maxLabel = document.createElement('div');
    maxLabel.className = 'tower-popup-label';
    maxLabel.textContent = '已達最高等級';
    btns.appendChild(maxLabel);
  }

  // 賣塔
  const sellVal = this._getSellValue(tw);
  const sellBtn = document.createElement('button');
  sellBtn.className = 'tower-popup-btn sell';
  sellBtn.textContent = `🗑️ 賣出　+${sellVal}g`;
  sellBtn.onclick = (e) => {
    e.stopPropagation();
    this.hideTowerActionPopup();
    this.sellTower(tw);
  };
  btns.appendChild(sellBtn);

  // 關閉
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tower-popup-btn close-btn';
  closeBtn.textContent = '✕';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    this.selectedTower = null;
    this.hideTowerActionPopup();
    this.rebuildSidebar();
  };
  btns.appendChild(closeBtn);

  // 定位：塔下方；若空間不足則塔上方
  popup.style.display = 'flex';
  const popupHeight = popup.offsetHeight || 200;
  const wrapHeight = document.getElementById('canvas-wrap').clientHeight;
  let top = towerCssY + cs * 0.6;
  if (top + popupHeight > wrapHeight - 60) top = towerCssY - popupHeight - cs * 0.2;
  let left = towerCssX - 80; // 置中於塔
  left = Math.max(4, Math.min(left, document.getElementById('canvas-wrap').clientWidth - 268));
  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
}

hideTowerActionPopup() {
  const popup = document.getElementById('tower-action-popup');
  if (popup) popup.style.display = 'none';
}
```

---

## canvas click handler 修改

在現有選塔邏輯（`this.grid[gy][gx] === 2` 分支）：

```
舊：
        this.selectedTower = (this.selectedTower === t) ? null : t;
        this.pendingPlace = null;
        this.rebuildSidebar();

新：
        if (this.selectedTower === t) {
          // 再次點同一塔：關閉 popup
          this.selectedTower = null;
          this.hideTowerActionPopup();
          this.rebuildSidebar();
        } else {
          this.selectedTower = t;
          this.pendingPlace = null;
          this.rebuildSidebar();
          this.showTowerActionPopup(t);
        }
```

取消選取（點空格/路徑）時加：
```js
        this.hideTowerActionPopup();
```

---

## 驗證

- 手機：點塔 → popup 出現在塔附近，升塔/賣塔按鈕高度充足（≥ 44px）
- 點 ✕ 或點空格 → popup 關閉
- popup 不遮擋 info-bar 或 ai-bar
- 桌機：`showTowerActionPopup` 有 matchMedia 守衛，行為不變
