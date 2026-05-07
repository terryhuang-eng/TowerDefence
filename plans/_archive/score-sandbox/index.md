# Plan: score-sandbox

## 問題分析

### 需求 A：評分可調整參數系統
**現況問題**
- `score_adj` 寫死在 `towers.js`，每次調整要改程式碼 + 重載頁面
- `calcTowerScore()` 公式係數（burn×150、chill×50…）寫死在 `dps-calc.html`
- 改完無法快速輸出 patch，需手動對照再寫回 towers.js

**目標**
- `dps-calc.html` 加入「公式權重面板」可即時調整係數
- `score_adj` 欄位 inline 可編輯（點擊直接輸入）
- Score 目標範圍可調（LV4_TARGET / tolerance%）
- 「匯出 score_adj 差異」按鈕 → 複製變更過的塔名:adj 對照表

### 需求 B：沙盒手動測試模式
**現況問題**
- index.html 無任何 debug/sandbox 功能
- 測試特定波次要從頭玩
- 元素塔需要等對應波次解鎖，無法直接測試

**目標**
- URL 參數 `?sandbox=1` 啟動沙盒模式（正常遊戲不受影響）
- 沙盒面板（右上角浮動）包含：
  - **跳至波次**：選擇 1-20，點「Go」立即進入該波 pre_wave
  - **怪物倍率**：HP / 數量倍率滑桿（0.25x ~ 5x）
  - **金幣**：「+9999g」按鈕
  - **解鎖元素**：立即給予 4 個元素 pick（可各自選）
  - **無限血量**：開關，基地不扣血
  - **遊戲速度**：1x / 2x / 4x（修改 CONFIG.tickMs）

## 步驟清單

| # | 步驟 | 檔案 | 說明 |
|---|------|------|------|
| 1 | 評分權重面板 | dps-calc.html | 公式係數 inputs + target/tolerance 可調 |
| 2 | score_adj inline 編輯 + 匯出 | dps-calc.html | score_adj 欄可點擊編輯、export 按鈕 |
| 3 | index.html 沙盒面板 UI | index.html | `?sandbox=1` 觸發，浮動面板 DOM 結構 |
| 4 | index.html 沙盒功能接線 | index.html | 波次跳躍、怪物倍率、金幣、元素解鎖、無限血量、速度 |

## 執行順序
Step 1 → Step 2 → Step 3 → Step 4

Step 1 & 2 同屬 dps-calc.html，分開是因為改動範圍不同：
- Step 1：修改 `calcTowerScore()` 函式 + 新增 weight panel HTML
- Step 2：修改 table render 邏輯 + 新增 overrideAdj 系統 + export 按鈕

Step 3 & 4 同屬 index.html，UI 先建、功能再接線，避免一次改動太多邏輯。

## 風險注意
- Step 4「跳至波次」需找到 waveStart / spawnWave 邏輯，確認直接設 currentWave 是否安全
- 沙盒模式只在 `?sandbox=1` 下啟動，不影響正常遊戲邏輯
- 速度倍率修改 tickMs 可能影響 setTimeout chain，需確認遊戲 loop 結構
