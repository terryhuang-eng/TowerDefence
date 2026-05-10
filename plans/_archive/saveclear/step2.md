# Step 2：修改專案 CLAUDE.md — EXECUTE Mode 完成偵測

## 目標
在 EXECUTE Mode 規則中加入「最後一步完成後提醒 `/saveclear`」的規則，取代現有的「提醒執行 `/clear`」。

## 目標檔案
`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/CLAUDE.md`

---

## 修改內容

### 現有規則（第 163 行附近）
```
  - **限制**：一次只動一個檔案，步驟完成後提醒使用者執行 `/clear`。
```

### 改為
```
  - **限制**：一次只動一個檔案。
  - **⚠️ 強制 — 步驟完成提醒**：
    - **一般步驟**：完成後提醒「步驟完成。可繼續 `execute XXX/stepN+1.md`，或輸入 `/clear` 清除對話。」
    - **最後一步**：讀取 `plans/active/XXX/index.md` 確認無更多 step 後，輸出：
      `✅ 所有步驟完成。測試通過後請執行 /saveclear 封存計畫並同步 git。`
```

---

## 最後一步偵測邏輯

EXECUTE 收到 `execute XXX/stepN.md` 時：
1. 讀取 `plans/active/XXX/index.md` 的步驟表
2. 比對最後一個 step 的檔名是否為 `stepN.md`
3. 若是 → 執行完後輸出 saveclear 提醒
4. 若否 → 輸出一般步驟提醒

**注意**：偵測在步驟**執行完畢後**，不在開始前。避免步驟失敗時錯誤提醒。

---

## 影響範圍
- 僅修改 `CLAUDE.md` 的 EXECUTE Mode 規則兩行
- 不影響 THINK mode、其他模式規則、技術規格內容
