# level-score-std-writeback

## 問題根因

`LEVEL_SCORE_STD` 與 `ATKSPD_REF` 是定義在 `skill-editor.html` 本身（line 947-948）的硬編碼常數，**不在任何 js/ 檔案中**。

`fileHandles` 系統只涵蓋 5 個 js 檔：
```
JS_DIR_FILES = { waves, sends, towers, config, skills }
```

UI 的 `updateLevelStd()` 雖然會 mutate 記憶體中的 `LEVEL_SCORE_STD`，但沒有任何路徑將改動序列化回檔案。瀏覽器重新整理後數值就還原為 line 947 的預設值。

## 解法選擇

| 方案 | 說明 | 缺點 |
|------|------|------|
| A. 移入 config.js | 加 SCORE_PARAMS 區塊，exportConfig 寫回 | 非遊戲邏輯混入 CONFIG |
| B. skill-editor.html 自寫（選定） | 加獨立 fileHandle 選取自身，patch 兩行 const | 需要使用者選取 html 檔 |
| C. 新增 score-params.js | 新檔，加入 JS_DIR_FILES | 多一個檔案 |

**選定方案 B**（自寫）：
- skill-editor 本就是 dev tool，對自身寫回合理
- 零架構變動，僅在現有 fileHandle 模式旁加一個 `seFileHandle`
- 使用者體驗：選一次 → 之後改完 click 💾 即持久化

## 修改範圍

單一檔案：`skill-editor.html`

## 步驟清單

| # | 步驟 | 目標 |
|---|------|------|
| 1 | [step1.md](step1.md) | 加 `seFileHandle` + `openSEHandle()` + `saveSEScoreParams()` + UI 按鈕 |

（單步完成，無依賴）
