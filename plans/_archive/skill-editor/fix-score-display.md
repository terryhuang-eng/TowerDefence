# 修正：技能參數更改後分數面板不更新

**日期**：2026-05-04

---

## 問題

改技能的 perHit / cap 等參數，分數面板不更新。
根因：`updateSkillParam` 只更新資料，沒觸發重繪。
另外 `updateSkillWeight` 呼叫 `renderPanel()` 但此函式不存在。

---

## 修改目標：`skill-editor.html`

### 修改 1：定義 `renderPanel` 函式（只重繪分數區塊，不重繪整個 editor）

插入位置：`renderEditor` 函式定義之後。

```js
function renderPanel() {
  const panel = document.getElementById('edit-panel');
  const unit = getSelectedUnit();
  if (!panel || !unit || currentTab !== 'towers') return;
  let existing = panel.querySelector('.score-section');
  if (!existing) return;
  const bd = computeScoreBreakdown(unit);
  if (!bd) return;
  const dpsColor = bd.dpsScore >= 0 ? '#95e1d3' : '#ff6b6b';
  const targetLabel = (bd.autoTarget !== bd.target)
    ? `${bd.target} <small>（手動覆蓋）</small>` : `${bd.target}`;
  let sHtml = `<div class="section score-section"><h3>📊 分數分析</h3>`;
  sHtml += `<div style="color:#aaa;font-size:0.9em">${bd.lv} 標準 <b>${bd.lvStd}</b> × 塔級調整 <b>${bd.adj}</b> = 目標 ${targetLabel}</div>`;
  sHtml += `<div>技能總分：<b>${bd.skillTotal}</b></div>`;
  bd.rows.forEach(r => {
    sHtml += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts</div>`;
  });
  sHtml += `<div>DPS 剩餘：<b style="color:${dpsColor}">${bd.dpsScore}</b>${bd.dpsScore < 0 ? ' ⚠️ 技能超出預算' : ''}</div>`;
  sHtml += `</div>`;
  existing.outerHTML = sHtml;
}
```

### 修改 2：`updateSkillParam` 末尾加 `renderPanel()`

```js
function updateSkillParam(type, param, value) {
  const unit = getSelectedUnit();
  if (!unit || !unit.skills) return;
  const sk = unit.skills.find(s => s.type === type);
  if (sk) {
    sk.params[param] = parseFloat(value) || 0;
    renderPanel();   // ← 加這行
  }
}
```

---

## 同時修正 score 面板術語

面板顯示 `× adj` → 改為 `× 塔級調整`（已包含在 renderPanel 定義中）。

---

## 影響範圍

- `skill-editor.html` 只改兩處（加函式 + 加一行呼叫）
- `towers.js` 不動
