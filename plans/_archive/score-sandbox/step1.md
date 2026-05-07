# Step 1：評分公式權重面板

## 目標
在 `dps-calc.html` 頂部加入「評分權重」可調面板，讓公式係數即時調整、分數即時重算，不需改程式碼。

## 影響範圍
**唯一修改檔案：** `dps-calc.html`

## 目前狀態
`calcTowerScore()` 中的係數全部寫死：
```js
case 'burn':   es += (p.dot || 0) * 150 * aoeMod;
case 'chill':  es += ... * 50 * aoeMod;
case 'freeze': es += (p.dur || 0) * 40 * aoeMod;
// LV4_TARGET = 410, LV4_LO = 348, LV4_HI = 472
```

## 具體修改說明

### 1. 新增 `scoreWeights` 物件（State 區塊）
在 `const overrideParams = {};` 附近新增：
```js
const scoreWeights = {
  dpsScaleConst: 2.841,   // dpsScore = dmg * spd * (range/3) * aoeMod * THIS
  aoeScoreMod:   0.7,     // aoeMod = 1 + aoe * THIS
  burn:   150,
  ignite:  80,
  detonate: 35,
  shred:   90,
  chill:   50,
  freeze:  40,
  warp_base: 10,
  warp_ratio: 80,
  vulnerability: 70,
  execute: 20,
  knockback: 8,
  hpPct_norm: 1500,       // sNorm = pct/every * THIS
  hpPct_boss: 7000,       // bossRaw = pct * THIS
  ramp:    60,
  chain:   50,
  pierce: 150,
  aura_dmg: 350,
  aura_range: 60,
  aura_atkSpd: 350,
  zone:    50,
  killGold: 4,
  permaBuff: 55,
  unstable: 8,
  lv4Target: 410,
  lv4Tolerance: 15,       // ± %
};
```

### 2. 修改 `calcTowerScore()` 讀取 scoreWeights
將所有寫死的數字替換為 `scoreWeights.XXX`。
例如：
```js
const aoeMod = 1 + (t.aoe || 0) * scoreWeights.aoeScoreMod;
const dpsScore = dmg * spd * (range/3) * aoeMod * scoreWeights.dpsScaleConst;
// ...
case 'burn': es += (p.dot||0) * scoreWeights.burn * aoeMod; break;
```

LV4_TARGET / LV4_LO / LV4_HI 改為動態計算：
```js
function getLv4Range() {
  const t = scoreWeights.lv4Target;
  const tol = scoreWeights.lv4Tolerance / 100;
  return { lo: Math.round(t * (1-tol)), hi: Math.round(t * (1+tol)) };
}
```
`scoreColor()` 改為呼叫 `getLv4Range()`。

### 3. 新增「評分權重面板」HTML（折疊式）
在 `.filters` div 下方插入：
```html
<details class="weight-panel" id="weightPanel">
  <summary>⚙️ 評分權重（展開調整）</summary>
  <div class="weight-grid">
    <!-- 左側：公式基礎 -->
    <div>
      <span class="wg-section">基礎</span>
      DPS scale <input id="w_dpsScaleConst" ...>
      AOE mod <input id="w_aoeScoreMod" ...>
      Lv4 目標 <input id="w_lv4Target" ...>
      容差% <input id="w_lv4Tolerance" ...>
    </div>
    <!-- 中：技能係數 -->
    <div>
      <span class="wg-section">技能係數</span>
      burn <input id="w_burn" ...>
      ignite <input id="w_ignite" ...>
      ...（每個係數一個 input）
    </div>
    <!-- 右：按鈕 -->
    <div>
      <button id="resetWeights">重置預設</button>
    </div>
  </div>
</details>
```

### 4. 事件綁定
- 所有 `#w_XXX` input 的 `change` 事件 → 更新 `scoreWeights.XXX` → 呼叫 `renderTable()`
- `#resetWeights` → 重置全部 scoreWeights 為預設值 → `renderTable()`

## 完成標準
- 修改 burn weight 從 150 → 200，所有含 burn 技能的塔 Score 欄即時更新
- 修改 lv4Target 從 410 → 500，色碼範圍即時移動
- 重置按鈕恢復所有預設值
