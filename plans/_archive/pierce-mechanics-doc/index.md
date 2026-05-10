# pierce-mechanics-doc

## 任務概述

1. 建立 `docs/mechanics.md`：記錄機制說明，作為未來補充的基礎文件
2. 改造 pierce：圓形全打 → 直線穿透，傷害遞減（越後面越痛 → 越後面越不痛）
3. 攻速上限關聯性分析（見下方分析結論）

## 步驟

| # | 步驟 | 修改檔案 |
|---|------|---------|
| 1 | [step1.md](step1.md) | 新建 `docs/mechanics.md` |
| 2 | [step2.md](step2.md) | `js/game.js`：pierce 改為直線 + 傷害遞減 |

---

## 攻速上限關聯性分析

### 攻速公式（game.js line 2799）

```
atkTimer += dt × atkSpd × killRush × (1 + _auraAtkSpd) × (1 + _rampBonus)
```

### 三個獨立加速來源

| 來源 | 參數 | Cap | 說明 |
|------|------|-----|------|
| 攻速光環（aura_atk_spd）| `_auraAtkSpd` | `GLOBAL_CAPS.atkSpdBonus = 2` | 鄰近塔的光環疊加，最多 +200% |
| 越攻越快（ramp）| `_rampBonus` | `rampSk.cap`（預設 0.5） | 連攻同目標累積，最多 +50% |
| 擊殺衝刺（multishot killRush）| `_killRushBonus` | 無上限 | 擊殺後短暫加速，預設 +50% |

### 無關聯，獨立相乘

`atkSpdBonus` 只限制光環來源（`_auraAtkSpd`），與 `ramp.cap` 完全無關。

**最壞情況**（光環滿 + ramp 滿 + killRush）：
```
atkSpd × (1 + 2.0) × (1 + 0.5) × (1 + 0.5) = atkSpd × 6.75×
```

例：風塔 atkSpd 2.5 + 攻速光環塔覆蓋：
- 基礎：2.5
- 光環滿：2.5 × 3.0 = 7.5 次/秒
- ramp 滿：7.5 × 1.5 = 11.25 次/秒

→ **目前沒有「整體攻速上限」**，各 cap 各自獨立，理論最大值可達 base 的 6.75 倍。

### 需決策：是否需要整體攻速 cap？

現況可能問題：
- ramp 塔站在攻速光環覆蓋下，實際 DPS 可能遠超 skill-editor 評分預期（評分只算 ramp cap 貢獻，沒算光環疊乘效果）
- `procMinInterval` 原本就是為了限制高攻速 proc 觸發頻率，但未實作

選項：
- A. 不加全局上限（現狀），靠稀有性自然限制（光環塔需要多塔疊加才能觸到 cap）
- B. 加 `GLOBAL_CAPS.maxAtkSpd`，`atkTimer += dt × min(atkSpd × mults, maxAtkSpd)`
- C. 實作 `procMinInterval`，限制 proc 技能而非攻速本身

建議：先實測是否造成問題，待有數據後再決策。
