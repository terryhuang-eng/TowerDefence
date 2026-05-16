# UI Grid & Mobile Fix

## 問題摘要

| 面向 | 現狀 | 目標 |
|------|------|------|
| 格子大小 | 只能調整寬度（gridCols），高度（gridRows=10）寫死，AI 行數 10 也寫死；路徑 y 值全部 hardcoded | 格子長寬皆可調整，儲存後下次開局生效 |
| 手機送兵列 | `buildMobileHud()` 只在 `showUpgradePanel()` 中呼叫；進入 pre_wave 時 `showWavePreview()` 不觸發它，送兵列永遠不出現 | pre_wave 進入時自動顯示 |
| 手機面板樣式 | 側欄 panel 內按鈕觸控目標過小（`.income-btn` padding 6px 12px）、戰報截斷 100px、升級選項小 | 手機上觸控區域達 44px、戰報加高、字體更易閱讀 |

---

## 三個功能

### 功能 1：格子長寬調整（Step 1）
- UI Editor 新增 Grid 區塊：gridCols（10–30）、gridRows（5–15）
- 修改即時儲存到 localStorage；**不立即重建格子，下次開局生效**
- 同時更新 `totalRows` 公式（`gridRows * 2 + 2`）、路徑生成改用比例公式

### 功能 2：手機送兵列修正（Step 2）
- `showWavePreview()` 結尾加 `this.buildMobileHud()`
- 一行修正，讓所有進入 pre_wave 的路徑都觸發 HUD 重建

### 功能 3：手機面板觸控樣式（Step 3）
- `@media (max-width: 768px)` + `body.mobile-preview` 加入 sidebar panel 手機樣式
- `.income-btn`、`.upgrade-opt`、`.tower-popup-btn` min-height ≥ 44px
- 戰報 max-height 調為 160px
- panel 間距、字體輕微放大

---

## 步驟清單

| # | 步驟 | 檔案 | 風險 |
|---|------|------|------|
| 1 | ✅ [Grid Dimension Editor + Path 泛化](step1.md) | `js/game.js` + `index.html` | 中：需泛化路徑 y 值，需 localStorage 讀取點 |
| 2 | ✅ [Mobile Send Bar Fix](step2.md) | `js/game.js` | 低：一行加法 |
| 3 | ✅ [Mobile Panel Touch Styles](step3.md) | `index.html` (CSS) | 低：純 CSS 加法 |

---

## 執行順序

Step 2 最優先（一行修正，立即有效）→ Step 3（CSS，安全）→ Step 1（最複雜）

---

## 驗證目標

- [ ] 手機模式 pre_wave 時底部自動出現送兵列
- [ ] 手機 sidebar 開啟後按鈕觸控區 ≥ 44px，戰報可滾動
- [ ] UI Editor 格子 slider 調整後按「儲存」顯示提示，刷新後格子大小改變
- [ ] 路徑在不同 gridRows 下仍為 U 型，不超出格子範圍
