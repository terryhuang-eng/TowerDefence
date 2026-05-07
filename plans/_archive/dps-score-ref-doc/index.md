# dps-score-ref-doc — 設計分析與文件計畫

## 核心釐清：DPS_REF 與 DPS_SCORE_REF 不是同一種單位

```
DPS_REF      = { lv3: 63,  lv4: 120, lv5: 190, lv6: 290 }  ← DPS 單位
DPS_SCORE_REF = { lv3: 80,  lv4: 160, lv5: 280, lv6: 440 }  ← 分數單位
```

這兩個參數量綱不同，不應用「相不相等」來理解，而應看**比值**：

```
score per DPS unit = DPS_SCORE_REF[lv] / DPS_REF[lv]
  lv3: 80/63  = 1.27
  lv4: 160/120 = 1.33
  lv5: 280/190 = 1.47
  lv6: 440/290 = 1.52
```

**意思**：每單位 DPS，換算成多少分數。lv 越高，每 DPS 換分越多（高等級塔 DPS 的分數價值更高）。

---

## 兩個參數各自控制什麼

| 參數 | 控制的事 | 典型調整情境 |
|------|---------|------------|
| `DPS_REF` | 「基準 DPS 值」的校準點 | 塔的傷害/攻速數值大幅改動後，更新 DPS_REF 讓它反映新的典型 DPS |
| `DPS_SCORE_REF` | 達到 DPS_REF 時拿幾分（DPS 的分數預算） | 想改變 DPS vs 技能的分數比重時調整 |

**關鍵觀察**：目前 `DPS_SCORE_REF == LEVEL_SCORE_STD`，表示「達到參考 DPS 的塔，光靠 DPS 就拿滿 100% 目標分」。技能分是在目標分之外疊加的「加分」，而非必要條件。

---

## 設計意圖確認（待使用者決定）

當前設計隱含兩種可能意圖：

### 意圖 A：DPS 是主體，技能是加分項
- DPS_SCORE_REF = LEVEL_SCORE_STD（維持現狀）
- balance% > 100% 表示「技能加強了基礎 DPS 塔」
- 適合：DPS 塔佔多數，技能塔是特例

### 意圖 B：DPS + 技能共同達到目標
- DPS_SCORE_REF = LEVEL_SCORE_STD × DPS 預算比例（例如 0.6）
- balance% 100% 需要 DPS + 技能合力
- 適合：每座塔都預期有技能配置

**目前實際行為是意圖 A**，但文件沒有說清楚，導致困惑。

---

## 步驟清單

| 步驟 | 說明 | 影響範圍 |
|------|------|---------|
| step1 | help modal 新增 DPS_SCORE_REF 專節，說明設計意圖 | `skill-editor.html` help modal |
| step2 | `docs/score-glossary.md` 補 DPS_SCORE_REF 詞條 | `docs/score-glossary.md` |
