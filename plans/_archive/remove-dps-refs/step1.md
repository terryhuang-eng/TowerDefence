# step1 — skill-editor.html 移除 DPS_REF / DPS_SCORE_REF

## 目標

移除所有與 `DPS_REF`、`DPS_SCORE_REF` 相關的常數、函數、UI、公式。

## 修改清單（共 6 處）

### 1. 常數定義（約 L960–961）

移除：
```
const DPS_REF        = { lv1: 35, lv2: 61, lv3: 63, lv4: 120, lv5: 190, lv6: 290 };
const DPS_SCORE_REF  = { lv1: 20, lv2: 45, lv3: 80, lv4: 160, lv5: 280, lv6: 440 };
```

### 2. Handler 函數（約 L197–204）

移除：
```js
function updateDpsRef(lv, val) {
  DPS_REF[lv] = parseFloat(val) || 1;
  renderPanel();
}
function updateDpsScoreRef(lv, val) {
  DPS_SCORE_REF[lv] = parseFloat(val) || 1;
  renderPanel();
}
```

### 3. 面板 UI — DPS_REF 區塊（約 L269–275）

移除：
```html
html += `<div ...><b>DPS_REF</b></div>`;
html += `<div style="display:grid...">`;
for (const lv of lvKeys) {
  html += `<label ...>${lv}:<input ... onchange="updateDpsRef('${lv}',this.value)"></label>`;
}
html += `</div>`;
```

### 4. 面板 UI — DPS_SCORE_REF 區塊（約 L277–283）

移除：
```html
html += `<div ...><b>DPS_SCORE_REF</b></div>`;
html += `<div style="display:grid...">`;
for (const lv of lvKeys) {
  html += `<label ...>${lv}:<input ... onchange="updateDpsScoreRef('${lv}',this.value)"></label>`;
}
html += `</div>`;
```

### 5. 計算公式（約 L1033–1035）

改為：
```js
// 移除這兩行
// const dpsRef      = DPS_REF[lv] || 1;
// const dpsScoreRef = DPS_SCORE_REF[lv] || 1;

// 修改這行
const dpsScoreActual = effectiveDPS;
```

### 6. Help modal 兩處

**L1601**：
```
// 改為
<li><b>effectiveDPS score</b>：DPS（damage × atkSpd）× AOE 乘數，直接作為 DPS 分</li>
```

**L1645**：
```
// 改為（移除 DPS_REF 提示）
<tr><td>&gt; 130%</td><td style="color:#f44">過強，考慮降低 scoreBase 或調整塔的 damage/atkSpd</td></tr>
```
