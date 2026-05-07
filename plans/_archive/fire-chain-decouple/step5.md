# step5 — 修正「灼燒 ×undefined」Bug

## 根本原因

`computeScoreBreakdown`（skill-editor.html ~962 行）的 `foldedIntoDPS` 早返回缺少 `weight` 欄位：

```js
// 現況（step3 寫入）：
if (def.foldedIntoDPS) {
  return { name: def.name, score: 0, foldedIntoDPS: true };
  //                                  ↑ weight 缺失！
}
```

渲染面板（step2 寫入）讀取 `r.weight`：

```js
h += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts...`;
//                                         ↑ undefined
```

`weight` 不存在 → 模板輸出 `×undefined`。

## 影響範圍

- `skill-editor.html`：`computeScoreBreakdown` 中 foldedIntoDPS 早返回（約 962 行）

## 具體修改

**定位**：`Grep 'foldedIntoDPS'` → 確認在 computeScoreBreakdown 的 map callback 內

```js
// 改前：
if (def.foldedIntoDPS) {
  return { name: def.name, score: 0, foldedIntoDPS: true };
}

// 改後：
if (def.foldedIntoDPS) {
  const weight = (s.scoreWeight !== undefined) ? s.scoreWeight : 1.0;
  return { name: def.name, score: 0, weight, foldedIntoDPS: true };
}
```

## 預期效果

`灼燒 ×1 → 0 pts`（weight 正常顯示為 1）
