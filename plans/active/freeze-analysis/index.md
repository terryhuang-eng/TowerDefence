# freeze-analysis — 冰凍觸發條件與層數清除行為確認

## 結論摘要

| 問題 | 答案 |
|------|------|
| 觸發冰凍後，冰冷層數會清除嗎？ | **是，完全歸零（chillStacks = 0）** |
| freeze 可以單獨生效嗎？ | **否，必須同一座塔同時有 chill + freeze** |
| 跨塔疊層可以觸發 freeze 嗎？ | **可以，但要由帶 freeze 的塔最後一擊觸發** |

---

## 完整運作流程（game.js line ~2470）

```
塔攻擊命中敵人
  ↓
getSkill(tower, 'chill') 存在？
  ├─ NO → 不疊層，freeze 也不觸發（即使塔有 freeze）
  └─ YES
       ├─ chillStacks += stacksPerHit（上限 chillMaxStacks=130）
       ├─ chillDecay = 0（重置衰減計時）
       └─ getSkill(tower, 'freeze') 存在？
            ├─ NO → 只疊層，不觸發冰凍
            └─ YES → chillStacks >= threshold（預設 30）？
                      ├─ NO → 繼續疊層
                      └─ YES
                           ├─ stunTimer = max(stunTimer, dur × ccMult)
                           └─ chillStacks = 0  ← 完全清零
```

---

## 全域數值（GLOBAL_CAPS）

| 參數 | 值 | 說明 |
|------|-----|------|
| `chillPerStack` | 0.005 | 每層 -0.5% 移動速度 |
| `chillMaxStacks` | 130 | 疊層上限（最多 65% 減速）|
| `chillDecayRate` | 6 | 未被攻擊時每秒衰減 6 層 |
| `slowPct` | 0.8 | 減速硬上限 80%（實際由 chillMaxStacks 限制在 65%）|

> ⚠️ `slowPct` 的 code 內 comment 寫「75%」但值是 0.8（80%），
> 且 130 層 × 0.005 = 65%，實際最大減速是 **65%**（chillMaxStacks 是真正的瓶頸）。

---

## SKILL_DEFS 預設值

| 技能 | 參數 | 預設值 |
|------|------|--------|
| `chill` | `stacksPerHit` | 1 |
| `freeze` | `threshold` | 30 |
| `freeze` | `dur` | 1（秒）|

---

## 跨塔疊層行為

`chillStacks` 是**敵人身上的屬性**，由所有塔共享疊加。

**情境示範（threshold=30）：**

| 步驟 | 攻擊塔 | 動作 | chillStacks | 結果 |
|------|--------|------|------------|------|
| 1 | 塔A（chill only）| 攻擊 29 次 | 29 | 無冰凍 |
| 2 | 塔B（chill+freeze）| 攻擊 1 次 | 30 | **觸發冰凍！chillStacks→0** |
| 3 | 塔B（chill+freeze）| 攻擊 1 次 | 1 | 無冰凍（需重新疊到 30）|
| 4 | 塔A（chill only）| 攻擊 29 次 | 30 | ❌ 不觸發（塔A無 freeze）|
| 5 | 塔B（chill+freeze）| 攻擊 1 次 | 31 | **觸發冰凍！chillStacks→0** |

**關鍵**：freeze 觸發只在**帶 freeze 技能的塔攻擊瞬間**判斷，不是被動監聽。

---

## stunTimer 行為

```js
enemy.stunTimer = Math.max(enemy.stunTimer, freezeSk.dur * ccMult);
```

- 取**最大值**，不累加 → 多塔同時觸發不延長定身
- `ccMult`：由 tenacity 技能決定（Boss ccReduce=0.5 → ccMult=0.5 → 定身時間減半）
- stunTimer > 0 時，敵人每 tick 跳過移動（`if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }`）

---

## 衰減計時細節

```js
e.chillDecay = (e.chillDecay || 0) + dt;
const decayStacks = Math.floor(e.chillDecay * GLOBAL_CAPS.chillDecayRate);  // 6 層/秒
if (decayStacks > 0) {
  e.chillStacks = Math.max(0, e.chillStacks - decayStacks);
  e.chillDecay -= decayStacks / GLOBAL_CAPS.chillDecayRate;
}
```

- `chillDecay` 是**時間累積器**，精確計算衰減量（非每秒整數扣）
- 每次攻擊重置 `chillDecay = 0` → 攻擊可完全阻止衰減
- 衰減只在 `chillStacks > 0` 時執行（line 2629 的 if 包圍）

---

## ⚠️ 潛在設計問題

### 問題 1：freeze 硬依賴 chill 在同一塔
若塔只有 `freeze` 無 `chill`，freeze **永遠不觸發**（被 `if(chillSk)` 擋住）。
設計意圖是「freeze 作為 chill 的強化」，但文字描述未說明此限制。

### 問題 2：冰凍後立即可重新疊層
清零後下一次該塔攻擊加 1 層，threshold=30 → 需要 29 次以上攻擊或多塔合力才能再觸發。
若 stacksPerHit 很高（如水砲 AOE），觸發節奏會很快。

### 問題 3：slowPct comment 與實際不符
comment 寫「75%」，值是 0.8（80%），但實際上限是 65%（chillMaxStacks 的隱性限制）。
三個數值互不一致，建議統一。

---

## 步驟清單

| # | 步驟 | 狀態 |
|---|------|------|
| step1 | ✅ | 機制完整分析（見本 index.md）|
| stepA | ⬜ | 若需修改：解決 slowPct / comment / chillMaxStacks 數值不一致 |
| stepB | ⬜ | 若需修改：允許 freeze 單獨配搭任何 chill（跨塔觸發通用化）|

> 純分析計畫，A/B 步驟僅在使用者確定需要修改後建立。
