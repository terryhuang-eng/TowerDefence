# step2 — 本機化 PeerJS（可選）

## 目標

將 PeerJS 從 CDN 改為本機檔案，確保玩家在網路不穩定時仍能開啟遊戲。

> **可跳過**：若確認玩家有網路（且 PVP 本來就需要網路），保留 CDN 連結即可。

## 影響檔案

`index.html`（更新 src）、`js/peerjs.min.js`（新建）

## 執行步驟

1. 下載 PeerJS：
   ```
   curl -L https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js -o js/peerjs.min.js
   ```
   （或手動下載儲存至 `js/peerjs.min.js`）

2. Grep `unpkg.com/peerjs` in index.html → 確認行號
3. Edit 更新 src：
   ```html
   <!-- 修改前 -->
   <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
   <!-- 修改後 -->
   <script src="js/peerjs.min.js"></script>
   ```

## 注意

- PeerJS 的 signaling server（用於 PVP 配對）仍需網路，本機化只解決「載入」問題
- 若選擇方案 B（單一 HTML），step3 會將 peerjs.min.js inline，此步驟仍有用
