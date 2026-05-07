# step1 — 補強 CLAUDE.md 核心規則

## 影響範圍

- `~/.claude/CLAUDE.md`（全域）：執行回饋格式章節
- `C:/Users/terryhuang/Claude/projects/tower-defense-prototype/CLAUDE.md`（專案）：THINK 模式章節

## 修改內容

### 全域 CLAUDE.md — 執行回饋格式

在「不輸出：程式碼片段、diff、逐行說明、工具呼叫摘要」後補充：

> **適用範圍：THINK 與 EXECUTE 模式的所有聊天回應均不顯示程式碼。**
> 若回應涉及程式碼細節，告知使用者參考對應的計畫 .md 檔。

### 專案 CLAUDE.md — THINK 模式規則

在「限制：寫完所有 md 後立即停止，等待使用者審核」後補充：

> **無例外**：無論任務大小，THINK 模式一律建立 plans/active/XXX/ 計畫文件後停止，不在聊天中直接輸出分析取代計畫文件。

## 定位方式

- 全域 CLAUDE.md：Grep `不輸出：程式碼片段` 找到插入點
- 專案 CLAUDE.md：Grep `等待使用者審核` 找到插入點
