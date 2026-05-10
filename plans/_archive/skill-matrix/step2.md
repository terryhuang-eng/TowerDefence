# Step 2：左 panel 技能清單 + 右 panel 技能視角

## 目標
實作「技能矩陣」tab 的核心交互：
- `renderList()` 的 skill-matrix 分支 → 左 panel 技能清單（含使用數徽章）
- `renderEditor()` 的 skill-matrix 分支 → 右 panel 技能視角（使用選中技能的塔 + params）

## 影響範圍
只修改 `skill-editor.html`，涉及 2 處：
- `renderList()` 函式尾（`skill-matrix` 分支，`} else if (currentTab === 'towers')` 前，約 line 392）
- `renderEditor()` 函式尾（`} // end renderEditor` 之前，加 skill-matrix return 分支）

---

## 具體修改

### A. renderList() — skill-matrix 分支

在 `} else if (currentTab === 'towers') {` 之前插入：

```js
  } else if (currentTab === 'skill-matrix') {
    renderSkillMatrixList(panel);
    return;
  }
```

新增函式（放在 renderList 定義之後）：

```js
function renderSkillMatrixList(panel) {
  const allTowers = buildAllTowers();
  // 計算每個技能被多少塔啟用
  const usageCount = {};
  for (const sk of Object.keys(SKILL_DEFS)) usageCount[sk] = 0;
  for (const t of allTowers) {
    for (const s of (t.unit.skills || [])) {
      if (s.enabled !== false && usageCount[s.type] !== undefined) usageCount[s.type]++;
    }
  }

  let html = '';
  // 「全部塔」入口
  const allSel = smSelectedSkill === null ? ' selected' : '';
  html += `<div class="list-item${allSel}" onclick="smSelectSkill(null)" style="font-weight:bold;">
    📋 所有塔技能摘要
    <span class="sm-skill-badge">${allTowers.filter(t=>(t.unit.skills||[]).some(s=>s.enabled!==false)).length}</span>
  </div>`;
  html += '<div class="chapter-divider">tower 技能（依 group）</div>';

  const groups = ['damage','control','debuff','buff','special'];
  const groupLabels = { damage:'⚔️ damage', control:'❄️ control', debuff:'🌀 debuff', buff:'✨ buff', special:'🔮 special' };
  for (const group of groups) {
    const skills = Object.entries(SKILL_DEFS).filter(([,d]) => d.category === 'tower' && d.group === group);
    if (skills.length === 0) continue;
    html += `<div class="group-header">${groupLabels[group] || group}</div>`;
    for (const [key, def] of skills) {
      const cnt = usageCount[key] || 0;
      const sel = smSelectedSkill === key ? ' selected' : '';
      const badgeCls = cnt === 0 ? 'zero' : '';
      html += `<div class="list-item${sel}" onclick="smSelectSkill('${key}')">
        <span>${def.name}</span>
        <span class="sm-skill-badge ${badgeCls}">${cnt}</span>
      </div>`;
    }
  }
  panel.innerHTML = html;
}

function smSelectSkill(key) {
  smSelectedSkill = key;
  renderSkillMatrixList(document.getElementById('list-panel'));
  renderSkillMatrixPanel();
}
```

---

### B. renderEditor() — skill-matrix 分支

在 `renderEditor()` 函式開頭 `if (!unit)` 判斷之前，加 early return：

```js
  if (currentTab === 'skill-matrix') {
    renderSkillMatrixPanel();
    return;
  }
```

新增函式：

```js
function renderSkillMatrixPanel() {
  const panel = document.getElementById('edit-panel');
  if (!panel) return;

  // 視角切換按鈕
  let html = `<div class="sm-view-toggle">
    <button class="${smView==='skill'?'active':''}" onclick="smView='skill';renderSkillMatrixPanel()">🎯 技能視角</button>
    <button class="${smView==='matrix'?'active':''}" onclick="smView='matrix';renderSkillMatrixPanel()">📊 矩陣視角</button>
  </div>`;

  if (smView === 'skill') {
    html += renderSmSkillView();
  } else {
    html += renderSmMatrixView();
  }
  panel.innerHTML = html;
}
```

---

### C. renderSmSkillView()

```js
function renderSmSkillView() {
  const allTowers = buildAllTowers();
  let html = '';

  if (smSelectedSkill === null) {
    // 全部塔摘要
    html += '<div style="color:#4ecdc4;font-size:13px;margin-bottom:10px;">📋 所有塔技能摘要</div>';
    let lastGroup = '';
    for (const t of allTowers) {
      const enabledSkills = (t.unit.skills || []).filter(s => s.enabled !== false);
      if (lastGroup !== t.groupLabel) {
        html += `<div class="chapter-divider">${t.groupLabel}</div>`;
        lastGroup = t.groupLabel;
      }
      const skNames = enabledSkills.map(s => {
        const def = SKILL_DEFS[s.type];
        return def ? `<span style="color:#ffd93d;font-size:10px">${def.name}</span>` : s.type;
      }).join(' ');
      html += `<div class="sm-tower-row">
        <span>${t.icon} <b style="color:#eee">${t.label}</b></span>
        <span style="color:#888;font-size:10px;margin-left:6px">[${t.lv}]</span>
        ${skNames || '<span style="color:#555;font-size:10px">（無技能）</span>'}
      </div>`;
    }
    return html;
  }

  // 選中特定技能
  const def = SKILL_DEFS[smSelectedSkill];
  if (!def) return '<div style="color:#888">未知技能</div>';

  html += `<div style="margin-bottom:10px">
    <span style="color:#ffd93d;font-size:15px;font-weight:bold">${def.name}</span>
    <span style="color:#888;font-size:11px;margin-left:8px">${def.group}</span>
    <div style="color:#888;font-size:11px;margin-top:4px">${def.desc}</div>
  </div>`;

  // 預設 params 顯示
  html += '<div style="color:#95e1d3;font-size:11px;margin-bottom:8px">預設參數：';
  for (const [pk, pv] of Object.entries(def.defaults || {})) {
    html += `<span style="margin-right:8px"><span style="color:#888">${pk}=</span><span style="color:#ffd93d">${pv}</span></span>`;
  }
  html += '</div>';

  const towers = allTowers.filter(t =>
    (t.unit.skills || []).some(s => s.type === smSelectedSkill && s.enabled !== false)
  );

  if (towers.length === 0) {
    html += '<div style="color:#666;padding:16px;text-align:center">目前沒有塔使用此技能</div>';
    return html;
  }

  html += `<div style="color:#ccc;font-size:11px;margin-bottom:8px">${towers.length} 個塔使用此技能：</div>`;

  let lastGroup = '';
  for (const t of towers) {
    if (lastGroup !== t.groupLabel) {
      html += `<div class="chapter-divider">${t.groupLabel}</div>`;
      lastGroup = t.groupLabel;
    }
    const sk = (t.unit.skills || []).find(s => s.type === smSelectedSkill);
    const params = { ...def.defaults, ...(sk?.params || {}) };
    html += `<div class="sm-tower-row">
      <span style="cursor:pointer;text-decoration:underline;color:#4ecdc4" onclick="jumpToTowerTab(${t.flatIdx})">${t.icon} ${t.label}</span>
      <span style="color:#888;font-size:10px;margin-left:4px">[${t.lv}]</span>
      <div class="sm-param-inline">`;
    for (const [pk, pv] of Object.entries(params)) {
      html += `<label>${pk}:<input type="number" step="any" value="${pv}"
        onchange="smUpdateParam(${t.flatIdx},'${smSelectedSkill}','${pk}',this.value)"></label>`;
    }
    html += `</div></div>`;
  }
  return html;
}

// 點塔名跳到「塔」tab 並選中該 flatIdx
function jumpToTowerTab(flatIdx) {
  currentTab = 'towers';
  selectedIdx = flatIdx;
  document.querySelectorAll('.tab-bar button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === 'towers');
  });
  renderList();
  renderEditor();
  renderExportBar();
}

// 在矩陣視角直接更新塔的技能 param
function smUpdateParam(flatIdx, skillType, param, value) {
  const allTowers = buildAllTowers();
  const t = allTowers.find(x => x.flatIdx === flatIdx);
  if (!t) return;
  const sk = (t.unit.skills || []).find(s => s.type === skillType);
  if (sk) sk.params[param] = parseFloat(value) || 0;
}
```

---

## 定位流程（執行時必做）
1. `Grep "} else if \(currentTab === 'towers'\)"` 在 renderList 中 → 找插入點行號
2. `Read ±5 行確認` → `Edit` 插入 skill-matrix 分支
3. `Grep "function renderEditor"` → 找函式開頭
4. `Read ±10 行確認 early return 插入點`
5. `Edit` 加入 skill-matrix early return
6. 在 renderList 函式關閉之後插入 `renderSkillMatrixList`、`smSelectSkill`
7. 在 renderEditor 函式關閉之後插入 `renderSkillMatrixPanel`、`renderSmSkillView`、`jumpToTowerTab`、`smUpdateParam`
