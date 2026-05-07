# step0 — 分析：burn 係數改用 DPS 而非單次傷害

## 假設命題

> 若 burn / ignite / detonate 的傷害係數改成 `DPS（damage × atkSpd）`而非 `damage`，是否更合理？

---

## 現況問題的根本

`doDmg()` 裡：
```js
enemy.burnDmg = baseDmg * burnSk.dot;    // baseDmg = tower.damage（單次傷害）
igniteDmg = Math.floor(baseDmg * igniteSk.flat);
detonateDmg = Math.floor(baseDmg * detSk.ratio);
```

**同 DPS、不同 atkSpd 設計的塔，burn 強度完全不同：**

| 塔型 | damage | atkSpd | DPS | burnDmg/s（dot=0.3） |
|------|--------|--------|-----|----------------------|
| 狙擊型 | 200 | 0.6 | 120 | **60/s** |
| 快攻型 | 60 | 2.0 | 120 | **18/s** |

→ 相同 DPS 的兩塔，burn 強度差 3.3 倍。火系狙擊塔天生 OP，不是因為 DPS 高，而是因為 damage 高。

---

## DPS 係數的核心效果

改為 `burnDmg = DPS × dot`：

```js
const dps = tower.damage * tower.atkSpd;
enemy.burnDmg = dps * burnSk.dot;
```

| 塔型 | damage | atkSpd | DPS | burnDmg/s（dot=0.3） |
|------|--------|--------|-----|----------------------|
| 狙擊型 | 200 | 0.6 | 120 | **36/s** |
| 快攻型 | 60 | 2.0 | 120 | **36/s** |

→ 相同 DPS = 相同 burn 強度。burn 成為純 DPS 的百分比延伸，而不是 damage 的偶然附加。

---

## Score 系統的根本簡化

DPS 係數讓 burn 的評分模型從「獨立技能分」→「DPS 乘數」：

### 現況 score 計算
```
totalScore = dpsScore(damage × atkSpd) + burnScore(scoreBase × dot/scoreRef)
           = f(DPS)                    + g(dot)        ← 兩個獨立維度
```
問題：`burnScore` 是靜態的，不隨 DPS 縮放。同一個 dot=0.3 的 burn，在 DPS=60 和 DPS=300 的塔上，scoreFactor 一樣，但實際貢獻完全不同（DPS × dot）。

### DPS 係數後的 score 模型
`burnDmg = DPS × dot`  →  burn 的有效 DPS = `DPS × dot`  →  total effective DPS = `DPS × (1 + dot)`

```
totalScore = effectiveDpsScore( DPS × (1 + dot) )
           ← 一個統一維度，burn 成為 DPS 乘數
```

不再需要 burn 的 `scoreBase`。只需把 effectiveDPS 代入 dpsScore 公式即可。
**score 和實際 DPS 完全一致，耦合問題在根本上消除。**

---

## 具體數字對比（Lv4 火+火弓手：damage=80, atkSpd=1.2, dot=0.45）

| 項目 | 現況 | DPS 係數後 |
|------|------|-----------|
| baseDPS | 96 | 96 |
| burnDmg/s | 80 × 0.45 = 36/s | 96 × 0.45 = 43.2/s |
| effectiveDPS | 96 + 36 = 132（近似，不含 uptime） | 96 × 1.45 = 139.2 |
| burnScore | 25 × (0.45/0.3) = 37.5 pts（靜態） | 包含在 effectiveDPS 分內（自動正確） |

差距不大（43.2 vs 36）；但在高 atkSpd 的快攻火塔上差距會放大。

---

## ignite / detonate 的問題

DPS 係數對 burn（持續 DOT）完全合理，但對 **ignite / detonate（per-hit 觸發）**有致命缺陷：

### ignite 的觸發頻率 = atkSpd
`igniteDmg = DPS × flat = damage × atkSpd × flat`

有效 ignite DPS = atkSpd × igniteDmg = atkSpd × damage × atkSpd × flat = **damage × atkSpd² × flat**

→ atkSpd 每 ×2，ignite DPS ×4。快攻塔引燃傷害爆炸性成長。

### detonate 的觸發頻率 = atkSpd/3
同理，`detonateDmg = DPS × ratio` → effective detonate DPS ∝ atkSpd²。

**結論：ignite 和 detonate 不應改用 DPS 係數，維持 `damage × param` 即可。**

---

## 若 dot 值需要重新校正

切換係數後，同等 burn 強度下，新的 dot 值 = `舊 dot × (damage / DPS)` = `舊 dot / atkSpd`。

以 atkSpd=1.2 的塔為例：`新 dot = 舊 dot × 0.83`。
也就是說原本 dot=0.3 需改為約 0.25 才能維持相同的 burn 強度。

**實際上不需要逐一調整**，因為切換的目的是讓「burn 強度」跟隨 DPS 縮放，而不是保持絕對值不變。只需接受整體 burn 強度略有調整，然後重新測試平衡即可。

---

## 建議方案（精確版本）

### 改 burn：DPS 係數（合理，強烈建議）
```js
// game.js ~2429
const towerDps = tower.damage * tower.atkSpd;
enemy.burnDmg = towerDps * burnSk.dot;     // 改
enemy.burnTimer = burnSk.dur;
```

### 不改 ignite / detonate：保持 damage 係數（避免 atkSpd² 效應）
```js
igniteDmg = Math.floor(baseDmg * igniteSk.flat);     // 不動
detonateDmg = Math.floor(baseDmg * detSk.ratio);     // 不動
```

### Score 系統：burn 折入 effectiveDPS
在 `computeScoreBreakdown` 中：
```js
// 現在：
const effectiveDPS = dpsRaw * aoeMultiplier;
// 改後：
const burnSk = (unit.skills || []).find(s => s.enabled && s.type === 'burn');
const dotBonus = burnSk ? (burnSk.params?.dot ?? 0.3) : 0;
const effectiveDPS = dpsRaw * aoeMultiplier * (1 + dotBonus);
// burn 的 scoreBase 改為 0（分數已含在 effectiveDPS 內）
```

ignite / detonate 仍保持 `scoreBase × param` 靜態分，但加入 `conditionalFactor`（見 step1.md）。

---

## 最終效益

| 問題 | 改前 | 改後 |
|------|------|------|
| 同 DPS 狙擊 vs 快攻，burn 強度差 3x | ❌ | ✅ 相同 |
| burn score 與實際 DPS 脫鉤 | ❌ | ✅ burn 折入 effectiveDPS |
| 高 ATK 狙擊塔 fire chain 天然 OP | ❌ | ✅ 只依賴 DPS |
| ignite/detonate 仍需獨立評分 | ❌ | ⚠️ 保持現狀+conditionalFactor |

---

## 執行步驟

1. **game.js** — 1 行改動（burn 係數從 `baseDmg` → `tower.damage * tower.atkSpd`）
2. **skill-editor.html** — `computeScoreBreakdown` 加入 dotBonus 到 effectiveDPS；burn 的 scoreBase 改 0
3. **towers.js** — 視平衡測試結果微調 dot 參數（可能整體降低 ~15%）
4. 執行 sandbox 火系 DPS 測試確認

**工程量：小。影響：精準。這是最乾淨的解套方式。**
