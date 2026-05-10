# Step 2：塔列表過濾 + Index 映射修正

## 目標檔案
`skill-editor.html`

## 影響範圍
- `renderList()` towers 分支（L387-517）：加入 `getActiveElems()` 過濾條件
- `getTowerByFlatIdx()` (L534-590)：同步加入相同過濾條件，維持 flat index 一致性

---

## 修改說明

### A. renderList() — 元素塔 Lv1-2 段（L412）

**定位**：`for (const elem of ELEM_KEYS)` 迴圈（L412，「元素塔 Lv1-2」段）

修改為：
```javascript
for (const elem of getActiveElems()) {   // 改這行
  const t = editData.towers[elem];
  if (!t) continue;
  // ... 其餘不動
```

### B. renderList() — ELEM_BASE Lv3 段（L432）

**定位**：`for (const elem of ELEM_KEYS)` 迴圈（L432，「元素基底 Lv3」段）

修改為：
```javascript
for (const elem of getActiveElems()) {   // 改這行
  for (const base of BASIC_KEYS) {
    // ... 其餘不動
```

### C. renderList() — INFUSIONS Lv4 段（L446-L463）

**定位**：外層 `for (const baseElem of ELEM_KEYS)` 和內層 `for (const injElem of ELEM_KEYS)`（L446, L451）

修改為：
```javascript
for (const baseElem of getActiveElems()) {   // 改這行
  const hdr = ...
  panel.appendChild(hdr);
  for (const injElem of getActiveElems()) {  // 改這行
    const inf = editData.infusions[baseElem]?.[injElem];
    if (!inf || !inf.lv4) continue;
    // ... 其餘不動
```

### D. renderList() — TRIPLE Lv5 段（L470）

**定位**：`for (const [key, triple] of Object.entries(editData.tripleTowers))` 迴圈（L470）

在 `if (!triple.lv5) continue;` **之後**，加入過濾：
```javascript
for (const [key, triple] of Object.entries(editData.tripleTowers)) {
  if (!triple.lv5) continue;
  // 新增：過濾所有元素都在 activeElems 中的組合
  const keyElems = key.split('_');
  const active = getActiveElems();
  if (!keyElems.every(e => active.includes(e))) continue;   // ← 插入這行
  // ... 其餘不動
```

### E. renderList() — PURE Lv5 段（L487）

**定位**：`for (const [elem, pure] of Object.entries(editData.pureTowers))` 迴圈（L487，純屬塔 Lv5）

在 `if (!pure.lv5) continue;` **之後**加入：
```javascript
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv5) continue;
  if (!getActiveElems().includes(elem)) continue;   // ← 插入這行
  // ... 其餘不動
```

### F. renderList() — PURE Lv6 段（L505）

**定位**：`for (const [elem, pure] of Object.entries(editData.pureTowers))` 迴圈（L505，純屬塔 Lv6）

在 `if (!pure.lv6) continue;` **之後**加入：
```javascript
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  if (!getActiveElems().includes(elem)) continue;   // ← 插入這行
  // ... 其餘不動
```

### G. renderList() — 過濾後空區塊標題處理

各 chapter-divider 標題若對應段落全部被過濾（如「🔥 火底注入 Lv4」但火未啟用），標題仍會顯示但無項目，視覺上稍顯冗餘。

解法：INFUSIONS 的 chapter header 改成**先判斷有無可見塔再插入**：
```javascript
for (const baseElem of getActiveElems()) {
  // 先計算這個 baseElem 有幾個可見注入
  const visibleInjs = getActiveElems().filter(injElem => {
    const inf = editData.infusions[baseElem]?.[injElem];
    return inf && inf.lv4;
  });
  if (visibleInjs.length === 0) continue;   // 無可見注入，跳過整個區塊（含標題）

  const hdr = document.createElement('div');
  hdr.className = 'chapter-divider';
  hdr.textContent = `${ELEM[baseElem].icon} ${ELEM[baseElem].name}底注入 Lv4`;
  panel.appendChild(hdr);

  for (const injElem of visibleInjs) {
    // ... 渲染列表項目
```

---

### H. getTowerByFlatIdx() — 同步過濾（L534-590）

**定位**：`getTowerByFlatIdx()` 函數，與 `renderList()` 使用相同的迴圈結構

每個迴圈的 `ELEM_KEYS` 替換為 `getActiveElems()`，TRIPLE/PURE 加入相同過濾判斷：

```javascript
// Lv1-2 元素塔
for (const elem of getActiveElems()) { ... }   // L542 改

// ELEM_BASE Lv3
for (const elem of getActiveElems()) {          // L551 改
  for (const base of BASIC_KEYS) { ... }

// INFUSIONS Lv4
for (const baseElem of getActiveElems()) {      // L557 改
  for (const injElem of getActiveElems()) {     // L558 改
    const inf = editData.infusions[baseElem]?.[injElem];
    if (!inf || !inf.lv4) continue;
    // ... 其餘不動

// TRIPLE Lv5（L565 附近）
for (const [key, triple] of Object.entries(editData.tripleTowers)) {
  const keyElems = key.split('_');
  if (!keyElems.every(e => getActiveElems().includes(e))) continue;  // ← 插入
  if (!triple.lv5) continue;
  // ...

// PURE Lv5 / Lv6（L576 附近）
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!getActiveElems().includes(elem)) continue;  // ← 插入
  // lv5 / lv6 判斷...
```

---

## 驗證
- 預設全選：塔列表長度與修改前完全一致
- 只啟用火水風：
  - 元素塔 Lv1-2：3 個元素 × 各自層數
  - 元素基底 Lv3：6 種（3 元素 × 2 基底）
  - INFUSIONS Lv4：最多 9 種（3×3，但只有 INFUSIONS 有定義的才出現）
  - TRIPLE Lv5：只有 key 全為火/水/風的組合（最多 1 種：fire_water_wind）
  - PURE Lv5/Lv6：各 3 種
- 點選各塔，右側 edit panel 正確顯示對應塔資料
- 切換元素開關後，已選中的塔若被隱藏 → selectedIdx 自動 deselect（-1）
- 重新啟用元素，資料（技能/數值）完整保留
