# THINK: DPS 納入分數系統

**觸發**：DPS 與技能分數脫鉤，想要總分 = DPS分 + 技能分 = 固定預算
**日期**：2026-05-04

---

## 現況問題

目前分數系統：
```
scoreTarget = 160
skillTotal  = Σ 技能分
DPS 剩餘   = 160 - skillTotal   ← 只是「還剩幾分」，不檢查 DPS 是否真的配合
```

問題：塔的 damage/atkSpd 沒有被評估。
焰弓手 lv3 和 none-arrow lv3 的 damage/atkSpd 完全一樣，但焰弓手多了 75pts 技能 → 系統不發現這個問題。

---

## 使用者想要的模型

```
總分 = DPS分（實際）+ 技能分 = scoreTarget
```

- 技能分 50pts → DPS 分應該是 100pts → 對應某個 damage × atkSpd 值
- 如果技能改強（50→70pts），DPS 分就要降（100→80pts），代表 damage 要跟著降
- 同一個技能（如緩速 30%）在所有塔的分數相同 → 修技能分數會全部一起影響

---

## 實作公式

需要新增一個 `DPS_REF` 常數（每個等級的「基準 DPS」）：

```js
const DPS_REF = { lv1: 35, lv2: 61, lv3: 63, lv4: 120, lv5: 190, lv6: 290 };
// 定義：「如果這個等級的塔沒有任何技能，它的 damage×atkSpd 應該是多少」
// 推導：lv3=63（none-arrow: 45×1.4）
//       lv4=120（≈ 63 × 250/130，按升級成本比例推算）
//       lv5=190, lv6=290（同比例）
```

DPS 分計算：
```
dpsScoreActual = (damage × atkSpd) × (scoreTarget / DPS_REF[lv])
```

分數面板改為：
```
lv4 標準 160 × 塔級調整 1.00 = 目標 160

DPS 分   (實際)：106.7   ← damage(32) × atkSpd(2.5) × (160/120)
技能分   (實際)：52.0    ← ramp(20) + aura_range(32)
─────────────────────
總分：          158.7   ← 與目標比較
目標：          160.0
差距：          -1.3    ← 幾乎剛好 ✓
```

---

## 驗證（現有塔的結果預測）

| 塔 | DPS實際 | DPS分 | 技能分 | 總分 | 目標 | 差距 |
|----|--------|------|------|-----|-----|-----|
| none-arrow lv3 | 63 | 80 | 0 | **80** | 80 | ±0 ✓ |
| 焰弓手 lv3 | 63 | 80 | 75 | **155** | 80 | +75 ⚠️ |
| 疾風塔 lv4（修正後）| 80 | 107 | 52 | **159** | 160 | -1 ✓ |
| 暴焰 lv4 | 117 | 156 | 113 | **269** | 123 | +146 ⚠️ |

→ **none-arrow 和 疾風塔 剛好**（這是因為 DPS_REF 從這些塔反推出來的）
→ **焰弓手、暴焰嚴重超標** — 這揭露了現有設計根本沒有受到預算約束

---

## 這代表什麼

加入 DPS 評分後，大多數現有塔會**顯示超出預算**。這不是 bug，而是**設計事實**：

- 現有塔是「想要什麼就給什麼」設計，沒有強制 DPS-技能 trade-off
- 加了 DPS 評分後，設計師才能看到哪些塔「免費」拿了技能卻沒降 DPS
- 修法：技能重的塔需要降 damage，或接受超預算（用 score_adj 提高目標）

---

## UI 改動（skill-editor.html）

### 加常數 DPS_REF
```js
const DPS_REF = { lv1: 35, lv2: 61, lv3: 63, lv4: 120, lv5: 190, lv6: 290 };
```

### 更新 computeScoreBreakdown
```js
const dpsActual = (unit.damage || 0) * (unit.atkSpd || 0);
const dpsScoreActual = Math.round(dpsActual * (target / (DPS_REF[lv] || 1)) * 10) / 10;
const total = Math.round((dpsScoreActual + skillTotal) * 10) / 10;
const balance = target > 0 ? Math.round((total / target) * 100) : 0;
// return 中新增：dpsScoreActual, total, balance
```

### 更新分數面板顯示
```
DPS 分 (實際)：106.7
技能分 (實際)：52.0
──────────────────────
總分：158.7 / 160  ✓ 99%
```
超過 110% 時顯示 ⚠️，低於 70% 顯示 💡（可加強）

---

## 執行

- `execute skill-editor/think-dps-score.md`（修改 skill-editor.html，只動 JS 部分）
- towers.js 不動（現有超預算是設計問題，之後另行調整）

---

## 後續設計工作（不是 coding）

加了 DPS 評分後，需要決定：
1. 哪些超預算塔要降 damage（技能多 → 攻擊力下調）
2. 哪些接受超預算（用 score_adj 提高目標，承認這塔是特意強的）
3. DPS_REF 是否需要微調（目前是按成本比例推算，不一定完全準確）
