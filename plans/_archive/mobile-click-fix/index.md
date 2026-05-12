# mobile-click-fix — 手機點格座標偏移修正

## 根本原因

`mobile-dpr-fix` 將 canvas 物理像素設為 `w * dpr`，同時 `ctx.scale(dpr, dpr)` 讓繪製座標仍用 CSS 像素。

但 `toGrid(e)` 和 `findEnemyAtClick(e)` 裡有這段舊邏輯：

```js
const sx = this.canvas.width / r.width, sy = this.canvas.height / r.height;
const mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sy;
```

**DPR 修正前**：`canvas.width == r.width` → `sx = 1` → 無作用
**DPR 修正後**：`canvas.width == r.width * dpr` → `sx = dpr`（例如 2 或 3）

結果：點擊 CSS 座標 `(100, 200)` 被錯誤放大成 `(200, 400)`，而 `offsetX / offsetY / cellSize` 仍是 CSS 像素，造成格子偏移 `(dpr-1)` 倍距離。

`findEnemyAtClick` 有完全相同的問題。

## 修正邏輯

移除 `sx/sy` 縮放，直接使用 CSS 座標（與 ctx.scale 後的繪製座標系一致）：

```js
const mx = e.clientX - r.left, my = e.clientY - r.top;
```

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 修正 toGrid + findEnemyAtClick 移除錯誤的 DPR 縮放 | ✅ | js/game.js |
