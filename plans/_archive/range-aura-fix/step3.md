# Step 3：js/game.js — 清除 summon/phaseShift 死代碼

> 沿用 skill-audit/step2.md 的分析

## 目標

`game.js` 有 `hasSkill(e, 'summon')` 和 `hasSkill(e, 'phaseShift')` 的判斷，
但 `skills.js` 中沒有對應定義 → 這些判斷永遠 false（dead code）。

選擇：**直接清除死代碼**（不實作這兩個 skill，需求未定）

## 影響範圍

**檔案：js/game.js**

定位方式（執行時 Grep）：
- `hasSkill.*summon` → 找到 L~2554
- `hasSkill.*phaseShift` → 找到 L~2568

---

## 修改說明

找到對應的 `if (hasSkill(e, 'summon'))` 和 `if (hasSkill(e, 'phaseShift'))` 區塊，
確認其 body 是空的或只有死代碼後，直接刪除整個 if 區塊。

執行前先 Read ±10 行確認 block 範圍。

## 依賴

- 無，可獨立執行
