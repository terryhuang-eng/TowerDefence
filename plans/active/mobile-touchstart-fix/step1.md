# step1 — canvas max-height:100% CSS

## 目標

在 iOS Safari 中，`max-height: 100%` 會限制元素的實際渲染盒（包含 touch target），
與 `overflow:hidden` 在父層不同，這會直接縮小 canvas 的 touch 捕獲區域。

作為 step2 前的立即防護。

## 影響範圍

- `index.html`：全域 `canvas` CSS

---

## 修改

```
舊：
canvas { display: block; touch-action: manipulation; }

新：
canvas { display: block; touch-action: manipulation; max-height: 100%; }
```

`100%` 相對 canvas-wrap（`position: relative` 的 containing block），
確保 canvas 不超過 canvas-wrap 高度。

---

## 驗證

- canvas 高度被限制在 canvas-wrap 高度以內
- HUD 按鈕區域不再被 canvas 覆蓋（可用 debug overlay 確認 touchstart 觸發）
