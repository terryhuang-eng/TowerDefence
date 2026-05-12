# step1 — 修正 toGrid + findEnemyAtClick 移除錯誤的 DPR 縮放

## 目標

`toGrid()` 與 `findEnemyAtClick()` 將點擊的 CSS 像素座標錯誤地乘以 DPR，導致手機上點格偏移。移除縮放邏輯，直接使用 CSS 座標。

## 影響範圍

- **唯一修改**：`js/game.js`，兩處
  - `toGrid` (line ~1932)
  - `findEnemyAtClick` (line ~2260)

---

## 修改 A — toGrid（line ~1932）

```
舊：
    const r = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / r.width, sy = this.canvas.height / r.height;
    const mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sy;

新：
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
```

---

## 修改 B — findEnemyAtClick（line ~2260）

```
舊：
    const r = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / r.width, sy = this.canvas.height / r.height;
    const mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sy;

新：
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
```

---

## 驗證

- 手機/模擬器（DPR=2 or 3）：點格子後正確顯示「點擊蓋塔」文字提示，塔預覽圖示位置正確
- 桌機（DPR=1）：行為不變（DPR=1 時舊邏輯 `sx=1` 也是無作用，結果相同）
