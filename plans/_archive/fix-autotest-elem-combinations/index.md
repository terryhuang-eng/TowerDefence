# Plan Index: fix-autotest-elem-combinations

## 問題摘要

| # | 問題 | 嚴重度 | 檔案 |
|---|------|--------|------|
| 1 | B 組混屬策略只測 5/15 種雙屬組合 | 高 | autotest.js |
| 2 | Bot 升塔邏輯讓混屬策略走錯 INFUSION 路線 | 高 | autotest.js |
| 3 | TRIPLE_TOWERS（20 種 Lv5）完全未測試 | 中 | autotest.js + index.html |
| 4 | AI 第 4 次 pick 固定加 baseElem，無法走三屬路線 | 中 | js/game.js |

## 步驟清單

| Step | 檔案 | 內容 | 風險 |
|------|------|------|------|
| [step1](step1.md) | `autotest.js` | 補全 B 組缺失的 10 種混屬策略 | 低 |
| [step2](step2.md) | `autotest.js` | 新增 C 組三屬代表性策略（5 種）| 中 |
| [step3](step3.md) | `autotest.js` | 修正 Bot upgradeTowers 注入優先邏輯 | 中 |
| [step4](step4.md) | `js/game.js` | 修正 AI 第 4 次 pick 邏輯 | 中 |

## 執行順序

Step 1 → Step 2 → Step 3 → Step 4（各步驟獨立，可分開 execute）

## 驗證目標
- B 組策略：11 個 → 21 個
- C 組新增：5 個三屬策略
- mix_fire_water 實際產出蒸汽塔（fire+water INFUSION），非暴焰塔
- AI 偶爾走三屬路線（aiThirdElem 實際被使用）
