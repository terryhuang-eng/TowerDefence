# step2 — 新建 build.html：可重複使用的打包工具

## 目標

建立一個獨立的 `build.html` 工具，每次打包時開啟 → 選目錄 → 點擊建置 → 下載 `game.html`。

## 影響檔案

新建 `build.html`

## 完整程式碼設計

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>🔨 Build Tool — Tower Defense</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#1a1a2e; color:#eee; font-family:'Segoe UI',sans-serif; padding:32px; }
h1 { font-size:18px; color:#ffd93d; margin-bottom:24px; }
button { padding:10px 20px; background:#0f3460; border:1px solid #4ecdc4; color:#4ecdc4;
         border-radius:6px; cursor:pointer; font-size:13px; margin-right:12px; }
button:hover { background:#1a4a70; }
button:disabled { opacity:0.4; cursor:default; }
#log { margin-top:20px; background:#0a0a1e; border-radius:8px; padding:16px;
       font-size:12px; line-height:2; min-height:200px; white-space:pre-wrap; }
.ok  { color:#4ecdc4; }
.err { color:#e94560; }
.info { color:#aaa; }
</style>
</head>
<body>
<h1>🔨 Tower Defense — Build Tool</h1>
<button id="btn-dir">📁 選擇專案目錄</button>
<button id="btn-build" disabled>🔨 建置 game.html</button>
<div id="log"><span class="info">點擊「選擇專案目錄」開始...</span></div>

<script>
// 需要 inline 的 JS 檔（載入順序）
const JS_FILES = [
  'js/config.js',
  'js/skills.js',
  'js/sends.js',
  'js/towers.js',
  'js/waves.js',
  'js/game.js',
];

let dirHandle = null;
const log = document.getElementById('log');

function addLog(msg, cls='info') {
  log.innerHTML += `<span class="${cls}">${msg}</span>\n`;
}

document.getElementById('btn-dir').onclick = async () => {
  try {
    dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    log.innerHTML = '';
    addLog(`✅ 已選擇目錄：${dirHandle.name}`, 'ok');
    document.getElementById('btn-build').disabled = false;
  } catch(e) {
    addLog('❌ 未選擇目錄', 'err');
  }
};

document.getElementById('btn-build').onclick = async () => {
  if (!dirHandle) return;
  log.innerHTML = '';
  addLog('🔧 開始建置...', 'info');

  // 1. 讀取 index.html
  let html;
  try {
    const fh = await dirHandle.getFileHandle('index.html');
    const file = await fh.getFile();
    html = await file.text();
    addLog(`✅ index.html 讀取完成（${(file.size/1024).toFixed(1)} KB）`, 'ok');
  } catch(e) {
    addLog('❌ 找不到 index.html，請確認選擇正確的專案根目錄', 'err');
    return;
  }

  // 2. 讀取並 inline 各 JS 檔
  for (const jsPath of JS_FILES) {
    try {
      // 支援子目錄（js/xxx.js → getFileHandle in 'js' subdir）
      const parts = jsPath.split('/');
      let handle = dirHandle;
      for (let i = 0; i < parts.length - 1; i++) {
        handle = await handle.getDirectoryHandle(parts[i]);
      }
      const fh = await handle.getFileHandle(parts[parts.length - 1]);
      const file = await fh.getFile();
      const content = await file.text();
      const tag = `<script src="${jsPath}"><\/script>`;
      html = html.replace(tag, `<script>\n${content}\n<\/script>`);
      addLog(`✅ ${jsPath} inline（${(file.size/1024).toFixed(1)} KB）`, 'ok');
    } catch(e) {
      addLog(`⚠️ ${jsPath} 讀取失敗，略過`, 'err');
    }
  }

  // 3. 移除 autotest.js（直接移除整行，包含條件載入的 script 區塊）
  html = html.replace(/<script src="autotest\.js"><\/script>/g, '');
  // 同時處理 step1 改成的條件載入寫法（整個 if-block script 標籤）
  html = html.replace(/<script>\s*if \(new URLSearchParams[\s\S]*?<\/script>/g, '');
  addLog('✅ autotest.js 已從輸出中移除', 'ok');

  // 4. 下載
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'game.html';
  a.click();
  URL.revokeObjectURL(url);

  const sizeKB = (new TextEncoder().encode(html).length / 1024).toFixed(1);
  addLog(`\n⬇️ game.html 下載完成（${sizeKB} KB）`, 'ok');
  addLog('📦 分享此單一檔案給玩家即可！', 'ok');
};
</script>
</body>
</html>
```

## 使用流程

```
1. 開啟 build.html（瀏覽器）
2. 點擊「📁 選擇專案目錄」→ 選擇 tower-defense-prototype/ 資料夾
3. 點擊「🔨 建置 game.html」
4. 瀏覽器自動下載 game.html
5. 將 game.html 傳給玩家
```

## 重複使用

每次修改遊戲數值後：
1. 直接點「🔨 建置 game.html」（目錄已選，無需重新選擇）
2. 重新下載並分享新版 game.html

## 執行步驟

1. Bash `ls` 確認 build.html 尚不存在
2. Write 建立 `build.html`（完整程式碼如上）
3. 用瀏覽器開啟 build.html 驗證功能

---

✅ 所有步驟完成。測試通過後請執行 `/saveclear` 封存計畫並同步 git。
