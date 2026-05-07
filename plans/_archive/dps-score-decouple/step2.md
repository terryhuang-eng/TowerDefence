# step2 — renderScoreDefsPanel 新增 DPS_SCORE_REF 輸入列

## 影響範圍

`skill-editor.html`，兩處：
- 第 193–200 行（update handlers）：新增 `updateDpsScoreRef`
- 第 265–272 行（renderScoreDefsPanel，DPS_REF 輸入列之後）：新增 DPS_SCORE_REF 輸入列

## 定位方式

```
Grep `updateDpsRef` → 找 handler 插入點
Grep `DPS_REF` → 找 renderScoreDefsPanel 的 DPS_REF 段落結束點
```

## 修改內容

### 1. 新增 updateDpsScoreRef handler

在 `updateDpsRef` 函式後插入：

```js
function updateDpsScoreRef(lv, val) {
  DPS_SCORE_REF[lv] = parseFloat(val) || 1;
  renderPanel();
}
```

### 2. renderScoreDefsPanel — 新增輸入列

在 DPS_REF 輸入列（`html += \`</div>\`` 結束後，`body.innerHTML = html` 前）插入：

```js
html += `<div style="margin-top:4px;border-top:1px solid #444;padding:6px 8px"><b>DPS_SCORE_REF</b></div>`;
html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 8px 8px">`;
for (const lv of lvKeys) {
  html += `<label style="font-size:11px">${lv}:<input type="number" step="1" value="${DPS_SCORE_REF[lv]}"
    style="width:48px;font-size:11px;background:#1a1a1a;color:#ccc;border:1px solid #444;padding:1px 3px"
    onchange="updateDpsScoreRef('${lv}',this.value)"></label>`;
}
html += `</div>`;
```

## 注意

- `DPS_SCORE_REF` 必須在 step1 完成後才能執行本步驟（常數需存在）
- help modal 的說明文字不在本步驟範圍，如需更新另開任務
