# step2 — skill-editor 分析面板條件標記 UI

## 目標
在「📊 分數分析」面板中，對條件性技能（ignite / detonate）顯示視覺標記，讓設計師一眼看出分數已折扣的原因。

## 影響範圍
- `skill-editor.html`：`renderScorePanel`（約 617 行）輸出 HTML

## 具體修改

在 `rows` 的每一行顯示時，若技能有 `conditionalFactor`：
```js
// 現在：
h += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts</div>`;
// 改後：
const condLabel = r.conditionalFactor !== undefined
  ? ` <span style="color:#fa8;font-size:10px">⚡×${r.conditionalFactor}（條件性）</span>`
  : '';
h += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts${condLabel}</div>`;
```

`computeScoreBreakdown` return 的 rows 需加入 `conditionalFactor` 欄位。

## 預期效果

分析面板顯示如下：
```
📊 分數分析 ▼
  灼燒 ×1.0 → 25 pts
  引燃 ×1.0 → 11.3 pts ⚡×0.75（條件性）
  引爆 ×1.0 → 10 pts ⚡×0.5（條件性）
  DPS: 138 → 95.4 pts
  ──────────────────
  總分: 141.7 / 目標: 145 (97%)
```

## 補充
- 若塔沒有帶前置（ignite 無 burn），score 顯示 0 pts 加上 `⚠️ 缺前置 burn` 提示
