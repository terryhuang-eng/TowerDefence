# Step 2：autotest D 組 — Lv4 單塔隔離測試

## 目標

讓 autotest 能隔離測試每種 Lv4 塔的實際遊戲強度，排除策略雜訊。

## 核心概念

D 組策略：
- 固定 elemPicks（強制走到指定 Lv4 塔的路線）
- Bot 只升特定元素的塔，且強制選擇特定注入路線
- `sendBudgetRatio: 0`（不送兵，純防守，消除進攻變數）
- 跑完 20 波後比較剩餘 HP

## 影響範圍

**檔案：autotest.js**

### 1. 新增 D 組策略定義（代表性 Lv4 塔，各元素底 × 注入組合取強者）

每組：`elemPicks` 設定為 `[底元素, 注入元素, 底元素, 注入元素]`，讓 Bot 在 W4 就能升 Lv4。

建議先測 12 種代表性 Lv4（每底選 2 個注入）：

```js
// D 組：火底
d_fire_fire:   { name: '🔥🔥 暴焰', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','fire','fire','fire'] },
d_fire_thunder:{ name: '🔥⚡ 電漿', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','thunder','fire','thunder'] },
d_fire_water:  { name: '🔥💧 蒸汽', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','water','fire','water'] },
// D 組：水底
d_water_water: { name: '💧💧 深寒', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','water','water','water'] },
d_water_thunder:{ name:'💧⚡ 感電', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','thunder','water','thunder'] },
// ...（可後續補全 36 種）
```

### 2. Bot.decide() 加入 D 組邏輯

```js
// 現有 decide() 約 L352 附近，補充：
if (s.group === 'D') {
  // D 組：sendBudgetRatio=0，全金幣買塔/升塔
  // 升塔時：有元素 pick 就立刻升到最高可用等級
  // Bot 放塔邏輯不變（交替箭砲）
}
```

### 3. appendTowerSummary 改名為 appendTowerSummaryD 或讓 D 組複用現有顯示

D 組使用 `appendTowerSummary`（與 B/C 組相同格式），但標題改為「🔬 Lv4 隔離測試排名」。

### 4. UI 按鈕

```html
<button class="income-btn" id="autotest-d" style="flex:1;border:2px solid #ff9f43;color:#ff9f43;font-size:11px;">D 塔型</button>
```

## 輸出指標

每筆結果記錄：
- 存活波（主要）
- 剩餘 HP（同波次比較）
- estimatedDPS（改進後）
- 評語：接近通關 / 中期崩 / 早期崩

## 限制

- Bot 不一定能完美走指定升塔路線（金幣不夠時降級放 Lv1/2）
- 地圖路徑固定，AOE 塔可能被高估或低估（依怪物密度）
- 需在 step3（estimateDPS 改進）完成後，D 組排名才可信

## 依賴

- 建議先做 step3（改進 estimateDPS）再執行 step2
- 不依賴 step1（dps-calc.html 為獨立工具）
