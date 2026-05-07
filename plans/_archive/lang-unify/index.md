# lang-unify — 語言統一 + 核心規則補強

## 問題來源

1. **規則模糊**：THINK / EXECUTE 回應的「不顯示程式碼」範圍未明確；THINK 模式在任務較小時被跳過計畫文件步驟。
2. **語言不一致**：skill-editor.html UI 中文英文混用；help modal 參數名稱也有混用。

## 目標

- 補強 CLAUDE.md 規則，確保行為一致
- 建立術語對照文件（英文為主，混淆風險術語附中文解說）
- skill-editor.html 全面英文化（index.html 除外）

## 步驟清單

| 步驟 | 目標 | 影響檔案 |
|------|------|---------|
| step1 | 補強全域與專案 CLAUDE.md 規則 | `~/.claude/CLAUDE.md`、`CLAUDE.md` |
| step2 | 建立 `docs/score-glossary.md` | 新建檔案 |
| step3 | skill-editor.html UI 英文化 + help modal 更新 | `skill-editor.html` |

## 執行順序

step1 → step2 → step3（依序，各步驟完成後 /clear）
