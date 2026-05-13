# step3 — HUD 按鈕改 touchstart

## 目標

`buildMobileHud()` 中的所有按鈕（readyBtn、送兵按鈕）改用 `addEventListener('touchstart', ...)` 取代 `onclick`。

`e.preventDefault()` 同時解決：
1. 縮放（最可靠的方式）
2. 300ms click 延遲
3. click 合成被 canvas 截走的問題

## 影響範圍

- `js/game.js`：`buildMobileHud()` 內

---

## 修改 A — Ready 按鈕

```
舊：
      readyBtn.ontouchstart = () => this._dbg(`readyBtn touchstart`);
      readyBtn.onclick = () => { this._dbg(`readyBtn click state=${this.state}`); this.startWave(); };

新：
      readyBtn.onclick = null;
      readyBtn.ontouchstart = null;
      readyBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this._dbg(`readyBtn touchstart state=${this.state}`);
        this.startWave();
      }, { passive: false, once: false });
```

注意：每次 `buildMobileHud()` 重建時需先移除舊 listener，否則累積多個。

### 處理 listener 累積問題

用命名函式存在按鈕上，重建前移除：

```js
if (readyBtn._touchHandler) readyBtn.removeEventListener('touchstart', readyBtn._touchHandler);
readyBtn._touchHandler = (e) => {
  e.preventDefault();
  this._dbg(`readyBtn touchstart state=${this.state}`);
  this.startWave();
};
readyBtn.addEventListener('touchstart', readyBtn._touchHandler, { passive: false });
readyBtn.onclick = null;
```

---

## 修改 B — 送兵按鈕

在 sendsDiv 的 btn 建立邏輯中，改為：

```
舊：
        btn.onclick = () => { ... 送兵邏輯 ... };

新：
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          ... 送兵邏輯 ...
        }, { passive: false });
        btn.onclick = null; // 桌機仍可用 onclick，但手機用 touchstart
```

---

## PVP Ready 按鈕

同樣方式處理 PVP 的 readyBtn.onclick → touchstart。

---

## 驗證

- 手機：點「開始波次」→ 立即觸發，無縮放，HUD 切換至「⚔️ 戰鬥中...」
- 手機：點送兵按鈕 → 立即觸發，無縮放
- 桌機：不受影響（touchstart 不觸發）
