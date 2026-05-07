# skill-editor-direct-write：直接寫入 js 檔

## 問題根源

目前流程：skill-editor 編輯 → export 產生文字 → 下載 → 手動替換
除了流程麻煩外，還有以下問題：

| 問題 | 檔案 | 說明 |
|------|------|------|
| ELEM_BASE 位置錯 | towers.js | 匯出時排在最後，正確應在 INFUSIONS 之前 |
| fmtSkills 遺漏參數 | towers.js | 過濾 default 相同值，`targets:2` 等被靜默丟棄 |
| skills.js 無法匯出 | skills.js | scoreBase 在 UI 可編輯但從不寫回；GLOBAL_CAPS 完全無法編輯 |
| 手動替換繁瑣 | 所有 | 下載後需手動覆蓋 js/ 目錄 |

## 解決方案

### 1. 修正 towers.js 匯出品質（step1）
- Fix A：ELEM_BASE 移到 INFUSIONS 之前
- Fix B：fmtSkills 輸出全部 params，不過濾 default

### 2. 新增 skills.js 匯出（step2）
新增 "技能" tab 或在現有 score 面板加匯出按鈕，允許：
- 編輯 `GLOBAL_CAPS`（6 個全域上限數值）
- 編輯 `SKILL_DEFS` 的 scoreBase（已可編輯，加匯出）
- 匯出只寫 GLOBAL_CAPS + SKILL_DEFS 資料部分（不動函數）

**skills.js 結構**：
```
GLOBAL_CAPS      ← 可匯出
SKILL_DEFS       ← scoreBase 已可編輯，需匯出
makeSkill        ← 不動（函數）
getSkill         ← 不動（函數）
hasSkill         ← 不動（函數）
getSkillDesc     ← 不動（函數）
getSkillBrief    ← 不動（函數）
```

匯出策略：只產生 `GLOBAL_CAPS` + `SKILL_DEFS` 兩個常數的文字；函數部分透過 File System Access API 「讀原始→替換前段→寫回」保留。

### 3. File System Access API — 直接寫入（step3）
- 加 `fileHandles` 全域物件（每個檔案獨立 handle）
- 每個 tab 的 export bar 加「📂」選取按鈕
- 選取後「💾 下載」升級為「✏️ 寫入」
- skills.js 用「讀原始 → patch 前段 → 寫回」，其他用全文覆寫

## 執行步驟

| Step | 任務 | 修改範圍 |
|------|------|---------|
| step1 | 修正 towers.js 匯出品質 | skill-editor.html：exportTowers() + fmtSkills() |
| step2 | 新增 skills.js 匯出 | skill-editor.html：新增 GLOBAL_CAPS 編輯 + exportSkills() |
| step3 | File System Access API | skill-editor.html：fileHandles + openFileHandle + doExport write mode |

## 不動的部分
- `js/*.js`、`index.html`、`js/game.js` — 完全不碰
- 玩家體驗不受任何影響（skill-editor.html 是獨立開發工具）

## 關鍵決策
- **fmtSkills 改為輸出所有 params**：與原始 towers.js 一致，便於 diff
- **number 格式（2.0→2）**：JS 無法原生保留，接受此視覺差異，不修正
- **skills.js 函數不重新產生**：改用 patch 策略保留函數原始格式
- **不做所有欄位 surgical patch**：只有 skills.js 需要 patch，其他全文覆寫即可
