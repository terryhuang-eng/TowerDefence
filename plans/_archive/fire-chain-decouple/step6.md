# step6 — 在評分基準面板暴露 conditionalFactor 調整入口

## 根本原因

`renderScoreDefsPanel`（skill-editor.html ~200 行）目前只為每個技能渲染 `scoreBase` 輸入框。
`conditionalFactor`（ignite=0.75, detonate=0.5）寫死在 `SKILL_DEFS` 中，使用者無法從 UI 調整，
也看不到這兩個數值的語義說明。

## 影響範圍

- `skill-editor.html`：`renderScoreDefsPanel`（~196–204 行）+ 新增 `updateSkillDefConditional` 函數

## 具體修改

### 1. 新增 `updateSkillDefConditional` 函數（緊接在 `updateSkillDefScore` 後面，約 173 行後）

```js
function updateSkillDefConditional(type, value) {
  if (SKILL_DEFS[type]) {
    SKILL_DEFS[type].conditionalFactor = parseFloat(value) || 0;
    renderPanel();
  }
}
```

### 2. 修改 `renderScoreDefsPanel` 中的技能行渲染（約 200–204 行）

**改前：**
```js
html += `<div class="score-def-row">
  <span class="sk-name">${sk.name}</span>
  <label>base:<input type="number" step="1" value="${sk.scoreBase}" onchange="updateSkillDefScore('${sk.key}',this.value)"></label>
  <span class="score-def-ref">${refInfo}</span>
</div>`;
```

**改後：**
```js
// conditionalFactor 說明文字對照表
const condDesc = {
  ignite: '灼燒 uptime 假設',
  detonate: '3層觸發率假設',
};
// ... (在 for loop 前定義，或直接 inline)

let condHtml = '';
if (sk.conditionalFactor !== undefined) {
  const desc = condDesc[sk.key] || '條件折扣';
  condHtml = ` <label title="${desc}（0=缺前置時歸零）">cond:<input type="number" step="0.05" min="0" max="1"
    value="${sk.conditionalFactor}"
    onchange="updateSkillDefConditional('${sk.key}',this.value)"
    style="width:42px"></label>`;
}

html += `<div class="score-def-row">
  <span class="sk-name">${sk.name}</span>
  <label>base:<input type="number" step="1" value="${sk.scoreBase}" onchange="updateSkillDefScore('${sk.key}',this.value)"></label>
  ${condHtml}
  <span class="score-def-ref">${refInfo}</span>
</div>`;
```

> **定位**：在 for loop 外（緊接在 `html = '';` 之後）加入 `condDesc` 物件，避免每次迭代重新建立。

## 執行順序

1. Grep `updateSkillDefScore` → 確認行號，在其後插入 `updateSkillDefConditional`
2. Grep `score-def-row` → 定位技能行渲染位置
3. 在 `html = '';` 之後加入 `condDesc`
4. 修改 for loop 內的渲染邏輯加入 `condHtml`

## 預期效果

⚙️ 面板中 ignite 行：`base: [15] cond: [0.75]  ratio / 0.2`（hover tooltip：「灼燒 uptime 假設」）
⚙️ 面板中 detonate 行：`base: [20] cond: [0.50]  ratio / 0.8`（hover tooltip：「3層觸發率假設」）
改值後即時重算分數面板。
