# step1 — 移除四處精華里程碑殘留

## 目標

清除 `js/game.js` 四處引用已廢棄 `CONFIG.essenceMilestones` / `CONFIG.essenceMilestoneBonus` 的代碼。

## 影響範圍

- **唯一修改**：`js/game.js`，四處

---

## 修改 A — 初始化（line ~62）

```
舊：
  this.essencePerElem = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
  this.essenceMilestonesReached = 0; // 已達到的里程碑數量

新：
  （整兩行刪除）
```

---

## 修改 B — 函數本體（line ~1094）

```
舊：
  checkEssenceMilestones() {
    const total = Object.values(this.essencePerElem).reduce((a, b) => a + b, 0);
    const milestones = CONFIG.essenceMilestones;
    const reached = milestones.filter(m => total >= m).length;
    if (reached > this.essenceMilestonesReached) {
      this.essenceMilestonesReached = reached;
      const bonusPct = Math.round(reached * CONFIG.essenceMilestoneBonus * 100);
      this.addBattleLog('player', `✨ 精華里程碑！送兵 HP +${bonusPct}%（共 ${total} 精華）`);
    }
  }

新：
  （整個函數刪除）
```

---

## 修改 C — 送兵 HP 加成（line ~1649）

```
舊：
  // 精華里程碑：送兵 HP 加成
  const essenceMilestoneHpMult = 1 + this.essenceMilestonesReached * CONFIG.essenceMilestoneBonus;
  for (const s of this.playerSendQueue) {
    const boostedHp = Math.round(s.hp * essenceMilestoneHpMult);
    this.aiLaneSpawnQueue.push({
      hp: boostedHp, maxHp: boostedHp, speed: s.speed, ...

新：
  for (const s of this.playerSendQueue) {
    this.aiLaneSpawnQueue.push({
      hp: s.hp, maxHp: s.hp, speed: s.speed, ...
```

（刪除 comment + essenceMilestoneHpMult 宣告；`boostedHp` 替換為 `s.hp`）

---

## 修改 D — 呼叫位置（line ~2974）

```
舊：
  // 精華累積：純屬 Lv3 塔（有 elem、無 infuseElem、無 thirdElem、非無屬）
  if (tw.elem && !tw.infuseElem && !tw.thirdElem && tw.elem !== 'none' && tw.level === 3) {
    this.essencePerElem[tw.elem] = (this.essencePerElem[tw.elem] || 0) + 1;
    this.checkEssenceMilestones();
  }

新：
  （整個 if 區塊刪除）
```

---

## 驗證

- Lv3 純屬塔攻擊時不再 crash
- 送兵 HP 正常（無 NaN）
- 無 `essencePerElem` / `essenceMilestonesReached` / `checkEssenceMilestones` 殘留引用
