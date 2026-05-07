# step1: LEVEL_SCORE_STD 校準

## 目標
確認各等級的標準技能分數（LEVEL_SCORE_STD），為所有塔的 scoreTarget 計算提供基準。

## 問題
scoreTarget 都是 0，因為沒有「基準值」可以計算。
需要先決定標準分，才能讓 score_adj 有意義。

---

## 校準方法

### 方法 A：從 skills.js scoreBase 反推（推薦）

1. 找出每個等級「典型技能組合」的 Σ scoreBase
2. 讓 Σ scoreBase ≈ LEVEL_SCORE_STD（代表 score_adj=1.0 時剛好符合）

**Lv3 典型（1 技能）**：
- 焰弓手 lv3：burn(35)×(0.30/0.30) = 35 → 標準分 ≈ 80（預留 DPS 空間）
- 冰弓手 lv3：chill(30)×(40/40) = 30 → 標準分 80 合理

**Lv4 典型（2 技能）**：
- 焰弓手 lv4：burn(35) + detonate(25)×(0.80/0.80) = 60 → 標準分 ≈ 160 合理

**Lv5 典型（3 技能）**：
- 三屬塔通常 2-3 技能，Σ ≈ 80-120 → 標準分 ≈ 200 or 240

**Lv6 典型（3-4 技能）**：
- 純屬終極塔有 aura 等強力技能，Σ ≈ 140-200 → 標準分 ≈ 280 or 320

### 方法 B：手動校準
直接在 dps-calc.html 中調整 score_adj，觀察 dpsScore 合理性，反推標準分。

---

## 建議起始值

```js
// 建議在 skill-editor.html 或 dps-calc.html 加一個常數
const LEVEL_SCORE_STD = {
  lv1: 0,    // 無技能
  lv2: 0,    // 無技能
  lv3: 80,   // 1 技能
  lv4: 160,  // 2 技能（注入）
  lv5: 240,  // 3 技能（三屬）
  lv6: 320,  // 4 技能（純屬終極）
};
```

> 每等 +80 分是均勻分佈假設，實際可能需要調整 lv5/lv6。
> 先用這個值驗證，再根據實際技能組合微調。

---

## 驗證步驟

1. 用幾個代表性塔手動算 `Σ skillScore`
2. 比對是否接近 `LEVEL_SCORE_STD[lv] × score_adj`
3. 若多數塔 dpsScore 為正且合理，標準值成立
4. 若多數塔 dpsScore 為負，提高標準值

---

## 影響範圍
- `skill-editor.html`：加入 LEVEL_SCORE_STD 常數（用於推算或顯示）
- `dps-calc.html`：可能同步使用（目前已有 score_adj 計算）
- **不動** `js/towers.js`（score_adj 已在那邊，不需要改結構）

---

## 完成條件
- LEVEL_SCORE_STD 數值確認（使用者確認或測試通過）
- 記錄到 index.md 的建議標準分欄位
