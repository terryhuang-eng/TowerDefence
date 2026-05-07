# Step 1：DPS Score 公式（由現有數據反推）

## 方向：B 反推 → 確立公式 → A 正向設計

以「**同等級同費用塔應有相近分數**」為校準原則，
Arrow Lv1 = Cannon Lv1（均 50g）作為錨點。

---

## 確認的機制（來自 game.js）

### AOE 實際運作
```js
// L2705-2707
if (tw.aoe > 0) {
  this.getEnemiesNear(p.x, p.y, tw.aoe)
    .forEach(e => this.doDmg(e, effDmg, twDmgElem, tw));
}
```
- `aoe = 0`：單體攻擊（只打目標本身）
- `aoe = 1.0`：以打擊點為圓心，**1 格半徑**內所有敵人各受一次完整傷害
- 命中數 = 範圍內的敵人密度決定

### shred 實際運作
```js
// L2277、L2360
armor = Math.max(0, armor - (enemy.shredAmount || 0));
enemy.shredAmount = Math.min(cap, current + shredSk.amt);
```
- shred 掛在**敵人身上**（`enemy.shredAmount`）
- 所有塔攻擊該敵時都扣除 shredAmount → **全隊效果**
- ramp/ignite 掛在塔的攻擊邏輯上 → **自身效果**

---

## DPS Score 公式

```
DPS_score = damage × atkSpd × range_mod × aoe_mod × K

range_mod = range / 3.0          （以 range=3.0 為基準，線性）
aoe_mod   = 1 + aoe × 0.7        （見下方校準）
K         = 100 / (35.2 × 1.0 × 1.0) = 2.841  （Arrow Lv1 = 100）
```

### AOE 係數校準
Arrow Lv1 與 Cannon Lv1 同為 50g，設兩者 DPS_score 相等：
```
Arrow Lv1:  22 × 1.6 × 1.0 × 1.0 = 35.2
Cannon Lv1: 35 × 0.6 × 1.0 × (1 + 1.0 × C) = 21 × (1 + C)

21 × (1 + C) = 35.2
C = (35.2 - 21) / 21 = 0.676 ≈ 0.7
```

---

## 反推驗算表（所有無特效塔）

| 塔 | dmg | spd | range | aoe | raw_DPS | range_mod | aoe_mod | DPS_score |
|----|-----|-----|-------|-----|---------|-----------|---------|-----------|
| **Arrow Lv1** | 22 | 1.6 | 3.0 | 0 | 35.2 | 1.00 | 1.00 | **100** |
| Arrow Lv2 | 32 | 1.9 | 3.0 | 0 | 60.8 | 1.00 | 1.00 | **173** |
| **Cannon Lv1** | 35 | 0.6 | 3.0 | 1.0 | 21.0 | 1.00 | 1.70 | **101** |
| Cannon Lv2 | 50 | 0.7 | 3.0 | 1.2 | 35.0 | 1.00 | 1.84 | **183** |

→ Lv1 配對校準完畢（100/101），Lv2 均落在約 173~183（差 6%）

---

## ELEM_BASE Lv3 驗算（有特效，僅看 DPS_score 部份）

| 塔 | dmg | spd | range | aoe | DPS_score | 共同特效 |
|----|-----|-----|-------|-----|-----------|---------|
| 焰弓手 | 45 | 1.4 | 3.5 | 0 | **213** | burn+ignite+detonate |
| 焰砲台 | 52 | 0.8 | 3.0 | 1.0 | **201** | burn+ignite+detonate |
| 冰弓手 | 45 | 1.4 | 3.5 | 0 | **213** | chill+slow+freeze |
| 潮砲台 | 52 | 0.8 | 3.0 | 1.0 | **201** | chill+slow+freeze |
| 岩射手 | 45 | 1.4 | 3.5 | 0 | **213** | shred×2+zone |
| 岩砲台 | 52 | 0.8 | 3.0 | 1.0 | **201** | shred×2+zone |
| 風弓手 | 45 | 1.4 | 3.5 | 0 | **213** | ignite+slow+ramp |
| 風砲台 | 52 | 0.8 | 3.0 | 1.0 | **201** | ignite+slow+ramp |
| 雷弓手 | 45 | 1.4 | 3.5 | 0 | **213** | chain+shred+pct_hp |
| 雷砲台 | 52 | 0.8 | 3.0 | 1.0 | **201** | chain+shred+pct_hp |

→ 同一元素的弓/砲 DPS_score 差距只有 6%（213 vs 201），
  差距主要來自射程補正（弓 range=3.5，砲 range=3.0）
  兩者特效相同 → **Effect Score 相加後應接近**

---

## Lv3 DPS_score 基準

基礎塔 Lv2 ≈ 173~183（無特效）
ELEM Lv3 DPS_score ≈ 201~213（有特效加持前的純 DPS）

→ 升 Lv3 時 DPS_score 提升約 +20%（從 183 → 213），
  但同時加入了 3 個特效。
  若 Effect Score = Lv3 分數 - DPS_score，
  **則 Effect Score 必須為正**，
  但這需要先定義 Lv3 的「目標總分」（見 step2）

---

## 結論：公式確立

```
DPS_score = damage × atkSpd × (range/3.0) × (1 + aoe×0.7) × 2.841
```

接下來 → 進入 step2：定義特效分與各等級目標總分
