# step2 — FAB 開始波次按鈕

## 目標

新增一個 `position:fixed` 的圓形浮動按鈕（FAB），完全在遊戲 DOM 之外，
作為「開始波次」的備用觸發點，繞開所有 canvas/HUD z-index 問題。

## 執行條件

step1 完成後，若 log 出現 `BTN state=pre_wave` 但 startWave 仍無效 → 執行本步驟。
（若 step1 後 startWave 已正常，本步驟可跳過或保留作為額外入口。）

## 影響範圍

- `index.html`：在 `</body>` 前加 FAB button
- `js/game.js`：`buildMobileHud()` 末端加 FAB 狀態同步

---

## 修改 A — index.html 加 FAB button

位置：在 `</body>` 前，debug overlay 元素後面。

```html
<button id="wave-fab" style="display:none;position:fixed;bottom:72px;right:10px;z-index:9999;width:64px;height:64px;border-radius:50%;border:none;background:#e94560;color:#fff;font-size:13px;font-weight:bold;line-height:1.2;box-shadow:0 3px 12px rgba(0,0,0,0.6);touch-action:manipulation;cursor:pointer;">▶<br><span id="wave-fab-label">W1</span></button>
```

---

## 修改 B — buildMobileHud() 末端加 FAB 狀態同步

在 `buildMobileHud()` 最末尾（`}` 之前）加入：

```js
// FAB 同步
const fab = document.getElementById('wave-fab');
const fabLabel = document.getElementById('wave-fab-label');
if (fab && fabLabel) {
  if (this.state === 'pre_wave') {
    fab.style.display = 'block';
    fabLabel.textContent = `W${this.wave + 1}`;
    if (!fab._handler) {
      fab._handler = (e) => {
        e.preventDefault();
        this._dbg(`FAB state=${this.state} wave=${this.wave}`);
        this.startWave();
        this._dbg(`FAB done state=${this.state}`);
      };
      fab.addEventListener('touchstart', fab._handler, { passive: false });
      fab.addEventListener('click', () => { this._dbg('FAB click'); this.startWave(); });
    }
  } else {
    fab.style.display = 'none';
  }
}
```

注意：`fab._handler` 只設置一次（`if (!fab._handler)`），不會累積。

---

## 驗證

- pre_wave：右下角出現紅色圓形「▶ W1」按鈕
- 點擊 → log 顯示 `FAB state=pre_wave wave=0` + `FAB done state=spawning`
- spawning/fighting：FAB 消失
- 桌機：FAB 顯示但用 click handler 觸發（touchstart 不觸發）
