# skill-editor-score-std — 等級分數基準 UI 調整面板

## 問題

`LEVEL_SCORE_STD` 與 `DPS_REF` 硬編碼在 skill-editor.html，
調整需直接改 JS 常數，且修改後無法快速看到對所有塔的影響。

## 設計

在現有「⚙️ 分數權重」面板旁（或其內部），新增「📐 等級基準」區塊，
包含兩個表格（LEVEL_SCORE_STD / DPS_REF），每個 lv 對應一個 input。

修改任一值 → 即時 `renderPanel()`（重算所有塔分數）。

### 面板位置

現有 `#score-defs-panel`（右側 ⚙️ 面板）內加一個 `<details>` 折疊區塊，
與現有權重 panel 同一位置，不新增浮窗。

---

## 步驟

| 步驟 | 內容 | 檔案 |
|------|------|------|
| step0 | `computeScoreBreakdown` DPS分 改用 lvStd（解耦 adj 影響） | `skill-editor.html` |
| step1 | ⚙️ 面板加 LEVEL_SCORE_STD / DPS_REF 輸入區 | `skill-editor.html` |

step0 必須先執行（否則 step1 加的調整 UI 在舊公式下會誤導）。
