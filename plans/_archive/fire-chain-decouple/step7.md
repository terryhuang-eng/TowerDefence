# step7 — 移除 foldedIntoDPS，讓 burn 回歸正常評分

## 根本原因

foldedIntoDPS 設計造成「有傷害的技能分數顯示 0」，邏輯對使用者不透明。
DPS 基礎分與技能附加分本來就是不同池，不存在重複計分問題。

## 影響範圍

- `js/skills.js`：burn 移除 `foldedIntoDPS: true`
- `skill-editor.html`：移除 foldedIntoDPS 早返回；effectiveDPS 移除 dotBonus

## 具體修改

### 1. js/skills.js — burn 移除 foldedIntoDPS

```js
// 改前：
burn: { ..., foldedIntoDPS: true },
// 改後：
burn: { ... },  // 移除 foldedIntoDPS: true
```

### 2. skill-editor.html — 移除 foldedIntoDPS 早返回（約 977 行）

```js
// 刪除整個區塊：
// foldedIntoDPS：技能分已折入 effectiveDPS，本身不另計分
if (def.foldedIntoDPS) {
  const weight = (s.scoreWeight !== undefined) ? s.scoreWeight : 1.0;
  return { name: def.name, score: 0, weight, foldedIntoDPS: true };
}
```

### 3. skill-editor.html — effectiveDPS 移除 dotBonus（約 1008 行）

```js
// 改前：
const burnSkill    = skills.find(s => s.enabled && s.type === 'burn');
const dotBonus     = burnSkill ? (burnSkill.params?.dot ?? 0.3) : 0;
const effectiveDPS = Math.round(dpsRaw * aoeMultiplier * (1 + dotBonus) * 10) / 10;

// 改後：
const effectiveDPS = Math.round(dpsRaw * aoeMultiplier * 10) / 10;
```

## 預期效果

灼燒 ×1 → 25 pts（正常計分，與其他技能一致）
effectiveDPS 只含 DPS × AOE，不含 dotBonus（更透明）
