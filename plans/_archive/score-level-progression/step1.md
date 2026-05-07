# Step 1：更新 skill-editor.html 的 LEVEL_SCORE_STD

## 目標

將 `LEVEL_SCORE_STD` 改為 v1 建議值，並加上清楚的「主要調整點」標記。

## 影響範圍

- 檔案：`skill-editor.html`
- 修改點：line 850（1 行修改 + 2 行注解）

## 定位流程

Grep `LEVEL_SCORE_STD` → 找到 line 850 → Read ±5 行確認 context → Edit

## 具體修改

**old（line 847-851）：**
```javascript
// ============================================================
// 分數分析
// ============================================================
const LEVEL_SCORE_STD = { lv1: 0, lv2: 0, lv3: 80, lv4: 160, lv5: 160, lv6: 200 };
const DPS_REF        = { lv1: 35, lv2: 61, lv3: 63, lv4: 120, lv5: 190, lv6: 290 };
```

**new：**
```javascript
// ============================================================
// 分數分析
// ← 主要調整點：修改下方數值即可改變各等級基準分（需同步更新 dps-calc.html）
// ============================================================
const LEVEL_SCORE_STD = { lv1: 20, lv2: 45, lv3: 80, lv4: 160, lv5: 280, lv6: 440 };
const DPS_REF        = { lv1: 35, lv2: 61, lv3: 63, lv4: 120, lv5: 190, lv6: 290 };
```

## 驗證方式

1. 開啟 `skill-editor.html`
2. 點選任意 LV1 塔（箭塔 LV1）→ 右側分數區應顯示 target=20，balance 約 100%
3. 點選任意 LV5 塔 → target=280（原本 160）
4. 點選任意 LV6 塔 → target=440（原本 200）
