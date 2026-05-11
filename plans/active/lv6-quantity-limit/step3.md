# step3 — skill-editor.html：config 面板 + exportConfig

## 目標

在設定頁 config tab 加入 `maxLv6Towers` 可調欄位，並同步加入 exportConfig 輸出。

## 影響檔案

`skill-editor.html`

---

## 修改 A：`renderConfigPanel()` 加入欄位

**位置**：`ecoFields` 陣列（line ~1740–1744），加入 `maxLv6Towers` 欄位。

### 現有
```js
const ecoFields = [
  { key:'startGold', label:'起始金幣' }, { key:'startHP', label:'起始HP' },
  { key:'baseIncome', label:'基礎收入' }, { key:'towerCost', label:'塔費用(Lv1)' },
  { key:'killGoldAiSend', label:'AI送兵擊殺金' }, { key:'totalWaves', label:'總波數' },
];
```

### 修改後
```js
const ecoFields = [
  { key:'startGold', label:'起始金幣' }, { key:'startHP', label:'起始HP' },
  { key:'baseIncome', label:'基礎收入' }, { key:'towerCost', label:'塔費用(Lv1)' },
  { key:'killGoldAiSend', label:'AI送兵擊殺金' }, { key:'totalWaves', label:'總波數' },
  { key:'maxLv6Towers', label:'Lv6上限（座）' },
];
```

---

## 修改 B：`exportConfig()` 加入輸出行

**位置**：`exportConfig` 函數，line ~1983–1986（`gridCols`、`gridRows`、`totalWaves` 之後）。

### 現有
```js
lines.push(`  gridCols: ${c.gridCols},`);
lines.push(`  gridRows: ${c.gridRows},`);
lines.push(`  totalWaves: ${c.totalWaves},`);
lines.push('};');
```

### 修改後
```js
lines.push(`  gridCols: ${c.gridCols},`);
lines.push(`  gridRows: ${c.gridRows},`);
lines.push(`  totalWaves: ${c.totalWaves},`);
lines.push(`  maxLv6Towers: ${c.maxLv6Towers ?? 1},   // 全場最多允許的 Lv6 塔數量（0 = 禁用 Lv6）`);
lines.push('};');
```

---

## 執行步驟

1. Grep `ecoFields` → 找到陣列定義，確認行號
2. Edit 在最後 `{ key:'totalWaves'...}` 後加 `maxLv6Towers` 項目
3. Grep `totalWaves.*c\.totalWaves` → 找到 exportConfig 中的該行
4. Read ±3 行確認 context
5. Edit 在 `totalWaves` 輸出行後插入 `maxLv6Towers` 輸出行

---

## 驗證方式

1. 開啟 skill-editor.html → 設定 tab → 基本經濟區應出現「Lv6上限（座）」欄位，預設值 1
2. 修改數值為 2 → 匯出 config.js → 確認 `maxLv6Towers: 2` 寫入
3. 遊戲端 F5 後，可同時升起 2 座 Lv6 塔

---

## 完成後

✅ 所有步驟完成。測試通過後請執行 `/saveclear` 封存計畫並同步 git。
