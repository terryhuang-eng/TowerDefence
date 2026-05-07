# Step 2：skill-editor.html — 加入 dmgType 編輯欄位 + 匯出支援

## 目標

在 skill-editor 的 towers tab 編輯面板中，加入 `dmgType` select 欄位，
讓設計者可以在 UI 中為每個塔選擇傷害元素類型。
同時修改 `exportTowers()` 讓匯出的 towers.js 包含 `dmgType`。

## 影響範圍

**檔案：skill-editor.html**

改動位置：
1. `getFieldsForTab()` — towers tab 欄位定義加入 `dmgType`
2. `exportTowers()` 的 ELEM_BASE 匯出段 — 加入 `dmgType`

---

## 修改說明

### 1. getFieldsForTab() — towers tab

**目前（L471-479）：**
```js
if (currentTab === 'towers') return [
  { key:'damage', label:'傷害', type:'number' },
  { key:'atkSpd', label:'攻速', type:'number' },
  { key:'range', label:'射程', type:'number' },
  { key:'aoe', label:'AOE', type:'number' },
  { key:'cost', label:'費用', type:'number' },
  { key:'desc', label:'描述', type:'text' },
];
```

**修改後：**
```js
if (currentTab === 'towers') return [
  { key:'damage', label:'傷害', type:'number' },
  { key:'atkSpd', label:'攻速', type:'number' },
  { key:'range', label:'射程', type:'number' },
  { key:'aoe', label:'AOE', type:'number' },
  { key:'cost', label:'費用', type:'number' },
  { key:'dmgType', label:'傷害元素', type:'select', forceShow: true, default: null,
    options: [
      { value: '', label: '（預設/基底元素）' },
      ...ELEM_KEYS.map(e => ({ value: e, label: ELEM[e].icon + ' ' + ELEM[e].name }))
    ]
  },
  { key:'desc', label:'描述', type:'text' },
];
```

注意：`forceShow: true` 讓即使塔沒有 `dmgType` 欄位也顯示（新增用）。

### 2. updateField() — 空字串處理

`dmgType` 選「預設」時值為 `''`（空字串），需轉為 `null`：

**目前（L485-492）：**
```js
function updateField(key, value, type) {
  const unit = getSelectedUnit();
  if (!unit) return;
  if (type === 'number') unit[key] = parseFloat(value) || 0;
  else if (type === 'bool') unit[key] = value === 'true';
  else unit[key] = value;
  renderList();
}
```

**修改後：**
```js
function updateField(key, value, type) {
  const unit = getSelectedUnit();
  if (!unit) return;
  if (type === 'number') unit[key] = parseFloat(value) || 0;
  else if (type === 'bool') unit[key] = value === 'true';
  else if (type === 'select') unit[key] = value === '' ? null : value;
  else unit[key] = value;
  renderList();
}
```

### 3. exportTowers() — ELEM_BASE 匯出段

**目前（L897-900）：**
```js
lines.push(`    ${base}:  { name: '${eb.name}', icon: '${eb.icon}', damage: ${eb.damage}, atkSpd: ${eb.atkSpd}, range: ${eb.range}, aoe: ${eb.aoe}, cost: ${eb.cost}, desc: '${eb.desc}',`);
lines.push(`      skills: ${fmtSkills(eb.skills)} },`);
```

**修改後：**
```js
const dmgTypePart = eb.dmgType ? `, dmgType: '${eb.dmgType}'` : '';
lines.push(`    ${base}:  { name: '${eb.name}', icon: '${eb.icon}', damage: ${eb.damage}, atkSpd: ${eb.atkSpd}, range: ${eb.range}, aoe: ${eb.aoe}, cost: ${eb.cost}${dmgTypePart}, desc: '${eb.desc}',`);
lines.push(`      skills: ${fmtSkills(eb.skills)} },`);
```

只有 `dmgType` 非 null 時才輸出，保持 towers.js 的簡潔（null 不寫入）。

---

## UI 顯示效果

towers 編輯面板的「基本屬性」區塊中，Lv3 砲塔（及所有塔）會多出：

```
傷害元素
[（預設/基底元素）▼]   ← select，可選 🔥火 / 💧水 / ⛰️土 / 🌪️風 / ⚡雷 / ⬜無
```

---

## 依賴

- 依賴 step1（towers.js 的 ELEM_BASE 有 `dmgType: null` 欄位）
  - 若 step1 未執行，`forceShow: true` 仍可正常顯示，UI 可手動設定

## 限制

- 此步驟**只處理 ELEM_BASE** 的匯出（與 step1 對應）
- INFUSIONS/TRIPLE/PURE 若也需 dmgType 可另立步驟擴充
- `dmgType` 只影響 towers.js 資料，game.js 邏輯在 step3 處理
