# step1 — 修正 canvas 溢出蓋住 HUD 按鈕

## 根本原因（最終確認）

```
initGrid() 時 HUD = display:none → canvas-wrap.clientHeight = 699px
→ canvas.style.height = '699px'（固定住了）

之後 buildMobileHud() 讓 HUD 出現 → canvas-wrap 縮短到 647px
→ canvas 仍是 699px，向下溢出 52px
→ canvas 的透明區域蓋在 HUD 按鈕上
→ canvas addEventListener('click') 吃掉所有點擊
→ button onclick 永遠不觸發
```

按鈕有 CSS :active 效果所以「感覺到點擊」，但 JS click event 被 canvas 截走。

## 修正方案

**雙重保險：**
1. `canvas-wrap` 加 `overflow: hidden` → canvas 再怎麼溢出都不影響外部 HUD
2. `buildMobileHud()` 首次顯示 HUD 時呼叫 `resizeCanvas()` → canvas 重新縮短到正確尺寸

## 影響範圍

- `index.html`：`#canvas-wrap` 加 `overflow: hidden`（mobile media query）
- `js/game.js`：`buildMobileHud()` 顯示 HUD 時觸發 resizeCanvas

---

## index.html — canvas-wrap overflow

```
舊：
  #canvas-wrap { flex: 1; width: 100%; min-height: 0; }

新：
  #canvas-wrap { flex: 1; width: 100%; min-height: 0; overflow: hidden; }
```

---

## js/game.js — buildMobileHud() 顯示 HUD 時 resizeCanvas

```
舊：
    hud.style.display = 'flex';

新：
    const wasHidden = hud.style.display !== 'flex';
    hud.style.display = 'flex';
    if (wasHidden) setTimeout(() => this.resizeCanvas(), 0);
```

`setTimeout 0` 讓 layout reflow 完成後再讀新的 canvas-wrap 高度。

---

## 驗證

- 按「開始波次」→ debug log 出現 `readyBtn touchstart` + `readyBtn click` ✓
- HUD 更新為「⚔️ 戰鬥中...」✓
- 敵人在正確位置出現 ✓
