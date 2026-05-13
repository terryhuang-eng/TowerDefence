# step2 — touch-action + viewport max-scale

## 目標

防止 iOS Safari 在點擊 HUD/popup 按鈕時觸發雙擊縮放，確保 click 事件正常觸發。

## 影響範圍

- `index.html`：viewport meta + HUD/popup 容器的 `touch-action`

---

## viewport meta

```
舊：
<meta name="viewport" content="width=device-width, initial-scale=1.0">

新：
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
```

`maximum-scale=1.0`：防止縮放，同時保留 `user-scalable`（不完全封鎖，較友善）。

---

## CSS touch-action（加在現有 HUD 規則內）

在 `@media` 區塊中，對 HUD 和 popup 容器加 `touch-action: manipulation`：

```css
/* 在 #mobile-hud {} 內加 */
#mobile-hud {
  /* ...現有屬性... */
  touch-action: manipulation;
}

/* 在 #tower-action-popup {} 內加 */
#tower-action-popup {
  /* ...現有屬性... */
  touch-action: manipulation;
}
```

---

## 驗證

- iOS Safari：快速點擊 Ready 不縮放，波次正常開始
- iOS Safari：快速點擊送兵按鈕不縮放，送兵正常觸發
- 縮放操作（pinch）仍可在 canvas 區正常運作（`maximum-scale` 只防雙擊縮放）
