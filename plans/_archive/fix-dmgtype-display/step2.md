# Step 2：INFUSIONS/TRIPLE_TOWERS/PURE_TOWERS lv4/lv5/lv6 補入 dmgType: null

**目標**：讓這些塔的 data object 有明確的 `dmgType: null`，使 editor 讀到的是明確值而非 undefined（靠 default 填充）

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/js/towers.js`

---

## 背景

目前 INFUSIONS.fire.fire.lv4 等物件格式：
```javascript
lv4: { damage: 90, atkSpd: 1.3, range: 3.5, aoe: 0, cost: 250, score_adj: 0.77, desc: '...',
  skills: [...] }
```
沒有 `dmgType` 欄位。editor 用 `f.default = null` 填充，行為上沒差，但語義上不明確。

---

## 修改策略

**不做全部替換**，因為 lv4 有 36 個、lv5 有 20 個、lv6 有 6 個，全部手動加入過於繁瑣。

建議改法：在 skill-editor.html 的 `getTowerByFlatIdx` 讀到 lv4/lv5/lv6 物件後，若 `dmgType === undefined` 則補 `null`：

```javascript
// getTowerByFlatIdx 中，返回前補 dmgType 預設
if (obj && obj.dmgType === undefined) obj = { ...obj, dmgType: null };
return obj;
```

這樣不需要改 towers.js 裡所有資料，只在 editor 讀取層補上。

---

## 目標檔案（改 skill-editor.html）

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/skill-editor.html`

---

## 定位方法

Grep: `return inf.lv4` → 找 getTowerByFlatIdx 中的各 return 點
Read ±5 行確認 context

---

## 具體修改

在 `getTowerByFlatIdx` 的最後，統一包裝：

舊：
```javascript
  for (const [elem, pure] of Object.entries(editData.pureTowers)) {
    if (!pure.lv6) continue;
    if (i === idx) return pure.lv6;
    i++;
  }
  return null;
```

新：
```javascript
  for (const [elem, pure] of Object.entries(editData.pureTowers)) {
    if (!pure.lv6) continue;
    if (i === idx) { const o = pure.lv6; return o.dmgType === undefined ? { ...o, dmgType: null } : o; }
    i++;
  }
  return null;
```

同樣套用到 inf.lv4 和 triple.lv5 的返回點。

---

## 影響範圍

只影響 skill-editor.html 的讀取邏輯，不影響 towers.js 資料或遊戲邏輯。
