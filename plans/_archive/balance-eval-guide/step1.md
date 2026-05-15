# step1 — 修正 Table E 的 BR 公式

## 目標

將 Table E 的 BR 公式從 `TPI/WTS`（單位：秒⁻¹，全部 < 0.3）改為：

```
BR_fix = path_time × TPI / WTS
       = 15 × available_gold × bestTDG / WTS
```

單位轉為「路徑可清倍率」，有意義的範圍 0.3–5.0。

同步修正閾值：
- `BR_fix < 0.4` → 🔴 過難
- `BR_fix 0.4–0.8` → 🟡 挑戰
- `BR_fix 0.8–2.5` → 🟢 理想
- `BR_fix > 2.5` → ⬜ 輕鬆

## 影響範圍

| 檔案 | 位置 | 說明 |
|------|------|------|
| `balance-eval.html` | `buildTableE()` 函式 | 修改 BR 計算與判定邏輯 |

**不影響：** Table A/B/C/D/F 不動

---

## 實作重點

### 修改 buildTableE() 中的計算

```js
// 原本
const br = tpi / wts;

// 改為
const PATH_TIME = 15;
const br = (PATH_TIME * tpi) / wts;
```

### 修改閾值判定

```js
// 原本
if      (br < 0.8)  { brCls = 'err';  brLabel = '🔴 過難'; }
else if (br < 1.5)  { brCls = 'warn'; brLabel = '🟡 挑戰'; }
else if (br < 4.0)  { brCls = 'ok';   brLabel = '🟢 理想'; }
else                { brCls = 'info';  brLabel = '⬜ 輕鬆'; }

// 改為
if      (br < 0.4)  { brCls = 'err';  brLabel = '🔴 過難'; }
else if (br < 0.8)  { brCls = 'warn'; brLabel = '🟡 挑戰'; }
else if (br < 2.5)  { brCls = 'ok';   brLabel = '🟢 理想'; }
else                { brCls = 'info';  brLabel = '⬜ 輕鬆'; }
```

### 修改表頭欄位名稱

```js
// BR 欄標題補充說明
th('BR(×路徑時間)')
```

### 修改 note 說明文字

```
BR = path_time(15s) × TPI ÷ WTS。代表「在路徑內，最佳投資能清掉這波的幾倍」。
BR<0.4🔴過難、0.4-0.8🟡挑戰、0.8-2.5🟢理想、>2.5⬜輕鬆。
```

---

## 預期結果（根據試算）

| 波次 | BR_fix | 判定 |
|------|--------|------|
| W1 | 3.4 | ⬜輕鬆 |
| W4 Boss | 3.9 | ⬜輕鬆 |
| W8 Boss | 1.3 | 🟢理想 |
| W12 Boss | 1.1 | 🟢理想 |
| W16 Boss | 0.71 | 🟡挑戰 |
| W20 Boss | 0.41 | 🔴過難（設計意圖：最終 Boss 就是要很難） |

→ 顯示出清晰的難度曲線：早期輕鬆 → 中期理想 → 後期挑戰 → 終Boss壓力。
