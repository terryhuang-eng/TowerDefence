# Plan: response-format-rule

## 問題分析

執行指令（EXECUTE / 任何需求動作）時，Claude 預設會輸出程式碼變更細節，
但使用者看不完這些細節，屬於無效 token。
使用者需要的只有：
1. **原因**：診斷分析，為什麼要這樣改
2. **結果**：改了什麼（名稱/效果層次，非程式碼）

## 目標

將此格式規則寫入 CLAUDE.md，確保任何 session 都自動遵守。

## 寫入位置

| 層級 | 檔案 | 加入位置 |
|------|------|---------|
| 全域 | `~/.claude/CLAUDE.md` | `## 語言與風格` 新增「執行回饋格式」條目 |
| 專案 | `projects/tower-defense-prototype/CLAUDE.md` | `EXECUTE Mode` 行動說明內補充輸出格式 |

## 步驟

- [step1.md](step1.md)：全域 CLAUDE.md → 語言與風格新增規則
- [step2.md](step2.md)：專案 CLAUDE.md → EXECUTE Mode 補充輸出格式約束
