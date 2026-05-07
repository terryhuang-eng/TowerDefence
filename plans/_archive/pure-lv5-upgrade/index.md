# pure-lv5-upgrade — 新增純屬 Lv5 中間升級步驟

## 問題分析

### 現象
- Sandbox 全解鎖（4 picks × 6 元素）後，純屬路線的 LV4 塔無法升至 LV5
- UI hint（index.html line 350）寫著「Lv4→5 純元素」，但實際並無此升級路徑

### 根本原因（4 個）

| # | 位置 | 問題 |
|---|------|------|
| 1 | `js/towers.js` PURE_TOWERS | 僅有 `lv6`，沒有 `lv5` stats |
| 2 | `js/game.js` `maxTowerLevel()` L376-388 | 純屬路線無 canLv5 判斷；falls through 到 `getAvailableThirdElems(elem,elem)`，但 TRIPLE_TOWERS 沒有三同屬組合 → 回傳空 → 等級卡在 4 |
| 3 | `js/game.js` 升級面板 L919-955 | 純屬路線只展示 LV6 按鈕（if-else 分支）；沒有 LV5 升級選項 |
| 4 | `js/game.js` `getTowerLvData()` L644-668 | 無 pure LV5 狀態識別（level=5, infuseElem=elem, thirdElem=null）；會 fallback 回 LV4 stats |

### 純屬 LV5 設計定義（依使用者說明）
- **狀態**：`level=5, elem=X, infuseElem=X, thirdElem=null`（區別於三屬 LV5 thirdElem!=null）
- **解鎖條件**：2 picks 同元素（無需精華）
- **升級費用**：~350g（LV4 雙屬 +250g → LV5 純屬 +350g → LV6 純屬 +600g）
- **LV5→LV6 條件**：3 picks + 精華 ≥ essenceLv6Threshold

---

## 修改步驟

| 步驟 | 檔案 | 內容 |
|------|------|------|
| Step 1 | `js/towers.js` | PURE_TOWERS 每個元素加入 `lv5` stats |
| Step 2 | `js/game.js` | 4 處邏輯修改 + sandbox 精華按鈕 |

---

## 執行順序
1. `execute pure-lv5-upgrade/step1.md`（純屬 LV5 資料）
2. `execute pure-lv5-upgrade/step2.md`（遊戲邏輯）
