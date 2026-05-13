# mobile-viewport-fix — 按鈕落在 browser chrome 外（100vh bug）

## 根本原因

debug log 顯示 `h=699`（window.innerHeight），但 CSS `100vh` 在 iOS Safari 是
「large viewport height」（browser bar 收起時的高度），約 760px。

```
canvas-wrap height = 100vh ≈ 760px（CSS）
window.innerHeight  = 699px（實際可視區）
差距                = ~61px

#mobile-hud { bottom: 44px } 實際 y = 760 - 44 = 716px
可視底部                              y = 699px
→ 按鈕超出可視區 17px，落在 Safari 底部工具列上
→ touch 事件被瀏覽器攔截，onclick/touchstart 皆不觸發
```

這解釋了為何只有 `initGrid done` 出現，readyBtn touchstart 完全沒有 log。

## 修正方案

### 方案：`--real-vh` JS 變數 + CSS fallback

```js
// 在 initGrid() mobile check 內
const setVh = () => document.documentElement.style.setProperty('--real-vh', window.innerHeight + 'px');
setVh();
window.addEventListener('resize', setVh);
```

```css
/* 全域 */
#game-container { height: var(--real-vh, 100vh); }
/* mobile media 內 */
#canvas-wrap { height: var(--real-vh, 100vh); }
```

CSS `dvh`（`100dvh` = 動態更新的 viewport height）是更現代的方案，但 iOS 15.4+ 才支援；`--real-vh` 相容性更廣。

兩者可並列提供：
```css
#game-container {
  height: 100vh;           /* 最舊瀏覽器 fallback */
  height: 100dvh;          /* iOS 15.4+ 原生支援 */
  height: var(--real-vh, 100dvh); /* JS 計算，最精確 */
}
```

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 修正 100vh → --real-vh | ✅ | JS 計算 window.innerHeight 寫入 CSS 變數，覆蓋 100vh | index.html + js/game.js |
