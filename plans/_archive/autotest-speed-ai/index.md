# autotest-speed-ai 計畫總覽

## 問題分析

### 問題 1：速度不夠快
**現況：**
- `ticksPerFrame = 50`，`simDt = 0.05` → 每幀模擬 2.5s 遊戲時間
- 每幀都執行 `render()` + `updateHUD()`（canvas 繪圖 + DOM 更新，耗時最多）
- `setInterval` 50ms 輪詢狀態

**瓶頸：** `render()` 和 `updateHUD()` 是最大成本，每秒 60 次全畫面重繪

### 問題 2：AI HP 欄位無意義 → 改為 AI 無限血量
**需求：** autotest 期間 AI 不應被擊敗（不會提前結束測試），但仍要記錄送兵造成的傷害量

**設計：** `ai.hp = 99999`（超大值），damage 照常結算但永遠不到 0。
結果表「AI HP」欄改為顯示「AI傷害」（傷害越高代表送兵壓力越大）

---

## 解法

### Step 1：速度提升（`autotest.js`）
- `ticksPerFrame` 50 → 200（4× 遊戲速度）
- turbo loop 跳過 render（或每 10 幀才 render 一次，保留視覺反饋）
- `setInterval` 50ms → 16ms（更快輪詢，減少等待）
- 預期整體加速：**4~8×**

### Step 2：AI 無限血量（`autotest.js`）
- `runTest()` 重置時 `ai.hp = ai.maxHp = 99999`
- `takeSnapshot()` 新增 `aiHpDmg`（傷害量 = 99999 − ai.hp）
- 結果表「AI HP」欄改顯示「AI傷害」，讓送兵壓力可量化
- `detectIssues()` 改用 `aiHpDmg < 10` 判斷送兵壓力極低

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | autotest.js | turbo loop 加速 + 跳過 render |
| step2.md | autotest.js | AI 防線強度可調（slider + injectDifficulty 覆蓋） |

## 執行順序
Step 1 → Step 2（獨立，可分開執行）
