# Plan: skill-help-page

## 目標
在主畫面（start-screen）新增「技能說明」按鈕，開啟一個獨立 overlay，列出所有塔技能與敵人被動的詳細說明，內容須**完全反映當前程式碼邏輯**（非 SKILL_DEFS.desc 的字面描述）。

## 問題分析

### 現況
- `#info-overlay` 已存在，但從遊戲中的 info-btn 觸發（遊戲進行中才能看）
- `#start-screen` 沒有技能說明入口
- `SKILL_DEFS.desc` 中有數個描述與實際邏輯不符（見下方）

### 程式碼 vs 說明不符之處（須在說明頁更正）

| 技能 | 說明上寫的 | 實際程式碼 |
|------|-----------|----------|
| chill | 每層 -2% | `chillPerStack=0.005` → 每層 -0.5%（160層上限=80%）|
| shield | 額外 amt 護盾 | HP 降至 0 時回復為 1 HP，僅一次 |
| burn+detonate | 消耗灼燒觸發 | burnStacks 累積到 3 層時第3次觸發，burnStacks 歸零 |
| zone_slow/zone_shred | 留下圓圈 | 每幀對區域內敵人設 chillStacks = max(current, target)，不累加 |
| chain | 跳到鄰近敵人 | 從目前範圍內（已排序）的其他目標取前 targets 個 |
| antiElement | 同元素 -reduce% | 受某元素累積傷害達 80 時，該元素抗性 +0.5%（持續疊加）|
| stealth | 每 cd 秒隱身 | 隱身中塔無法鎖定；距任何塔 ≤2 格時自動揭露 |
| phaseShift | 每 1/phases HP 換相 | 換相後：主元素 +60% 抗性，相剋元素 -30%（弱點），全傷 ×(1-dmgReduce) |

## 步驟

### step0.md — Bug Fix：burnStacks 應隨 burnTimer 歸零清空
- 修正引爆積累在火焰熄滅後仍殘留的問題
- 需先修再寫說明頁，確保說明反映正確行為
- 改動檔案：`js/game.js`（1 行修改）

### step1.md — HTML: 加入按鈕 + overlay 外殼
- 在 `#start-screen` 的「開始戰鬥」按鈕下方加入「📖 技能說明」按鈕
- 在 index.html body 加入 `#skill-ref-overlay`（結構同現有 overlay，加 tab 列）
- 改動檔案：`index.html`

### step2.md — JS: 實作 `showSkillRef()` 函數
- 在 index.html 的 scripts 最後加入全域函數 `showSkillRef()`
- 功能：build 三個 tab 的 HTML 並注入 overlay
  - Tab 1：🗡️ 塔技能（傷害 / 控制 / 弱化 / 增益 / 特殊）
  - Tab 2：👾 敵人被動
  - Tab 3：📊 全域上限
- 所有描述讀自 `SKILL_DEFS` + `GLOBAL_CAPS`，關鍵不符項目用準確說明覆寫
- 改動檔案：`index.html`

## 執行順序
step1 → step2（皆改同一個 index.html，需依序執行）
