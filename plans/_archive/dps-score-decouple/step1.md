# step1 — 新增 DPS_SCORE_REF 常數，修正 computeScoreBreakdown

## 影響範圍

`skill-editor.html`，兩處：
- 第 947–948 行附近（常數區）：新增 `DPS_SCORE_REF`
- 第 1020–1021 行（computeScoreBreakdown）：修正公式

## 定位方式

```
Grep `const DPS_REF` → 找常數區行號
Grep `dpsScoreActual` → 找公式行號
```

## 修改內容

### 1. 常數區（在 DPS_REF 行後插入）

新增：
```js
const DPS_SCORE_REF = { lv1: 20, lv2: 45, lv3: 80, lv4: 160, lv5: 280, lv6: 440 };
```

初始值與現有 LEVEL_SCORE_STD 相同，確保修改前後數值不變。

### 2. computeScoreBreakdown（修正 dpsScoreActual 公式）

現況（line 1021）：
```js
const dpsScoreActual = Math.round(effectiveDPS * (lvStd / dpsRef) * 10) / 10;
```

改為：
```js
const dpsScoreRef    = DPS_SCORE_REF[lv] || 1;
const dpsScoreActual = Math.round(effectiveDPS * (dpsScoreRef / dpsRef) * 10) / 10;
```

## 驗證

修改後行為：
- 調整 `LEVEL_SCORE_STD` → 只有 target 變動，dpsScoreActual 不動 ✓
- 調整 `DPS_REF` → dpsScoreActual 變動（正確）
- 調整 `DPS_SCORE_REF` → dpsScoreActual 變動（新旋鈕）
- 初始狀態數值不變（因初始值與 LEVEL_SCORE_STD 相同）✓
