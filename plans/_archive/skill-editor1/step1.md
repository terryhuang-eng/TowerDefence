# Step 1：`getSelectedUnit()` — 顯示修正

## 目標
當 LV4+ 塔的 `dmgType` 為 undefined 時，UI select 顯示基底元素，而不是 null（「預設/基底元素」）。

## 影響範圍
- **檔案**：`skill-editor.html`
- **函式**：`getSelectedUnit()`，行 435–456

## 目前程式碼（行 435-456）

```js
for (const baseElem of ELEM_KEYS) {
  for (const injElem of ELEM_KEYS) {
    const inf = editData.infusions[baseElem]?.[injElem];
    if (!inf || !inf.lv4) continue;
    if (i === idx) { const o = inf.lv4; if (o.dmgType === undefined) o.dmgType = null; return o; }
    i++;
  }
}
for (const [key, triple] of Object.entries(editData.tripleTowers)) {
  if (!triple.lv5) continue;
  if (i === idx) { const o = triple.lv5; if (o.dmgType === undefined) o.dmgType = null; return o; }
  i++;
}
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv5) continue;
  if (i === idx) { const o = pure.lv5; if (o.dmgType === undefined) o.dmgType = null; return o; }
  i++;
}
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  if (i === idx) { const o = pure.lv6; if (o.dmgType === undefined) o.dmgType = null; return o; }
  i++;
}
```

## 修改說明

4 處 `o.dmgType = null` → 改為基底元素：

| 位置 | 改為 |
|------|------|
| INFUSIONS | `o.dmgType = baseElem` |
| TRIPLE lv5 | `o.dmgType = key.split('_')[0]` |
| PURE lv5 | `o.dmgType = elem` |
| PURE lv6 | `o.dmgType = elem` |

## 修改後程式碼

```js
for (const baseElem of ELEM_KEYS) {
  for (const injElem of ELEM_KEYS) {
    const inf = editData.infusions[baseElem]?.[injElem];
    if (!inf || !inf.lv4) continue;
    if (i === idx) { const o = inf.lv4; if (o.dmgType === undefined) o.dmgType = baseElem; return o; }
    i++;
  }
}
for (const [key, triple] of Object.entries(editData.tripleTowers)) {
  if (!triple.lv5) continue;
  if (i === idx) { const o = triple.lv5; if (o.dmgType === undefined) o.dmgType = key.split('_')[0]; return o; }
  i++;
}
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv5) continue;
  if (i === idx) { const o = pure.lv5; if (o.dmgType === undefined) o.dmgType = elem; return o; }
  i++;
}
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  if (i === idx) { const o = pure.lv6; if (o.dmgType === undefined) o.dmgType = elem; return o; }
  i++;
}
```

## 驗證
開啟 skill-editor，切到 Towers tab → 點擊任一 LV4 infusion 塔 → 「傷害元素」select 應顯示對應的基底元素（如火底注入塔顯示「🔥 火」），而非「（預設/基底元素）」。
