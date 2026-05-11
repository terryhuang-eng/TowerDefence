# step1 — initGrid + resizeCanvas 套用 devicePixelRatio

## 目標

修正 canvas 物理解析度，消除手機高 DPI 螢幕下的模糊。

## 影響範圍

- **唯一修改**：`js/game.js`，兩處（initGrid line ~516、resizeCanvas line ~560）

---

## 修改 A — initGrid（line ~516）

```
舊：
    const w = wrap.clientWidth, h = wrap.clientHeight;
    this.canvas.width = w; this.canvas.height = h;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';

新：
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
```

---

## 修改 B — resizeCanvas（line ~560）

```
舊：
    this.canvas.width = w; this.canvas.height = h;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';

新：
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
```

**注意**：`ctx.scale` 每次 resize 都需要重設（canvas resize 會重置 context 狀態）。
cellSize / offsetX / offsetY 計算仍使用 CSS 像素（w, h），無需修改。

---

## 驗證

- 手機/模擬器開啟 index.html：canvas 文字、圖形清晰不模糊
- 桌機（DPR=1）行為不變
