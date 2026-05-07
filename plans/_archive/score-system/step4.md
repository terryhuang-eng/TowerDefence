# Step 4：分數顯示面板

**目標**：在 `skill-editor.html` 的塔 panel 底部加入即時分數顯示區塊

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/skill-editor.html`

---

## 顯示內容

```
📊 分數分析
目標分數: 100
技能總分: 50
  🔥 灼燒 ×1.0 → 35 pts
  ❄️ 冰冷 ×1.0 → 15 pts
DPS 剩餘: 50  ← 綠色 = 正值；紅色 = 負值（技能爆分）
```

---

## 定位方法

### A. 加入 computeScoreBreakdown 函數
Grep: `function fmtSkills` → 找行號（約 619 行）
在此函數**之前**插入新函數

### B. 在 renderPanel 末尾加入分數面板
Grep: `panel.innerHTML = html` → 找行號（約 438 行）
在 `panel.innerHTML = html` 之後、`renderResist()` 之前插入 score block

---

## 具體修改

### A. 新增 computeScoreBreakdown(unit)

插入在 `function fmtSkills` 之前：

```javascript
function computeScoreBreakdown(unit) {
  if (!unit || currentTab !== 'towers') return null;
  const target = unit.scoreTarget || 0;
  const skills = (unit.skills || []).filter(s => s.enabled);
  const rows = skills.map(s => {
    const def = SKILL_DEFS[s.type];
    if (!def || !def.scoreBase) return { name: def ? def.name : s.type, score: 0 };
    let score = def.scoreBase;
    if (def.scorePrimary && def.scoreRef) {
      const cur = (s.params && s.params[def.scorePrimary] !== undefined)
        ? s.params[def.scorePrimary]
        : def.defaults[def.scorePrimary];
      score = def.scoreBase * (cur / def.scoreRef);
    }
    const weight = (s.scoreWeight !== undefined) ? s.scoreWeight : 1.0;
    score = Math.round(score * weight * 10) / 10;
    return { name: def.name, score, weight };
  });
  const skillTotal = Math.round(rows.reduce((a, r) => a + r.score, 0) * 10) / 10;
  const dpsScore = Math.round((target - skillTotal) * 10) / 10;
  return { target, rows, skillTotal, dpsScore };
}
```

### B. renderPanel 末尾加 score block（僅塔頁面顯示）

在 `panel.innerHTML = html;` 之後加：

```javascript
  if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) {
      const dpsColor = bd.dpsScore >= 0 ? '#95e1d3' : '#ff6b6b';
      let sHtml = `<div class="section score-section"><h3>📊 分數分析</h3>`;
      sHtml += `<div>目標分數：<b>${bd.target}</b></div>`;
      sHtml += `<div>技能總分：<b>${bd.skillTotal}</b></div>`;
      bd.rows.forEach(r => {
        sHtml += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts</div>`;
      });
      sHtml += `<div>DPS 剩餘：<b style="color:${dpsColor}">${bd.dpsScore}</b></div>`;
      sHtml += `</div>`;
      panel.innerHTML += sHtml;
    }
  }
```

### C. 加 CSS（在 `<style>` 區塊，加在既有樣式後）

Grep: `\.sk-desc` → 找樣式行號，在附近加：

```css
.score-section { border-top: 1px solid #444; margin-top: 8px; padding-top: 8px; }
.score-row { font-size: 11px; color: #ccc; margin-left: 8px; }
.score-weight-label { color: #ffd93d; margin-left: 4px; }
```

---

## 影響範圍

- `computeScoreBreakdown`：純計算函數，不修改任何資料
- score block 用 `+=` append，不覆蓋既有 panel 內容
- 只在 `currentTab === 'towers'` 顯示，不影響 waves/sends 頁面
