# mobile-hud-restructure — HUD 移出 canvas-wrap + canvas tap 備援

## 策略轉向

所有 CSS/viewport 修正均無效，原因是：**HTML 元素疊在 canvas 上**在 iOS Safari 的觸控攔截問題涉及多層因素，繼續追修補方向報酬遞減。

根本解法：**把 `#mobile-hud` 移出 `canvas-wrap`，變成 `#game-container` 的 flex 底部列**。

```
舊結構：
game-container
  ├─ sidebar
  └─ canvas-wrap               ← position:relative
       ├─ canvas
       ├─ mobile-hud           ← position:absolute 疊在 canvas 上（問題根源）
       └─ ...overlays

新結構：
game-container (flex-direction:column on mobile)
  ├─ sidebar（mobile 隱藏）
  ├─ canvas-wrap               ← flex:1，自動縮短讓出 HUD 空間
  │    ├─ canvas
  │    └─ ...overlays（其他疊層保持不動）
  └─ mobile-hud                ← 正常文件流，flex-shrink:0，無疊層問題
```

好處：
- 完全脫離 canvas 事件攔截
- 不需要 z-index、position:absolute、bottom 定位
- 不受 100vh、browser bar 影響
- canvas 自動縮短（`resizeCanvas()` 會重算）

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 移動 #mobile-hud 至 canvas-wrap 外 | ✅ | HTML 搬移 + CSS 改為 flex 底列 | index.html |
| step2 | canvas tap 備援觸發開始波次 | ✅ | pre_wave 狀態下點空白格也能開始波次 | js/game.js |
