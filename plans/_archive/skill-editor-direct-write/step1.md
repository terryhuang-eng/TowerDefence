# step1：修正匯出品質

## 目標

修正 `skill-editor.html` 的 `exportTowers()` 兩個問題：
1. ELEM_BASE 的輸出位置錯誤（應在 TOWERS 後、INFUSIONS 前）
2. `fmtSkills()` 遺漏與 default 相同的 params（如 `targets:2`）

## 修改檔案

`skill-editor.html` 只動這一個檔

---

## Fix A：ELEM_BASE 移到 INFUSIONS 之前

### 背景

`towers.js` 實際順序：
```
ELEM → BASIC_TOWERS → BASIC_KEYS → TOWERS → ELEM_BASE → INFUSIONS → TRIPLE_TOWERS → PURE_TOWERS
```

`exportTowers()` 目前順序：
```
ELEM → BASIC_TOWERS → TOWERS → INFUSIONS → TRIPLE_TOWERS → PURE_TOWERS → ELEM_BASE  ← 錯
```

### 做法

1. 在 `exportTowers()` 的 TOWERS 區塊結尾（L1045, `lines.push('');`）之後、INFUSIONS 區塊（L1047 `// INFUSIONS`）之前，**插入**整個 ELEM_BASE 輸出區塊。

2. **刪除**原本在 PURE_TOWERS 之後（L1111-末尾）的 ELEM_BASE 區塊。

### 插入位置（在 L1045 後插入）

```javascript
  // ELEM_BASE
  lines.push('// ============================================================');
  lines.push('// ELEM_BASE — Lv3 元素基底塔（單元素，依箭/砲基底區分）');
  lines.push('// Lv2 基礎塔 + 1 元素 pick → 轉為元素塔');
  lines.push('// ============================================================');
  lines.push('const ELEM_BASE = {');
  for (const elem of ELEM_KEYS) {
    lines.push(`  ${elem}: {`);
    for (const base of BASIC_KEYS) {
      const eb = editData.elemBase[elem][base];
      const dmgTypePart = eb.dmgType ? `, dmgType: '${eb.dmgType}'` : '';
      lines.push(`    ${base}:  { name: '${eb.name}', icon: '${eb.icon}', damage: ${eb.damage}, atkSpd: ${eb.atkSpd}, range: ${eb.range}, aoe: ${eb.aoe}, cost: ${eb.cost}${dmgTypePart}, desc: '${eb.desc}',`);
      lines.push(`      skills: ${fmtSkills(eb.skills)} },`);
    }
    lines.push(`  },`);
  }
  lines.push('};');
  lines.push('');
```

---

## Fix B：fmtSkills 輸出全部 params

### 背景

目前 L825-838：
```javascript
function fmtSkills(skills) {
  if (!skills || skills.length === 0) return '[]';
  const parts = skills.map(s => {
    const defs = SKILL_DEFS[s.type].defaults;
    const customParams = {};
    for (const [k, v] of Object.entries(s.params)) {
      if (v !== defs[k]) customParams[k] = v;  // 只匯出「非預設值」← 問題根源
    }
    if (Object.keys(customParams).length === 0) return `makeSkill('${s.type}')`;
    const pStr = JSON.stringify(customParams).replace(/"(\w+)":/g, '$1:');
    return `makeSkill('${s.type}',${pStr})`;
  });
  return '[' + parts.join(', ') + ']';
}
```

對 `chain` 技能（`defaults: { targets: 2, decay: 0.7 }`），若 tower 使用 `targets:2, decay:0.5`：
- `targets:2` 與 default 相同 → 被濾掉
- 匯出：`makeSkill('chain',{decay:0.5})` — 遺失 targets

### 做法

改為輸出 **所有 params**，不過濾 default：

```javascript
function fmtSkills(skills) {
  if (!skills || skills.length === 0) return '[]';
  const parts = skills.map(s => {
    const allParams = s.params || {};
    if (Object.keys(allParams).length === 0) return `makeSkill('${s.type}')`;
    const pStr = JSON.stringify(allParams).replace(/"(\w+)":/g, '$1:');
    return `makeSkill('${s.type}',${pStr})`;
  });
  return '[' + parts.join(', ') + ']';
}
```

### 注意

- `makeSkill(type, params)` 在 towers.js 中使用 `Object.assign({}, defaults, params)` 合併，輸出 full params 不影響功能
- number formatting（2.0 → 2）不在此處理，JSON.stringify 本身就會去掉小數 — 這是已知視覺差異，功能等效，不修正

## 執行後驗證

1. 在 skill-editor.html 的 towers tab 按「📋 複製 towers.js」
2. 確認 ELEM_BASE 出現在 INFUSIONS 之前
3. 找雷爆塔（chain skill）確認 `targets:2` 出現在匯出結果中
