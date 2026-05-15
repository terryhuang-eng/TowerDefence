# balance-eval — 自動化平衡評估工具

## 問題摘要

| 項目 | 內容 |
|------|------|
| 目標 | 不用手動測試即可自動評估：怪物強度曲線 vs 塔防能力成長 vs 送兵 ROI 是否合理 |
| 方式 | 建立 `balance-eval.html`，載入現有 JS 資料，自動計算四項核心指標並標示異常 |
| 輸出 | 每波難度比率、金流圖、塔 DPS/金效率、送兵 ROI + PVP 威脅值 |

---

## 四大核心指標定義

### 1. Wave Threat Score（WTS）— 每波有效血量總計

```
EHP_base = hp / (1 - armor)
skill_mult（疊乘）：
  regen      → × 1.15（回血讓擊殺時間拉長）
  armorStack → × 1.30（平均多0.25甲效果）
  enrage     → × 1.10（低血速度爆發，更難集火）
  charge     → × 1.05（前段很快，減少塔覆蓋時間）

WTS_wave = Σ( count × EHP_base × skill_mult )
Boss dmgToBase 另外標記（不計入 WTS，但顯示風險）
```

### 2. Gold Flow（GF）— 每波可用金幣估算

```
基礎假設：
  每波收入  = baseIncome（50g）
  擊殺金    = 前波的 killGold × count（全清）
  起始      = startGold（230g）

GF[n] = 230 + Σ(killGold[w] for w < n) + baseIncome × (n - 1)
```

注：不扣送兵花費（代表「防守能力上限」的 gold budget）

### 3. Tower DPS/Gold（TDG）— 塔的金幣效率

```
DPS_raw = damage × atkSpd
DPS_adj = DPS_raw × aoe_factor
  aoe_factor = 1.0（單體）
             = 2.5（aoe > 0，預估平均打到 2.5 個敵人）

cumulative_cost（到達該等級的總累積金幣）：
  Lv1/Lv2   = BASIC_TOWERS 累積
  Lv3(ELEM) = 260g
  Lv4(INF)  = 510g
  Lv5(TRI)  = 910g
  Lv6(PURE) = 1510g

TDG = DPS_adj / cumulative_cost

「每波最佳 TDG」= 該波可解鎖等級的最高 TDG
  W1-3  → Lv1-2 塔
  W4-6  → Lv3 塔（W3 後首個元素）
  W7-9  → Lv4 塔（W6 後第二元素）
  W10-12 → Lv5
  W13+  → Lv6
```

### 4. 綜合難度比率（Balance Ratio）+ 送兵效率

```
Tower Power Index (TPI) = GF[n] × best_TDG[n]
  （代表「玩家若把現有金幣都換成最佳塔，能有多少 DPS」）

Balance Ratio = TPI / WTS
  ≈ 1.5~3.0 → 理想（有餘裕但不無聊）
  < 1.0      → 過難（🔴 spike）
  > 5.0      → 過簡（⬜ boring）
  急劇下降    → 難度 spike（警示）
```

送兵 ROI：
```
payback_waves = cost / income
break_even_wave = totalWaves - payback_waves
  → 在 break_even_wave 之前送才有正 ROI

EHP_per_gold = (count × hp / (1-armor)) / cost
  → 跟 TDG 對比：送兵 HP 能否撐住對手的 DPS？

PVP 送兵威脅值（PThreat）：
  kill_time = EHP_send / assumed_opponent_DPS
  path_time = 15s（假設路徑通過時間）
  PThreat   = kill_time / path_time
  → PThreat > 1 代表對手一條路很難在路徑內擊殺（高威脅）
  → PThreat < 0.2 代表送了幾乎沒威脅
```

---

## 步驟清單

| 步驟 | 說明 | 檔案 | 狀態 |
|------|------|------|------|
| [step1](step1.md) | HTML 骨架 + Wave EHP Table + Gold Flow Table | `balance-eval.html`（新建） | ✅ |
| [step2](step2.md) | Tower DPS/Gold Table + Send ROI Table | 同上（繼續擴充） | ✅ |
| [step3](step3.md) | Composite Balance Ratio Table + PVP PThreat + 自動標色警示 | 同上（繼續擴充） | ✅ |

---

## 驗證目標

- [ ] 打開 `balance-eval.html` 即自動計算，不需要任何輸入
- [ ] WTS 欄位數字反映真實的怪物「難殺程度」（W4 Boss 遠高於 W3 普通波）
- [ ] Balance Ratio 在 Boss 波前後出現明顯低點（Boss 是壓力點）
- [ ] 送兵 break-even 波次清楚顯示（斥候永遠划算、霸者 W8 前才划算）
- [ ] PThreat > 1 的兵種高亮（代表對手要特別準備應對）
