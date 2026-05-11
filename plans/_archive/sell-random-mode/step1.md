# step1 — 賣塔返還率分級（Lv1-3=100%，Lv4-6=80%）

## 目標

修改三處：sellValue 計算邏輯改為依塔等級決定返還率。

## 影響範圍

- **唯一修改**：`js/game.js`，三處（sidebar 顯示 × 2、sellTower × 1）

---

## 修改 A — sidebar 顯示（line ~758）

定位：`const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * 0.8);`（第一個）

```
舊：
    const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * 0.8);

新：
    const sellRate = (t.level <= 3 || this.randomMode) ? 1.0 : 0.8;
    const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * sellRate);
```

**注意**：`this.randomMode` 在 step2 加入，step1 執行時此欄位不存在但 `undefined` 為 falsy，運算結果正確（`undefined || false` = `false`）→ 不影響 step1 測試。

---

## 修改 B — sellTower（line ~1093）

定位：`sellTower(t) {` 內的 `const sellValue = ...`

```
舊：
    const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * 0.8);

新：
    const sellRate = (t.level <= 3 || this.randomMode) ? 1.0 : 0.8;
    const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * sellRate);
```

---

## 驗證

- Lv1/2/3 塔賣出返還 100%（投入多少返回多少）
- Lv4/5/6 塔賣出返還 80%
- sidebar 顯示的「賣出: Xg」與實際返還金額一致
