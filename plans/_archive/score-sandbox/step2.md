# Step 2：score_adj Inline 編輯 + 匯出

## 目標
讓 `dps-calc.html` 的 Score 欄 `score_adj` 值可以直接點擊修改，並加入「匯出差異」功能。

## 影響範圍
**唯一修改檔案：** `dps-calc.html`

## 前提
Step 1 已完成（scoreWeights 系統存在）。

## 目前狀態
- `calcTowerScore()` 讀取 `t.score_adj`（來自 towers.js，不可在 UI 改）
- Score 欄只顯示數值，無法互動

## 具體修改說明

### 1. 新增 `overrideAdj` 物件（State 區塊）
```js
const overrideAdj = {};   // key = t.id, value = number
```

### 2. 修改 `calcTowerScore()` 讀取 overrideAdj
```js
const adj = (t.id in overrideAdj) ? overrideAdj[t.id]
          : (t.score_adj != null ? t.score_adj : 1.0);
```

### 3. Score 欄顯示改為 inline 可編輯
目前 Score 欄 render：
```js
// 找到 td 的 Score 欄，目前顯示純文字
```
改為：
```html
<td class="col-score">
  <span class="score-val" style="color: XXX">NNN</span>
  <span class="adj-badge" data-tower-id="t.id"
    title="點擊編輯 score_adj">adj: 0.77</span>
</td>
```

`.adj-badge` 點擊後變成 `<input type="number" step="0.01" ...>`，失焦/Enter 確認：
- 更新 `overrideAdj[towerId]`
- 若與原始值相同則從 overrideAdj 刪除
- 重新 render 該行 Score（不需全表 re-render，只更新一行）

`.adj-badge` 樣式：
- 未修改：灰色小字
- 已修改（in overrideAdj）：橙色 + 底線提示

### 4. 新增「匯出 score_adj 差異」按鈕
在頂部 controls 區塊加入：
```html
<button id="exportAdj">📋 匯出 adj 差異</button>
```

點擊後：
```js
const changed = Object.keys(overrideAdj).map(id => {
  const t = allTowers.find(t => t.id === id);
  return `  // ${t ? t.name : id}\n  '${id}': ${overrideAdj[id]}`;
});
const text = changed.length === 0
  ? '（沒有變更）'
  : 'const ADJ_PATCH = {\n' + changed.join(',\n') + '\n};';
// 複製到剪貼簿
navigator.clipboard.writeText(text);
// 顯示 toast 提示
```

匯出格式：
```js
const ADJ_PATCH = {
  // 極限焰（fire×fire）
  'inf_fire_fire': 0.72,
  // 冰霜域（water×water）
  'inf_water_water': 0.85,
};
```
使用者可以把這段直接給 Claude 說「請套用這個 patch 到 towers.js」。

### 5. 新增「重置全部 adj」按鈕
在 exportAdj 按鈕旁：
```html
<button id="resetAdj">↺ 重置 adj</button>
```
點擊後清空 `overrideAdj`，重新 render。

## 完成標準
- 點擊 Score 欄的 adj badge → 變成 input → 輸入 0.85 → 分數即時更新 + adj 顯示橙色
- 點匯出 → 剪貼簿有 JS object 格式的差異
- 重置 → 所有 adj 回到 towers.js 原始值
