# step5：toggleSkill 改用 enabled flag（保留 params）

**目標檔案**：`skill-editor.html`
**影響範圍**：`toggleSkill()`、技能 checkbox 渲染、input disabled 條件

---

## 修改一：toggleSkill

```js
// ❌ 舊
if (checked) {
    if (!unit.skills.find(s => s.type === type)) {
        unit.skills.push({ type, enabled: true, params: { ...SKILL_DEFS[type].defaults }, scoreWeight: 1.0 });
    }
} else {
    unit.skills = unit.skills.filter(s => s.type !== type);
}

// ✅ 新
if (checked) {
    const existing = unit.skills.find(s => s.type === type);
    if (existing) {
        existing.enabled = true;
    } else {
        unit.skills.push({ type, enabled: true, params: { ...SKILL_DEFS[type].defaults }, scoreWeight: 1.0 });
    }
} else {
    const sk = unit.skills.find(s => s.type === type);
    if (sk) sk.enabled = false;
}
```

---

## 修改二：技能渲染（renderEditor 技能區）

checkbox checked 條件和 input disabled 條件都要更新：

```js
// ❌ 舊
const active = unit.skills && unit.skills.find(s => s.type === sk.key);
const checked = active ? 'checked' : '';
// ...
${!active ? 'disabled' : ''}

// ✅ 新
const active = unit.skills && unit.skills.find(s => s.type === sk.key);
const isEnabled = active && active.enabled;
const checked = isEnabled ? 'checked' : '';
// ...
${!isEnabled ? 'disabled' : ''}
```

注意：`params` 的初始值仍來自 `active`（只要物件存在就用已儲存的參數）：
```js
const params = active ? { ...sk.defaults, ...active.params } : sk.defaults;
```
這行不變，確保即使 `enabled=false`，再次開啟時顯示的仍是已儲存的 params。

`scoreWeight` 也類似：
```js
const sw = active ? (active.scoreWeight !== undefined ? active.scoreWeight : 1.0) : 1.0;
```
不變。

---

## 定位流程

1. Grep `const active = unit.skills` in renderEditor → 找 skills 渲染區行號
2. Read ±5 行確認
3. Edit：把 `const checked = active ? 'checked' : ''` 改為兩行（isEnabled）
4. Edit：把兩處 `${!active ? 'disabled' : ''}` 改為 `${!isEnabled ? 'disabled' : ''}`
5. Grep `function toggleSkill` → Edit toggleSkill 函數體

---

## 驗證

1. 開啟塔，勾選越攻越快，把 perHit 改成 0.1
2. 取消勾選 → checkbox 變空
3. 重新勾選 → perHit 應仍是 0.1（不是預設值）
4. 分數面板正確反映開/關狀態
