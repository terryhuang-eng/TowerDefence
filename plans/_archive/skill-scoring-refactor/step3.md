# step3 — zone shred 效果更新

## 前提

依賴 step2 完成：`enemy.shredStacks / shredDecay` 已存在。

## 目標

zone 的 `effect:"shred"` 從「設絕對護甲穿透值」改為「設 shredStacks 保底層數」，
對齊 zone slow 的換算語義。

## zone 效果語義說明

zone 的設計語義是「在區域內維持最低保底效果，離開後自然衰減」：
- 進入 zone：效果維持在設定層數（用 max，不累積）
- 離開 zone：正常衰減（shredDecayRate / chillDecayRate）

這與攻擊型疊層（每次命中 +N 層）不同，zone 是持續場地保底，兩者可以共存（zone 保底，攻擊繼續疊高）。

## 改動範圍

**唯一檔案**：`js/game.js`（兩處，搜尋 `armorRed`）

### 位置一：建立 zone 時（約 line 2873）

```js
// 舊
armorRed: zoneSk.effect === 'shred' ? zoneSk.value : 0,

// 新（換算成目標層數，語義對齊 slow 的換算方式）
shredTarget: zoneSk.effect === 'shred'
  ? Math.round(zoneSk.value / GLOBAL_CAPS.shredPerStack)
  : 0,
```

### 位置二：zone 每 tick 更新（約 line 2886~2887）

```js
// 舊
if (z.slowAmt)  { e.chillStacks = Math.max(e.chillStacks || 0, Math.round(z.slowAmt / GLOBAL_CAPS.chillPerStack)); e.chillDecay = 0; }
if (z.armorRed) { e.shredAmount = Math.max(e.shredAmount, z.armorRed); }

// 新
if (z.slowAmt)     { e.chillStacks = Math.max(e.chillStacks || 0, Math.round(z.slowAmt / GLOBAL_CAPS.chillPerStack)); e.chillDecay = 0; }
if (z.shredTarget) { e.shredStacks = Math.max(e.shredStacks || 0, z.shredTarget); e.shredDecay = 0; }
```

## zone slow 的換算一致性

改後，slow 和 shred 的 zone 換算方式完全一致：
- slow: `value / chillPerStack` → 目標 chillStacks 層數
- shred: `value / shredPerStack` → 目標 shredStacks 層數

**全域調整時自動生效**：若調整 chillPerStack 或 shredPerStack，
towers.js 的 zone value 不需改，效果自動跟著縮放。

## 注意

- 目前 towers.js 中沒有塔使用 `effect:"shred"` zone（都是 `effect:"slow"`），
  此步驟主要確保實作正確，供未來使用
- 改動極小（2 行替換），風險低
