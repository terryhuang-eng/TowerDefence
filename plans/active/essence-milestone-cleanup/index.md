# essence-milestone-cleanup — 精華里程碑殘留代碼清除

## 根本原因

`lv6-quantity-limit` 計畫移除了 Lv6 精華門檻，同時 config.js 的精華 config 區塊
（`essenceMilestones` / `essenceMilestoneBonus`）也一併消失。
但 game.js 有四處殘留仍引用這些已不存在的 config 值 → crash。

## 影響位置（全在 game.js）

| 行 | 類型 | 問題 |
|----|------|------|
| 62-63 | 初始化 | `essencePerElem` / `essenceMilestonesReached` 死變數 |
| 1094-1103 | 函數 | `checkEssenceMilestones()` — `CONFIG.essenceMilestones.filter()` → crash |
| 1650-1652 | 送兵邏輯 | `essenceMilestonesReached × CONFIG.essenceMilestoneBonus`（undefined）= NaN → 送兵 HP NaN |
| 2974-2976 | 塔攻擊 | 呼叫 `checkEssenceMilestones()`（觸發 crash 的位置）|

## 設計決策

精華里程碑（送兵 HP 加成）隨 essenceMilestones config 一起廢除。
移除全部四處殘留；`essencePerElem` 累積本身也成為死代碼一併清除。

送兵 HP 改為直接使用原始 `s.hp`（無加成，等同里程碑 0 時的效果）。

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 移除四處精華里程碑殘留 | ⬜ | js/game.js |
