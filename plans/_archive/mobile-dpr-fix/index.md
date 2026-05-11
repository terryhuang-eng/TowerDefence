# mobile-dpr-fix — 手機版文字模糊修正

## 根本原因

`initGrid()`（line 516）與 `resizeCanvas()`（line 560）直接將 canvas 物理像素設為 CSS 像素大小：

```js
this.canvas.width = w; this.canvas.height = h;
```

手機 DPR（devicePixelRatio）通常為 2~3，瀏覽器需拉伸 canvas 填滿高解析螢幕 → 所有繪製內容（文字、圖形）模糊。

**修正**：canvas 物理像素 = CSS 像素 × DPR，`ctx.scale(dpr, dpr)` 讓後續繪製坐標仍用 CSS 像素，無需修改其餘渲染代碼。

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | initGrid + resizeCanvas 套用 devicePixelRatio | ✅ | js/game.js |
