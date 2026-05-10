# 計畫：skill-matrix — 技能總覽 Tab

## 問題分析

現有 skill-editor.html 的「塔」tab 是「塔→技能」方向：選一個塔才能看到它用了哪些技能。
使用者需要：
1. **概覽方向**：一眼看到目前 activeElems 下所有塔組合的技能使用狀況
2. **技能→塔方向**：選一個技能，看哪些塔用了它（含各塔的技能 params）
3. **塔→技能方向**（補強）：點塔名可快速跳回「塔」tab 深度編輯

## 設計決策

新增第 5 個 tab「技能矩陣」到既有 TABS 陣列，layout 沿用既有 list-panel + edit-panel。

### 左 panel（技能清單）
- 以 group 分組顯示所有 tower-category 技能
- 每個技能 row 顯示：技能名稱 + 技能說明 + 使用塔數徽章
- 點擊技能 → 右側顯示使用該技能的塔清單
- 附 "全部塔" 入口（selectedSkill = null）→ 右側顯示所有塔的技能摘要

### 右 panel — 雙視角（header 按鈕切換）

**視角 A：技能視角**（預設）
- 顯示使用選中技能的所有塔
- 每塔一行：icon + 名稱 + 等級 + params inline 顯示
- params 可直接編輯（呼叫已有 updateSkillParam）

**視角 B：矩陣視角**
- 表格：列 = 所有塔（按等級分組），欄 = 所有有使用的技能
- Cell：✓ 表示使用，— 表示無
- 點塔名 → 跳塔 tab 並選中該塔
- 橫向 scroll

## 核心 helper：buildAllTowers()
回傳 Array<{label, icon, lv, unit, groupLabel}>，依 getActiveElems() 篩選。
供左 panel 計算 usageCount、右 panel 渲染塔清單共用。

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | skill-editor.html | Tab 定義 + CSS + buildAllTowers() |
| step2.md | skill-editor.html | 左 panel 技能清單 + 右 panel 技能視角 |
| step3.md | skill-editor.html | 右 panel 矩陣視角（切換按鈕） |

## 執行順序
step1 → step2 → step3（依序，每步驟前 read 目標行號）
