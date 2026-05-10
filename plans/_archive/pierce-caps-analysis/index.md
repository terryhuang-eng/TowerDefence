# pierce-caps-analysis

## 一、穿透（pierce）傷害計算

### 實作程式碼（game.js ~2837）

```js
const targets = this.enemies
  .filter(e => distance(e, tw) <= effRange)   // 射程圓圈內所有敵人
  .sort((a, b) => b.pathIdx - a.pathIdx);       // 降序：pathIdx 高 = 更靠近終點

const pierceSk = getSkill(tw, 'pierce');
if (pierceSk) {
  const pUp = pierceSk.dmgUp;  // 預設 0.15
  targets.forEach((e, i) =>
    this.doDmg(e, Math.floor(effDmg * (1 + i * pUp)), twDmgElem, tw)
  );
}
```

### 關鍵設計事實

**不是直線穿透——是圓形範圍全打**
- `targets` = 所有在 `effRange` 範圍內的敵人
- 不考慮方向，不限制路徑是否共線
- 等同於「以射程圓圈為範圍，同時擊打所有敵人，並對每個依序增傷」

**傷害遞增方向**
| 索引 i | 敵人 | 傷害 (dmgUp=0.15) |
|--------|------|-----------------|
| 0 | 最靠近終點（最前端）| effDmg × 1.00 |
| 1 | 第二靠近終點 | effDmg × 1.15 |
| 2 | 第三靠近終點 | effDmg × 1.30 |
| n | 最遠離終點（後排）| effDmg × (1 + n×0.15) |

→ 後排敵人受到更高傷害（因為 i 越大）。主目標（最危險的前端敵人）反而只受基礎傷害。

**設計意圖**：
- 穿透塔站在路徑後段，讓炮彈「穿進」敵群，後排敵人受高增幅傷害
- 本質是「打越多目標、後排目標越痛」，而非「打第一個目標最痛」
- 聚集型敵群（多怪靠近）比稀疏敵群更值得穿透

### 穿透塔目前數值

| 塔 | 等級 | dmgUp | dmgUp 效果 |
|----|------|-------|-----------|
| 磐石（土+土弓手）| Lv4 | 0.05 | 每穿 +5% |
| 相位塔（風+無弓） | Lv4 | 0.15 | 每穿 +15% |
| 相位塔（無+風弓） | Lv4 | 0.15 | 每穿 +15% |
| 燎原塔（火風風） | Lv5 | 0.10 | 每穿 +10% |
| 磐石塔（土土土） | Lv5 | 0.20 | 每穿 +20% |
| 磐石塔（土土土） | Lv6 | 0.25 | 每穿 +25% |

---

## 二、GLOBAL_CAPS 各參數說明

### chillDecayRate = 2.5

**意思**：冰冷層數的自然衰減速率，每秒減少 2.5 層。

**運作**（game.js ~2614）：
```js
e.chillDecay += dt;
const decayStacks = Math.floor(e.chillDecay * GLOBAL_CAPS.chillDecayRate);
if (decayStacks > 0) {
  e.chillStacks -= decayStacks;
  e.chillDecay -= decayStacks / GLOBAL_CAPS.chillDecayRate;
}
```
- 每 `1/2.5 = 0.4 秒` 衰減 1 層
- 冰冷減速 = `min(chillStacks × 0.005, slowPct=0.8)` → 最高 80% 減速
- 達到 120 層（slowPct/chillPerStack = 0.8/0.005）才觸發上限

**調整影響**：數值越大 → 冰冷消退越快 → 水塔維持減速難度越高

---

### atkSpdBonus = 2（cap 上限）

**意思**：aura_atk_spd 光環疊加後的攻速加成上限，最多 +2（即 +200%）。

**運作**（game.js ~2786、2799）：
```js
// 累積光環加成（capped at 2）
tw._auraAtkSpd = Math.min(GLOBAL_CAPS.atkSpdBonus, tw._auraAtkSpd + aa.bonus);

// 套用攻速
tw.atkTimer += dt × tw.atkSpd × (1 + tw._auraAtkSpd);
```
- 多個攻速光環塔疊加，但總加成不超過 `atkSpdBonus = 2`
- 實際攻速倍率 = 塔自身 atkSpd × (1 + _auraAtkSpd)，上限 3×
- 注意：技能欄 comment「+100%」與值 2（即 +200%）不一致，以值為準

**調整影響**：數值越大 → 攻速光環可疊得更高 → 高攻速塔群傷害更強

---

### procMinInterval = 0.3

**意思**：proc 型技能的最小觸發間隔（0.3 秒）。

**⚠️ 狀態：定義存在，但 game.js 中未實際套用**

搜尋 game.js 找不到任何讀取 `GLOBAL_CAPS.procMinInterval` 的程式碼。
此 cap 是**已規劃但未實作**的保護機制，用途為：
> 防止高攻速塔對 proc 技能（chill/shred/vuln/ignite/detonate 等每次攻擊觸發型）觸發過頻，保護遊戲平衡。

目前效果：無論 procMinInterval 設多少，proc 技能每次攻擊必觸發。

---

### hpPctCd = 0.2

**意思**：%HP 傷害技能對每個目標的觸發冷卻時間（0.2 秒）。

**⚠️ 狀態：定義存在，但 game.js 使用技能自身的 cd 參數，不使用此 cap**

實際程式碼（game.js ~2488）：
```js
if (!enemy._hpPctCd || enemy._hpPctCd <= 0) {
  enemy.hp -= hpDmg;
  enemy._hpPctCd = hpPctSk.cd;   // ← 用技能的 cd 欄位，不是 GLOBAL_CAPS.hpPctCd
}
```
- `GLOBAL_CAPS.hpPctCd` 沒有任何程式碼讀取
- 每個 hpPct 技能的 cd 由塔定義（`skills` 陣列裡的 `cd` 欄位）

---

## 三、總結：哪些 cap 有效、哪些未實作

| 參數 | 有效？ | 說明 |
|------|--------|------|
| chillDecayRate | ✅ 有效 | 實際控制冰冷衰減速率 |
| atkSpdBonus | ✅ 有效 | 攻速光環上限，cap = 2 = +200% |
| procMinInterval | ❌ 未實作 | 定義存在，game.js 無讀取 |
| hpPctCd | ❌ 未實作 | game.js 改用技能自身 cd 欄位 |

---

## 四、待決策項目

1. **穿透的「直線」設計需求**：目前是圓形全打。若想改為直線穿透（只打路徑方向上的敵人），需要額外的方向過濾邏輯。是否調整？
2. **procMinInterval 是否需要實作**：高攻速塔（atkSpd 2.5+）目前可以每秒觸發 2.5 次 proc，是否需要用 procMinInterval 限流？
3. **hpPctCd 是否需要移到技能層**：目前 hpPctCd cap 完全冗餘（被技能 cd 取代），可以從 GLOBAL_CAPS 移除，或改為當技能 cd 為 0 時的全域後備。
