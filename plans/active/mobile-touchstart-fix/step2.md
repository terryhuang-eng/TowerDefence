# step2 — canvas click 邏輯抽出 + touchstart 接管

## 目標

將 canvas click handler 的邏輯抽到 `_handleCanvasAction(pos)` 方法，
再加一個 touchstart listener 呼叫同樣邏輯，並在 touchstart 加 `e.preventDefault()` 阻止縮放。

桌機保留 click handler，手機用 touchstart 接管。

## 影響範圍

- `js/game.js`：`setupEvents()` 內

---

## 修改

### 抽出 `_handleCanvasAction(pos)`

現有 canvas click handler 的所有邏輯（closeTowerSelectPopup 之後、直到 startWave 備援）移入：

```js
_handleCanvasAction(pos) {
  // pos = { clientX, clientY }
  this.closeTowerSelectPopup();
  const {gx, gy} = this.toGrid(pos);
  // ... 以下與現有 click handler 完全相同 ...
}
```

`toGrid(e)` 使用 `e.clientX`，傳入 `pos` 即可相容。

### setupEvents() 中修改

```js
// 現有 click handler（保留給桌機）
this.canvas.addEventListener('click', (e) => {
  this._handleCanvasAction(e);
});

// 新增 touchstart handler（手機）
this.canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // 阻止縮放 + 阻止 click 合成（避免雙觸發）
  if (!e.touches.length) return;
  const t = e.touches[0];
  this._handleCanvasAction({ clientX: t.clientX, clientY: t.clientY });
}, { passive: false });
```

`e.preventDefault()` 的效果：
- 阻止 touchstart → click 的合成（不會雙觸發）
- 阻止 double-tap zoom
- 阻止 long-press context menu

---

## 驗證

- 手機：點塔 → popup 出現（touchstart 觸發）
- 手機：點空白格 → pre_wave 時 startWave（canvas tap 備援正常）
- 手機：點擊不再縮放 ✓
- 桌機：click handler 仍正常運作 ✓
