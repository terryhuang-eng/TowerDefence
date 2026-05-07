# Step 2：AI 無限血量（測試永不因擊殺 AI 結束）

## 目標
autotest 期間 AI 不會被擊敗，確保每場測試都跑完全 20 波。
同時保留 AI HP 損耗數據，讓 "AI HP" 欄位反映送兵壓力（傷害越高 = 送兵越有效）。

## 設計決策
- 不用真的設 `Infinity`（顯示/計算可能出問題）
- 改為：`ai.hp = 99999`，`ai.maxHp = 99999`
- 傷害照常結算 → `ai.hp` 會下降但永遠不到 0
- 結果表顯示「AI HP 損耗 = 99999 - finalAiHp」比「剩餘 HP」更有意義

## 影響範圍
- 檔案：`autotest.js`
- 函數：`runTest()` 的重置區段

## 修改內容

### 1. runTest() 重置 AI 時改用超大 HP

```js
// 重置 AI（autotest.js L633~641）
if (game.ai) {
  const aiStart = CONFIG.aiStartGold?.[difficulty] || 350;
  game.ai.gold = aiStart;
  game.ai.income = CONFIG.aiBaseIncome || 50;
  game.ai.hp = 99999;       // ← 改這裡（原本是 diff.aiHp || 100）
  game.ai.maxHp = 99999;    // ← 改這裡
  game.ai.towers = [];
  game.ai.totalSent = [];
}
```

### 2. takeSnapshot() 改回傳「損耗量」
```js
// 現況（autotest.js L322）
aiHp: ai.hp ?? game.aiHp ?? 100,

// 改為：
aiHp: ai.hp ?? game.aiHp ?? 99999,
aiHpDmg: 99999 - (ai.hp ?? 99999),  // 送兵造成的總傷害
```

### 3. appendRankTable() 的「AI HP」欄改顯示傷害量
```js
// 現況（autotest.js L989）
html += `<td style="text-align:center;padding:3px 6px;">${last?.aiHp ?? '—'}</td>`;

// 改為：
const aiDmg = last?.aiHpDmg ?? 0;
html += `<td style="text-align:center;padding:3px 6px;">${aiDmg > 0 ? `-${aiDmg}` : '0'}</td>`;
```

同步更新欄位標題 `AI HP` → `AI傷害`：
```js
// 現況
html += '<th style="text-align:center;padding:3px 6px;">AI HP</th>';
// 改為
html += '<th style="text-align:center;padding:3px 6px;">AI傷害</th>';
```

### 4. detectIssues() 調整 AI HP 判斷
原本：`if (lastSnap.aiHp > 90)` 判斷「AI 幾乎沒受到送兵壓力」
改為用損耗量：`if ((lastSnap.aiHpDmg ?? 0) < 10)`

```js
// 改為：
if ((lastSnap.aiHpDmg ?? 0) < 10) {
  issues.push(`⚠️ AI 幾乎未受到傷害（${lastSnap.aiHpDmg ?? 0} dmg），送兵壓力極低`);
}
```

## 預期效果
- 每場測試必定跑完 20 波，不會提前因擊殺 AI 結束
- 結果表顯示「AI傷害」欄，可比較不同策略對 AI 的送兵壓力
- AI 傷害 > 100 = 理論上可擊殺 AI（如果不是無限血）
- AI 傷害 ≈ 0 = 送兵完全被 AI 塔防住

## 注意事項
- `appendTowerSummary` 中也有 `aiHp` 欄位，同步改顯示 `aiHpDmg`
- 超時（60s）時 `finalAiHp` 照常記錄，損耗計算不受影響
