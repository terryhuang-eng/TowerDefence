# Step 1：js/game.js — 射程圓圈視覺修正 + 光環半徑顯示

## 目標

1. 選中/hover 塔時，射程圓圈用 `effRange` 而非 `tw.range`
2. 選中有 `aura_range` skill 的塔時，額外繪製綠色光環半徑圓

## 影響範圍

**檔案：js/game.js**

定位方式（執行時 Grep）：
- `ctx.arc(px\+cs/2, py\+cs/2, tw\.range\*cs` → 找到 L2984、L2990

---

## 修改說明

### A. 選中塔射程圓（L~2980–2986）

```js
// 目前
ctx.arc(px+cs/2, py+cs/2, tw.range*cs, 0, Math.PI*2);

// 修改後
const effRangeVis = tw.range + (tw._auraRange || 0);
ctx.arc(px+cs/2, py+cs/2, effRangeVis*cs, 0, Math.PI*2);
```

在 stroke() 之後，加入光環半徑圓：
```js
// 選中塔有 aura_range 時，繪製光環覆蓋範圍
const arSk = getSkill(tw, 'aura_range');
if (arSk) {
  ctx.beginPath();
  ctx.arc(px+cs/2, py+cs/2, arSk.radius*cs, 0, Math.PI*2);
  ctx.strokeStyle = '#44ff8844'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke();
  ctx.setLineDash([]);
}
```

### B. Hover 塔射程圓（L~2988–2992）

```js
// 目前
ctx.arc(px+cs/2, py+cs/2, tw.range*cs, 0, Math.PI*2);

// 修改後（與 A 相同邏輯，但 hover 不需繪製光環半徑圓，避免干擾）
const effRangeVisH = tw.range + (tw._auraRange || 0);
ctx.arc(px+cs/2, py+cs/2, effRangeVisH*cs, 0, Math.PI*2);
```

---

## 執行注意

- `tw._auraRange` 在每幀開頭重置為 0（L2632），所以渲染時若在同一幀已更新則正確
- 渲染與邏輯幀同步（同一 requestAnimationFrame loop），不需擔心時序問題
- `getSkill` 已在 js/skills.js 定義，可直接使用

## 依賴

- 無，可獨立執行
