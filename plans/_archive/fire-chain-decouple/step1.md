# step1 — Score 加入依賴修正係數

## 目標
在 SKILL_DEFS 加入 `conditionalFactor` 欄位，讓 skill-editor 的分數計算感知 burn/ignite/detonate 的前置依賴。

## 影響範圍
- `js/skills.js`：SKILL_DEFS 中 ignite / detonate 加入新欄位
- `skill-editor.html`：`computeScoreBreakdown` 函數，加入條件性乘數邏輯

## 具體修改

### js/skills.js

`ignite` 加入：
```js
requires: 'burn',
conditionalFactor: 0.75,   // 假設 burn uptime 75%（每 3 秒攻擊至少一次即可）
```

`detonate` 加入：
```js
requires: 'burn',
conditionalFactor: 0.5,    // 疊 3 層觸發率（攻速 1.2/s × 3 秒 burn = 3.6 hits，約 50% 機率正好在 ≥3 層時觸發）
```

### skill-editor.html（computeScoreBreakdown，約 932 行附近）

在計算每個 skill score 之後，加入：
```js
// 條件性技能修正：若需要前置且塔確實帶有前置，套用 conditionalFactor
if (def.requires && def.conditionalFactor !== undefined) {
  const hasPre = skills.some(p => p.enabled && p.type === def.requires);
  if (hasPre) {
    score *= def.conditionalFactor;  // 有前置：套用觸發率折扣
  } else {
    score = 0;  // 無前置：技能無效，分數歸零
  }
}
```

## 預期效果

### 現況分數（burn+ignite+detonate 齊帶）
- burn(dot=0.3): 25 pts
- ignite(flat=0.2): 15 pts
- detonate(ratio=0.8): 20 pts
- **合計: 60 pts**（虛高）

### 修正後分數
- burn(dot=0.3): 25 pts（無變化，不依賴前置）
- ignite(flat=0.2): 15 × 0.75 = **11.25 pts**
- detonate(ratio=0.8): 20 × 0.5 = **10 pts**
- **合計: 46.25 pts**（更接近實際）

### 邊界情況
- 塔只有 `ignite` 沒有 `burn`：ignite score = 0（正確，in-game 毫無效果）
- 塔只有 `detonate` 沒有 `burn`：detonate score = 0（正確）

## 注意事項
- `conditionalFactor` 是設計假設值，可在 skill-editor 的「⚙️ 技能評分基準」面板讓設計師調整
- 不影響任何遊戲邏輯，純粹是 score 評估系統
