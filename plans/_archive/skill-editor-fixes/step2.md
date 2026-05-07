# step2：新增「技能評分基準」面板（全局 scoreBase 編輯）

**目標檔案**：`skill-editor.html`
**影響範圍**：新增一個獨立的 HTML 區塊 + 相關 JS 函數

---

## 設計

在 skill-editor 右側面板（`#edit-panel` 之外）或頂部，
新增一個**可收合的** `<div id="score-defs-panel">`，
預設**收合**（不打擾日常流程），點擊標題展開。

### 位置

放在 `#edit-panel` 右側（flex 佈局），寬度固定 280px。
- 左側：現有編輯器（`#list-panel` + `#edit-panel`）
- 右側：新的 `#score-defs-panel`

若右側空間不足，改為放在 `#edit-panel` 最上方（可收合）。

---

## 面板內容

```
⚙️ 技能評分基準  [收合/展開]
────────────────────────────
[傷害]
灼燒      scoreBase: [35] scorePrimary: dot / ref: 0.30
引燃      scoreBase: [15] scorePrimary: flat / ref: 0.20
引爆      scoreBase: [25] scorePrimary: ratio / ref: 0.80
...
[控制]
冰冷      scoreBase: [30] scorePrimary: cap / ref: 40
...
[增益]
越攻越快  scoreBase: [20] scorePrimary: cap / ref: 0.50
...
```

- `scoreBase` 為可編輯 number input
- `scorePrimary` + `ref` 顯示用（說明縮放規則）
- 修改後即時生效（`onchange` 更新 `SKILL_DEFS[type].scoreBase`）
- 如果當前 towers tab 有選中的塔，同時呼叫 `renderPanel()` 刷新分數

---

## 實作細節

### 新增全域函數

```js
function updateSkillDefScore(type, value) {
    if (SKILL_DEFS[type]) {
        SKILL_DEFS[type].scoreBase = parseFloat(value) || 0;
        renderPanel();   // 刷新當前塔的分數面板
    }
}
```

### 渲染函數（初始化時呼叫一次，之後不需重建）

```js
function renderScoreDefsPanel() {
    const panel = document.getElementById('score-defs-panel');
    if (!panel) return;
    const towerSkills = Object.entries(SKILL_DEFS)
        .filter(([, def]) => def.category === 'tower');
    const groupNames = { damage:'傷害', control:'控制', debuff:'弱化', buff:'增益', special:'特殊' };
    const groups = {};
    for (const [key, def] of towerSkills) {
        if (!groups[def.group]) groups[def.group] = [];
        groups[def.group].push({ key, ...def });
    }
    let html = `<div class="score-defs-inner">`;
    for (const [group, skills] of Object.entries(groups)) {
        html += `<div class="group-header">${groupNames[group] || group}</div>`;
        for (const sk of skills) {
            const refInfo = sk.scorePrimary ? `${sk.scorePrimary}/${sk.scoreRef}` : '固定';
            html += `<div class="score-def-row">
                <span class="sk-name">${sk.name}</span>
                <label>base:<input type="number" step="1" value="${sk.scoreBase}"
                    onchange="updateSkillDefScore('${sk.key}',this.value)"></label>
                <span class="score-def-ref">${refInfo}</span>
            </div>`;
        }
    }
    html += `</div>`;
    panel.innerHTML = html;
}
```

### HTML 結構（加在 layout 中）

```html
<div id="score-defs-panel">
    <div class="panel-header" onclick="toggleScoreDefsPanel()">
        ⚙️ 技能評分基準 <span id="score-defs-toggle">▶</span>
    </div>
    <div id="score-defs-body" style="display:none">
        <!-- renderScoreDefsPanel() 填入 -->
    </div>
</div>
```

```js
function toggleScoreDefsPanel() {
    const body = document.getElementById('score-defs-body');
    const toggle = document.getElementById('score-defs-toggle');
    if (body.style.display === 'none') {
        body.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        body.style.display = 'none';
        toggle.textContent = '▶';
    }
}
```

### CSS

```css
#score-defs-panel {
    width: 260px;
    background: #1a1a1a;
    border-left: 1px solid #333;
    flex-shrink: 0;
    font-size: 11px;
}
#score-defs-panel .panel-header {
    padding: 8px 12px;
    background: #252525;
    cursor: pointer;
    font-weight: bold;
    color: #ffd93d;
    user-select: none;
}
.score-def-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
}
.score-def-row .sk-name { width: 70px; }
.score-def-row input { width: 45px; }
.score-def-ref { color: #555; font-size: 10px; }
```

---

## 定位流程

1. Grep `</body>` 或 `<div id="edit-panel"` 找到主 layout 位置
2. 找到 flex container（`#main` 或 `#editor-layout` 之類）
3. 新增 `#score-defs-panel` div
4. 新增 CSS、JS 函數
5. 在 `init()` 或頁面載入時呼叫 `renderScoreDefsPanel()`

---

## 驗證

1. 展開「技能評分基準」面板
2. 找到「越攻越快」，把 scoreBase 從 20 改為 10
3. 切到任意有越攻越快的塔
4. 分數面板中越攻越快的分數應減半
5. 切到另一個有越攻越快的塔，分數也應已更新
