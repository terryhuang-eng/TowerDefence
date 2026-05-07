# step1 — 分數面板拆分顯示 effectiveDPS 與 dpsScore

## 影響範圍

`skill-editor.html:663`（renderScorePanel 的 DPS 顯示行）

## 定位方式

```
Grep `DPS 分：` → 找到目標行
```

## 修改內容

### 現況（line 663）
```js
h += `<div>DPS 分：<b>${bd.dpsScoreActual}</b>${aoeNote}</div>`;
```

### 改為兩行
```js
h += `<div style="color:#aaa;font-size:0.9em">effectiveDPS: <b style="color:#ccc">${bd.effectiveDPS}</b>${aoeNote}</div>`;
h += `<div>dpsScore: <b>${bd.dpsScoreActual}</b></div>`;
```

說明：
- 第一行 `effectiveDPS` 用灰色小字顯示，作為參考資訊（不受評分參數影響）
- 第二行 `dpsScore` 為換算後的分數（受 DPS_SCORE_REF / DPS_REF 影響）
- aoeNote 移至 effectiveDPS 行，因為 AOE 是影響實際 DPS 的因素

## 驗證

修改後：
- 改塔的 damage/atkSpd/aoe → effectiveDPS 與 dpsScore 都變 ✓
- 改 DPS_SCORE_REF → 只有 dpsScore 變，effectiveDPS 不動 ✓
- 改 DPS_REF → 只有 dpsScore 變，effectiveDPS 不動 ✓
