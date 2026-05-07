# Step 1：game.js — hpPct 傷害加 cap 判斷

## 目標
防止 hpPct 技能在 Boss 場景造成過量傷害。

## 影響範圍
- 檔案：`js/game.js`
- 行數：約 L2370~2375（hpPct 傷害計算區塊）
- 範圍：**僅修改 hpPct 傷害計算，不動其他邏輯**

---

## 定位方式

```
Grep 找：hpPctSk && (tower.atkCount
→ 找到 L2371 附近的 hpPct 觸發區塊
→ Read ±10 行確認 context
```

## 現有代碼（L2371~2374 附近）

```js
if (hpPctSk && (tower.atkCount || 0) % hpPctSk.every === 0) {
  if (!enemy._hpPctCd || enemy._hpPctCd <= 0) {
    enemy.hp -= Math.floor(enemy.maxHp * hpPctSk.pct);   // ← 無 cap
    enemy._hpPctCd = hpPctSk.cd;
```

## 修改後代碼

```js
if (hpPctSk && (tower.atkCount || 0) % hpPctSk.every === 0) {
  if (!enemy._hpPctCd || enemy._hpPctCd <= 0) {
    const rawHpDmg = Math.floor(enemy.maxHp * hpPctSk.pct);
    const hpDmg = hpPctSk.cap ? Math.min(rawHpDmg, hpPctSk.cap) : rawHpDmg;
    enemy.hp -= hpDmg;
    enemy._hpPctCd = hpPctSk.cd;
```

## 驗算
- 一般怪 HP=300，pct=0.03，cap=120：rawHpDmg=9 → hpDmg=9（cap不觸發）✓
- Boss HP=7000，pct=0.03，cap=120：rawHpDmg=210 → hpDmg=120（cap觸發）✓
- 無 cap 欄位的舊技能：hpDmg=rawHpDmg（維持向後相容）✓

## 注意
- 不需要修改 dps-calc.html 的 hpPct 計算（step4 一起處理）
- 完成後提醒執行 `/clear`
