# Step 1：activeElems 資料層 + 設定頁「元素開關」UI

## 目標檔案
`skill-editor.html`

## 影響範圍
- `editData` 初始化（新增 `config.activeElems`）
- 新增 `getActiveElems()` helper function
- `renderConfigPanel()` 新增「元素開關」區塊（在 elemAdv 矩陣之前）
- `setElemAdv()` 相關的矩陣渲染改為只顯示 activeElems 範圍
- `exportConfig()` 加入 `activeElems` 輸出

---

## 修改說明

### A. editData 初始化加入 activeElems

**定位**：找 `editData = {` 的 `config:` 區塊（約 L110-135 附近）

在 `config:` 物件內加入：
```javascript
activeElems: [...ELEM_KEYS],   // 預設全開，與 ELEM_KEYS 保持同步
```

### B. 新增 helper function

在 `setElemAdv()` 函數（L1467）**之前**插入：
```javascript
function getActiveElems() {
  return editData.config.activeElems ?? [...ELEM_KEYS];
}

function toggleElem(elemKey, enabled) {
  const cur = editData.config.activeElems;
  if (enabled) {
    if (!cur.includes(elemKey)) cur.push(elemKey);
    // 維持 ELEM_KEYS 的順序
    editData.config.activeElems = ELEM_KEYS.filter(e => cur.includes(e));
  } else {
    editData.config.activeElems = cur.filter(e => e !== elemKey);
  }
  // 切換元素後重繪：設定頁（矩陣縮小）+ 若在塔頁則 deselect 並重繪
  renderConfigPanel();
  if (currentTab === 'towers') {
    selectedIdx = -1;
    renderList();
    renderEditor();
  }
}
```

### C. renderConfigPanel() 新增「元素開關」區塊

**定位**：`renderConfigPanel()` 函數（L1385），找到 `元素克制 (elemAdv)` 的 html 段落（L1440 附近），在其**之前**插入元素開關 HTML：

```javascript
// === 元素開關 ===
html += '<div class="section"><h3>🧩 啟用元素</h3>';
html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">';
for (const ek of ELEM_KEYS) {
  const isActive = getActiveElems().includes(ek);
  const el = ELEM[ek];
  html += `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 8px;border:1px solid ${isActive ? '#4ecdc4' : '#444'};border-radius:4px;background:${isActive ? '#1a2a3a' : '#111'};">
    <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleElem('${ek}', this.checked)" style="width:14px;height:14px;">
    ${el.icon} ${el.name}
  </label>`;
}
html += '</div></div>';
```

### D. elemAdv 矩陣縮小為 activeElems 範圍

**定位**：L1440-1465 的 elemAdv 矩陣雙層迴圈

將兩個迴圈的 `ELEM_KEYS` 改為 `getActiveElems()`：
```javascript
// 原來：for (const atk of ELEM_KEYS)
for (const atk of getActiveElems()) {
  // ...
  // 原來：for (const def of ELEM_KEYS)
  for (const def of getActiveElems()) {
```

### E. exportConfig 加入 activeElems

**定位**：config export 區塊（約 L1594 附近，`elemAdv:` 的位置）

在 `elemAdv` 輸出之前加入：
```javascript
const activeArr = editData.config.activeElems ?? [...ELEM_KEYS];
lines.push('  activeElems: ' + JSON.stringify(activeArr) + ',');
```

---

## 驗證
- 開啟設定頁，頂部出現 6 個元素勾選框（預設全勾）
- 取消勾選「土」，elemAdv 矩陣縮小為 5×5
- 切換到塔頁不受影響（step2 才改塔頁過濾）
- 重新勾選「土」，矩陣恢復 6×6
