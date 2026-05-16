# Step 1：Grid Dimension Editor + Path 泛化

## 目標
讓 gridCols（寬）和 gridRows（高）都可從 UI Editor 調整並儲存。修改同時需要泛化 `initGrid()` 的路徑生成，讓路徑 y 值從寫死的數字改為根據 gridRows 動態計算。

---

## 影響範圍

| 檔案 | 位置 | 動作 |
|------|------|------|
| `js/game.js` | 頂端 UI Editor Helpers 區塊（line ~1 附近） | 新增 localStorage 讀取，在 Game 構造前覆蓋 CONFIG |
| `js/game.js` | `initGrid()` line 555 `totalRows` | 改為 `CONFIG.gridRows * 2 + 2` |
| `js/game.js` | `initGrid()` line 560 `this.grid` | 不變 |
| `js/game.js` | `initGrid()` line 562–576（玩家路徑） | y 值改為比例公式 |
| `js/game.js` | `initGrid()` line 579–587（AI 路徑） | y 值改為比例公式（offset 後同樣適用） |
| `js/game.js` | `resizeCanvas()` line 628 `totalRows` | 改為 `CONFIG.gridRows * 2 + 2` |
| `index.html` | UI Editor panel HTML | 新增 Grid 區塊 |
| `index.html` | UI Editor JS script | 新增 grid slider 綁定 + 儲存邏輯 |

**不影響範圍：**
- 遊戲邏輯（傷害、波次、送兵、PVP）
- 現有 towers 陣列（格子重建只在新局開始時）
- 塔的放置邏輯（仍讀 `CONFIG.gridCols/gridRows`）

---

## 實作重點

### 1. game.js 頂端：讀取 localStorage 覆蓋 CONFIG

加在 `window._mobilePreview = false;` 之後：

```js
// Grid config: load from localStorage (applied before Game construction)
(function() {
  try {
    const saved = JSON.parse(localStorage.getItem('tdGridConfig') || '{}');
    if (saved.gridCols >= 10 && saved.gridCols <= 30) CONFIG.gridCols = saved.gridCols;
    if (saved.gridRows >= 5  && saved.gridRows <= 15) CONFIG.gridRows = saved.gridRows;
  } catch(e) {}
})();
```

### 2. `totalRows` 修正（initGrid + resizeCanvas）

```js
// Before (hardcoded AI rows = 10):
const totalRows = CONFIG.gridRows + 1 + 10 + 1;

// After (AI rows mirrors player rows):
const totalRows = CONFIG.gridRows * 2 + 2;
```

修改位置：`initGrid()` line ~555 和 `resizeCanvas()` line ~628（兩處都要改）。

### 3. 路徑 y 值泛化（initGrid）

玩家路徑（當前 line 562–576）：

```js
// 目前（hardcoded for gridRows=10）:
for (let y = 1; y <= 3; y++) ...      // 3
for (let x = cols-4; x >= 2; x--) this.path.push({x, y: 3});
for (let y = 4; y <= 6; y++) ...      // 6
for (let x = 3; x < cols-2; x++) this.path.push({x, y: 6});
for (let y = 7; y <= 9; y++) ...      // 9
for (let x = cols-4; x >= 0; x--) this.path.push({x, y: 9});

// 改為（比例公式，gridRows=10 時結果完全相同）:
const rows = CONFIG.gridRows;
const pr1 = Math.floor(rows / 3);         // gridRows=10: 3
const pr2 = Math.floor(rows * 2 / 3);     // gridRows=10: 6
const pr3 = rows - 1;                      // gridRows=10: 9

for (let x = 0; x < cols - 2; x++) this.path.push({x, y: 0});
for (let y = 1; y <= pr1; y++) this.path.push({x: cols-3, y});
for (let x = cols-4; x >= 2; x--) this.path.push({x, y: pr1});
for (let y = pr1+1; y <= pr2; y++) this.path.push({x: 2, y});
for (let x = 3; x < cols - 2; x++) this.path.push({x, y: pr2});
for (let y = pr2+1; y <= pr3; y++) this.path.push({x: cols-3, y});
for (let x = cols-4; x >= 0; x--) this.path.push({x, y: pr3});
```

AI 路徑（當前 line 579–587）：

```js
// aiStartRow 不變（= CONFIG.gridRows + 1）
const aiStartRow = CONFIG.gridRows + 1;
// 使用相同 pr1, pr2, pr3，加上 aiStartRow offset:
for (let x = 0; x < cols - 2; x++) this.aiPath.push({x, y: aiStartRow});
for (let y = aiStartRow+1; y <= aiStartRow+pr1; y++) this.aiPath.push({x: cols-3, y});
for (let x = cols-4; x >= 2; x--) this.aiPath.push({x, y: aiStartRow+pr1});
for (let y = aiStartRow+pr1+1; y <= aiStartRow+pr2; y++) this.aiPath.push({x: 2, y});
for (let x = 3; x < cols - 2; x++) this.aiPath.push({x, y: aiStartRow+pr2});
for (let y = aiStartRow+pr2+1; y <= aiStartRow+pr3; y++) this.aiPath.push({x: cols-3, y});
for (let x = cols-4; x >= 0; x--) this.aiPath.push({x, y: aiStartRow+pr3});
```

### 4. `index.html`：UI Editor 新增 Grid 區塊

在現有 `.ue-divider`（重置按鈕上方）前新增：

```html
<hr class="ue-divider">
<div style="color:#4a9eff;font-size:11px;margin-bottom:6px;">⬛ 格子大小（重新開局生效）</div>
<div class="ue-row">
  <label>Cols</label>
  <input type="range" id="ue-cols" min="10" max="30" step="1" value="20">
  <input type="number" id="ue-cols-num" min="10" max="30" value="20">
  <span class="ue-unit">格</span>
</div>
<div class="ue-row">
  <label>Rows</label>
  <input type="range" id="ue-rows" min="5" max="15" step="1" value="10">
  <input type="number" id="ue-rows-num" min="5" max="15" value="10">
  <span class="ue-unit">格</span>
</div>
<div class="ue-row">
  <button id="ue-grid-save" style="flex:1;background:#0f3460;border:1px solid #4a9eff;color:#4a9eff;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">💾 儲存格子設定</button>
  <span id="ue-grid-msg" style="font-size:10px;color:#4c4;display:none;margin-left:6px;">已儲存 ✓</span>
</div>
```

### 5. `index.html`：UI Editor JS 新增 grid 邏輯

在 `bindPair(...)` 呼叫後新增：

```js
// Grid dimension controls
const savedGrid = JSON.parse(localStorage.getItem('tdGridConfig') || '{}');
if (savedGrid.gridCols) {
  document.getElementById('ue-cols').value     = savedGrid.gridCols;
  document.getElementById('ue-cols-num').value = savedGrid.gridCols;
}
if (savedGrid.gridRows) {
  document.getElementById('ue-rows').value     = savedGrid.gridRows;
  document.getElementById('ue-rows-num').value = savedGrid.gridRows;
}

// Cols / Rows slider ↔ number sync (no live apply — save button only)
function syncPair(sliderId, numId) {
  const sl = document.getElementById(sliderId);
  const nm = document.getElementById(numId);
  sl.oninput = function() { nm.value = sl.value; };
  nm.oninput = function() {
    const v = Math.max(+sl.min, Math.min(+sl.max, +nm.value));
    sl.value = v; nm.value = v;
  };
}
syncPair('ue-cols', 'ue-cols-num');
syncPair('ue-rows', 'ue-rows-num');

document.getElementById('ue-grid-save').onclick = function() {
  const cols = +document.getElementById('ue-cols').value;
  const rows = +document.getElementById('ue-rows').value;
  localStorage.setItem('tdGridConfig', JSON.stringify({gridCols: cols, gridRows: rows}));
  const msg = document.getElementById('ue-grid-msg');
  msg.style.display = 'inline';
  setTimeout(function() { msg.style.display = 'none'; }, 2000);
};
```

---

## 注意事項

- `Math.floor(rows / 3)` 和 `Math.floor(rows * 2 / 3)` 在 rows=10 時精確為 3、6，完全向後相容。
- AI 路徑的 `aiGrid` 不存在——AI 路徑繪製用 `aiPath` 陣列，不需要另建 aiGrid。
- 儲存後「已儲存 ✓」提示出現 2 秒後消失。
- 重置按鈕需要一同重置格子 slider 為預設值 20/10，但**不刪除 localStorage**（使用者可能只想重置 bar 高度）。若需要完全重置，可加一個清除按鈕。
- Execute 時先讀 `initGrid()` 全段確認實際行號再 Edit（路徑程式碼跨多行）。
