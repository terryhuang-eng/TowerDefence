# Step 1：玩家塔射擊 — while loop 修正

## 目標
將 `tw.atkTimer = 0` 改為 `tw.atkTimer -= 1`，並用 while loop 包住整個射擊邏輯，讓高倍速下可以在同一個 update() 觸發多次攻擊。

## 影響範圍
- **檔案**：`js/game.js`
- **行數**：約 2751–2870（玩家塔攻擊 loop）

## ⚠️ 修改注意
1. while loop 需要有**最大攻擊次數上限**（防止 effAtkSpd 極端值造成無限迴圈）
2. ramp 邏輯（`_rampBonus` 更新）需在每次 while 迭代內執行
3. `tw.atkCount` 每次 while 迭代各 +1

建議上限：`while (tw.atkTimer >= 1 && shots++ < 20)` — 20 次/幀已足夠覆蓋任何合理的 effAtkSpd × 8×speed 組合（18.9 × 8× = 2.4 次/幀，遠低於 20）

## 目前程式碼結構（行 2750–2870 示意）

```js
for (const tw of this.towers) {
  // cooldown ticks...
  const rampSk = getSkill(tw, 'ramp');
  const effAtkSpd = tw.atkSpd * ... * (1 + (tw._rampBonus || 0));
  tw.atkTimer += dt * effAtkSpd;
  if (tw.atkTimer < 1) continue;        // ← 這行保留
  tw.atkTimer = 0;                      // ← 改為 while loop
  // ... 射擊邏輯（目標選擇 / ramp 更新 / doDmg / chain / ...）
}
```

## 修改後結構

```js
for (const tw of this.towers) {
  // cooldown ticks...（維持不動）
  const rampSk = getSkill(tw, 'ramp');
  tw.atkTimer += dt * tw.atkSpd * ... * (1 + (tw._rampBonus || 0));  // ← effAtkSpd 每次 while 重算

  let shotsThisFrame = 0;
  while (tw.atkTimer >= 1 && shotsThisFrame < 20) {
    tw.atkTimer -= 1;
    shotsThisFrame++;

    // 目標選擇（每次 while 重新選，因前一次攻擊可能殺死目標）
    const effRange = ...
    const targets = ...
    if (targets.length === 0) break;
    const target = targets[0];

    tw.atkCount = (tw.atkCount || 0) + 1;
    // ... 完整射擊邏輯 ...

    // ramp 更新後，effAtkSpd 可能變化 → while 條件下次仍用最新值
    // 但 tw.atkTimer 已累積，不需要重算 timer（timer 是前面加好的）
  }
}
```

## 注意：effAtkSpd 的計算位置

**問題**：`_rampBonus` 在每次 while 迭代內更新，但 `tw.atkTimer` 是用 while **前**的 effAtkSpd 累積的。

解法（簡單可行）：
- timer 累積時用**當幀初始**的 effAtkSpd（ramp 可能在這幀更新）
- 這個誤差在一幀內可忽略，且 ramp 本來就是漸進加速設計

## 驗證
1. 設 1× 速讓疾風塔 ramp 疊滿後，記錄擊殺某波怪的時間（或剩餘血量）
2. 切 8× 速重跑同一波 → 怪物應有相近的剩餘血量（不再是 8× 最差）
