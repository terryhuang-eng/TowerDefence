# step2：新增 skills.js 匯出（GLOBAL_CAPS + SKILL_DEFS）

## 目標

在 `skill-editor.html` 新增：
1. **GLOBAL_CAPS 編輯**：目前完全無法修改
2. **exportSkills()** 函數：輸出 GLOBAL_CAPS + SKILL_DEFS 資料部分
3. **匯出 bar 新增 skills.js 按鈕**

## 修改檔案

`skill-editor.html` 只動這一個檔

---

## 資料狀態確認

目前 skill-editor 對 skills.js 的使用：
- `SKILL_DEFS[type].scoreBase` — 透過 `updateSkillDefScore()` 在記憶體修改（已有 UI）
- `GLOBAL_CAPS` — 只讀取，沒有任何編輯 UI

因此需要補：
1. `editData.globalCaps` 的初始化（deep copy GLOBAL_CAPS）
2. GLOBAL_CAPS 編輯 UI
3. `exportSkills()` 函數

---

## Fix A：editData 加入 globalCaps

在 `editData` 初始化區塊（大約 L90-100 附近）加入：

```javascript
globalCaps: JSON.parse(JSON.stringify(GLOBAL_CAPS)),
```

---

## Fix B：GLOBAL_CAPS 編輯 UI

在「⚙️ 技能評分基準」面板下方（或同一面板）加入 GLOBAL_CAPS 編輯區塊。
找到 `id="score-base-panel"` 或類似的面板 div，在其中加：

```javascript
// 在 renderScorePanel() 或同類函數內，補充 GLOBAL_CAPS 區段
function renderGlobalCapsPanel() {
  const caps = editData.globalCaps;
  const LABELS = {
    slowPct:         '減速上限',
    atkSpdBonus:     '攻速加成上限',
    armorShred:      '碎甲上限',
    vulnerability:   '易傷上限',
    procMinInterval: 'Proc 最小間隔(s)',
    hpPctCd:         '%HP CD(s)',
  };
  let html = '<div style="margin-top:8px;border-top:1px solid #444;padding-top:6px"><b>GLOBAL_CAPS</b></div>';
  for (const [key, val] of Object.entries(caps)) {
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0">
      <span style="font-size:11px">${LABELS[key] || key}</span>
      <input type="number" step="0.01" value="${val}" style="width:60px;font-size:11px"
        onchange="editData.globalCaps['${key}']=parseFloat(this.value)||0">
    </div>`;
  }
  return html;
}
```

---

## Fix C：exportSkills() 函數

新增匯出函數，只輸出資料部分（函數由 step3 的 patch 策略保留）：

```javascript
function exportSkills(mode) {
  let lines = [];

  lines.push('// ============================================================');
  lines.push('// SKILL SYSTEM — 模組化技能定義');
  lines.push('// ============================================================');
  lines.push('');

  // GLOBAL_CAPS
  lines.push('// 全域上限');
  lines.push('const GLOBAL_CAPS = {');
  const capComments = {
    slowPct: '// 減速上限 75%',
    atkSpdBonus: '// 攻速加成上限 +100%',
    armorShred: '// 碎甲上限 -50%',
    vulnerability: '// 易傷上限 +50%',
    procMinInterval: '// proc 最小間隔 0.3 秒',
    hpPctCd: '// %HP 傷害每目標冷卻 0.5 秒',
  };
  for (const [key, val] of Object.entries(editData.globalCaps)) {
    const comment = capComments[key] ? `  ${capComments[key]}` : '';
    lines.push(`  ${key}: ${val},${comment}`);
  }
  lines.push('};');
  lines.push('');

  // SKILL_DEFS header
  lines.push('// ============================================================');
  lines.push('// SKILL_DEFS — 所有技能的 master 登錄表');
  lines.push('// ============================================================');
  lines.push('const SKILL_DEFS = {');

  // group 順序
  const GROUP_ORDER = ['damage', 'control', 'debuff', 'buff', 'special'];
  const CAT_COMMENTS = {
    damage:  '// ── 塔：傷害類 ──',
    control: '// ── 塔：控制類 ──',
    debuff:  '// ── 塔：弱化類 ──',
    buff:    '// ── 塔：增益類 ──',
    special: '// ── 塔：特殊類 ──',
  };
  let lastGroup = null;
  // tower skills first
  for (const group of GROUP_ORDER) {
    for (const [type, def] of Object.entries(SKILL_DEFS)) {
      if (def.category !== 'tower' || def.group !== group) continue;
      if (def.group !== lastGroup) {
        lines.push('');
        lines.push(`  ${CAT_COMMENTS[group] || ''}`);
        lastGroup = def.group;
      }
      const defaultsStr = JSON.stringify(def.defaults).replace(/"(\w+)":/g, '$1:');
      lines.push(`  ${type.padEnd(12)}: { category: '${def.category}', group: '${def.group}', name: '${def.name}', defaults: ${defaultsStr}, desc: '${def.desc}', scoreBase: ${def.scoreBase}, scorePrimary: ${def.scorePrimary === null ? 'null' : "'" + def.scorePrimary + "'"}, scoreRef: ${def.scoreRef === null ? 'null' : def.scoreRef} },`);
    }
  }
  // enemy skills
  lines.push('');
  lines.push('  // ── 敵人/送兵技能 ──');
  for (const [type, def] of Object.entries(SKILL_DEFS)) {
    if (def.category !== 'enemy') continue;
    const defaultsStr = JSON.stringify(def.defaults).replace(/"(\w+)":/g, '$1:');
    lines.push(`  ${type.padEnd(12)}: { category: '${def.category}', group: '${def.group}', name: '${def.name}', defaults: ${defaultsStr}, desc: '${def.desc}', scoreBase: ${def.scoreBase}, scorePrimary: ${def.scorePrimary === null ? 'null' : "'" + def.scorePrimary + "'"}, scoreRef: ${def.scoreRef === null ? 'null' : def.scoreRef} },`);
  }
  lines.push('};');
  lines.push('');
  lines.push('// （以下為工具函數，不由 skill-editor 產生）');

  doExport(lines.join('\n'), 'skills.js', mode);
}
```

---

## Fix D：renderExportBar 加入 skills.js 按鈕

在 `renderExportBar()` 加入一個常駐的 skills.js 按鈕（不依賴 tab，因為 scoreBase 在所有 tab 都可編輯）：

```javascript
// 在現有 html += '<span class="status"...' 之前加：
html += '<button onclick="exportSkills(\'copy\')">📋 複製 skills.js</button>';
html += '<button onclick="exportSkills(\'download\')">💾 下載 skills.js</button>';
```

或者讓它只在 `currentTab === 'towers'` 時顯示（因為 scoreBase 主要在 towers tab 使用）。

---

## 執行後驗證

1. 開啟 skill-editor.html
2. 確認「⚙️ 技能評分基準」面板下方出現 GLOBAL_CAPS 6 個數值可編輯
3. 修改任一 scoreBase 或 GLOBAL_CAPS 值
4. 按「💾 下載 skills.js」
5. 確認下載的 skills.js 包含 `const GLOBAL_CAPS = {...}` 和 `const SKILL_DEFS = {...}`
6. 確認 SKILL_DEFS 中有更新後的 scoreBase 值
7. **注意**：下載的 skills.js 結尾有 `// （以下為工具函數...）` 提示，代表函數需要保留在原始檔案中
