# step2 — 建立 docs/score-glossary.md

## 影響範圍

新建 `C:/Users/terryhuang/Claude/projects/tower-defense-prototype/docs/score-glossary.md`

## 內容規則

- 術語名稱用英文（與程式碼一致）
- 有混淆風險才附中文解說；無混淆風險只給一行簡述
- 廢棄術語標注 deprecated + 原因

## 術語清單

### 計分核心

| term | needs explanation | note |
|------|-----------------|------|
| `scoreBase` | 無 | base score at reference param value |
| `scoreRef` | 是 | "ref" = reference value（基準值），非 object reference |
| `scorePrimary` | 是 | field name of the primary scaling param，不是技能主要功能 |
| `scoreFactors` | 是 | secondary multipliers，每個 factor 是 {param, ref}，實際值/ref = 乘數 |
| `weight` | 是 | per-skill row weight，乘在 score 最後；不是技能整體強度，是使用者手動微調旋鈕 |
| `score_adj` | 是 | per-unit target multiplier；autoTarget = LEVEL_SCORE_STD × score_adj |
| `scoreTarget` | 無 | override autoTarget；0 = use autoTarget |
| `balance%` | 無 | (effectiveDPS score + skillTotal) / target × 100 |

### 條件與正規化

| term | needs explanation | note |
|------|-----------------|------|
| `conditionalFactor` | 是 | trigger probability assumption（條件觸發達成率假設）；ignite=0.75（burn uptime），detonate=0.5（3-stack rate）；0 = prerequisite missing |
| `atkSpdSensitive` | 是 | proc-rate normalization；score × (unit.atkSpd / ATKSPD_REF[lv])；反映每秒實際觸發次數 |
| `ATKSPD_REF` | 是 | reference atkSpd by level（lv3-5: 1.2, lv6: 1.5）；基準點 = ×1.0 |
| `requires` | 無 | prerequisite skill type string |

### DPS 相關

| term | needs explanation | note |
|------|-----------------|------|
| `effectiveDPS` | 無 | damage × atkSpd × (1 + aoe × AOE_DENSITY) |
| `DPS_REF` | 無 | expected DPS by level；用於換算 effectiveDPS 分數 |
| `AOE_DENSITY` | 是 | assumed enemy density in AOE（假設 AOE 範圍內的目標密度）；預設 0.5 |

### 廢棄

| term | status | note |
|------|--------|------|
| `foldedIntoDPS` | deprecated (removed step7) | burn score 原本折入 effectiveDPS 以避免重複計分，但導致「有傷害技能顯示 0 分」。移除後 burn 回歸正常計分 |
