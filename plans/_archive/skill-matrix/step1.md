# Step 1：Tab 定義 + CSS + buildAllTowers()

## 目標
在 skill-editor.html 加入：
1. 新 tab 入口 `skill-matrix`
2. 矩陣視角所需 CSS（橫向 scroll 表格、技能 badge、矩陣 cell）
3. `buildAllTowers()` helper + `smSelectedSkill` / `smView` 狀態變數

## 影響範圍
只修改 `skill-editor.html`，涉及 3 處：
- **CSS 區塊**（`</style>` 之前，約 line 73）
- **TABS 陣列**（約 line 152~157）
- **`<script>` 底部**（`init()` 呼叫前，約 line 161 之前）— 加入 helper + 狀態

---

## 具體修改

### A. CSS 新增（插入 line 73 `</style>` 之前）

```css
/* ── 技能矩陣 tab ── */
.sm-view-toggle { display:flex; gap:4px; margin-bottom:10px; }
.sm-view-toggle button { background:#1a1a3e; color:#888; border:1px solid #444; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:12px; }
.sm-view-toggle button.active { background:#1a2a4e; color:#4ecdc4; border-color:#4ecdc4; }
.sm-skill-badge { display:inline-block; min-width:18px; text-align:center; background:#1a3a5e; color:#4ecdc4; border-radius:10px; padding:1px 5px; font-size:10px; margin-left:4px; }
.sm-skill-badge.zero { background:#2a2a2a; color:#555; }
.sm-tower-row { padding:5px 8px; border-bottom:1px solid #1a1a3e; }
.sm-tower-row:hover { background:#1a1a3e; }
.sm-param-inline { display:inline-flex; gap:4px; flex-wrap:wrap; margin-left:8px; }
.sm-param-inline label { color:#aaa; font-size:10px; }
.sm-param-inline input { width:52px; background:#0a0a1e; color:#eee; border:1px solid #444; border-radius:3px; padding:2px 3px; font-size:10px; }
.sm-param-inline input:focus { border-color:#ffd93d; outline:none; }
.sm-matrix-wrap { overflow-x:auto; overflow-y:auto; flex:1; }
.sm-matrix { border-collapse:collapse; font-size:11px; white-space:nowrap; }
.sm-matrix th, .sm-matrix td { border:1px solid #2a2a3e; padding:3px 5px; }
.sm-matrix thead th { background:#1a1a3e; color:#4ecdc4; position:sticky; top:0; z-index:2; }
.sm-matrix thead th.sk-col { writing-mode:vertical-rl; text-orientation:mixed; min-width:28px; max-width:36px; color:#ffd93d; font-size:10px; vertical-align:bottom; height:80px; }
.sm-matrix tbody th { background:#111; color:#ccc; text-align:left; position:sticky; left:0; z-index:1; min-width:120px; }
.sm-matrix tbody tr:hover td, .sm-matrix tbody tr:hover th { background:#1a2a3a; }
.sm-matrix td.has-skill { background:#1a3a2a; color:#4fc; text-align:center; }
.sm-matrix td.no-skill { text-align:center; color:#333; }
.sm-group-row th { background:#0f1a2a !important; color:#95e1d3 !important; font-size:11px; font-style:italic; }
```

### B. TABS 陣列（line 152~157）

在 `{ id: 'config', label: '設定', category: 'none' }` 之前插入：

```js
  { id: 'skill-matrix', label: '技能矩陣', category: 'tower' },
```

### C. 狀態變數 + buildAllTowers()（插入 `let currentTab = 'waves';` 前，約 line 145）

```js
// ── skill-matrix 狀態 ──
let smSelectedSkill = null; // 選中的技能 key，null = 全部
let smView = 'skill';       // 'skill' | 'matrix'

// 回傳所有塔的扁平陣列（依 activeElems 篩選）
// 每項：{ label, icon, lv, groupLabel, unit, flatIdx }
function buildAllTowers() {
  const result = [];
  let flatIdx = 0;
  const actElems = getActiveElems();

  // 基礎塔
  for (const key of BASIC_KEYS) {
    const b = editData.basicTowers[key];
    b.levels.forEach((lv, li) => {
      result.push({ label: `${b.name} Lv${li+1}`, icon: b.icon, lv: `lv${li+1}`, groupLabel: '基礎塔', unit: lv, flatIdx });
      flatIdx++;
    });
  }
  // 元素塔 Lv1-2
  for (const elem of actElems) {
    const t = editData.towers[elem];
    if (!t) continue;
    t.levels.forEach((lv, li) => {
      if (lv === null) return;
      result.push({ label: `${t.name} Lv${li+1}`, icon: t.icon, lv: `lv${li+1}`, groupLabel: '元素塔 Lv1-2', unit: lv, flatIdx });
      flatIdx++;
    });
  }
  // 元素基底 Lv3
  for (const elem of actElems) {
    for (const base of BASIC_KEYS) {
      const eb = editData.elemBase[elem]?.[base];
      if (!eb) continue;
      result.push({ label: eb.name, icon: eb.icon, lv: 'lv3', groupLabel: '元素基底 Lv3', unit: eb, flatIdx });
      flatIdx++;
    }
  }
  // 注入 Lv4
  for (const baseElem of actElems) {
    for (const injElem of actElems) {
      const inf = editData.infusions[baseElem]?.[injElem];
      if (!inf || !inf.lv4) continue;
      result.push({ label: inf.name, icon: inf.icon, lv: 'lv4', groupLabel: `${ELEM[baseElem].icon}底注入 Lv4`, unit: inf.lv4, flatIdx });
      flatIdx++;
    }
  }
  // 三屬塔 Lv5
  for (const [key, triple] of Object.entries(editData.tripleTowers)) {
    if (!triple.lv5) continue;
    const keyElems = key.split('_');
    if (!keyElems.every(e => actElems.includes(e))) continue;
    result.push({ label: triple.name, icon: triple.icon, lv: 'lv5', groupLabel: '三屬塔 Lv5', unit: triple.lv5, flatIdx });
    flatIdx++;
  }
  // 純屬塔 Lv5（強化）
  for (const [elem, pure] of Object.entries(editData.pureTowers)) {
    if (!actElems.includes(elem) || !pure.lv5) continue;
    const eIcon = ELEM[elem]?.icon || elem;
    result.push({ label: `${pure.name} Lv5`, icon: eIcon+eIcon, lv: 'lv5', groupLabel: '純屬塔 Lv5', unit: pure.lv5, flatIdx });
    flatIdx++;
  }
  // 純屬塔 Lv6（終極）
  for (const [elem, pure] of Object.entries(editData.pureTowers)) {
    if (!actElems.includes(elem) || !pure.lv6) continue;
    result.push({ label: pure.name, icon: pure.icon, lv: 'lv6', groupLabel: '純屬塔 Lv6', unit: pure.lv6, flatIdx });
    flatIdx++;
  }
  return result;
}
```

### D. switchTab 函式：補 skill-matrix 分支（約 line 323~334）

在 `if (currentTab !== 'config')` 的 else 之前，找到 `renderList()` 呼叫後，確認 `renderExportBar()` 已有；不需額外改動（renderList 會 dispatch）。

---

## 定位流程（執行時必做）
1. `Grep "let currentTab"` → 找 line number
2. `Read ±10 行確認 context`
3. `Edit` 插入狀態變數 + buildAllTowers()
4. `Grep "{ id: 'config'"` → 找 TABS 陣列位置
5. `Edit` 插入新 tab 入口
6. `Grep "</style>"` → 找 CSS 結尾位置
7. `Edit` 插入新 CSS
