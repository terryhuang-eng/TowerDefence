# skill-scoring-refactor — 疊層技能統一規範

## 設計原則

所有疊層型技能（chill / shred / vulnerability）遵循同一三層架構：

```
全域參數（GLOBAL_CAPS）     個別技能參數（makeSkill）     評分
────────────────────────    ──────────────────────────    ──────────────────────
每層效果值 xPerStack     ×  每次命中疊幾層 stacksPerHit  = scoreBase × stacksPerHit
最大層數   xMaxStacks
衰減速率   xDecayRate
```

**全域參數**：調整整體強度，影響所有同類技能
**技能參數**：只有 `stacksPerHit`，控制疊層速度
**評分**：`scoreBase × (stacksPerHit / scoreRef)`，scoreBase 由設計者自行設定

---

## 命名規則

### 全域參數（GLOBAL_CAPS）

| 效果 | 每層值 | 最大層數 | 衰減速率 |
|------|--------|---------|---------|
| 冰冷（chill）   | `chillPerStack` | `chillMaxStacks` | `chillDecayRate` |
| 碎甲（shred）   | `shredPerStack` | `shredMaxStacks` | `shredDecayRate` |
| 易傷（vulnerability） | `vulnPerStack` | `vulnMaxStacks` | `vulnDecayRate` |

### 技能參數（makeSkill defaults）

所有疊層型技能的個別參數只有一個：`stacksPerHit`（每次攻擊疊幾層）

### Enemy 狀態欄位

| 效果 | 當前層數 | 衰減計時器 |
|------|---------|-----------|
| 冰冷 | `chillStacks` | `chillDecay` |
| 碎甲 | `shredStacks` | `shredDecay` |
| 易傷 | `vulnStacks`  | `vulnDecay`  |

---

## 初始數值（設計者自行調整）

```js
// GLOBAL_CAPS 追加
shredPerStack:  0.02,   // 每層 -2% 護甲穿透
shredMaxStacks: 37,     // 上限 37 層 = 74%
shredDecayRate: 1.5,    // 每秒 -1.5 層（比 chill 2.5 慢，符合土系持久特性）
vulnPerStack:   0.02,   // 每層 +2% 易傷
vulnMaxStacks:  37,
vulnDecayRate:  1.5,
```

---

## 評分框架擴充（scoreFactors）

現有公式：`score = scoreBase × (primary/ref) × weight`

擴充後：`score = scoreBase × (primary/ref) × Π(factor.param/factor.ref) × weight`

`scoreFactors` 是可選陣列，用於有多個參數共同影響強度的技能：
```js
// 範例：burn 的 dot 和 dur 都影響總 DOT 傷害
burn: {
  scoreBase: 35, scorePrimary: 'dot', scoreRef: 0.3,
  scoreFactors: [{ param: 'dur', ref: 3 }],  // dur:3 → ×1, dur:6 → ×2
}
```
不設 scoreFactors 的技能行為不變。

---

## 步驟清單

| 步驟 | 內容 | 主要檔案 |
|------|------|---------|
| step1 | 評分框架通用化（scoreFactors 支援） | `skill-editor.html` |
| step2 | shred/vulnerability 改為疊層模型 | `skills.js` / `game.js` / `towers.js` |
| step3 | zone shred 效果更新 | `game.js`（2處） |

執行順序：step1 → step2 → step3
