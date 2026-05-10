# Step 1：建立 docs/mechanics.md

## 目標

新建 `docs/mechanics.md`，記錄以下機制說明。此檔之後作為補充說明的彙整點。

## 修改點

**新增** `C:/Users/terryhuang/Claude/projects/tower-defense-prototype/docs/mechanics.md`

---

## 檔案內容（完整）

```markdown
# Mechanics Reference

> 本檔記錄遊戲機制的設計規格與運算邏輯。未來有任何機制補充說明，請一律更新此檔。
> 來源程式碼：js/game.js、js/skills.js

---

## 穿透（pierce）

### 設計規格

- 攻擊時，炮彈沿「塔 → 主目標」方向直線延伸，命中路徑上的所有敵人
- 主目標（距離最近）受完整傷害，後方每個目標依序遞減
- 觸發條件：塔擁有 `pierce` 技能

### 目標篩選（直線）

1. 以射程圓圈過濾候選敵人
2. 方向向量 `d` = 正規化（主目標位置 − 塔位置）
3. 保留滿足以下條件的敵人：
   - `t = dot(enemyPos − towerPos, d) > 0`（在塔前方）
   - 垂直距離 ≤ `PIERCE_WIDTH = 0.6`（格）

### 傷害公式

```
傷害[i] = floor(effDmg × max(MIN_PIERCE_RATIO, 1 − i × dmgDown))
```

| 符號 | 說明 | 預設值 |
|------|------|--------|
| `i` | 穿透目標順序（主目標 i=0） | — |
| `dmgDown` | 每穿一體的傷害衰減比例 | 技能參數 `dmgUp` |
| `MIN_PIERCE_RATIO` | 最低傷害下限（相對 effDmg） | 0.3（30%） |

| i | 傷害（dmgDown=0.15）|
|---|---------------------|
| 0 | 100%（主目標）|
| 1 | 85% |
| 2 | 70% |
| 3 | 55% |
| 4 | 40% |
| 5+ | 30%（下限）|

### 參數 dmgUp（技能 pierce）

`dmgUp` 原語意為「每穿增傷」，改版後語意不變但方向相反：
- 舊：越後面越痛（`1 + i × dmgUp`）
- 新：越後面越不痛（`1 − i × dmgUp`），視作 "dmgFalloff"
- 技能欄位名稱保持 `dmgUp` 不改（避免大規模 refactor）

---

## 攻速機制

### 公式

```
atkTimer += dt × atkSpd × killRush × (1 + _auraAtkSpd) × (1 + _rampBonus)
```

### 加速來源與上限

| 來源 | 觸發方式 | Cap | 備註 |
|------|---------|-----|------|
| 攻速光環（aura_atk_spd）| 鄰近塔的光環技能 | `GLOBAL_CAPS.atkSpdBonus = 2`（+200%）| 多塔疊加但有全局上限 |
| 越攻越快（ramp）| 連攻同目標 | `rampSk.cap`（預設 0.5 = +50%）| per-skill，非全局 |
| 擊殺衝刺（multishot killRush）| 擊殺後短暫觸發 | 無（靠持續時間限制）| 預設 +50%，持續 3s |

### 各 cap 無關聯

`GLOBAL_CAPS.atkSpdBonus` 只限制光環加成，與 `ramp.cap` 完全獨立、互不影響。
三者相乘，無整體上限：

```
最壞情況 = atkSpd × (1 + 2.0) × (1 + 0.5) × (1 + 0.5) = atkSpd × 6.75×
```

目前設計選擇：不設全局攻速 cap，靠光環需多塔疊加的稀有性自然控制。

---

## GLOBAL_CAPS 參數

定義位置：`js/skills.js` 頂部 `GLOBAL_CAPS` 物件。

| 參數 | 值 | 有效？ | 說明 |
|------|-----|--------|------|
| `slowPct` | 0.8 | ✅ | 減速上限 80% |
| `chillPerStack` | 0.005 | ✅ | 每層冰冷 -0.5% 速度 |
| `chillMaxStacks` | 120 | ✅ | 冰冷最大層數（達到 slowPct 上限） |
| `chillDecayRate` | 2.5 | ✅ | 每秒衰減 2.5 層（0.4s/層） |
| `atkSpdBonus` | 2 | ✅ | 攻速光環疊加上限（+200%，實際 3×）|
| `shredPerStack` | 0.02 | ✅ | 每層碎甲 -2% 護甲 |
| `shredMaxStacks` | 37 | ✅ | 碎甲最大層數（最高 -74%）|
| `shredDecayRate` | 1.5 | ✅ | 碎甲每秒衰減 1.5 層 |
| `vulnPerStack` | 0.02 | ✅ | 每層易傷 +2% 傷害 |
| `vulnMaxStacks` | 37 | ✅ | 易傷最大層數（最高 +74%）|
| `vulnDecayRate` | 1.5 | ✅ | 易傷每秒衰減 1.5 層 |
| `procMinInterval` | 0.3 | ❌ 未實作 | proc 技能最小間隔，定義但 game.js 無讀取 |
| `hpPctCd` | 0.2 | ❌ 未實作 | %HP 冷卻，game.js 改用技能自身 cd 欄位 |
```

---

## 執行指令

新建 `docs/mechanics.md`，內容如上（去除最外層 markdown 程式碼包裝）。
無需讀取現有檔案（檔案不存在）。
