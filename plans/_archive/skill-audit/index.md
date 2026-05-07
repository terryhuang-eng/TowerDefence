# Plan: skill-audit — 所有 skill 運作檢查

## 問題分析

本次用 Grep 快速掃描取代 Read 全文，以最低 token 完成覆蓋稽核。

### Token 節省策略
- 先 grep `getSkill\(|hasSkill\(` 取得所有呼叫點
- 再 grep 各 skill 的 key state variable（`burnTimer`、`vulnAmount` 等）確認讀寫都存在
- 僅對疑問處 Read ±15 行，不讀全文

---

## 稽核結果總表

| Skill | 類型 | 狀態 | 備注 |
|-------|------|------|------|
| burn | tower | ✅ | burnStacks/burnTimer 完整 |
| ignite | tower | ✅ | 覆蓋灼燒時觸發 |
| detonate | tower | ✅ | burnStacks >= 3 觸發，支援 AOE |
| chain | tower | ✅ | step3 已更新用 twDmgElem |
| execute | tower | ✅ | |
| hpPct | tower | ✅ | cd 冷卻機制存在 |
| lifedrain | tower | ✅ | |
| chill | tower | ✅ | |
| freeze | tower | ✅ | 依 threshold 層觸發 |
| warp | tower | ✅ | cd 冷卻機制存在 |
| knockback | tower | ✅ | |
| shred | tower | ✅ | timer 衰減 |
| vulnerability | tower | ✅ | vulnTimer 正確設置與衰減 |
| ramp | tower | ✅ | |
| aura_dmg | tower | ✅ | _auraDmgFlat/_auraDmgPct 正確 |
| aura_atkSpd | tower | ✅ | _auraAtkSpd cap 正確 |
| aura_range | tower | ✅ | _auraRange 正確 |
| multishot | tower | ⚠️ | killBonus/killDur 未讀取 skill params（見 step1）|
| pierce | tower | ✅ | step3 已更新 |
| zone | tower | ✅ | 每 tick 更新、filter 過期 |
| killGold | tower | ✅ | |
| unstable | tower | ✅ | |
| permaBuff | tower | ✅ | _permaBuff 加入 effDmg |
| regen | enemy | ✅ | |
| armorStack | enemy | ✅ | |
| enrage | enemy | ✅ | |
| shield | enemy | ✅ | _shieldUsed 一次性 |
| charge | enemy | ✅ | _chargeTimer 倒計 |
| dodge | enemy | ✅ | |
| tenacity | enemy | ✅ | ccMult 正確應用 |
| blink | enemy | ✅ | _blinkCd 冷卻 |
| splitOnDeath | enemy | ✅ | |
| antiElement | enemy | ✅ | adaptDmg 追蹤 |
| stealth | enemy | ✅ | _stealthTimer + revealed 邏輯 |
| fortify | enemy | ✅ | |
| resilient | enemy | ✅ | _resilientReduction 累積 |
| summon | — | ⚠️ | game.js 有 hasSkill 判斷但 SKILL_DEFS 未定義（見 step2）|
| phaseShift | — | ⚠️ | 同上 |

---

## 確認問題

### Bug 1：multishot killBonus 硬編碼，未讀 skill params
- **現況**：L2599-2601 觸發條件是 `tower.elem === 'wind'`（非 multishot skill），且攻速加成硬編碼 1.5×、3 秒
- **影響**：所有風系塔都觸發，而非只有有 multishot skill 的塔；調整 skill params 無效
- **修法**：改為讀取 `multishot.killBonus`、`multishot.killDur`，且觸發由 `getSkill(tower, 'multishot')` 判斷

### Bug 2：summon / phaseShift 未在 SKILL_DEFS 定義
- **現況**：game.js L2554 / L2568 有 `hasSkill(e, 'summon')` 和 `hasSkill(e, 'phaseShift')`，但 skills.js 中沒有對應定義
- **影響**：這些判斷永遠是 false（dead code），但不影響現有功能
- **修法**：加入 SKILL_DEFS 並實作（若計畫使用），或清除死代碼

---

## 執行步驟

| # | 檔案 | 說明 |
|---|------|------|
| step1 | js/game.js | 修正 multishot killBonus 讀取 skill params |
| step2 | js/skills.js + js/game.js | summon/phaseShift：加定義或清除死代碼 |
