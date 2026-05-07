# Step 2：更新 dps-calc.html 的 SCORE_WEIGHT_DEFAULTS + Weight Panel

## 目標

1. 在 `SCORE_WEIGHT_DEFAULTS` 加入 lv1~lv3 / lv5 / lv6 目標（目前只有 lv4Target）
2. 在 Weight Panel 的「基礎」section 新增這些欄位，讓用戶可 UI 調整
3. 更新 `scoreColor()` 讓 LV1~LV3 / LV5 / LV6 也有顏色標示（不只 LV4）

## 影響範圍

- 檔案：`dps-calc.html`
- 修改點 1：`SCORE_WEIGHT_DEFAULTS`（line ~343-353）
- 修改點 2：`WEIGHT_COLS` 中的 `基礎` section（line ~774-780）
- 修改點 3：`scoreColor()` 函式（line ~505-511）
- 修改點 4：`getLv4Range()` → 改為通用 `getLvRange(lv)` 函式（line ~452-456）
- 修改點 5：`scoreColor` 呼叫時的 HTML render（line ~647，只改 lv4 提示文字為動態）

## 具體修改

### 修改 1：SCORE_WEIGHT_DEFAULTS 加入全 LV 目標

**定位：** Grep `lv4Target: 410` → 找到 SCORE_WEIGHT_DEFAULTS 區塊

**old：**
```javascript
const SCORE_WEIGHT_DEFAULTS = {
  dpsScaleConst: 2.841, aoeScoreMod: 0.7,
  lv4Target: 410, lv4Tolerance: 15,
```

**new：**
```javascript
const SCORE_WEIGHT_DEFAULTS = {
  dpsScaleConst: 2.841, aoeScoreMod: 0.7,
  // ← 主要調整點：各等級有效分目標（需同步 skill-editor.html 的 LEVEL_SCORE_STD 換算比例）
  lv1Target: 56, lv2Target: 127, lv3Target: 227, lv4Target: 410, lv5Target: 717, lv6Target: 1127,
  lv4Tolerance: 15,
```

> **注意：** dps-calc 的 target 是 `calcTowerScore()` 計算出的有效分（含 DPS×scale + 技能權重），
> 數值比 skill-editor 的 `LEVEL_SCORE_STD` 大 2~3 倍（因為 dpsScaleConst≈2.841）。
> 比例關係維持：lv1:lv2:lv3:lv4:lv5:lv6 = 20:45:80:160:280:440 → 對應 × 2.56 倍率。
> 可依實際觀察調整，這只是 v1 起點。

### 修改 2：WEIGHT_COLS 基礎 section 加入全 LV 欄位

**定位：** Grep `lv4Target` 在 WEIGHT_COLS 中 → 找到 `items` 陣列

**old：**
```javascript
{ section: '基礎', items: [
  { key: 'dpsScaleConst', label: 'DPS scale', step: '0.001' },
  { key: 'aoeScoreMod',   label: 'AOE mod',   step: '0.05' },
  { key: 'lv4Target',     label: 'Lv4 目標',  step: '10' },
  { key: 'lv4Tolerance',  label: '容差 %',    step: '1' },
]},
```

**new：**
```javascript
{ section: '基礎', items: [
  { key: 'dpsScaleConst', label: 'DPS scale', step: '0.001' },
  { key: 'aoeScoreMod',   label: 'AOE mod',   step: '0.05' },
  { key: 'lv1Target',     label: 'Lv1 目標',  step: '5' },
  { key: 'lv2Target',     label: 'Lv2 目標',  step: '5' },
  { key: 'lv3Target',     label: 'Lv3 目標',  step: '10' },
  { key: 'lv4Target',     label: 'Lv4 目標',  step: '10' },
  { key: 'lv5Target',     label: 'Lv5 目標',  step: '10' },
  { key: 'lv6Target',     label: 'Lv6 目標',  step: '10' },
  { key: 'lv4Tolerance',  label: '容差 %',    step: '1' },
]},
```

### 修改 3：getLv4Range → getLvRange(lv)，scoreColor 全等級支援

**定位：** Grep `function getLv4Range` → line ~452

**old：**
```javascript
function getLv4Range() {
  const t = scoreWeights.lv4Target;
  const tol = scoreWeights.lv4Tolerance / 100;
  return { lo: Math.round(t * (1 - tol)), hi: Math.round(t * (1 + tol)) };
}
```

**new：**
```javascript
function getLvRange(lv) {
  const key = 'lv' + lv + 'Target';
  const t = scoreWeights[key] || scoreWeights.lv4Target;
  const tol = scoreWeights.lv4Tolerance / 100;
  return { lo: Math.round(t * (1 - tol)), hi: Math.round(t * (1 + tol)) };
}
```

**定位：** Grep `function scoreColor` → line ~505

**old：**
```javascript
function scoreColor(eff, lv) {
  if (lv !== 4) return '#aaa';
  const r = getLv4Range();
```

**new：**
```javascript
function scoreColor(eff, lv) {
  if (lv < 1 || lv > 6) return '#aaa';
  const r = getLvRange(lv);
```

### 修改 4：HTML render 更新 scoreColor 呼叫文字

**定位：** Grep `Lv4 目標` 在 dps-calc.html（line ~647）

**old：**
```javascript
(t.lv === 4 ? ' <span style="color:#666;font-size:0.8em">（Lv4 目標 ' + scoreWeights.lv4Target + '±' + scoreWeights.lv4Tolerance + '%）</span>' : '')
```

**new：**
```javascript
' <span style="color:#666;font-size:0.8em">（Lv' + t.lv + ' 目標 ' + (scoreWeights['lv'+t.lv+'Target'] || '?') + '±' + scoreWeights.lv4Tolerance + '%）</span>'
```

## 驗證方式

1. 開啟 `dps-calc.html`
2. Weight Panel 中應出現 Lv1~Lv6 目標共 6 個輸入框
3. 任意 LV1 塔的 Score 欄位應顯示有顏色（非灰色 #aaa）
4. LV5 塔應顯示目標 717（而非之前只是灰色）
5. 調整 Lv5 目標輸入框 → 塔的顏色即時更新
