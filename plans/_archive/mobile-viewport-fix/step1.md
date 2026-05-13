# step1 — 修正 100vh → --real-vh

## 目標

讓 `#game-container` 與 `#canvas-wrap` 使用真實可視高度，確保 HUD 按鈕落在可觸控區域內。

## 影響範圍

- `index.html`：全域 `#game-container` height + mobile media `#canvas-wrap` height
- `js/game.js`：`initGrid()` mobile check 內加 `setVh()`

---

## index.html — CSS 修改

### 全域 `#game-container`

```
舊：
#game-container { display: flex; height: 100vh; }

新：
#game-container { display: flex; height: 100vh; height: 100dvh; height: var(--real-vh, 100dvh); }
```

### mobile media `#canvas-wrap`

```
舊：
#canvas-wrap { flex: 1; width: 100%; height: 100vh; }

新：
#canvas-wrap { flex: 1; width: 100%; height: 100vh; height: 100dvh; height: var(--real-vh, 100dvh); }
```

同一行三段 height，後者覆蓋前者：
1. `100vh` — 舊瀏覽器 fallback
2. `100dvh` — iOS 15.4+ / Chrome 108+
3. `var(--real-vh, 100dvh)` — JS 精確計算（最優先）

---

## js/game.js — initGrid() mobile check 內加

在 debug overlay 初始化之後加：

```js
const setVh = () => document.documentElement.style.setProperty('--real-vh', window.innerHeight + 'px');
setVh();
window.addEventListener('resize', setVh);
this._dbg(`vh set: ${window.innerHeight}px`);
```

---

## 驗證

debug log 預期出現：
```
11:04:00 initGrid done w=390 h=699
11:04:00 vh set: 699px
11:04:xx buildHUD state=pre_wave mq=true hud=true
11:04:xx readyBtn touchstart
11:04:xx readyBtn click state=pre_wave
11:04:xx startWave wave=0 state=pre_wave
```

- 按鈕應落在可視區內（不再被 browser bar 遮蓋）
- 點開始波次有反應 ✓
