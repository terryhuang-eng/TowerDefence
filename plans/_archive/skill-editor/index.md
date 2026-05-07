# THINK: skill-editor 分數系統設計

**觸發**：think skill-editor（scoreTarget 都是 0、scoreWeight 都是 1，設計怎麼運作）
**日期**：2026-05-04

---

## 問題陳述

skill-editor.html 完成了欄位實作，但 scoreTarget / scoreWeight 都是預設值，尚未填入任何有意義的數字。
需要設計「如何決定這些數值」的完整規則。

---

## 系統架構（三層）

```
層級          欄位              位置              說明
───────────────────────────────────────────────────────────
1. 等級標準   LEVEL_SCORE_STD   設計常數            同等級所有塔共用的參考基準
2. 塔級調整   score_adj         towers.js per-tower 整塔技能預算比例（vs 基準）
3. 技能微調   scoreWeight       技能實例 per-skill   個別技能偏離公式的補償
```

### scoreTarget = 如何計算

```
scoreTarget（塔）= LEVEL_SCORE_STD[lv] × score_adj

skillScore（技能 i）= scoreBase_i × (currentParam_i / scoreRef_i) × scoreWeight_i

skillTotal = Σ skillScore
dpsScore   = scoreTarget - skillTotal   ← 正數 = DPS 還有預算；負數 = 技能過重
```

---

## 三層詳解

### 1. LEVEL_SCORE_STD（等級標準分）

同等級的塔應有相同（或接近）的 scoreTarget，讓設計師可以跨塔比較。

| 等級 | 成本（含累計） | 建議標準分 | 說明 |
|------|--------------|-----------|------|
| Lv1  | 50g          | 0         | 無技能，純 DPS |
| Lv2  | 130g         | 0         | 無技能，純 DPS |
| Lv3  | 260g         | 80        | 單技能（元素特色） |
| Lv4  | 510g         | 160       | 雙技能（注入組合） |
| Lv5  | 910g         | 240       | 三技能（三屬組合） |
| Lv6  | 1510g        | 320       | 四技能（純屬終極） |

> 這些是**起始提案值**，實際校準後可能調整。
> 每增一等約 +80 分，但 Lv4 增幅較大（注入機制大幅提升技能複雜度）。

### 2. score_adj（塔級比例，towers.js 現有欄位）

- 預設 1.0 = 技能預算完整符合等級標準
- < 1.0（如 0.75）= 技能「輕」，DPS 較重（e.g. 焰弓手純輸出路線）
- > 1.0（如 1.40）= 技能「重」（e.g. 金幣標記，utility 價值高、DPS 相對低）

**score_adj 值決定 scoreTarget**，不是獨立填的：
```
scoreTarget = round(LEVEL_SCORE_STD[lv] × score_adj)
```
因此 skill-editor 的 scoreTarget 欄位需要從 towers.js 的 score_adj 反推帶入，或改為自動計算。

### 3. scoreWeight（技能實例微調）

用途：公式縮放後仍然不符合設計師直覺時，微調單一技能。

**何時用 scoreWeight？**
- 技能效果非線性（e.g. warp 定身 1s 與 2s 的實際影響不是 2 倍）
- 技能有強烈 combo 效果（e.g. burn + detonate 組合比單技能分數更高）
- 公式 scorePrimary 參數無法捕捉全部影響（e.g. zone 的 effect 種類不同）

**預設行為**：scoreWeight = 1.0，表示「完全信任公式」。
大多數技能不需要調整。

---

## 關鍵設計決策

### Q1: scoreTarget 應該存 towers.js 還是只在 skill-editor 顯示？
**建議**：存在 towers.js（per level object），讓 dps-calc.html 也能用。
skill-editor export 時帶出 scoreTarget，成為塔定義的一部分。

### Q2: score_adj 和 scoreTarget 是否重複？
**不重複，但有從屬關係**：
- score_adj = 設計師意圖（「這塔技能預算要比標準多/少幾%」）
- scoreTarget = 計算結果（「所以這塔的技能分數目標是 X 分」）
- 保留兩者：score_adj 是直覺參數，scoreTarget 是計算結果供 UI 顯示

### Q3: scoreWeight = 1.0 vs score_adj = 1.0 的差異？
| | score_adj | scoreWeight |
|--|-----------|-------------|
| 作用範圍 | 整塔技能預算（塔級） | 單一技能（技能實例級） |
| 預設值 | 1.0（標準） | 1.0（信任公式） |
| 何時改 | 塔的整體 DPS/技能比設計意圖不同時 | 某技能公式捕捉不準確時 |
| 存放位置 | towers.js lv 物件 | 技能實例 |

---

## 步驟清單

| 步驟 | 內容 | 優先度 |
|------|------|--------|
| step1 | 設計 LEVEL_SCORE_STD 常數位置與校準方法 | **分析** |
| step2 | skill-editor 顯示「等級標準分 × score_adj = scoreTarget」推算邏輯 | **實作** |

---

## 執行順序

1. `execute skill-editor/step1.md`（先確認標準分數值，再動 code）
2. `execute skill-editor/step2.md`（在 editor UI 顯示推算來源）
