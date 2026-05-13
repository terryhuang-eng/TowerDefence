# mobile-wave-btn-v2 — 快取破除 + 雙擊間隔調整 + FAB 開始按鈕

## 根本診斷

「LOG 內容都一樣」= **iOS Safari 快取了舊版 `game.js`，新程式碼根本沒跑到**。

iOS Safari 對 `file://` 或本地 server 的 JS 檔案快取很激進。
即使伺服器有更新，`game.js` 沒有版本號時瀏覽器直接用快取——
所有 onclick → touchstart 的改動、所有 log 改動，手機上看到的都是舊版本。

確認方式：看 log 中是否出現 `BTN state=` 格式（新版），還是 `readyBtn touchstart state=`（舊版）。

---

## 解決方案

### Step 1：快取破除 + 雙擊間隔縮短

**快取破除**：
```html
舊：<script src="js/game.js"></script>
新：<script src="js/game.js?v=3"></script>
```
加版本號強制瀏覽器重新下載。之後每次改 JS 都要改版本號。

**雙擊間隔**：從 350ms 縮為 200ms（使用者確認 double-tap 已解，但間隔太長影響連點）

```js
舊：if (now - _lastTapTime < 350)
新：if (now - _lastTapTime < 200)
```

---

### Step 2：用 FAB 取代 HUD ready button（如果快取破除後仍無效）

`position: fixed` 的浮動按鈕，完全在遊戲 DOM 之外，不受 canvas/z-index 干擾。

**HTML**（加在 `</body>` 前）：
```html
<button id="wave-fab" style="display:none;position:fixed;bottom:72px;right:10px;z-index:9999;width:64px;height:64px;border-radius:50%;border:none;background:#e94560;color:#fff;font-size:13px;font-weight:bold;box-shadow:0 3px 12px rgba(0,0,0,0.6);touch-action:manipulation;">
  ▶<br><span id="wave-fab-label">W1</span>
</button>
```

**JS**（在 `buildMobileHud()` 中同步狀態）：
```js
const fab = document.getElementById('wave-fab');
if (fab) {
  if (this.state === 'pre_wave') {
    fab.style.display = 'block';
    document.getElementById('wave-fab-label').textContent = `W${this.wave + 1}`;
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

FAB 按鈕優點：
- `position:fixed` 在 viewport 最頂層，完全不受 canvas/HUD overlap 影響
- 同時保留 `click` handler 讓桌機也能測試
- 圓形大按鈕，手機操作舒適

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 快取破除 + 雙擊間隔縮短 | ✅ | ?v=3 + 200ms | index.html + js/game.js |
| step2 | FAB 開始波次按鈕 | ✅ | position:fixed 浮動按鈕，與 HUD 並行 | index.html + js/game.js |
