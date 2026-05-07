# Step 2：startWave() 重置塔戰鬥狀態

## 目標
每波開始時重置 `_rampBonus`，確保 ramp 是「本波連攻加速」不跨波。

## 影響範圍
- **檔案**：`js/game.js`
- **函式**：`startWave()`，行約 1542–1550

## 目前程式碼（行 1547 附近）

```js
startWave() {
  this.wave++;
  if (this.wave > CONFIG.totalWaves) { this.endGame(true, 'survived'); return; }
  this.state = 'spawning';
  this.sendUsed = {};
  // ...
```

## 修改後

```js
startWave() {
  this.wave++;
  if (this.wave > CONFIG.totalWaves) { this.endGame(true, 'survived'); return; }
  // 重置塔的每波戰鬥狀態
  for (const tw of this.towers) {
    tw._rampBonus = 0;
    tw._rampTarget = null;
    tw.atkTimer = 0;
  }
  this.state = 'spawning';
  this.sendUsed = {};
  // ...
```

## 說明
- `_rampBonus = 0`：ramp 從本波第一擊重新累積
- `_rampTarget = null`：確保第一擊判斷為「新目標」，與 _rampBonus=0 一致
- `atkTimer = 0`：確保波次開始時不帶入 pre_wave 期間的殘留（配合 step1 其實不太必要，但語意上更乾淨）
- `_permaBuff` **不重置**（設計上是永久增益，跨波累積是意圖）

## 驗證
Sandbox 重複跑同一波 5 次：每次行為應完全相同（第 1 次無法擊殺的，第 5 次應同樣無法擊殺）。
