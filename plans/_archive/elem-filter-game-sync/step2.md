# Step 2：js/game.js — 元素持有顯示面板過濾

## 目標檔案
`js/game.js`

## 影響範圍
- 側欄元素持有顯示（L600）：只顯示 activeElems 的元素

---

## 修改說明

**定位**：`const elemsHtml = ELEM_KEYS.map(e => {`（約 L600）

修改前：
```javascript
const elemsHtml = ELEM_KEYS.map(e => {
  const count = this.elemPicks[e];
  if (count === 0) return `<span class="elem-tag" style="background:#33333322;border-color:#555;color:#555">${ELEM[e].icon} ${ELEM[e].name} ×0</span>`;
  return `<span class="elem-tag" style="background:${ELEM[e].color}22;border-color:${ELEM[e].color};color:${ELEM[e].color}">${ELEM[e].icon} ${ELEM[e].name} ×${count}</span>`;
}).join('');
```

修改後：
```javascript
const elemsHtml = getActiveKeys().map(e => {
  const count = this.elemPicks[e];
  if (count === 0) return `<span class="elem-tag" style="background:#33333322;border-color:#555;color:#555">${ELEM[e].icon} ${ELEM[e].name} ×0</span>`;
  return `<span class="elem-tag" style="background:${ELEM[e].color}22;border-color:${ELEM[e].color};color:${ELEM[e].color}">${ELEM[e].icon} ${ELEM[e].name} ×${count}</span>`;
}).join('');
```

> 只改 `ELEM_KEYS.map` → `getActiveKeys().map`，其餘不動。
> `activeElems: null` 時 `getActiveKeys()` fallback 全元素，顯示不變。

---

## 驗證
- `activeElems: ['fire','water','wind']` → 面板只顯示火/水/風三格，無土/雷/無
- `activeElems: null` → 面板顯示全 6 元素，行為不變
