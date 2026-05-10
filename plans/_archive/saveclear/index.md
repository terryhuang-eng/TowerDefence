# saveclear 擴充計畫

## 問題分析

### 現況痛點
每次 plan 完成後，需要手動執行 4 個獨立步驟：
1. 移動 `plans/active/XXX/` → `plans/_archive/XXX/`
2. 更新 Obsidian 筆記（進度、結論）
3. `git commit`
4. `git push`

此外，EXECUTE mode 結束後只提醒 `/clear`，但正確時機應是：
**測試通過後 → 提醒 `/saveclear` 一次完成封存 + 同步**。

### 現有 /saveclear 結構
- 位置：`~/.claude/commands/saveclear.md`（全域 command）
- 現有步驟：Step 1-6 = `/save` 的所有步驟（handoff YAML + Obsidian session-log + MEMORY.md 更新） + 提示用戶輸入 `/clear`
- **缺少**：plan 封存、Obsidian 專案 README 更新、git commit/push

---

## 架構決策

### 修改對象
| 對象 | 修改內容 |
|------|---------|
| `~/.claude/commands/saveclear.md` | 在現有 save 步驟前加 Step 0（plan 封存），save 步驟後加 Step 7（git commit + push） |
| 專案 `CLAUDE.md` EXECUTE Mode 規則 | 最後一步執行完後，改提醒 `/saveclear` 而非 `/clear` |

### 不修改的對象
- `~/.claude/commands/save.md`（save 不含 git，保持輕量）
- Obsidian 更新：已在 `/save` Step 3，保留在 save 流程中（不移入 git step）

### Plan 完成偵測邏輯
「計畫完成」定義為：
- 執行的是 `plans/active/XXX/stepN.md`（最後一步）
- **且**用戶確認測試通過（口頭確認 or 明確說「通過」）

觸發行為：在步驟完成的「原因 + 結果」之後，額外輸出一行：
```
✅ 所有步驟完成。測試通過後請執行 `/saveclear` 封存計畫並同步 git。
```

「最後一步」偵測方式：讀取 `plans/active/XXX/index.md`，比對步驟表中最後一個 step 的檔名是否與當前執行的 stepN 相符。

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1 | step1.md | 修改 `~/.claude/commands/saveclear.md`：加 Step 0（plan 封存）+ Step 7（git commit/push）|
| step2 | step2.md | 修改專案 `CLAUDE.md`：EXECUTE Mode 最後一步提醒改為 `/saveclear` + 測試通過條件說明 |

## 執行順序

step1 → step2（獨立，無依賴）。
