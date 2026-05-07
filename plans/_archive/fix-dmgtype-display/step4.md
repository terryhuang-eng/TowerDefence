# Step 4：skill-editor export 補入 dmgType 條件輸出（INFUSIONS/TRIPLE/PURE）

**目標**：讓 INFUSIONS/TRIPLE_TOWERS/PURE_TOWERS export 時，若有設定非 null 的 `dmgType`，能輸出到 towers.js

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/skill-editor.html`

---

## 背景

目前 export 模板：
- ELEM_BASE：已有條件輸出 `dmgType`（`const dmgTypePart = eb.dmgType ? ... : ''`）
- INFUSIONS lv4：無 dmgType
- TRIPLE_TOWERS lv5：無 dmgType
- PURE_TOWERS lv6：無 dmgType

---

## 定位方法

Grep: `lv4: { damage: \${lv.damage}` → 找 INFUSIONS export 行號
Grep: `lv5: { damage: \${lv.damage}` → 找 TRIPLE_TOWERS export 行號
Grep: `lv6: { damage: \${lv.damage}` → 找 PURE_TOWERS export 行號
Read ±3 行確認 context

---

## 具體修改

### INFUSIONS（約第 854 行）

舊：
```javascript
lines.push(`      lv4: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}, desc: '${lv.desc}',`);
```

新：
```javascript
const lv4DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';
lines.push(`      lv4: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}${lv4DmgPart}, desc: '${lv.desc}',`);
```

### TRIPLE_TOWERS（約第 872 行）

舊：
```javascript
lines.push(`    lv5: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}, desc: '${lv.desc}',`);
```

新：
```javascript
const lv5DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';
lines.push(`    lv5: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}${lv5DmgPart}, desc: '${lv.desc}',`);
```

### PURE_TOWERS（約第 888 行）

舊：
```javascript
lines.push(`    lv6: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}, desc: '${lv.desc}',`);
```

新：
```javascript
const lv6DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';
lines.push(`    lv6: { damage: ${lv.damage}, atkSpd: ${lv.atkSpd}, range: ${lv.range}, aoe: ${lv.aoe}, cost: ${lv.cost}${lv6DmgPart}, desc: '${lv.desc}',`);
```

---

## 影響範圍

只影響 skill-editor.html 的 export 函數，不影響遊戲邏輯。現有資料 dmgType 全為 null，export 行為無變化。
