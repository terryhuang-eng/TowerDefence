# skill-editor：LV4+ dmgType 預設修正

## 問題診斷

### 規則
LV4 以後的塔，`dmgType` 應預設為**基底元素**，只有特定的反克制塔（如逆焰塔）才需要明確設為不同元素。

### 現況（壞掉的狀態）

**`getSelectedUnit()` 函式**（行 435-456）：
- LV4 infusion 選中時：`o.dmgType === undefined → o.dmgType = null`
- LV5 triple 選中時：`o.dmgType === undefined → o.dmgType = null`
- LV5/LV6 pure 選中時：`o.dmgType === undefined → o.dmgType = null`

→ 開啟 editor 後 UI 顯示「（預設/基底元素）」，無法辨識實際是哪個元素。

**`generateCode()` export 函式**：
```js
// LV4 (行 1158)
const lv4DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';

// LV5 triple (行 1178)
const lv5DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';

// LV5/LV6 pure (行 1196, 1201)
const lv5DmgPart = lv5.dmgType ? `, dmgType: '${lv5.dmgType}'` : '';
const lv6DmgPart = lv6.dmgType ? `, dmgType: '${lv6.dmgType}'` : '';
```

→ `dmgType = null/undefined` 時，export 完全省略 `dmgType` 欄位。
→ 遊戲靠 LV3 殘留值運作（脆弱，且 TRIPLE/PURE 路徑不固定）。

### 根本原因
export 條件 `lv.dmgType ? ...` 在 null/undefined 時產生空字串，導致 LV4+ 塔的 `dmgType` 從未被明確寫入 towers.js。

---

## 修正方案

### 修改點：skill-editor.html（單一檔案）

**1. `getSelectedUnit()` — 顯示修正**
改為「基底元素」預設，而非 null。各段的 baseElem 從外層 loop 推導：
- INFUSIONS：`baseElem`（外層 for 迴圈的變數）
- TRIPLE：`key.split('_')[0]`（key 第一個元素）
- PURE lv5/lv6：`elem`（for...of Object.entries 的 elem 鍵）

**2. `generateCode()` — export 修正**
相同邏輯：`lv.dmgType || baseElem`（取有值的，否則填基底元素）

---

## 執行步驟

| 步驟 | 檔案 | 修改位置 |
|------|------|---------|
| step1.md | skill-editor.html | `getSelectedUnit()` 四處 null 初始化 → 改為基底元素 |
| step2.md | skill-editor.html | `generateCode()` 四處 export 條件 → 改為 `\|\|baseElem` fallback |
