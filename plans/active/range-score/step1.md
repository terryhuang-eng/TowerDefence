# step1 — skill-editor.html 加入射程評分

## 目標

新增 `RANGE_FACTOR_K` 常數，將 rangeFactor 乘入 dpsScoreActual，並在面板與說明中揭露。

---

## 修改清單（共 6 處）

### 1. 常數定義（緊接在 ATKSPD_REF 後）

位置：Grep `const ATKSPD_REF`

新增一行：
```js
const RANGE_FACTOR_K = 0.2; // 每單位射程差的 DPS 分數增幅；基準 range=4，有效區間 3~5
```

---

### 2. Handler 函數（緊接在 updateLevelStd 或同區塊其他 handler 後）

位置：Grep `function updateLevelStd`

新增：
```js
function updateRangeFactorK(val) {
  RANGE_FACTOR_K = parseFloat(val) || 0;
  renderPanel();
}
```

注意：需同步將 `const RANGE_FACTOR_K` 改為 `let RANGE_FACTOR_K`（因為 handler 會覆寫）

---

### 3. 面板 UI（renderScoreDefsPanel，加在 ATKSPD_REF 區塊後）

位置：Grep `ATKSPD_REF` 在面板 html 字串內

新增：
```js
html += `<div style="margin-top:4px;border-top:1px solid #444;padding:6px 8px"><b>RANGE_FACTOR_K</b></div>`;
html += `<div style="padding:0 8px 8px">`;
html += `<label style="font-size:11px">k:<input type="number" step="0.05" value="${RANGE_FACTOR_K}"
  style="width:56px;font-size:11px;background:#1a1a1a;color:#ccc;border:1px solid #444;padding:1px 3px"
  onchange="updateRangeFactorK(this.value)"></label>`;
html += `<span style="font-size:10px;color:#888;margin-left:8px">range3=${(0.8).toFixed(2)}× range4=1.00× range5=${(1.2).toFixed(2)}×</span>`;
html += `</div>`;
```

---

### 4. 計算公式（computeScoreBreakdown）

位置：Grep `const dpsScoreActual = effectiveDPS`

修改為：
```js
const rangeFactor    = Math.round((1.0 + ((unit.range || 4) - 4) * RANGE_FACTOR_K) * 100) / 100;
const dpsScoreActual = Math.round(effectiveDPS * rangeFactor * 10) / 10;
```

同時在 return 物件加入 `rangeFactor`：

位置：Grep `return { target, rows, skillTotal, dpsScoreActual`

修改為：
```js
return { target, rows, skillTotal, dpsScoreActual, effectiveDPS, rangeFactor, aoeMultiplier,
         total, balance, lv, lvStd, adj, autoTarget };
```

---

### 5. 分數面板顯示

位置：Grep `DPS 分：.*bd\.dpsScoreActual`

在該行後新增：
```js
const rangeNote = bd.rangeFactor !== 1.0
  ? ` <span style="color:#aaa;font-size:0.85em">射程×${bd.rangeFactor}</span>`
  : '';
```

並將原行修改為：
```js
h += `<div>DPS 分：<b>${bd.dpsScoreActual}</b>${aoeNote}${rangeNote}</div>`;
```

（`aoeNote` 已存在，`rangeNote` 補在其後）

---

### 6. Help modal（Overview 區塊）

位置：Grep `直接作為 DPS 分`

修改該行為：
```html
<li><b>effectiveDPS score</b>：DPS（damage × atkSpd）× AOE 乘數 × 射程係數，作為 DPS 分</li>
```

並在 `<ul>` 結束後新增說明段：
```html
<h3>📏 射程係數（rangeFactor）</h3>
<p><code>rangeFactor = 1.0 + (range - 4) × RANGE_FACTOR_K</code></p>
<p>設計射程區間為 3～5，以 range=4 為基準（×1.0）。超出區間的塔仍可套用公式，但應透過建造難度控制平衡，不依賴評分系統。</p>
<table>
  <tr><th>range</th><th>rangeFactor（K=0.2）</th></tr>
  <tr><td>3</td><td>0.8×</td></tr>
  <tr><td>4</td><td>1.0×</td></tr>
  <tr><td>5</td><td>1.2×</td></tr>
</table>
<p><code>RANGE_FACTOR_K</code> 可在 ⚙️ 面板調整。</p>
```
