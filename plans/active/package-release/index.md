# package-release — 發布打包系統

## 更新後的設計方向

### 問題 1：autotest.js 依賴
- 目前：`<script src="autotest.js">` 無條件載入
- 目標：只在 `?sandbox=1` 模式下動態載入
- 理由：release 版本不應包含測試程式碼，但開發時 sandbox 仍需 autotest

### 問題 2：打包工具
- 目標：建立可重複使用的打包工具 `build.html`
- 模式：類似 skill-editor.html，使用 File System API 讀取專案目錄
- 每次打包：開啟 build.html → 選目錄 → 點擊建置 → 輸出 `game.html`

---

## 發布版本（dist/game.html）內容

| 元素 | 處理方式 |
|------|---------|
| index.html HTML/CSS | 保留 |
| `js/config.js` … `js/game.js` 6 個 JS | **Inline** 為 `<script>` 區塊 |
| `autotest.js` | **移除**（不 inline，不載入）|
| sandbox panel HTML | **保留**（玩家可用 `?sandbox=1` 開啟，但無 autotest 按鈕功能）|
| PeerJS CDN `<script src="https://...">` | **保留**（連結不變，PVP 本來就需網路）|

> 大小估算：~288 KB 純文字單檔

---

## 步驟清單

| # | 步驟 | 狀態 | 改動檔案 |
|---|------|------|---------|
| step1 | ⬜ | `index.html`：autotest.js 改為 sandbox 條件動態載入 | index.html |
| step2 | ⬜ | 新建 `build.html`：File System API 打包工具 | build.html（新建）|

---

## step1 條件載入設計

將 line 485 的：
```html
<script src="autotest.js"></script>
```

替換為同步條件載入（document.write 確保在 DOM 解析前完成）：
```html
<script>
if (new URLSearchParams(location.search).get('sandbox') === '1') {
  document.write('<script src="autotest.js"><\/script>');
}
</script>
```

效果：
- `index.html`（無參數）→ autotest.js **不載入**（release 行為）
- `index.html?sandbox=1` → autotest.js **載入**（開發行為不變）
- `dist/game.html`（inline 版）→ 此條件 script 保留但 autotest.js 未 inline，不載入

---

## step2 build.html 設計

### 功能
1. 選擇專案根目錄（showDirectoryPicker）
2. 讀取 index.html + js/*.js（共 7 個檔）
3. 將 `<script src="js/xxx.js"></script>` 替換為 `<script>/* 內容 */</script>`
4. 保留 CDN script src（開頭為 http 的不 inline）
5. 輸出為可下載的 `game.html`（或寫回到 dist/game.html）

### UI
```
[ 選擇專案目錄 ]   已選擇：tower-defense-prototype/
[ 🔨 建置 game.html ]

狀態：
✅ index.html 讀取完成（58 KB）
✅ js/config.js inline（1.4 KB）
✅ js/skills.js inline（22 KB）
✅ js/sends.js inline（4 KB）
✅ js/towers.js inline（27 KB）
✅ js/waves.js inline（5 KB）
✅ js/game.js inline（170 KB）
⬇️ game.html 下載中...（288 KB）
```

### 技術細節
- CDN src 偵測：`src.startsWith('http')` → 不 inline
- 檔案不存在（如 autotest.js）→ 替換為空字串（行為等同 step1 的條件載入效果）
- 輸出方式：建立 Blob URL → `<a download="game.html">` 觸發下載
