# atkTimer 溢位 + rampBonus 跨波殘留

## 問題描述
Sandbox 重複測試同一波，風塔表現越來越強：
- 第 1 次：打不死
- 第 2 次：傷害明顯變高
- 第 3 次後：直接清空

---

## 根本原因（兩個缺陷疊加）

### 缺陷 1：`atkTimer` 在 pre_wave 無目標時溢位（主要）

**直接觸發**：step1 修正（`atkTimer = 0` → `atkTimer -= 1`）在「無目標」情境下產生副作用。

```js
// game.js 行 2754-2756
while (tw.atkTimer >= 1 && _shotsThisFrame < 20) {
  tw.atkTimer -= 1;   // 扣 1
  _shotsThisFrame++;

  const targets = [...];
  if (targets.length === 0) break;  // break 但 timer 只扣了 1
```

**每幀行為（8× 速，rampBonus=5.8，atkSpd=2.7）**：
- 累積：`dt × effAtkSpd = 0.128 × 2.7 × 7.8 = 2.69`
- 消耗：`1`（while 只執行一次就 break）
- 淨增：`+1.69 / 幀`

**結果**：pre_wave 期間（等待玩家按開始），`atkTimer` 每秒增加 `1.69 × 60 = 101`。等待 3 秒 → `atkTimer ≈ 303`。

波次開始，第一批敵人出現：while loop 每幀最多打 20 下，連打數幀清空所有敵人。

### 缺陷 2：`_rampBonus` 跨波殘留（次要，放大缺陷 1）

波次結束或 sandbox 重置時，塔的 `_rampBonus` **從未歸零**。

```js
// 切波時沒有任何 tower state reset
g.enemies = [];
g.wave = target - 1;
g.state = 'pre_wave';
// _rampBonus 維持上波末尾值（最高可達 5.8）
```

這使 `effAtkSpd = 2.7 × 7.8 = 21` 在 pre_wave 期間持續讓 `atkTimer` 快速累積。

**`_rampBonus` 本身確實在第一次攻擊時歸零**（target 不同 → reset），所以對在波次中的 DPS 影響有限。但它顯著放大了 `atkTimer` 在 pre_wave 中的溢位速度。

---

## 兩缺陷交互過程

| 狀態 | Run 1 | Run 2 | Run 3 |
|------|-------|-------|-------|
| wave 開始前 `_rampBonus` | 0 | 5.8（殘留） | 5.8（殘留） |
| pre_wave `atkTimer` 溢位 | 無（ramp=0，累積 < 消耗） | **嚴重**（累積 2.69 > 消耗 1） | **嚴重** |
| wave 開始時 `atkTimer` | 0 | 300+ | 300+ |
| 效果 | 正常 DPS | 第一波高爆發 | 幾乎瞬間清場 |

注意：在 **1× 速**下缺陷 1 不發生（`0.016 × 21 = 0.34 < 1`），每幀消耗 > 累積，`atkTimer` 不會溢位。這也解釋了為何 1× 速下行為正常。

---

## 修正方案

### 修正 1（必要）：無目標時清空 `atkTimer`

```js
// game.js，while loop 內
if (targets.length === 0) { tw.atkTimer = 0; break; }
```

從 `break` 改為 `tw.atkTimer = 0; break;`，確保 pre_wave 期間 timer 不溢位。

### 修正 2（建議）：波次開始時重置塔的戰鬥狀態

```js
// game.js，startWave() 內，state = 'spawning' 之前
for (const tw of this.towers) {
  tw._rampBonus = 0;
  tw._rampTarget = null;
  tw.atkTimer = 0;
}
```

確保每波開始時 ramp 都從 0 出發，語意上正確（ramp 是「本波連攻加速」，不應跨波）。

### 修正 3（建議）：sandbox 波次跳躍也重置塔狀態

```js
// index.html，sandbox wave jump handler
g.towers.forEach(function(tw) {
  tw._rampBonus = 0; tw._rampTarget = null; tw.atkTimer = 0;
  tw._permaBuff = 0; tw._killRushTimer = 0; tw._killRushBonus = 0;
});
```

---

## 執行步驟

| 步驟 | 位置 | 修改 |
|------|------|------|
| step1.md | `js/game.js` while loop 行 2765 | `break` → `tw.atkTimer = 0; break;` |
| step2.md | `js/game.js` `startWave()` | 波次開始前重置 `_rampBonus / _rampTarget / atkTimer` |
| step3.md | `index.html` sandbox wave jump | 加入 tower combat state reset |
