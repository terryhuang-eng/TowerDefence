# step1 — 快取破除 + 雙擊間隔縮短

## 目標

1. 在 `game.js` 的 script 標籤加版本號，強制瀏覽器重新下載
2. 雙擊防護間隔從 350ms 縮為 200ms

## 影響範圍

- `index.html`：script src
- `js/game.js`：`_lastTapTime` 判斷

---

## 修改 A — index.html script 標籤

```
舊：
<script src="js/game.js"></script>

新：
<script src="js/game.js?v=3"></script>
```

注意：之後每次改 game.js 就要把 `v=3` 改成 `v=4`、`v=5` 等，確保瀏覽器重新載入。

---

## 修改 B — game.js 雙擊間隔

```
舊：
      let _lastTapTime = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - _lastTapTime < 350) e.preventDefault();
        _lastTapTime = now;
      }, { passive: false });

新：
      let _lastTapTime = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - _lastTapTime < 200) e.preventDefault();
        _lastTapTime = now;
      }, { passive: false });
```

---

## 驗證

手機開啟後，debug overlay 應出現 **新格式** log：
```
HH:MM:SS.mmm buildHUD state=pre_wave mq=true hud=true
HH:MM:SS.mmm initGrid done w=390 h=844
```

若仍顯示舊格式（`readyBtn touchstart state=...`），表示快取破除失效，需在 Safari 設定 → 進階 → 清除快取。
