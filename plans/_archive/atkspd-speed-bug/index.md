# 倍速下攻擊次數丟失 Bug

## 問題描述
風系塔（疾風 Lv4/Lv5）在 ramp 疊滿後，1× 速可擊殺，高倍速下存活血量越多（8× 最差）。

---

## 根本原因：`tw.atkTimer = 0`（行 2753）

### 攻擊 Timer 邏輯（game.js:2750–2753）

```js
const effAtkSpd = tw.atkSpd * ... * (1 + (tw._rampBonus || 0));
tw.atkTimer += dt * effAtkSpd;
if (tw.atkTimer < 1) continue;
tw.atkTimer = 0;   // ← 問題所在：應為 -= 1 甚至 while loop
```

Timer 超過 1 時只觸發**一次攻擊**，然後**歸零**，多餘的累積時間完全丟失。

---

## 量化影響

疾風 Lv5：`atkSpd = 2.7`，ramp cap = 6 → **最大 effAtkSpd = 2.7 × 7 = 18.9**

| 倍速 | sDt（秒/幀） | sDt × 18.9 | 實際射速（次/秒） | 期望射速 | 效率 |
|------|------------|------------|-----------------|---------|------|
| 1×   | 0.016      | 0.302      | ~18.2           | 18.9    | 96%  |
| 2×   | 0.032      | 0.605      | ~30.3           | 37.8    | 80%  |
| 4×   | 0.064      | 1.21       | 60（每幀1發）    | 75.6    | 79%  |
| 8×   | 0.128      | 2.42       | 60（每幀1發）    | 151.2   | **40%** |

8× 速時塔只剩期望 DPS 的 40%，完全解釋觀察現象。

---

## 次生影響（加重問題）

1. **ramp 累積更慢**：因為攻擊次數少，`_rampBonus` 更難疊到上限，effAtkSpd 更低 → 惡性循環
2. **AI 塔同樣受影響**（game.js:2919 `tw.atkTimer = 0`，同一 bug）

---

## 解法

**正確修法：while loop**（行 2752-2753 重構）

```js
tw.atkTimer += dt * effAtkSpd;
while (tw.atkTimer >= 1) {
  tw.atkTimer -= 1;
  // ... 完整射擊邏輯（一次 while iteration = 一次攻擊）
}
```

代價：射擊程式碼需提取為可重複呼叫的結構（目前約 60 行）。

**退而求其次：`-= 1` 但不 while loop**

```js
tw.atkTimer = 0;  →  tw.atkTimer -= 1;
```

只要 `sDt * effAtkSpd ≤ 2`（約 effAtkSpd ≤ 15.6 at 8×），每幀最多損失 < 1 次攻擊。但無法解決更高 atkSpd 場景。

**最輕量：cap sDt 傳入 tower update**

在塔攻擊計算前，限制 dt 最大為 `1 / effAtkSpd`，確保每幀最多累積到剛好觸發一次。這不增加射擊次數，但不再丟失時間（等效 `while` 在 effAtkSpd 不極端時）。不推薦：治標不治本。

---

## 執行步驟

| 步驟 | 內容 |
|------|------|
| step1.md | 重構玩家塔射擊邏輯為 while loop（game.js 行 2752 附近） |
| step2.md | 同步修正 AI 塔（game.js 行 2918 附近） |
