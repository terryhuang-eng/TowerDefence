# Step 3：Sandbox 波次跳躍重置塔狀態

## 目標
Sandbox wave jump 除了清敵人，也要清除塔的戰鬥累積狀態，確保測試環境每次都是乾淨起點。

## 影響範圍
- **檔案**：`index.html`
- **位置**：`sbWaveGo` click handler，行約 590-604

## 目前程式碼（行 590-604）

```js
document.getElementById('sbWaveGo').addEventListener('click', function() {
  var g = sbGame(); if (!g) { alert('請先開始遊戲'); return; }
  var target = parseInt(document.getElementById('sbWaveSelect').value);
  g.enemies = []; g.spawnQueue = [];
  g.aiLaneTroops = []; g.aiLaneSpawnQueue = [];
  g.projectiles = []; g.aiLaneProjectiles = [];
  g.playerSendQueue = []; g.pvpIncomingSends = [];
  g.wave = target - 1;
  g.state = 'pre_wave';
  g.myReady = false;
  g.readyPlayers && g.readyPlayers.clear();
  g.showPreWave && g.showPreWave();
  g.rebuildSidebar && g.rebuildSidebar();
  g.render();
});
```

## 修改後（加入 tower state reset）

```js
document.getElementById('sbWaveGo').addEventListener('click', function() {
  var g = sbGame(); if (!g) { alert('請先開始遊戲'); return; }
  var target = parseInt(document.getElementById('sbWaveSelect').value);
  g.enemies = []; g.spawnQueue = [];
  g.aiLaneTroops = []; g.aiLaneSpawnQueue = [];
  g.projectiles = []; g.aiLaneProjectiles = [];
  g.playerSendQueue = []; g.pvpIncomingSends = [];
  g.zones = [];
  // 重置塔的戰鬥狀態（確保每次測試行為一致）
  (g.towers || []).forEach(function(tw) {
    tw._rampBonus = 0; tw._rampTarget = null; tw.atkTimer = 0;
    tw._permaBuff = 0; tw._killRushTimer = 0; tw._killRushBonus = 0;
    tw.atkCount = 0;
  });
  g.wave = target - 1;
  g.state = 'pre_wave';
  g.myReady = false;
  g.readyPlayers && g.readyPlayers.clear();
  g.showPreWave && g.showPreWave();
  g.rebuildSidebar && g.rebuildSidebar();
  g.render();
});
```

## 新增重置項目說明

| 欄位 | 理由 |
|------|------|
| `_rampBonus / _rampTarget / atkTimer` | step1+2 的主要問題點 |
| `_permaBuff` | sandbox 下 `permaBuff` 塔（熔爐塔）跨波殘留會讓攻擊力越來越高，測試不準確 |
| `_killRushTimer / _killRushBonus` | multishot 塔的擊殺加速 bonus |
| `atkCount` | multishot every N 的計數器，跨波殘留會讓 multishot 觸發時機不同 |
| `g.zones = []` | zone 效果（泥沼/暴雨）殘留到下一波是另一個 sandbox 污染源 |

## 注意
`_permaBuff` 在一般遊玩中是永久累積（intentional design）。這裡只在 sandbox reset 時清零，不影響正常遊戲。
