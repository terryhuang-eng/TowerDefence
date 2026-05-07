# Step 2：專案 CLAUDE.md — EXECUTE Mode 補充輸出格式約束

## 目標
在 `projects/tower-defense-prototype/CLAUDE.md` 的 `執行模式 (EXECUTE Mode)` 的「行動」清單末尾，
補充輸出格式的強制規定。

## 影響範圍
- 檔案：`C:\Users\terryhuang\Claude\projects\tower-defense-prototype\CLAUDE.md`
- 僅影響本專案 EXECUTE 觸發時的行為

## 具體修改

找到 EXECUTE Mode 的「行動」清單（「僅讀取 ... 並執行該步驟」那一行），
在「限制」區塊中新增一條：

```
  - **⚠️ 強制 — 回饋格式**：步驟完成後只輸出「原因」＋「結果」，不輸出程式碼變更細節、diff 或逐行說明。
```

加在現有兩條 ⚠️ 強制之後，/clear 提醒之前。
