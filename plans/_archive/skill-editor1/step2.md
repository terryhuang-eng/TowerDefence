# Step 2：`generateCode()` — export 修正

## 目標
export 的 towers.js 中，LV4+ 塔必須明確寫出 `dmgType`（預設為基底元素），不得省略。

## 影響範圍
- **檔案**：`skill-editor.html`
- **函式**：`generateCode()`，4 處 dmgType export 邏輯

## 前置條件
Step 1 完成後，已點擊過的 tower 的 `dmgType` 會是基底元素。
但**未點擊過**的 tower，`lv.dmgType` 仍是 `undefined`（未被初始化）。
→ export 需要自行計算 fallback。

## 修改點

### 1. INFUSIONS LV4（行約 1158）
```js
// 舊
const lv4DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';

// 新
const lv4DmgPart = `, dmgType: '${lv.dmgType || baseElem}'`;
```
`baseElem` 在此處已是外層 `for (const baseElem of ELEM_KEYS)` 迴圈變數，直接可用。

### 2. TRIPLE_TOWERS LV5（行約 1178）
```js
// 舊
const lv5DmgPart = lv.dmgType ? `, dmgType: '${lv.dmgType}'` : '';

// 新
const tripleBaseElem = key.split('_')[0];
const lv5DmgPart = `, dmgType: '${lv.dmgType || tripleBaseElem}'`;
```
`key` 在此處已是外層 `for (const [key, triple] of Object.entries(...))` 迴圈變數。

### 3. PURE_TOWERS LV5（行約 1196）
```js
// 舊
const lv5DmgPart = lv5.dmgType ? `, dmgType: '${lv5.dmgType}'` : '';

// 新
const lv5DmgPart = `, dmgType: '${lv5.dmgType || elem}'`;
```

### 4. PURE_TOWERS LV6（行約 1201）
```js
// 舊
const lv6DmgPart = lv6.dmgType ? `, dmgType: '${lv6.dmgType}'` : '';

// 新
const lv6DmgPart = `, dmgType: '${lv6.dmgType || elem}'`;
```
`elem` 在此處已是外層 `for (const [elem, pure] of Object.entries(...))` 迴圈變數。

## 驗證
1. 開啟 skill-editor → 不點擊任何 LV4+ 塔 → 直接點「複製程式碼」
2. 檢查 INFUSIONS section：每個 lv4 都有 `dmgType: 'fire'`（或對應基底）
3. 確認反克制塔（如手動設了 dmgType 的塔）仍保留自訂值，不被覆蓋
4. 確認 TRIPLE_TOWERS / PURE_TOWERS lv5/lv6 也都有 `dmgType`
