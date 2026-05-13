# autotest-rules — 規則式自動化測試

## 現況分析

### 現有 autotest.js 做什麼

A/B/C/D 四組策略，每組跑完整 20 波模擬，輸出「存活波次 / HP / income / DPS」排名表。

這是**整合測試**（「能活幾波」），適合數值平衡驗證。

### 現有系統的限制

| 問題 | 說明 |
|------|------|
| 無法測具體邏輯 | 升級有沒有扣金？選項數量對不對？ |
| 需要完整遊戲啟動 | 必須 index.html?sandbox=1，等 UI 渲染 |
| 失敗不顯示原因 | 只知道「存活到 W12」，不知道是哪個 bug 造成的 |
| 新增 bug 後才知道 | 測試完 20 波才發現早在 W4 就扣金錯誤 |

---

## 解決方案：獨立 `test.html` + assertion 機制

建立 `test.html`（與 skill-editor.html、dps-calc.html 同層），：
- 自動載入 `js/*.js`（不需要 Canvas，不需要 Game 啟動）
- 定義 `assert(condition, message)` 斷言函數
- 每次打開頁面**自動跑**所有測試，顯示通過/失敗清單
- 失敗時顯示「期望 vs 實際」

### 流程對比

**現在**：開 index.html → P 鍵 → 按 A 組 → 等 30 秒 → 看排名表 → 猜哪個波段有問題

**新方案**：開 test.html → 自動跑完（< 1 秒）→ 看紅/綠清單

---

## 測試分層設計

### Layer 1：資料完整性（純靜態）
不需要 Game instance，直接驗證資料結構：

| 測試 | 規則 |
|------|------|
| INFUSIONS 完整性 | 每個 `INFUSIONS[A][B]` 必須有 `lv4.cost / damage / atkSpd / range` |
| TRIPLE_TOWERS 完整性 | 每個 key 必須有 `lv5.cost / damage` |
| PURE_TOWERS 完整性 | 每個元素必須有 `lv5` 和 `lv6` |
| 技能 ID 合法性 | towers 中所有 `skills[].id` 必須存在於 `SKILL_DEFS` |
| WAVES killGold | 每波必須有 `killGold` 欄位 |
| CONFIG 必要欄位 | `startGold / startHP / baseIncome / towerCost / maxLv6Towers` 存在 |

### Layer 2：升級邏輯（Mock Game）
建立 minimal mock Game object，直接呼叫 `_getMobileUpgradeOptions` 等方法：

| 測試 | 規則 |
|------|------|
| Lv4 純屬塔（picks=3）選項數 | `_getMobileUpgradeOptions` 回傳剛好 **1** 個選項（Lv5） |
| Lv5 純屬塔（picks=3）選項數 | 回傳剛好 **1** 個選項（Lv6） |
| Lv5 純屬塔（picks=2）選項數 | 回傳 **0** 個選項 |
| showTowerActionPopup 升級扣金 | 升級後 `game.gold` 減少正確費用 |
| Lv1→Lv2 升級 | gold 正確扣除 `BASIC_TOWERS[x].levels[1].cost` |
| Lv3→Lv4 升級 | gold 正確扣除 `INFUSIONS[elem][inj].lv4.cost` |

### Layer 3：送兵配額（Mock Game）

| 測試 | 規則 |
|------|------|
| getSendQuota 波次對應 | W1 斥候配額 = 5, W3-4 = 6 等 |
| sendAction 扣金 | 執行後 gold 減少 `s.cost` |
| sendAction HUD 更新 | 執行後 `buildHUD()` 被呼叫（用 spy） |

---

## 步驟清單

| 步驟 | 內容 | 影響檔案 |
|------|------|---------|
| ✅ step1 | 建立 `test.html` 框架：assert 函數 + 自動執行 + 結果 UI + Layer 1 資料測試 | `test.html`（新建） |
| ✅ step2 | 加入 Layer 2：Mock Game + 升級選項 + 升級扣金測試 | `test.html` |
| ✅ step3 | 加入 Layer 3：送兵配額 + sendAction 扣金 + buildHUD spy | `test.html` |

---

## 執行順序

step1 → step2 → step3，各步驟只建立/修改 `test.html`，不動遊戲邏輯。

## 驗證目標

- 打開 test.html，1 秒內看到所有綠色 ✅
- 修改遊戲邏輯後，有破壞性改動立即顯示紅色 ❌ + 原因
- 不需要手動操作遊戲
