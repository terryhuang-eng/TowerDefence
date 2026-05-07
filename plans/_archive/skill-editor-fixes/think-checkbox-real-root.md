# THINK: checkbox 取消 bug 真正根因

**日期**：2026-05-04

---

## step1 的修正是錯誤的假設

`innerHTML +=` 確實是反模式，但不是這個 bug 的根因。
真正的問題在 `getTowerByFlatIdx`。

---

## 真正根因：getTowerByFlatIdx 回傳 spread copy

```js
// line 398（infusions lv4）
if (i === idx) { const o = inf.lv4; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }

// line 404（tripleTowers lv5）
if (i === idx) { const o = triple.lv5; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }

// line 409（pureTowers lv6）
if (i === idx) { const o = pure.lv6; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }
```

當 `o.dmgType === undefined` 時，回傳的是 `{ ...o, dmgType: null }` ——
這是一個**臨時 spread copy**，不存在於 `editData` 中。

---

## 為什麼 push（新增技能）可以、filter（移除技能）不行？

### 新增技能（push）

```js
unit.skills.push({ type, ... })
```

`unit` 是 spread copy，但 `unit.skills` 初始指向和 `o.skills` **同一個陣列**（shallow copy 的特性）。

`push` 就地修改陣列 → `o.skills`（在 editData 中）也被修改 ✓

### 移除技能（filter）

```js
unit.skills = unit.skills.filter(s => s.type !== type);
```

`filter` 建立**新陣列**並賦值給 `unit.skills`。
只改了臨時 copy 的 reference，`o.skills` 完全不受影響 ✗

`renderEditor()` 再次呼叫 `getSelectedUnit()` 時，
取回的是新 copy，`skills` 還是舊的 `o.skills`（技能還在），
checkbox 重新渲染為勾選 ✗

---

## 修法：直接改 o，不建立 copy

```js
// ❌ 現行
return o.dmgType === undefined ? { ...o, dmgType: null } : o;

// ✅ 修正
if (o.dmgType === undefined) o.dmgType = null;
return o;
```

`editData` 已是整份 deep copy（`JSON.parse(JSON.stringify(...))`），
直接修改 `o.dmgType` 完全安全。

修改後：
- `getSelectedUnit()` 永遠回傳 editData 中的直接 reference
- 任何賦值（包括 `unit.skills = filter(...)`, `unit.dmgType = x` 等）都正確更新 editData ✓

---

## 影響範圍

三處相同模式，都要修：
- line 398：`editData.infusions[baseElem][injElem].lv4`
- line 404：`editData.tripleTowers[key].lv5`
- line 409：`editData.pureTowers[elem].lv6`

---

## 執行

`execute skill-editor-fixes/step3.md`
