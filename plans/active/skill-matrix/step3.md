# Step 3：矩陣視角（技能 × 塔 交叉表格）

## 目標
實作 `renderSmMatrixView()`，補完 step2 中切換按鈕的矩陣視角。

## 影響範圍
只修改 `skill-editor.html`，單一位置：在 `renderSmSkillView` 函式之後插入 `renderSmMatrixView`。

---

## 設計

### 矩陣結構
- **列（rows）**：所有塔，依 groupLabel 分段，前面插入分組標題行
- **欄（columns）**：
  - 第 0 欄：塔名稱（sticky left）
  - 後續欄：所有在任一塔上啟用的技能（自動收集，只顯示有被至少 1 塔使用的）
- **Cell**：
  - 有技能且 enabled：`✓`（綠底），tooltip 顯示 params
  - 無技能：`—`（暗色）

### 欄選中高亮
- `smMatrixHighlight` 變數記錄目前 highlight 的 skill key
- 點欄 header → 設定 `smSelectedSkill` 並切回技能視角
- 矩陣視角的點欄：只做視覺 highlight（reload renderSmMatrixView 帶 highlight 參數）

### 塔名點擊
- 點塔名 → 呼叫 `jumpToTowerTab(flatIdx)`

---

## 具體修改

### 新增函式 renderSmMatrixView()

```js
function renderSmMatrixView() {
  const allTowers = buildAllTowers();

  // 收集所有在任一塔上啟用的 tower 技能（依 group 排序）
  const usedSkillKeys = [];
  const seenKeys = new Set();
  const groupOrder = ['damage','control','debuff','buff','special'];
  for (const group of groupOrder) {
    for (const [key, def] of Object.entries(SKILL_DEFS)) {
      if (def.category !== 'tower' || def.group !== group) continue;
      if (seenKeys.has(key)) continue;
      const isUsed = allTowers.some(t =>
        (t.unit.skills || []).some(s => s.type === key && s.enabled !== false)
      );
      if (isUsed) { usedSkillKeys.push(key); seenKeys.add(key); }
    }
  }

  if (usedSkillKeys.length === 0) {
    return '<div style="color:#666;padding:24px;text-align:center">目前無任何塔配置技能</div>';
  }

  let html = '<div class="sm-matrix-wrap"><table class="sm-matrix"><thead><tr>';
  html += '<th style="min-width:130px">塔</th>';
  for (const key of usedSkillKeys) {
    const def = SKILL_DEFS[key];
    const hlStyle = (smSelectedSkill === key) ? 'background:#1a3a5e;color:#ffd93d;' : '';
    html += `<th class="sk-col" style="${hlStyle}" onclick="smView='skill';smSelectedSkill='${key}';renderSkillMatrixPanel()" title="${def.name}：${def.desc}">${def.name}</th>`;
  }
  html += '</tr></thead><tbody>';

  let lastGroup = '';
  for (const t of allTowers) {
    if (lastGroup !== t.groupLabel) {
      html += `<tr class="sm-group-row"><th colspan="${usedSkillKeys.length + 1}">${t.groupLabel}</th></tr>`;
      lastGroup = t.groupLabel;
    }
    html += `<tr>`;
    html += `<th><span style="cursor:pointer;color:#4ecdc4" onclick="jumpToTowerTab(${t.flatIdx})">${t.icon} ${t.label}</span> <span style="color:#555;font-size:10px">[${t.lv}]</span></th>`;
    for (const key of usedSkillKeys) {
      const sk = (t.unit.skills || []).find(s => s.type === key && s.enabled !== false);
      if (sk) {
        // params tooltip
        const paramStr = Object.entries({ ...SKILL_DEFS[key].defaults, ...sk.params })
          .map(([k,v]) => `${k}:${v}`).join(' ');
        const hlBg = (smSelectedSkill === key) ? 'background:#1a4a2a' : '';
        html += `<td class="has-skill" style="${hlBg}" title="${paramStr}">✓</td>`;
      } else {
        const hlBg = (smSelectedSkill === key) ? 'background:#1a1a3a' : '';
        html += `<td class="no-skill" style="${hlBg}">—</td>`;
      }
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}
```

---

## 定位流程（執行時必做）
1. `Grep "function renderSmSkillView"` → 找到 step2 插入的函式
2. 找該函式的結尾 `}` 行號（Read ±5 行確認）
3. `Edit`：在函式結尾後插入 `renderSmMatrixView()`
4. 驗證：`Grep "function renderSmMatrixView"` 確認已插入

---

## 完成後驗收清單
- [ ] 新 tab「技能矩陣」出現在 header tab bar
- [ ] 左 panel：技能清單分組顯示，badge 顯示使用數（0 = 暗色）
- [ ] 選技能後右側顯示使用該技能的塔清單，params 可直接編輯
- [ ] 「所有塔技能摘要」顯示所有塔及其技能名稱
- [ ] 切換矩陣視角：表格正確顯示，✓ 正確出現
- [ ] 點矩陣欄 header → 切回技能視角並選中該技能
- [ ] 點塔名 → 跳塔 tab 並正確選中該塔
- [ ] activeElems 更改後矩陣自動更新（因為 buildAllTowers 每次呼叫都重算）
