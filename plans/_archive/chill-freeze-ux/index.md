# chill-freeze-ux 計畫總覽（更新版）

## 確認範圍
1. **Step1**：修正 `perStack` 被忽略的程式碼 Bug，不調整任何數值
2. **Step2**：freeze 技能改為只有 LV6 純水塔（冰河塔 lv6）才有，移除 深寒/冰河塔lv5 的 freeze
3. **Step3**：Skill Editor UX 修正（描述顯示實際數值、評分 cap 加說明）

---

## 問題摘要

### Bug 1：chill perStack 被忽略（純程式碼 Bug）
`game.js:2591` 硬寫 `0.02`，不管塔的 `perStack` 參數為何都用同一個值。
例如深寒的 `perStack:0.5` 完全無效。

### Bug 2：freeze 範圍過廣導致觸發難以平衡
深寒（lv4）和冰河塔（lv5）都有 freeze，但觸發條件（threshold）在 chill 疊層機制下很難正常運作。
解法：freeze 收斂到 LV6 純水，讓用戶在 Bug1 修完後自行測試 lv6 參數。

### Bug 3：Skill Editor 描述/評分顯示問題
- 描述顯示 `perStack`、`cap` 等變數名，無法直接看出數值
- 評分面板的 `cap` 語意不清（是「層數上限」而非「減速%上限」）

---

## 步驟清單

| 步驟 | 檔案 | 說明 |
|------|------|------|
| step1.md | `js/game.js` | 修正 hardcode `* 0.02`，改讀 enemy 身上記錄的 `chillPerStack` |
| step2.md | `js/towers.js` | 移除 深寒lv4 和 冰河塔lv5 的 freeze 技能，保留 lv6 |
| step3.md | `skill-editor.html` | 描述改用 `getSkillDesc()` 渲染；評分 cap 加說明文字 |

---

## 執行順序
step1 → step2 → step3（三步驟互相獨立，但建議依序執行後測試）
