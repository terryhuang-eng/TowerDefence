# Step 5：export 更新（scoreTarget + scoreWeight）

**目標**：讓 skill-editor export 時，把 `scoreTarget` 寫入塔等級資料、`scoreWeight` 寫入技能實例

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/skill-editor.html`

---

## 背景

兩個 export 面向：

1. **塔等級** — 各層級結構（BASIC lv1/2、ELEM_BASE、INFUSIONS lv4、TRIPLE lv5、PURE lv6）
   - 現在不含 `scoreTarget`
   - 需：若 `scoreTarget` 有值（> 0），條件輸出 `scoreTarget: N`

2. **技能實例** — `fmtSkills(skills)` 函數
   - 現在輸出：`{ type: '...', enabled: true, params: {...} }`
   - 需：若技能有 `scoreWeight` 且 ≠ 1.0，條件輸出 `scoreWeight: N`

---

## 定位方法

### A. fmtSkills（約 619 行）
Grep: `function fmtSkills` → 找行號
Read ±15 行確認整個函數

### B. BASIC_TOWERS export（約 813 行）
Grep: `skills: \$\{fmtSkills\(lv\.skills\)\}, desc:` → 找 BASIC export 行號
Read ±3 行確認

### C. ELEM_BASE export（約 909 行）
Grep: `skills: \$\{fmtSkills\(eb\.skills\)\}` → 找行號

### D. INFUSIONS lv4（約 855 行）, TRIPLE lv5（約 874 行）, PURE lv6（約 891 行）
（已知行號，+1 因 step4 已各加一行）

---

## 具體修改

### A. fmtSkills — 條件輸出 scoreWeight

舊（約 619-626 行）：
```javascript
function fmtSkills(skills) {
  if (!skills || skills.length === 0) return '[]';
  const parts = skills.map(s => {
    ...
```

在每個技能物件輸出加 scoreWeight：

```javascript
function fmtSkills(skills) {
  if (!skills || skills.length === 0) return '[]';
  const parts = skills.map(s => {
    const swPart = (s.scoreWeight !== undefined && s.scoreWeight !== 1.0) ? `, scoreWeight: ${s.scoreWeight}` : '';
    // 原有的 return 字串中加入 swPart（位置：在 params 之後）
```

Read 整個 fmtSkills 函數確認現有 return 格式，再針對性 Edit 插入 swPart。

### B. BASIC_TOWERS export（Lv1/Lv2）

Grep: `skills: \$\{fmtSkills\(lv\.skills\)\}, desc:` 找行號，確認是 BASIC 區段。

舊：
```javascript
lines.push(`      { damage: ${lv.damage}, ..., skills: ${fmtSkills(lv.skills)}, desc: '${lv.desc}' },`);
```

新：
```javascript
const lvScorePart = lv.scoreTarget ? `, scoreTarget: ${lv.scoreTarget}` : '';
lines.push(`      { damage: ${lv.damage}, ..., skills: ${fmtSkills(lv.skills)}${lvScorePart}, desc: '${lv.desc}' },`);
```

### C. ELEM_BASE export（約 909 行）

Grep: `skills: \$\{fmtSkills\(eb\.skills\)\} \}` 找行號。

新：
```javascript
const ebScorePart = eb.scoreTarget ? `, scoreTarget: ${eb.scoreTarget}` : '';
lines.push(`      skills: ${fmtSkills(eb.skills)}${ebScorePart} },`);
```

### D. INFUSIONS lv4、TRIPLE lv5、PURE lv6（分別找行號）

對 `skills: ${fmtSkills(lv.skills)} }` 這類行加 scoreTarget 條件輸出，模式相同。

---

## 注意

- fmtSkills 的 return 字串格式需先 Read 確認，再插入 `swPart`
- scoreTarget 位置：放在 skills 之後、desc 之前（或末尾，視現有格式）
- scoreWeight 不等於 1.0 才輸出（避免 export 雜訊）
- scoreTarget 等於 0 或 undefined 不輸出

---

## 影響範圍

只影響 export 輸出字串。不影響遊戲邏輯（game.js 不讀取 scoreTarget/scoreWeight）。
