# step2 — 強化縮放防止

## 目標

完全阻止手機遊戲中的縮放行為（雙擊 + 雙指 pinch）。

## 原因

- `maximum-scale=1.0`：iOS 10+ 基於無障礙原則**忽略此屬性**
- `touch-action: manipulation`：防雙擊縮放，但不防 pinch zoom
- 遊戲場景下 `user-scalable=no` 是合理選擇

## 影響範圍

- `index.html`：viewport + JS touch handler

---

## viewport meta

```
舊：
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">

新：
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

---

## JS — 阻止雙指 pinch zoom（加在 `initGrid()` mobile check 內）

```js
// 阻止 pinch zoom（遊戲內不需要縮放）
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
```

---

## 驗證

- 雙擊 HUD 按鈕：不縮放
- 雙指捏合：不縮放
- 正常單指滑動（送兵按鈕橫向捲動）：仍可運作（`#mobile-hud` 有 overflow-x: auto）
