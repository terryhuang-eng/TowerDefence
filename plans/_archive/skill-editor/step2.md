# step2: skill-editor 顯示分數推算來源

## 目標
讓 skill-editor 的分數面板顯示「等級標準分 × score_adj = scoreTarget」的推算關係，
讓設計師不用手動填 scoreTarget，而是從結構化參數自動計算。

## 前置
- step1 完成：LEVEL_SCORE_STD 常數確認

---

## 設計

### 現況（scoreTarget 手動填）
```
[scoreTarget: ____]  ← 需要手動填，且預設 0，語意不清
```

### 目標（scoreTarget 自動計算，可覆蓋）
```
等級標準分: 160   （LEVEL_SCORE_STD[lv4]）
score_adj:   1.00  （from towers.js）
────────────────
目標分數:  160.0  （= 160 × 1.00）

技能小計:   60.0
DPS 分:    100.0  ← 正數 = 合理
```

---

## 修改說明

### 1. skill-editor.html — 加入 LEVEL_SCORE_STD
```js
const LEVEL_SCORE_STD = { lv1:0, lv2:0, lv3:80, lv4:160, lv5:240, lv6:320 };
```

### 2. 塔資料中加入 score_adj 欄位（getFieldsForTab）
```js
{ key:'score_adj', label:'塔級調整', type:'number', forceShow:true, default:1.0 }
```
（目前 scoreTarget 已存在，但語意不清；加 score_adj 讓推算透明）

### 3. computeScoreBreakdown 改為自動計算 scoreTarget
```js
function computeScoreBreakdown(unit) {
  const lv = unit.lv || 'lv4';  // 從塔的等級推斷
  const std = LEVEL_SCORE_STD[lv] || 0;
  const adj = unit.score_adj !== undefined ? unit.score_adj : 1.0;
  const target = unit.scoreTarget || Math.round(std * adj);
  // ... 其餘不變
}
```

### 4. 分數面板顯示推算來源
在現有分數顯示區加一行：
```
Lv4 標準 160 × adj 1.00 = 目標 160
```

---

## 考量

### scoreTarget 手填 vs 自動計算
- **自動**：`std × score_adj`，設計師只需設定 score_adj
- **手填覆蓋**：如果手填了 scoreTarget（≠ 0），優先使用手填值
- 邏輯：`target = unit.scoreTarget || round(std × adj)`

### 與 towers.js score_adj 同步
- 理想情況：skill-editor export 時把 score_adj 帶入 towers.js
- 目前 export 函式 fmtTower 需要確認是否包含 score_adj

---

## 影響範圍
- `skill-editor.html`：
  - 加 LEVEL_SCORE_STD 常數
  - getFieldsForTab 加 score_adj 欄位
  - computeScoreBreakdown 使用 adj 推算 target
  - 分數面板顯示推算來源
- `js/towers.js`：不需要改結構（score_adj 已有）

---

## 完成條件
- skill-editor 開啟任一 lv4 塔後，分數面板顯示「160 × adj = target」
- dpsScore 有正數或負數提示（正 = DPS 空間足夠，負 = 技能過重警告）
