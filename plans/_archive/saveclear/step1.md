# Step 1：修改 /saveclear 全域 command

## 目標
在現有 `~/.claude/commands/saveclear.md` 的 save 步驟前後，分別插入：
- **Step 0（最前）**：封存已完成的 plan 資料夾
- **Step 7（最後，save 步驟之後）**：git commit + push

## 目標檔案
`C:/Users/terryhuang/.claude/commands/saveclear.md`

---

## Step 0：Plan 封存邏輯

插入在「執行 /save 的所有步驟」之**前**，作為 Step 0：

```markdown
## Step 0：封存已完成的 Plan

掃描 `plans/active/` 下的所有子資料夾，讀取每個資料夾的 `index.md`：
- 若步驟表中**所有步驟均為 ✅**（無 ⬜ 或其他未完成標記）→ 視為「已完成的 plan」
- 將該資料夾整體移動至 `plans/_archive/<資料夾名>/`（保留所有 step md 檔）
- 若 `plans/_archive/<資料夾名>/` 已存在，附加日期後綴（`-YYYY-MM-DD`）避免覆蓋

掃描方式：
1. Glob `plans/active/*/index.md`
2. Read 每個 index.md，Grep `⬜` 或 `❌`
3. 若無未完成標記 → Bash `mv plans/active/XXX plans/_archive/XXX`

若無任何已完成的 plan → 跳過此步驟，不輸出任何訊息。
若有封存 → 列出「已封存：plans/_archive/XXX」。
```

---

## Step 7：git commit + push

插入在現有 Step 6（回報）之**後**，作為 Step 7：

```markdown
## Step 7：git commit + push

若目前工作目錄是 git repo（`git status` 不報錯）：

1. `git status` — 確認有變更
2. 若有未 stage 的變更：
   - Stage 範圍：程式碼檔案（js/*.js / *.html）+ plans/ + docs/
   - **不 stage**：`.claude/`、`*.env`、`node_modules/`
3. 自動產生 commit message：
   - 若 Step 0 有封存 plan：`Archive <plan名> + save session state`
   - 若無封存：`Session save: <session 主題摘要（從 Step 2 整理）>`
4. `git commit -m "..."` → `git push`
5. 輸出：`✅ git push 完成（<branch> → origin）`

若工作目錄不是 git repo，或 push 失敗 → 跳過，輸出原因，不中斷流程。
```

---

## 修改方式

在現有 `saveclear.md` 的：
- `執行 /save 的所有步驟（Step 1 到 Step 6）` 段落之前，插入 Step 0 區塊
- 完成所有儲存步驟後的輸出模板之後，插入 Step 7 區塊
- 最終輸出模板中，在「請輸入 /clear 清除對話。」之前加一行：`git push 完成（若適用）`

## 影響範圍
- 僅修改 `~/.claude/commands/saveclear.md`
- 全域生效（所有專案的 /saveclear 均會執行 plan 封存 + git push）
- `~/.claude/commands/save.md` **不修改**（save 仍保持輕量，無 git）
