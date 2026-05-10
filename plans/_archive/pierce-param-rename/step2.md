# Step 2：js/game.js — dmgUp→dmgDown + count 截斷

## 目標檔案
`js/game.js`

## 影響範圍
- pierce 攻擊邏輯（約 L2913, L2936）：讀取 `dmgDown` + 用 `count` 截斷目標陣列

---

## 修改說明

**定位**：`const pDown = pierceSk.dmgUp;`（約 L2913）和 `lineTargets.forEach`（約 L2936）

修改前：
```javascript
const pDown = pierceSk.dmgUp;
// ... lineTargets 建立（不動）...
lineTargets.forEach((e, i) => {
```

修改後：
```javascript
const pDown = pierceSk.dmgDown;
// ... lineTargets 建立（不動）...
lineTargets.slice(0, pierceSk.count ?? 3).forEach((e, i) => {
```

> **`?? 3`**：若塔資料未設定 count（舊資料向後相容），fallback 預設 3 體。

> 其餘邏輯（`1 - i * pDown`、MIN_RATIO、PIERCE_WIDTH、sort）完全不動。

---

## 驗證
- pierce 塔路徑上 5 個目標、count=3 → 只有前 3 個受傷
- pierce 塔路徑上 2 個目標、count=3 → 兩個都受傷（不超過實際目標數）
- 傷害遞減仍正常：第 2 體傷害低於第 1 體
