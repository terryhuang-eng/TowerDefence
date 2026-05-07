# Step 2 — skill-editor.html 同步修正（3 處）

## 目標
修正 skill-editor.html 的匯出與 UI，使其與 towers.js 現行格式完全對應。

## 影響範圍
- **檔案**：`skill-editor.html`
- **修改點**：A（INFUSIONS 匯出）、B（PURE_TOWERS 匯出）、C（PURE_TOWERS UI）

---

## 修改 A — INFUSIONS 匯出加入 score_adj

**定位**：Grep `lv4DmgPart` 找到匯出行。

**現況**（skill-editor.html 匯出 INFUSIONS 的 lv4 那行）：
```javascript
lines.push(`      lv4: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}${lv4DmgPart}, desc: '${lv.desc}',`);
```

**修改後**（在 cost 後加入 score_adj，若有的話）：
```javascript
const lv4ScoreAdj = lv.score_adj !== undefined ? `, score_adj: ${lv.score_adj}` : '';
lines.push(`      lv4: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}${lv4ScoreAdj}${lv4DmgPart}, desc: '${lv.desc}',`);
```

注意：`lv4ScoreAdj` 的宣告要插在 `lv4DmgPart` 宣告之後、push 之前。

---

## 修改 B — PURE_TOWERS 匯出加入 lv5

**定位**：Grep `PURE_TOWERS — Lv6` 找到匯出區段。

**現況**：
```javascript
lines.push('// PURE_TOWERS — Lv6 純屬塔（同元素×3 + 精華）');
// ...
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  const lv = pure.lv6;
  if (!lv) continue;
  lines.push(`  ${elem}: { name: '${pure.name}', icon: '${pure.icon}',`);
  const lv6DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';
  lines.push(`    lv6: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}${lv6DmgPart}, desc: '${lv.desc}',`);
  lines.push(`      skills: ${fmtSkills(lv.skills)} },`);
  lines.push(`  },`);
}
```

**修改後**（注釋更新 + 加入 lv5 匯出）：
```javascript
lines.push('// PURE_TOWERS — Lv5 純屬強化 / Lv6 純屬終極（同元素×3 + 精華）');
// ...
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  lines.push(`  ${elem}: { name: '${pure.name}', icon: '${pure.icon}',`);
  // lv5（純屬強化，若存在）
  if (pure.lv5) {
    const lv5 = pure.lv5;
    const lv5DmgPart = lv5.dmgType ? `, dmgType: '${lv5.dmgType}'` : '';
    lines.push(`    lv5: { damage: ${lv5.damage}, atkSpd: ${lv5.atkSpd}, range: ${lv5.range}, aoe: ${lv5.aoe}, cost: ${lv5.cost}${lv5DmgPart}, desc: '${lv5.desc}',`);
    lines.push(`      skills: ${fmtSkills(lv5.skills)} },`);
  }
  // lv6（純屬終極）
  const lv6 = pure.lv6;
  const lv6DmgPart = lv6.dmgType ? `, dmgType: '${lv6.dmgType}'` : '';
  lines.push(`    lv6: { damage: ${lv6.damage}, atkSpd: ${lv6.atkSpd}, range: ${lv6.range}, aoe: ${lv6.aoe}, cost: ${lv6.cost}${lv6DmgPart}, desc: '${lv6.desc}',`);
  lines.push(`      skills: ${fmtSkills(lv6.skills)} },`);
  lines.push(`  },`);
}
```

---

## 修改 C — PURE_TOWERS 側欄列表與編輯 panel 加入 lv5

### C1 — 側欄列表加入 lv5 入口

**定位**：Grep `純屬塔 Lv6` 找到側欄標題附近。

**現況**（側欄只列 lv6）：
```javascript
const pureHdr = document.createElement('div');
pureHdr.textContent = '純屬塔 Lv6';
panel.appendChild(pureHdr);
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  const lv = pure.lv6;
  // ... 建立 item ...
  item.innerHTML = `<span>${pure.icon} ${pure.name}</span>...`;
```

**修改後**：分兩段列出 lv5 與 lv6：
```javascript
// === 純屬塔 Lv5 ===
const pure5Hdr = document.createElement('div');
pure5Hdr.className = 'chapter-divider';
pure5Hdr.textContent = '純屬塔 Lv5（強化）';
panel.appendChild(pure5Hdr);
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv5) continue;
  const lv = pure.lv5;
  const sc = lv.skills ? lv.skills.length : 0;
  const item = document.createElement('div');
  item.className = 'tower-item';
  item.innerHTML = `<span>${ELEM_ICONS[elem] || ''}${ELEM_ICONS[elem] || ''} ${pure.name} Lv5</span><span class="skills-count">${sc > 0 ? sc + '技能' : ''}</span>`;
  item.onclick = () => selectTower('pure5_' + elem);
  panel.appendChild(item);
}

// === 純屬塔 Lv6 ===
const pureHdr = document.createElement('div');
pureHdr.className = 'chapter-divider';
pureHdr.textContent = '純屬塔 Lv6（終極）';
panel.appendChild(pureHdr);
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  const lv = pure.lv6;
  const sc = lv.skills ? lv.skills.length : 0;
  const item = document.createElement('div');
  item.className = 'tower-item';
  item.innerHTML = `<span>${pure.icon} ${pure.name}</span><span class="skills-count">${sc > 0 ? sc + '技能' : ''}</span>`;
  item.onclick = () => selectTower('pure_' + elem);
  panel.appendChild(item);
}
```

注意：需確認 skill-editor 中有 `ELEM_ICONS` 或類似 mapping，否則用 element 名稱代替。先 Grep `ELEM_ICONS` 確認。

### C2 — `selectTower` / `getTowerObj` 加入 pure5 識別

**定位**：Grep `getTowerObj\|selectTower\|pure_` 找到目前的 pure 塔物件取得邏輯。

**現況**（只處理 `pure_` 前綴）：
```javascript
for (const [elem, pure] of Object.entries(editData.pureTowers)) {
  if (!pure.lv6) continue;
  if (i === idx) { const o = pure.lv6; ... return o; }
```

**修改後**：加入 `pure5_` 前綴對應 lv5：
在 pure 塔的迭代之前，先加入 pure5 的迭代：
```javascript
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

---

## 執行注意事項
- 先 Grep 找精確行號，Read ±10 行確認 context 再 Edit
- 修改 C 較複雜，需先確認 ELEM_ICONS 的存在與格式
- 所有修改在同一個檔案 skill-editor.html，但分 3 個邏輯區塊執行
