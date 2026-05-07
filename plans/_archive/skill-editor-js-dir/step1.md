# Step 1：加入 js 資料夾選取 + export bar 按鈕

## 目標
使用者點一個「📁 js/」按鈕，選取遊戲根目錄的 `/js` 資料夾後，
系統自動 resolve 所有 fileHandles，後續直接點「✏️ 寫入」即可，不再需要逐一選檔。

**只改 `skill-editor.html`，共 2 處。**

---

## 修改一：加 jsDirHandle 變數 + openJsDir 函數

**位置**：`const fileHandles = {};`（line 103）附近，在其後插入

**現況**：
```js
const fileHandles = {};
```

**改為**：
```js
const fileHandles = {};
let jsDirHandle = null;
const JS_DIR_FILES = { waves:'waves.js', sends:'sends.js', towers:'towers.js', config:'config.js', skills:'skills.js' };

async function openJsDir() {
  if (!window.showDirectoryPicker) return;
  try {
    const dh = await window.showDirectoryPicker({ mode: 'readwrite' });
    jsDirHandle = dh;
    for (const [key, filename] of Object.entries(JS_DIR_FILES)) {
      try {
        fileHandles[key] = await dh.getFileHandle(filename, { create: false });
      } catch (_) {
        // 該 js 資料夾下找不到此檔，略過
      }
    }
    showStatus(`✅ 已選取 js/ 資料夾，${Object.keys(fileHandles).length} 個檔案就緒`);
    renderExportBar();
  } catch (e) {
    if (e.name !== 'AbortError') showStatus('⚠️ 無法開啟資料夾：' + e.message);
  }
}
```

---

## 修改二：renderExportBar 開頭加「📁 js/」按鈕

**位置**：`renderExportBar()` 函數（line 803），`let html = '';` 這行之前插入

**現況**：
```js
  let html = '';
  if (currentTab === 'waves')        html = btnSet('waves',  'exportWaves',  'waves.js');
```

**改為**：
```js
  const dirBtn = window.showDirectoryPicker
    ? `<button onclick="openJsDir()" title="選取遊戲根目錄的 js/ 資料夾，自動綁定所有 js 檔" style="padding:2px 8px;${jsDirHandle ? 'color:#4c4' : ''}">${jsDirHandle ? '✅ js/' : '📁 js/'}</button> `
    : '';
  let html = dirBtn;
  if (currentTab === 'waves')        html += btnSet('waves',  'exportWaves',  'waves.js');
```

注意：原本 `let html = ''` 和後面的 `if` 的 `html =` 要改成 `html +=`（因為 dirBtn 已佔了 html）

---

## 完整 renderExportBar 對應行修改

`html =` → `html +=`（共 4 處 if/else if 分支）：

```js
  if (currentTab === 'waves')        html += btnSet('waves',  'exportWaves',  'waves.js');
  else if (currentTab === 'sends')   html += btnSet('sends',  'exportSends',  'sends.js');
  else if (currentTab === 'towers')  html += btnSet('towers', 'exportTowers', 'towers.js');
  else if (currentTab === 'config')  html += btnSet('config', 'exportConfig', 'config.js');
```

---

## 預期結果

| 狀態 | export bar 顯示 |
|------|----------------|
| 未選資料夾 | `📁 js/` 按鈕（灰色）+ 各檔的 `📂` 按鈕（原有行為） |
| 已選資料夾 | `✅ js/` 按鈕（綠色）+ 各檔直接顯示「✏️ 寫入」（無需再選） |

## 影響範圍
- `skill-editor.html`：line 103 附近（插入變數+函數）、line 818 附近（renderExportBar 邏輯）
