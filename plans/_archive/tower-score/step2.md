# Step 2：特效評分公式

## 規則確認

- **攻擊命中型效果**（burn, shred, chill...）→ 評分 × 塔的 aoe_mod
- **獨立範圍效果**（aura, zone）→ 評分 × `(1 + effect_radius × 0.4)`
- **自身成長型**（ramp, ignite, chain）→ **不**乘 aoe_mod
- **hpPct**：分一般/Boss 兩段，Boss 段設上限（見下方）
- **killGold**：評估後調降，差距過大用 score_adj 補

---

## 特效評分公式表

### 攻擊命中型（× tower aoe_mod）

| skill | 參數 | 公式 | 代入範例 |
|-------|------|------|---------|
| burn | dot | `dot × 150` | 0.20→30, 0.25→38, 0.30→45, 0.45→68 |
| ignite | flat | `flat × 80` | 0.30→24 |
| detonate | ratio | `ratio × 35` | 1.20→42 |
| shred | cap | `cap × 90` | 0.3→27, 0.4→36, 0.5→45 |
| chill | perStack×cap | `min(pS×cap, 1.0) × 50` | 0.02×30→30, 0.03×50→50 |
| freeze | dur | `dur × 40` | 0.8→32 |
| warp | dur,cd | `dur/cd × 80 + 10` | 0.8/6→21, 1.0/5→26 |
| vuln | cap | `cap × 70` | 0.3→21, 0.5→35 |
| execute | threshold,mult | `threshold × mult × 20` | 0.3×2.0→12, 0.5×1.5→15 |
| unstable | variance | `+8`（固定，設計特性） | — |
| knockback | dist | `dist × 8` | 2→16 |

### hpPct — 分段計分（雙上限）

```
一般場景：score_normal = pct / every × 1500
Boss 場景：score_boss   = min(boss_cap_dmg / every, pct × boss_hp / every)
           其中 boss_cap_dmg = 120（每 proc 最多算分 120 DPS 等效）

評分取兩段加權平均：
  hpPct_score = score_normal × 0.6 + min(score_boss, boss_cap_score) × 0.4
  boss_cap_score = boss_cap_dmg / every × 1.5
```

| 參數 | score_normal | score_boss（cap=120） | 加權評分 |
|------|-------------|----------------------|---------|
| pct=0.02, ev=3 | 10 | min(60,18)=18 → ×1.5=27, ×0.4=11 | 10×0.6+11=**17** |
| pct=0.02, ev=4 | 7.5 | 8 | **8** |
| pct=0.03, ev=3 | 15 | 27 | **15×0.6+16=25** |
| pct=0.04, ev=3 | 20 | 36 | **20×0.6+21=33** |

> Boss 上限設計：Boss HP=7000 時 pct=0.03 → 每 proc 210 傷害，
> 若不設上限等效 DPS=70，設 boss_cap_dmg=120 → 算分上限 60 DPS
> **此 cap 也應實作進 game.js（hpPctCap 欄位），否則 Boss 會被過快秒殺**

### 自身成長型（不乘 aoe_mod）

| skill | 參數 | 公式 | 代入範例 |
|-------|------|------|---------|
| ramp | cap | `cap × 60` | 0.3→18, 0.5→30 |
| chain | targets,decay | `targets × decay × 50` | 2×0.5→50, 3×0.5→75 |
| pierce | dmgUp | `dmgUp × 150` | 0.15→23 |

### 獨立範圍型（× `(1 + r × 0.4)`）

| skill | 基礎公式 | r=2 時 | 代入結果 |
|-------|---------|--------|---------|
| aura_dmg | `pct × 350` | ×1.8 | pct=0.15→53→**95** |
| aura_range | `bonus × 60` | ×1.8 | b=0.5→30→**54**, b=0.8→48→**86** |
| aura_atkSpd | `bonus × 350` | ×1.8 | b=0.15→53→**95** |
| zone | `+50` | × tower aoe_mod | aoe=1.2→×1.84→**92** |

### 經濟型（**調降後**）

| skill | 舊公式 | **新公式** | 說明 |
|-------|--------|-----------|------|
| killGold | bonus × 8 | **bonus × 4** | 金幣效益非戰鬥，調降後仍差距大用 score_adj |
| permaBuff | +55 | +55 | 維持 |

> killGold(5): 40 → **20**；killGold(3): 24 → **12**
> 降分後賞金塔系列仍低，剩餘差距用 score_adj 處理（見 step3）

---

## score_adj 使用規則

```
score_adj = 每座塔的最終調整係數（預設 1.0）

effective_score = (DPS_score + Effect_score) × score_adj

設定優先順序：
  1. 調整 Effect_score 公式參數（全局或塔特定）
  2. 若 DPS_score 仍偏高 → 降低塔的 damage/atkSpd 參數
  3. 最終仍有偏差 → 用 score_adj 補正
  4. score_adj ≠ 1.0 → 視為「公式無法完整描述此塔設計意圖」的顯式標記
```

**可接受範圍**：score_adj ∈ [0.85, 1.15]（±15% 以內不用特別標記）
**需調查範圍**：score_adj < 0.80 或 > 1.20
