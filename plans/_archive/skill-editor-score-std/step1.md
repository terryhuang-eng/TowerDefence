# skill-editor-score-std / step1 — 等級基準 UI 面板

## 目標

在 `#score-defs-panel` 底部新增「等級基準」區塊，
讓 `LEVEL_SCORE_STD` 與 `DPS_REF` 可從 UI 即時調整並重算所有塔分數。

## 影響範圍

唯一修改檔案：`skill-editor.html`
- `LEVEL_SCORE_STD` / `DPS_REF` const 物件的屬性可直接 mutate（不需改成 let）
- `renderScoreDefsPanel()` 末尾加新區塊
- 新增兩個 handler 函式

---

## 修改 A — renderScoreDefsPanel() 末尾加等級基準區塊

在 `body.innerHTML = html;`（約 line 219）之前，html 末尾加：

```js
const lvKeys = ['lv1','lv2','lv3','lv4','lv5','lv6'];
html += `<div style="margin-top:8px;border-top:1px solid #444;padding:6px 8px"><b>等級目標分數（LEVEL_SCORE_STD）</b></div>`;
html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 8px 4px">`;
for (const lv of lvKeys) {
  html += `<label style="font-size:11px">${lv}:
    <input type="number" step="1" value="${LEVEL_SCORE_STD[lv]}"
      style="width:48px;font-size:11px;background:#1a1a1a;color:#ccc;border:1px solid #444;padding:1px 3px"
      onchange="updateLevelStd('${lv}',this.value)">
  </label>`;
}
html += `</div>`;
html += `<div style="margin-top:4px;border-top:1px solid #444;padding:6px 8px"><b>DPS 參考值（DPS_REF）</b></div>`;
html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 8px 8px">`;
for (const lv of lvKeys) {
  html += `<label style="font-size:11px">${lv}:
    <input type="number" step="1" value="${DPS_REF[lv]}"
      style="width:48px;font-size:11px;background:#1a1a1a;color:#ccc;border:1px solid #444;padding:1px 3px"
      onchange="updateDpsRef('${lv}',this.value)">
  </label>`;
}
html += `</div>`;
```

---

## 修改 B — 新增兩個 handler 函式（緊接在 updateSkillDefScore 之後）

先確認 `updateSkillDefScore` 位置：
```
Grep 'updateSkillDefScore' skill-editor.html
```

加在其後：

```js
function updateLevelStd(lv, val) {
  LEVEL_SCORE_STD[lv] = parseFloat(val) || 0;
  renderPanel();
}
function updateDpsRef(lv, val) {
  DPS_REF[lv] = parseFloat(val) || 1;
  renderPanel();
}
```

---

## 行為說明

- 調整 `LEVEL_SCORE_STD[lv4]` 160 → 200：所有 Lv4 塔的目標分數從 160×adj 變成 200×adj，平衡度重算
- 調整 `DPS_REF[lv4]` 120 → 150：DPS 分縮小（同樣 DPS 對應更低分），塔更難達標
- 兩者互動：可以用 LEVEL_SCORE_STD 拉高目標（讓 DPS 貢獻更多），用 DPS_REF 調整 DPS 佔比

## 定位指令

```
Grep 'body.innerHTML = html' skill-editor.html → 確認 renderScoreDefsPanel 末尾行號
Grep 'updateSkillDefScore' skill-editor.html   → 確認 handler 插入位置
```
