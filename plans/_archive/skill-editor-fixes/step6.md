# step6：onchange → oninput + weight tooltip

**目標檔案**：`skill-editor.html`
**影響範圍**：技能 params input、weight input 的事件綁定與說明文字

---

## 修改一：skill params 改 oninput

```js
// ❌ 舊
onchange="updateSkillParam('${sk.key}','${pk}',this.value)"

// ✅ 新
oninput="updateSkillParam('${sk.key}','${pk}',this.value)"
```

---

## 修改二：weight input 改 oninput + 加 tooltip

```js
// ❌ 舊
html += `<label class="score-weight-label">weight:<input type="number" step="0.1" min="0" value="${sw}" data-skill="${sk.key}" onchange="updateSkillWeight('${sk.key}',this.value)" ${!isEnabled ? 'disabled' : ''}></label>`;

// ✅ 新
html += `<label class="score-weight-label" title="分數個別乘數：1.0=全額，0.5=折半（只影響此塔）">weight:<input type="number" step="0.1" min="0" value="${sw}" data-skill="${sk.key}" oninput="updateSkillWeight('${sk.key}',this.value)" ${!isEnabled ? 'disabled' : ''}></label>`;
```

（注意：`!isEnabled` 需與 step5 的修改一致）

---

## 定位流程

1. Grep `onchange="updateSkillParam` → 找行號 → Edit 改 oninput
2. Grep `score-weight-label.*onchange` → 找行號 → Edit 改 oninput + 加 title

---

## 驗證

1. 勾選任意技能，改變 params 數值（不需點別處）→ 分數應即時更新
2. 改變 weight 數值 → 分數應即時更新
3. hover weight 欄位 → 出現 tooltip 說明文字
