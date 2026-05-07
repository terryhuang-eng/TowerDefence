# Plan: tower-score — 塔分數平衡框架

## 問題分析

### 目標
建立一套**正反向皆可用**的塔評分系統：
- **正向**：給定等級 → 知道分數預算 → 分配 DPS + 特效 → 調參數
- **反向**：現有塔參數 → 計算出分數 → 查看是否在預算範圍內

### 核心公式架構（待確認）
```
Tower Score = DPS Score + Effect Score
DPS Score = f(damage, atkSpd, range, aoe)
Effect Score = Σ effect_i(type, strength)
```

---

## 現有數據快照（Arrow Lv1 作基準）

| 塔 | damage | atkSpd | range | aoe | 原始DPS | 相對Arrow Lv1 |
|----|--------|--------|-------|-----|---------|-------------|
| Arrow Lv1 | 22 | 1.6 | 3.0 | 0 | 35.2 | **1.00x** |
| Arrow Lv2 | 32 | 1.9 | 3.0 | 0 | 60.8 | **1.73x** |
| Cannon Lv1 | 35 | 0.6 | 3.0 | 1.0 | 21.0 | 0.60x（AOE未計） |
| Cannon Lv2 | 50 | 0.7 | 3.0 | 1.2 | 35.0 | 0.99x（AOE未計） |
| ELEM fire arrow Lv3 | 45 | 1.4 | 3.5 | 0 | 63.0 | 1.79x |
| ELEM fire cannon Lv3 | 52 | 0.8 | 3.0 | 1.0 | 41.6 | 1.18x（AOE未計） |
| INFUSIONS lv4 min | 30 | 2.2 | 4.5 | 0 | 66.0 | 1.88x |
| INFUSIONS lv4 max | 112 | 1.3 | 3.5 | 0 | 145.6 | 4.14x |
| APEX lv5 min | 45 | 1.5 | 4.0 | 1.5 | 67.5 | 1.92x |
| APEX lv5 max | 130 | 0.5 | 3.0 | 2.0 | 65.0 | 1.85x（AOE未計） |
| TIER lv6 min | 100 | 1.2 | 4.0 | 1.8 | 120.0 | 3.41x（AOE未計） |
| TIER lv6 max | 220 | 1.8 | 3.5 | 0 | 396.0 | 11.25x |

---

## 關鍵問題清單

### P1：DPS Score 公式未定義
使用者提議「射程+射速+傷害範圍為DPS分數」，但具體公式未定：
- 選項 A：`DPS_score = (damage × atkSpd) × range_mod × aoe_mod × K`
- 選項 B：加法模型 `DPS_score = dmg_score + spd_score + range_score + aoe_score`
- **問題**：Arrow Lv1→Lv2 實際DPS增幅 +73%，但假設分數只+20%。公式必須有壓縮機制（非線性）？

### P2：AOE 換算比例未定義
Cannon Lv1 單體DPS僅 21（低於 Arrow Lv1 的 35.2），但 aoe=1.0 可打多目標。
- 需要定義：`aoe=1.0` 平均打到幾個敵人？（依敵人密度）
- 建議：在某個「標準密度假設」下訂出 `aoe_factor`（e.g. aoe=1.0 → 打3人 → ×2.5效益）

### P3：射程分數未定義
- 射程影響：射程越長 → 可攻擊時間越長 → 有效DPS乘成器
- 但射程增益是非線性的（射程從2.5→3.0 效益 > 從4.0→4.5）
- 最簡單的估算：可攻擊時間 = (range × 2) / enemy_speed → 需要敵人速度基準

### P4：特效評分表不完整
目前遊戲中存在的 skill 類型（來自 towers.js skills 欄位）：

**傷害類：**
- `burn` — DOT（每秒%傷害）
- `ignite` — 集中攻擊增傷（ramp）
- `detonate` — 觸發AoE爆炸
- `true_damage` — 真傷
- `pct_hp` — %HP傷害

**控制類：**
- `slow` — 減速（%）
- `chill` — 寒氣（疊加減速）
- `freeze` — 定身（秒）
- `stun` — 定身（觸發型）
- `knockback` — 擊退

**弱化類：**
- `shred` — 碎甲（降護甲%）
- `vulnerability` — 易傷（受傷+%）

**增益類（支援）：**
- `aura_atkSpd` — 攻速光環
- `aura_range` — 射程光環
- `aura_dmg` — 傷害光環
- `zone` — 區域效果

**特殊：**
- `chain` — 彈射
- `gold_mark` — 金幣標記
- `vamp` — 吸血

→ **每一項都需要獨立的評分公式**，目前一個都沒有

### P5：Lv4 分散度極大，難以用單一分數管理
現有 INFUSIONS lv4 的 damage×atkSpd 範圍：66~145（比例2.2倍）
- 這些塔有不同特效，分數結構差異很大
- 需要先建立特效評分才能反向驗算 DPS 分是否合理

### P6：Lv6 存在但使用者分數表未納入
CLAUDE.md 只寫5階，但 towers.js 有 `lv6`（cost 600）。
- 分數表要不要加 Lv6？
- 若加：Lv6=320 → 這個值需要確認

### P7：分數是「塔本身」還是「生態位貢獻」？
- `aura_dmg` 不提升自己 DPS，而是提升友塔 DPS
- 這類塔的「Effect Score」代表什麼？隊伍效益？
- 如果只算塔本身的數字，支援塔會被嚴重低估

---

## 需要補齊的內容

| 項目 | 描述 | 優先度 |
|------|------|--------|
| DPS公式 | 定義 damage/atkSpd/range/aoe 的加權公式（含正規化係數） | 🔴 必要 |
| 等級分數表 | 確認 Lv1~Lv6 的分數基準（100/120/150/190/240/320 是假設值） | 🔴 必要 |
| AOE換算假設 | 定義「標準敵人密度」下 aoe=N 的命中數 | 🔴 必要 |
| 射程換算係數 | range=3.0 為基準，+0.5 range 值多少分 | 🟡 重要 |
| 特效評分表 | 列出所有 skill 類型 × 強度參數的分值 | 🔴 必要 |
| 支援塔評分方式 | 光環/zone 效果的計分邏輯 | 🟡 重要 |
| 反向驗算 | 用新公式算出現有塔的分數，找出離群值 | 🟢 後續 |

---

## 分析步驟

| 步驟 | 內容 |
|------|------|
| step1 | 定義 DPS Score 公式 + 正規化，以 Arrow Lv1=100 為錨點，算出其他無特效塔的分數 |
| step2 | 定義特效評分表（先做主要5類：burn/slow/shred/freeze/aura_dmg） |
| step3 | 反向驗算：將現有 Lv3/Lv4 塔代入公式，比較是否符合等級預算 |
