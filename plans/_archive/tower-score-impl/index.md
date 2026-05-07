# Plan: tower-score-impl — 塔評分系統實作

## 背景

來自 `plans/active/tower-score/` 的分析結論：
- 公式：`DPS_score = dmg × spd × (range/3.0) × (1 + aoe×0.7) × 2.841`
- 特效評分依 step2.md 定義
- Lv4 目標分數 ≈ 410，各塔 `score_adj` 已在 step3.md 列出
- hpPct 無 cap → Boss 可被過快秒殺，需加上限

---

## 問題清單

| 問題 | 影響 | 對應步驟 |
|------|------|---------|
| hpPct 無上限傷害 | Boss 被過快秒殺（7000HP × 3% = 210/proc） | step1 |
| towers.js hpPct skill 無 cap 參數 | game.js 讀不到 cap 值 | step2 |
| INFUSIONS lv4 無 score_adj 欄位 | 無法從 code 讀出設計意圖 | step3 |
| dps-calc.html 無評分系統顯示 | 無法快速驗算塔的設計合理性 | step4 |

---

## 步驟清單

| 步驟 | 檔案 | 內容 | 前置 |
|------|------|------|------|
| step1 | `js/game.js` | hpPct 傷害加 cap 判斷 | 無 |
| step2 | `js/towers.js` | 所有 hpPct makeSkill 加 `cap: 120` 參數 | step1 |
| step3 | `js/towers.js` | INFUSIONS lv4 全部 36 座加 `score_adj` 欄位 | 無（可與 step1/2 並行）|
| step4 | `dps-calc.html` | 新增「塔分數」欄位及顯示邏輯 | step2、step3 完成後 |

## 執行順序

step1 → step2 → step3（可並行） → step4

---

## 設計決策摘要

### score_adj 概念
```
effective_score = (DPS_score + Effect_score) × score_adj
```
- `score_adj = 1.0`：公式正常描述此塔
- `score_adj < 1.0`：此塔原始分偏高（強），adj 標記壓縮
- `score_adj > 1.0`：此塔原始分偏低（弱/特殊定位），adj 標記補升
- **任何 adj ≠ 1.0 的塔都是明確設計決策的標記**

### hpPct cap
- cap = 120 per proc（約等於高 DPS 塔一次攻擊傷害量）
- 一般敵人（HP≤400）：pct×HP < 120，cap 不觸發
- Boss（HP=7000）：pct=0.03 → 原本 210 → cap 到 120

### killGold 評分
- 舊：bonus × 8
- 新：bonus × 4（非戰鬥型效果，差距用 score_adj 標記）
