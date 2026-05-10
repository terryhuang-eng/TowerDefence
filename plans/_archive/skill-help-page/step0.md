# Step 0: Bug Fix — burnStacks 應隨 burnTimer 歸零清空

## 問題
`burnStacks`（引爆計數）只有在 detonate 觸發時才重置為 0，`burnTimer` 自然歸零（灼燒熄滅）時不清除。
導致：有 burn-only 塔快速疊層後，帶 detonate 的塔每一擊都能立即引爆（stacks 永遠 >= 3）。

## 原始設計意圖
- burn stacks 代表「目標身上的燃燒積累」
- 引爆觸發後 stacks 歸零，需要重新堆疊才能再次引爆
- 火焰熄滅（burnTimer <= 0）時積累也應消失 → 必須**持續**有 burn 塔輸出才能維持引爆節奏

## 修正

**改動檔案**：`js/game.js`

**定位**：enemy update loop 中處理 burnTimer 扣減的區段（`e.burnTimer -= dt` 附近）

**現況**（約 2640 行）：
```js
if (e.burnTimer > 0) {
  const _bdt = e.burnDmg * dt;
  e.hp -= _bdt;
  ...
  e.burnTimer -= dt;
}
```

**修正**：在 `burnTimer` 扣減後加一行：
```js
if (e.burnTimer <= 0) e.burnStacks = 0;
```

## 影響範圍
- 只影響 burn + detonate 的互動節奏
- burn DOT 本身、ignite 均不受影響
- 修正後行為：stacks 僅在「目標持續燃燒中」才有效，detonate 塔需與 burn 塔協同輸出才能持續引爆
