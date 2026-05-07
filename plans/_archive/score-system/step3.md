# Step 3：技能 row 加入 scoreWeight 輸入

**目標**：在 `skill-editor.html` 的技能 row 加入 `scoreWeight` 欄位，並在 `toggleSkill` 初始化時帶入預設值 1.0

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/skill-editor.html`

---

## 背景

現有技能 row 結構（約 426-433 行）：
- checkbox（開關技能）
- skill name
- params inputs（來自 defaults）
- desc

`toggleSkill` 啟用時：`unit.skills.push({ type, enabled: true, params: { ...SKILL_DEFS[type].defaults } })`
→ 沒有 `scoreWeight`

---

## 定位方法

### A. 修改 renderPanel 技能 row（約 431 行）
Grep: `data-skill="\${sk.key}" data-param=` → 找 params 渲染行號
Read ±5 行確認 context

### B. 修改 toggleSkill（約 562 行）
Grep: `unit.skills.push\({ type, enabled: true` → 找行號
Read ±3 行確認

---

## 具體修改

### A. renderPanel 技能 row — 在 params loop 後加 scoreWeight 輸入

舊（約 430-432 行）：
```javascript
      for (const [pk, pv] of Object.entries(params)) {
        html += `<label>${pk}:<input type="number" step="any" value="${pv}" data-skill="${sk.key}" data-param="${pk}" onchange="updateSkillParam('${sk.key}','${pk}',this.value)" ${!active ? 'disabled' : ''}></label>`;
      }
      html += `</div><span class="sk-desc">${sk.desc}</span></div>`;
```

新（params loop 不變，在 `</div>` 前插入 scoreWeight）：
```javascript
      for (const [pk, pv] of Object.entries(params)) {
        html += `<label>${pk}:<input type="number" step="any" value="${pv}" data-skill="${sk.key}" data-param="${pk}" onchange="updateSkillParam('${sk.key}','${pk}',this.value)" ${!active ? 'disabled' : ''}></label>`;
      }
      const sw = active ? (active.scoreWeight !== undefined ? active.scoreWeight : 1.0) : 1.0;
      html += `<label class="score-weight-label">weight:<input type="number" step="0.1" min="0" value="${sw}" data-skill="${sk.key}" onchange="updateSkillWeight('${sk.key}',this.value)" ${!active ? 'disabled' : ''}></label>`;
      html += `</div><span class="sk-desc">${sk.desc}</span></div>`;
```

### B. toggleSkill — 啟用時加入 scoreWeight:1.0

舊（約 562 行）：
```javascript
      unit.skills.push({ type, enabled: true, params: { ...SKILL_DEFS[type].defaults } });
```

新：
```javascript
      unit.skills.push({ type, enabled: true, params: { ...SKILL_DEFS[type].defaults }, scoreWeight: 1.0 });
```

### C. 新增 updateSkillWeight 函數（加在 updateSkillParam 附近）

Grep: `function updateSkillParam` → 找行號，在其後加：

```javascript
function updateSkillWeight(type, value) {
  const unit = getSelectedUnit();
  if (!unit || !unit.skills) return;
  const sk = unit.skills.find(s => s.type === type);
  if (sk) {
    sk.scoreWeight = parseFloat(value) || 1.0;
    renderPanel();
  }
}
```

---

## 影響範圍

- `renderPanel`：技能 row 多一個 weight input（disabled 時灰色，不影響操作）
- `toggleSkill`：新建技能實例多一個 `scoreWeight` 欄位（舊資料無此欄位，讀取時 fallback 1.0）
- 新函數 `updateSkillWeight`：獨立，不影響其他功能
