# Step 6：game.js — ramp 切換衰減邏輯 + frostbite 移除

## 目標
1. 將 ramp 切換目標的邏輯從「立即歸零」改為「扣除 switchLoss 層」
2. 確認 frostbite 傷害邏輯是否可安全移除（或保留並標記無效化）

## 改動位置
`js/game.js`

---

## 改動一：ramp 切換衰減

### 定位
Grep `tw._rampTarget = target; tw._rampBonus = 0` 找到第 2826 行附近的 ramp 切換邏輯。

### 原本
```js
if (rampSk) {
  if (tw._rampTarget === target) {
    tw._rampBonus = Math.min(rampSk.cap, (tw._rampBonus || 0) + rampSk.perHit);
  } else {
    tw._rampTarget = target; tw._rampBonus = 0;
  }
}
```

### 替換為
```js
if (rampSk) {
  if (tw._rampTarget === target) {
    tw._rampBonus = Math.min(rampSk.cap, (tw._rampBonus || 0) + rampSk.perHit);
  } else {
    tw._rampTarget = target;
    tw._rampBonus = Math.max(0, (tw._rampBonus || 0) - (rampSk.switchLoss || 0) * rampSk.perHit);
  }
}
```

**行為說明：**
- 切換目標時：扣除 `switchLoss × perHit`（而非歸零）
- `Math.max(0, ...)` 確保不會變成負數
- `switchLoss` 未定義時 fallback 為 0（向後兼容）
- 快速清群：每個目標只打 1-2 發就死，扣除少量 ramp 後接著打下個目標 → 維持中等加速

---

## 改動二：frostbite 傷害邏輯處理

### 定位
Grep `frostbite` 在 game.js 中找到所有使用點。

### 處理方式

frostbite 的傷害邏輯在敵人 update 區段（每秒 tick dmgPct × maxHP）。
確認以下兩種情況：

**情況 A：現有塔型有 frostbite（PURE_TOWERS.water 舊版）**
→ 在 step7 中從 towers.js 移除這些技能後，game.js 的 frostbite 邏輯不再有塔觸發
→ 邏輯可保留（有技能才觸發，無技能 = 無效果）
→ 不需要從 game.js 刪除邏輯，讓廢棄標記在 skill-editor 中呈現即可

**情況 B：確認無潛在副作用**
Grep `hasSkill.*frostbite|getSkill.*frostbite` 確認所有讀取點都有 hasSkill 守衛。
若有守衛，移除 towers.js 中的 frostbite 使用即可讓邏輯自然閒置。

**結論：** game.js 中 frostbite 邏輯**不需要刪除**，只要 towers.js 不再給塔加 frostbite 技能，邏輯就不會觸發。

---

## 驗證方式

**ramp 切換衰減：**
- sandbox 模式建一座含 ramp 的風塔
- 攻擊一個目標疊幾次，觀察攻速加快
- 目標死亡後切換到下一個目標：確認攻速不完全歸零（應保留部分加速）
- 多個目標快速清除：ramp 應維持在一個穩定的中等水位

**frostbite 不觸發：**
- step7 完成後，確認 pure water 塔攻擊時無 frostbite 觸發（無凍傷 DOT 顯示）
