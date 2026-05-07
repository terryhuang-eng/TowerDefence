# Plan: skill-editor 關閉技能不生效

## 問題分析

### 根本原因
`fmtSkills()` 在序列化技能陣列時，**沒有過濾 `enabled === false` 的項目**。

完整流程：
1. 使用者取消勾選技能 → `toggleSkill()` 設 `sk.enabled = false`（技能仍留在陣列中）
2. 使用者點「✏️ 寫入 towers.js」→ `exportTowers` 呼叫 `fmtSkills(lv.skills)`
3. `fmtSkills` 對陣列中**所有**元素做 `map()`，無視 `enabled` 欄位 → 仍輸出 `makeSkill('burn', {...})`
4. F5 後，`makeSkill` 建立的物件沒有 `enabled` 欄位（預設視為啟用）
5. `renderEditor` 檢查 `active.enabled !== false` → `undefined !== false = true` → 顯示為打勾

### 影響範圍
- 唯一有問題的函數：`fmtSkills()`（skill-editor.html line 950）
- 受影響的匯出：`exportTowers`（towers.js）、`exportWaves`（waves.js）、`exportSends`（sends.js）
  — 因為這三個都用同一個 `fmtSkills`

## 步驟清單

| # | 步驟 | 檔案 | 複雜度 |
|---|------|------|--------|
| 1 | 修正 `fmtSkills` 過濾 `enabled === false` | skill-editor.html | 低 |

## 執行順序
只有一個步驟，執行：`execute skill-editor-disable-fix/step1.md`
