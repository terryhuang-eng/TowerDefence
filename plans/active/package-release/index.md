# package-release — 打包最小發布版本供玩家使用

## 現況分析

### 遊戲必要檔案

| 檔案 | 大小 | 說明 |
|------|------|------|
| `index.html` | 58 KB | 主遊戲（HTML + CSS + 載入邏輯）|
| `js/config.js` | 1.4 KB | 所有可調數值 |
| `js/skills.js` | 22 KB | 技能定義 + GLOBAL_CAPS |
| `js/sends.js` | 4 KB | 送兵定義 |
| `js/towers.js` | 27 KB | 所有塔定義（Lv1–Lv6）|
| `js/waves.js` | 5 KB | 20 波定義 |
| `js/game.js` | 170 KB | 主遊戲邏輯 |
| **合計** | **~288 KB** | |

### 不需要的檔案（開發用）

| 檔案 | 原因 |
|------|------|
| `skill-editor.html` | 數值編輯工具，非遊戲本體 |
| `dps-calc.html` | DPS 計算工具 |
| `map-editor.html` | 地圖編輯工具 |
| `skill-test.html` | 自動測試工具 |
| `autotest.js` | 自動測試腳本 |
| `js/towers.js.bak` | 備份檔 |
| `docs/`、`plans/`、`CLAUDE.md`、`*.md`、`*.txt` | 開發文件 |
| `.git/`、`.claude/`、`.gitignore` | 版控與 Claude 設定 |

### ⚠️ 現有問題

**`index.html` line 485 有殘留的 `autotest.js` 引用**：
```html
<script src="autotest.js"></script>
```
玩家資料夾中不包含 autotest.js → 瀏覽器 console 會報 404 錯誤（不影響遊戲，但不乾淨）。

### 外部依賴

```html
<!-- line 7 -->
<script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
```

- **PVP 功能**：強制需要網路（PeerJS 本身的 signaling server 也需要網路）
- **Solo 單人遊玩**：若 CDN 無法連線，可能造成 JS 錯誤影響啟動
- 建議打包時一同下載 peerjs.min.js（約 170KB）以確保穩定

---

## 打包方案比較

| 方案 | 分享方式 | 離線可用 | 複雜度 |
|------|---------|---------|--------|
| **A：資料夾壓縮包** | 傳 .zip，解壓縮後開啟 index.html | 需下載 peerjs 本機化 | 低 |
| **B：單一 HTML 檔** | 傳一個 .html，直接開啟 | 需下載 peerjs 本機化 | 低 |

**推薦 B（單一 HTML）**：最低摩擦，玩家直接收到一個 .html 開啟即玩，不需解壓或維持資料夾結構。

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 |
|---|------|------|------|
| step1 | ⬜ | 移除 index.html 中的 `autotest.js` 引用 | index.html |
| step2 | ⬜ | 下載 peerjs.min.js 至 `js/peerjs.min.js`，更新 script src | index.html |
| step3 | ⬜ | 建立 `dist/game.html`：將 6 個 js/*.js 全部 inline 進單一 HTML | 新建 dist/game.html |

> step2 可選：若確認玩家有穩定網路則跳過，保留 CDN 連結即可。

---

## step3 單一 HTML 產生邏輯

```
dist/game.html = index.html 的內容
  + 將 <script src="js/xxx.js"></script> 替換為 <script>/* 對應檔案內容 */</script>
  + 移除 <script src="autotest.js"></script>
  + PeerJS 保持 CDN src（或替換為 inline）
```

大小估算：288 KB（純文字，gzip 後約 60–80 KB）
