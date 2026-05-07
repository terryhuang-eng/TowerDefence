# Step 2：AI 塔射擊 — 同步修正

## 目標
game.js 行 2917–2919 的 AI 塔有同一個 bug，套用相同的 `while` 修法。

## 影響範圍
- **檔案**：`js/game.js`
- **行數**：約 2914–2960（AI 塔攻擊 loop）

## 目前程式碼（行 2917–2919）

```js
tw.atkTimer = (tw.atkTimer || 0) + dt * aiTwStats.atkSpd;
if (tw.atkTimer < 1) continue;
tw.atkTimer = 0;
// ...攻擊邏輯（較簡單）...
```

## 修改後

```js
tw.atkTimer = (tw.atkTimer || 0) + dt * aiTwStats.atkSpd;
let aiShotsThisFrame = 0;
while (tw.atkTimer >= 1 && aiShotsThisFrame < 20) {
  tw.atkTimer -= 1;
  aiShotsThisFrame++;
  // ...攻擊邏輯（目標選擇 / doDmg）...
}
continue; // 改為 break 或直接移到 while 後
```

AI 塔的射擊邏輯比玩家塔簡單（無 ramp / multishot），包進 while 的工作量較小。

## 驗證
PVP 模式下，AI 在 8× 速的攻擊效果應與 1× 速等比。
