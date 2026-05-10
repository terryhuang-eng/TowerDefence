# Step 3：game.js — wealthScale 傷害邏輯 + interest 波末結算

## 目標
在 `js/game.js` 實作兩個技能的邏輯：
1. wealthScale：塔攻擊時讀取即時持有金幣，計算傷害加成
2. interest：每波戰鬥結束時（進入 pre_wave 前），依持有金幣直接加一筆金幣

---

## 改動一：wealthScale 傷害加成（塔攻擊計算）

### 定位方式
Grep `e._lastHitTower = tw` 或 `effDmg` 找到塔攻擊的傷害計算區段。
確認 `effDmg` 是塔的最終有效傷害變數（含 aura、permaBuff 加成後）。

### 插入位置
在 `effDmg` 確定後、呼叫 `this.doDmg(...)` 之前，加入：

```js
// wealthScale：財富積累傷害加成
const wsSk = getSkill(tw, 'wealthScale');
if (wsSk) {
  effDmg += Math.min(Math.floor(this.gold / wsSk.divisor), wsSk.cap);
}
```

**行為：**
- `this.gold`：即時讀取，玩家花錢後立刻反映
- `Math.floor(this.gold / wsSk.divisor)`：每 divisor g = +1 傷害
- `Math.min(..., wsSk.cap)`：硬上限，防止後期超量

---

## 改動二：interest 波末結算

### 定位方式
Grep `this.state === 'fighting' && waveDone` 找到波次清場判斷（約第 3050 行附近）。

找到以下區段：
```js
if (this.state === 'fighting' && waveDone) {
  // Wave clear → 收取 income
  this.gold += this.income;
  this.addBattleLog('player', `📈 Wave ${this.wave} 結算：收入 +${this.income}g（總金:${Math.floor(this.gold)}）`);
  ...
```

### 插入位置
在 `this.gold += this.income;` 這行**之後**（先收 income，再以含 income 的金幣計算利息），在進入 `this.state = 'pre_wave'` 或 `this.state = 'reward'` 之前，插入：

```js
// interest：利息結算（波次結束後，income 已入帳的金幣為基準）
const interestTower = this.towers.find(tw => hasSkill(tw, 'interest'));
if (interestTower) {
  const iSk = getSkill(interestTower, 'interest');
  const interestBonus = Math.min(Math.floor(this.gold * iSk.rate), iSk.cap);
  if (interestBonus > 0) {
    this.gold += interestBonus;
    this.addBattleLog('player', `💰 利息 +${interestBonus}g（持有 ${Math.floor(this.gold - interestBonus)}g × ${(iSk.rate*100).toFixed(0)}%，上限 ${iSk.cap}g）`);
  }
}
```

**設計要點：**
- `this.towers.find(...)` = 只觸發一次，無論場上有多少純無塔
- 觸發時機 = income 已入帳之後、state 切換之前（玩家無法賣塔影響此時的 this.gold）
- `interestBonus` 直接加入 `this.gold`（非永久 income）
- 若無純無塔則完全不執行，無副作用

---

## 改動三：AI 不觸發 interest（選擇性）

若遊戲有 AI 對手（PVE 模式），確認 `this.ai` 物件不會觸發 interest（AI 目前沒有純無塔）。
找到以下 AI income 區段：
```js
if (this.mode === 'pve') {
  this.ai.gold += this.ai.income;
  ...
}
```
確認該區段沒有呼叫 interest 邏輯即可（不需要額外修改）。

---

## 驗證方式

**wealthScale：**
- 瀏覽器開 `?sandbox=1`，建一座 LV5 純無塔
- 持有 200g 時：無塔攻擊傷害應比 baseDmg 高約 +10（200 / 20 = 10）
- 花掉 160g（剩 40g）：無塔攻擊傷害應比 baseDmg 高約 +2

**interest：**
- 打完一波，觀察 battle log 是否顯示「💰 利息 +Xg」
- 確認金幣增加量 = min(持有g × 0.05, 40)
- 確認 pre_wave 期間賣塔後，下一波結算的利息不受影響（此次結算已完成）
