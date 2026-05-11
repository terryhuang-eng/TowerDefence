# 計畫：aura-self — 光環自身加成修正

## 問題分析

**根本原因**：`js/game.js` line 2798 有一行 `if (tw === src) continue;`，
在「src 光環塔 → tw 受益塔」的雙層迴圈中直接跳過 `tw === src` 的情況，
導致**持有光環技能的塔無法受自身光環加成**。

**距離計算不需特判**：當 `tw === src` 時，
`dist = Math.hypot(0, 0) = 0`，`0 <= radius` 永遠成立，
移除 `continue` 後自身光環自動生效，不需額外邏輯。

## 影響塔型（持有光環技能的塔）

| 塔 | 光環技能 | 自身受益 |
|----|---------|---------|
| earth×none Lv4（穿甲光環）| aura_dmg flat:5 pct:0 radius:2 | +5 傷害 |
| 某三屬 Lv5（含 aura_atkSpd）| aura_atkSpd bonus:0.15 radius:2 | +15% 攻速 |
| 純土 Lv6（全場 +20% 傷害）| aura_dmg pct:0.2 radius:2.5 | ×1.2 傷害 |
| 純風 Lv6（全場 +1 射程）| aura_range bonus:1 radius:2.5 | +1 射程（4.5→5.5） |
| 純雷 Lv6（全場 +25% 攻速）| aura_atkSpd bonus:0.25 radius:2.5 | +25% 攻速 |

## 設計確認

**光環自身加成是否合理？** ✅

- 射程光環（aura_range）：純風 Lv6 range:4.5 + bonus:1 → 5.5 格，符合「全場+射程」定位
- 攻速光環（aura_atkSpd）：純雷 Lv6 atkSpd:1.6 × 1.25 → 2.0 實際攻速，合理
- 傷害光環（aura_dmg）：純土 Lv6 ×1.2 加給自身，不會過強（damage:180 → 216 DPS 等效）
- 三屬火土風 Lv5 atkSpd:1.1 × 1.15 → 1.27，輔助色彩保留

## 修改內容（1 行）

**位置**：`js/game.js` 光環預計算迴圈（約 line 2798）

```js
// 修改前
for (const tw of this.towers) {
  if (tw === src) continue;   ← 刪除此行
  const dist = Math.hypot(tw.x - src.x, tw.y - src.y);
  ...
}
```

```js
// 修改後
for (const tw of this.towers) {
  const dist = Math.hypot(tw.x - src.x, tw.y - src.y);
  ...
}
```

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | js/game.js | 刪除 `if (tw === src) continue;` 一行 |

> 單步驟計畫，step1 即最後一步。
