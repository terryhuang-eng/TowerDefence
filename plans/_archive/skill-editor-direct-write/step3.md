# step3：File System Access API — 直接寫入所有 js 檔

## 目標

為 `towers.js`、`waves.js`、`sends.js`、`config.js`、`skills.js` 全部加入直接寫入功能。
選取檔案後，「💾 下載」升級為「✏️ 寫入」，直接覆蓋本機原始檔。

**skills.js 特殊處理**：函數部分不由 skill-editor 產生，需讀原始檔，只 patch 前段資料。

## 修改檔案

`skill-editor.html` 只動這一個檔

---

## 瀏覽器支援

| 瀏覽器 | showOpenFilePicker | 備注 |
|--------|-------------------|------|
| Chrome / Edge | ✅ | 完整支援 |
| Firefox | ❌ | fallback 回下載模式 |
| Safari 15.2+ | ⚠️ | 部分支援 |

判斷方式：`if (window.showOpenFilePicker)` — 不存在時隱藏「📂」按鈕，只保留下載。

---

## 實作細節

### A. 全域 fileHandles 狀態

在全域初始化區加入：

```javascript
const fileHandles = {};
// key: 'towers' | 'waves' | 'sends' | 'config' | 'skills'
// value: FileSystemFileHandle
```

---

### B. openFileHandle(key) — 選取並綁定檔案

```javascript
async function openFileHandle(key) {
  if (!window.showOpenFilePicker) return;
  try {
    const [fh] = await window.showOpenFilePicker({
      types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }],
      id: key,
    });
    fileHandles[key] = fh;
    showStatus(`✅ 已選取 ${fh.name}，下次按「✏️ 寫入」直接覆寫`);
    renderExportBar();
  } catch (e) {
    if (e.name !== 'AbortError') showStatus('⚠️ 無法開啟：' + e.message);
  }
}
```

---

### C. writeToHandle(key, text) — 寫入（一般全文覆寫）

```javascript
async function writeToHandle(key, text) {
  const fh = fileHandles[key];
  if (!fh) { showStatus('⚠️ 尚未選取檔案'); return; }
  try {
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
    showStatus(`✅ 已寫入 ${fh.name}`);
  } catch (e) {
    showStatus('⚠️ 寫入失敗：' + e.message);
  }
}
```

---

### D. writeSkillsWithPatch(text) — skills.js patch 寫入

skills.js 的函數部分（makeSkill、getSkill 等）不由 skill-editor 產生。
用 patch 策略：讀原始檔 → 找到第一個函數定義 → 保留其後所有內容 → 前段用新資料取代。

```javascript
async function writeSkillsWithPatch(newDataText) {
  const fh = fileHandles['skills'];
  if (!fh) { showStatus('⚠️ 尚未選取 skills.js'); return; }
  try {
    // 讀原始內容
    const file = await fh.getFile();
    const original = await file.text();

    // 找函數起始行（第一個 'function ' 或 '// 工具函數'）
    const funcMarker = original.search(/^\/\/ =+\s*\n\/\/ 工具函數|^function\s/m);
    const funcPart = funcMarker !== -1 ? '\n' + original.slice(funcMarker) : '';

    // 組合：新資料 + 原始函數部分
    const patched = newDataText + funcPart;

    const w = await fh.createWritable();
    await w.write(patched);
    await w.close();
    showStatus('✅ 已寫入 skills.js（函數部分保留原始）');
  } catch (e) {
    showStatus('⚠️ 寫入失敗：' + e.message);
  }
}
```

---

### E. 修改 doExport() — 加入 write mode

```javascript
function doExport(text, filename, mode) {
  const key = filename.replace('.js', '');
  if (mode === 'copy') {
    navigator.clipboard.writeText(text).then(() => showStatus('✅ 已複製到剪貼簿'));
  } else if (mode === 'write') {
    if (key === 'skills') {
      writeSkillsWithPatch(text);
    } else {
      writeToHandle(key, text);
    }
  } else {
    // download fallback
    const blob = new Blob([text], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    showStatus('✅ 已下載 ' + filename);
  }
}
```

---

### F. 修改 renderExportBar() — 動態切換按鈕

```javascript
function renderExportBar() {
  const bar = document.getElementById('export-bar');
  const supportsWrite = !!window.showOpenFilePicker;

  function btnSet(key, exportFn, filename) {
    const fh = fileHandles[key];
    const openBtn = supportsWrite
      ? `<button onclick="openFileHandle('${key}')" title="選取本機 ${filename}" style="padding:2px 6px">📂</button>`
      : '';
    const actionBtn = (supportsWrite && fh)
      ? `<button onclick="${exportFn}('write')">✏️ 寫入 ${filename}</button>`
      : `<button onclick="${exportFn}('download')">💾 下載 ${filename}</button>`;
    return `<button onclick="${exportFn}('copy')">📋 複製 ${filename}</button>${openBtn}${actionBtn}`;
  }

  let html = '';
  if (currentTab === 'waves')        html = btnSet('waves',  'exportWaves',  'waves.js');
  else if (currentTab === 'sends')   html = btnSet('sends',  'exportSends',  'sends.js');
  else if (currentTab === 'towers')  html = btnSet('towers', 'exportTowers', 'towers.js');
  else if (currentTab === 'config')  html = btnSet('config', 'exportConfig', 'config.js');

  // skills.js 按鈕常駐（不依賴 tab）
  html += ' ' + btnSet('skills', 'exportSkills', 'skills.js');
  html += '<span class="status" id="export-status"></span>';
  bar.innerHTML = html;
}
```

---

## 操作流程（執行後）

1. 開啟 `skill-editor.html`（Chrome/Edge）
2. 點「📂」選取 `js/towers.js` → 按鈕變「✏️ 寫入 towers.js」
3. 編輯塔數值 → 按「✏️ 寫入」→ 直接覆蓋原始檔
4. 對 skills.js 同樣操作 → patch 寫入，函數保留

## 執行後驗證

1. 選取 `js/towers.js` 後確認按鈕切換為「✏️ 寫入 towers.js」
2. 改一個數值後寫入 → 重新整理 `index.html` 確認數值生效
3. 選取 `js/skills.js` → 改一個 scoreBase → 寫入 → 用文字編輯器確認函數部分保留
4. Firefox 確認只顯示「💾 下載」，沒有「📂」按鈕
