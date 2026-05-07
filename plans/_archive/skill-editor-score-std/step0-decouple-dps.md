# skill-editor-score-std / step0 — DPS分 從 target 解耦

## 問題

現有公式：
```
target      = lvStd × adj
DPS分       = effectiveDPS × (target / DPS_REF)
            = effectiveDPS × adj × (lvStd / DPS_REF)
```

結果：`DPS分 / target = effectiveDPS / DPS_REF`，是常數，與 adj 完全無關。
→ `score_adj` 和 `scoreTarget` 兩者都只是改 `target`，目的重複。
→ 改 adj 只縮放 DPS分 的絕對值，無法改變 DPS 佔 target 的比例。
→ 跨塔比較 DPS分 時，adj 不同的塔數字無法直接比較。

## 修法

**DPS分 永遠用 lvStd 計算，不受 adj 或 scoreTarget 影響：**

```
DPS分       = effectiveDPS × (lvStd / DPS_REF)   ← 固定基準
target      = lvStd × adj                          ← adj 只影響判斷基準
balance%    = (DPS分 + 技能分) / target
```

### 結果比較

| 情境 | 舊公式（DPS分綁target） | 新公式（DPS分綁lvStd） |
|------|----------------------|----------------------|
| fire×fire adj=0.77 | DPS分縮小，balance看起來「正常」| DPS分不變，balance高 → 正確顯示「過強」|
| thunder×none adj=1.4 | DPS分放大，balance虛高 | DPS分不變，balance低 → 正確顯示「有餘裕」|
| adj=1.0（標準塔）| 行為不變 | 行為不變 |

---

## 影響範圍

唯一修改：`skill-editor.html` `computeScoreBreakdown` 函式（約 line 937）

```js
// 現況
const dpsScoreActual = target > 0 ? Math.round(effectiveDPS * (target / dpsRef) * 10) / 10 : 0;

// 改為（用 lvStd 而非 target）
const dpsScoreActual = Math.round(effectiveDPS * (lvStd / dpsRef) * 10) / 10;
```

---

## 連帶修改：score_adj / scoreTarget 的 UI 說明

解耦後兩欄位的語義變清晰：

| 欄位 | 新語義 |
|------|--------|
| `score_adj` | 「這座塔預期強度是標準的 X 倍，調整判斷基準（target）」|
| `scoreTarget` | 「直接指定 target 絕對值（完全跳過等級×adj 計算）」|

兩者仍有部分重複（都是設定 target），但解耦 DPS分 後，差別是相對 vs 絕對，設計師視需要選用。
可考慮未來只保留一個（推薦保留 `score_adj`，因為相對值更直覺）。

---

## 執行順序

step0（本步驟）→ step1（等級基準面板）

step0 應先執行，否則 step1 加入的 LEVEL_SCORE_STD 調整介面在舊公式下會有誤導（改 lvStd 會同時影響 target 和 DPS分）。

## 定位指令

```
Grep 'dpsScoreActual' skill-editor.html → 確認行號 → Read ±3 行 → Edit
```
