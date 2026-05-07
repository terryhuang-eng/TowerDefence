# step3：修正 getTowerByFlatIdx 的 spread copy bug

**目標檔案**：`skill-editor.html`
**影響範圍**：`getTowerByFlatIdx` 函數內 3 行（line 398, 404, 409）

---

## 修改方式

三處相同模式：

```js
// ❌ 現行（回傳臨時 copy，導致 filter/assign 對 editData 無效）
return o.dmgType === undefined ? { ...o, dmgType: null } : o;

// ✅ 修正（直接改 editData，永遠回傳 direct reference）
if (o.dmgType === undefined) o.dmgType = null;
return o;
```

---

## 定位流程

Grep `dmgType === undefined` in skill-editor.html → 找到 3 個 match（line 398, 404, 409）
逐一 Edit 替換（3 次相同修改）

---

## 3 處替換

### 處 1（infusions lv4，line 398）

```js
// 舊
if (i === idx) { const o = inf.lv4; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }

// 新
if (i === idx) { const o = inf.lv4; if (o.dmgType === undefined) o.dmgType = null; return o; }
```

### 處 2（tripleTowers lv5，line 404）

```js
// 舊
if (i === idx) { const o = triple.lv5; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }

// 新
if (i === idx) { const o = triple.lv5; if (o.dmgType === undefined) o.dmgType = null; return o; }
```

### 處 3（pureTowers lv6，line 409）

```js
// 舊
if (i === idx) { const o = pure.lv6; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }

// 新
if (i === idx) { const o = pure.lv6; if (o.dmgType === undefined) o.dmgType = null; return o; }
```

---

## 驗證

1. 開啟 skill-editor.html → 切塔頁面
2. 選一個 INFUSIONS 塔（lv4，通常在 元素×元素 組合區）
3. 取消勾選任意已啟用的技能 → checkbox 應保持未勾選
4. 確認分數面板更新（skillTotal 減少）
5. 換一個 TRIPLE 塔重複測試
