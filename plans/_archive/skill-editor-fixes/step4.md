# step4：分數面板移到頂部 + 可收合

**目標檔案**：`skill-editor.html`
**影響範圍**：
1. 新增全域變數 `scoreExpanded`
2. `renderEditor()`：把 buildScoreHtml 從末尾移到最前
3. `buildScoreHtml(bd)`：加上 header + collapsible body
4. 新增 `toggleScoreSection()` 函數
5. CSS：加 `.score-section-header` 樣式

---

## 修改細節

### 1. 新增全域變數（加在 currentTab 附近）

```js
let scoreExpanded = true;
```

### 2. renderEditor：分數放最前面

```js
// ❌ 舊（分數在最後）
if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) html += buildScoreHtml(bd);
}
panel.innerHTML = html;

// ✅ 新（分數在最前面，基本屬性之前）
let html = '';
if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) html += buildScoreHtml(bd);
}
html += '<div class="section"><h3>📊 基本屬性</h3>...
```

具體做法：找到 `let html = '';` 這行，在其後加入分數 HTML，再接其餘內容。

### 3. buildScoreHtml：改為可收合結構

```js
function buildScoreHtml(bd) {
  const targetLabel = (bd.autoTarget !== bd.target)
    ? `${bd.target} <small>（手動覆蓋）</small>` : `${bd.target}`;
  const balanceColor = bd.balance > 110 ? '#ff6b6b' : bd.balance < 70 ? '#ffd93d' : '#95e1d3';
  const balanceIcon  = bd.balance > 110 ? ' ⚠️ 超出預算' : bd.balance < 70 ? ' 💡 可加強' : ' ✓';
  const aoeNote = bd.aoeMultiplier > 1 ? ` <small>（AOE ×${bd.aoeMultiplier.toFixed(2)}）</small>` : '';

  // 收合時只顯示總分，展開時顯示詳細
  const summary = `<b style="color:${balanceColor}">${bd.total}/${bd.target} ${bd.balance}%${balanceIcon}</b>`;

  let h = `<div class="section score-section">`;
  h += `<h3 class="score-section-header" onclick="toggleScoreSection()">📊 分數分析 ${scoreExpanded ? '▼' : '▶'} <span style="font-weight:normal;font-size:0.85em">${scoreExpanded ? '' : summary}</span></h3>`;
  h += `<div id="score-body" style="${scoreExpanded ? '' : 'display:none'}">`;
  h += `<div style="color:#aaa;font-size:0.9em">${bd.lv} 標準 <b>${bd.lvStd}</b> × 塔級調整 <b>${bd.adj}</b> = 目標 ${targetLabel}</div>`;
  h += `<div>DPS 分：<b>${bd.dpsScoreActual}</b>${aoeNote}</div>`;
  h += `<div>技能分：<b>${bd.skillTotal}</b></div>`;
  bd.rows.forEach(r => {
    h += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts</div>`;
  });
  h += `<hr style="border-color:#333;margin:4px 0">`;
  h += `<div>總分：<b style="color:${balanceColor}">${bd.total}</b> / ${bd.target}　<b style="color:${balanceColor}">${bd.balance}%${balanceIcon}</b></div>`;
  h += `</div>`; // score-body
  h += `</div>`; // score-section
  return h;
}
```

### 4. 新增 toggleScoreSection()

```js
function toggleScoreSection() {
  scoreExpanded = !scoreExpanded;
  renderPanel();
}
```

### 5. CSS（加在現有 score-section 旁）

```css
.score-section-header { cursor: pointer; user-select: none; }
.score-section-header:hover { color: #4ecdc4; }
```

---

## 定位流程

1. Grep `let html = '';` in renderEditor → 找到行號
2. Read ±5 行確認（應在 renderEditor 內，基本屬性前）
3. 在 `let html = '';` 後、屬性區之前插入分數 HTML 邏輯
4. 修改 buildScoreHtml（整個函數替換）
5. 在 toggleScoreSection / scoreExpanded 附近新增函數與變數
6. CSS 新增兩行

---

## 注意

`renderPanel()` 呼叫 `buildScoreHtml(bd)` 並替換 `.score-section`，
由於 `buildScoreHtml` 現在讀取全域 `scoreExpanded`，
`toggleScoreSection` 只需更新變數後呼叫 `renderPanel()` 即可，不需額外邏輯。
