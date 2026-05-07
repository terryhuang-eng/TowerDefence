# Plan: range-aura-fix — 射程光環視覺 + 邏輯修正

## 問題分析

### 問題 1：視覺 Bug — 受益塔射程圓圈不反映增幅

**現況（js/game.js L2984、L2990）：**
```js
ctx.arc(px+cs/2, py+cs/2, tw.range*cs, 0, Math.PI*2);
```
- 選中或 hover 某塔時，射程圓圈固定用 `tw.range`
- 但實際攻擊範圍是 `effRange = tw.range + (tw._auraRange || 0)`（L2661）
- 視覺與實際不符 → 看不出射程光環有無效果

**影響：** 用戶無法確認光環是否生效，UX 混亂

---

### 問題 2：視覺 Bug — 光環塔沒有光環半徑視覺提示

**現況：**
- `aura_dmg`、`aura_atkSpd`、`aura_range` 三種光環都沒有繪製光環半徑圓圈
- skill-audit index 標記為 ✅ 但光環半徑不可見

**影響：** 用戶不知道光環覆蓋範圍有多大

---

### 問題 3：設計確認 — 光環塔自身不受益

**現況（L2640）：**
```js
if (tw === src) continue;  // 自身不受益
```
- 這是設計決策，非 bug — 「友軍光環」通常不含自身
- 但缺乏明確視覺區分（自身射程圓圈也不變）

**結論：** 維持現有邏輯（自身不受益），只修視覺

---

### 問題 4：aura_range 的 radius 單位

**現況：**
- `aura_range` 的 `radius: 2` 單位是「格數」
- `dist = Math.hypot(tw.x - src.x, tw.y - src.y)` 也是格數
- `bonus: 0.5` 單位也是「格數」（直接加到 effRange）
- **邏輯正確**，只是視覺沒更新

---

## Token 節省策略

- 執行時用 Grep 定位行號，不讀全文
- 每次只 Read ±10 行確認 context
- 一步一檔

---

## 執行步驟

| # | 檔案 | 說明 |
|---|------|------|
| step1 | js/game.js | 射程圓圈改用 effRange，並在選中光環塔時繪製光環半徑圓圈 |
| step2 | js/game.js | skill-audit Bug 1：multishot killBonus 改讀 params |
| step3 | js/game.js + js/skills.js | skill-audit Bug 2：清除 summon/phaseShift 死代碼 |

> step2、step3 沿用 skill-audit 的 step1.md 和 step2.md 細節

---

## 視覺修正設計（step1 詳細說明見 step1.md）

選中塔時：
1. 射程圓圈 → 改為 `(tw.range + (tw._auraRange || 0)) * cs`
2. 若該塔有 `aura_range` skill → 額外繪製綠色半透明光環半徑圓（`ar.radius * cs`）

Hover 塔時（選中優先，不重複）：
1. 射程圓圈同上改用 effRange
