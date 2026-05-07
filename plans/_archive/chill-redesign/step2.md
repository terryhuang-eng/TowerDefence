# Step 2：game.js — chill 疊加 + 減速計算重構

## 目標
1. 移除 per-enemy 的 `chillPerStack` 欄位（不再需要）
2. 疊加邏輯改用 `chillSk.stacksPerHit` + `GLOBAL_CAPS.chillMaxStacks`
3. 減速計算改用 `GLOBAL_CAPS.chillPerStack`
4. 狀態顯示 UI 更新
5. zone slow 的 hardcode `0.02` 改用全域值

只改 `js/game.js`，共 5 處。

---

## 修改一：敵人初始化欄位移除 chillPerStack

**位置**：line 1856（`pathIdx: 0, chillStacks: 0, chillDecay: 0, chillPerStack: 0`）

**現況**：
```js
pathIdx: 0, chillStacks: 0, chillDecay: 0, chillPerStack: 0, stunTimer: 0,
```

**改為**：
```js
pathIdx: 0, chillStacks: 0, chillDecay: 0, stunTimer: 0,
```

---

## 修改二：chill 疊加邏輯

**位置**：line 2441~2442

**現況**：
```js
enemy.chillStacks = Math.min(chillSk.cap, (enemy.chillStacks || 0) + 1);
enemy.chillPerStack = Math.max(enemy.chillPerStack || 0, chillSk.perStack);
```

**改為**：
```js
enemy.chillStacks = Math.min(GLOBAL_CAPS.chillMaxStacks, (enemy.chillStacks || 0) + (chillSk.stacksPerHit || 1));
```

---

## 修改三：freeze 觸發後清除（移除 chillPerStack 重置）

**位置**：line 2449~2450

**現況**：
```js
enemy.chillStacks = 0;
enemy.chillPerStack = 0;
```

**改為**：
```js
enemy.chillStacks = 0;
```

---

## 修改四：減速計算改用全域值

**位置**：line 2593

**現況**：
```js
const chillSlow = Math.min(e.chillStacks * (e.chillPerStack || 0.02), GLOBAL_CAPS.slowPct);
```

**改為**：
```js
const chillSlow = Math.min(e.chillStacks * GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct);
```

同行下方 line 2601（chillStacks 歸零時清 chillPerStack）：

**現況**：
```js
if (e.chillStacks === 0) e.chillPerStack = 0;
```

**改為**（刪除這行，chillPerStack 不再存在）：
```js
// （刪除）
```

---

## 修改五：狀態顯示 UI

**位置**：line 2274

**現況**：
```js
const ps = enemy.chillPerStack || 0.02; statusHtml += `<span style="color:#4cf">❄️冰冷${enemy.chillStacks}層（-${Math.round(Math.min(enemy.chillStacks*ps, GLOBAL_CAPS.slowPct)*100)}%）</span> `;
```

**改為**：
```js
statusHtml += `<span style="color:#4cf">❄️冰冷${enemy.chillStacks}層（-${Math.round(Math.min(enemy.chillStacks*GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct)*100)}%）</span> `;
```

---

## 修改六：zone slow hardcode 修正

**位置**：line 2864

**現況**：
```js
if (z.slowAmt) { e.chillStacks = Math.max(e.chillStacks || 0, Math.round(z.slowAmt / 0.02)); e.chillDecay = 0; }
```

**改為**：
```js
if (z.slowAmt) { e.chillStacks = Math.max(e.chillStacks || 0, Math.round(z.slowAmt / GLOBAL_CAPS.chillPerStack)); e.chillDecay = 0; }
```

---

## 預期結果
- 多塔同打：各塔各自貢獻 `stacksPerHit` 層，純加法，無 Math.max workaround
- 減速計算完全由全域值控制，與 per-tower 參數無關
