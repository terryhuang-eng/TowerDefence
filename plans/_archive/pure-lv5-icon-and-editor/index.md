# pure-lv5-icon-and-editor

## 問題 1 — 純屬 LV5 升級按鈕顯示錯誤 icon（3 個元素）

### 現象
點 LV4 純屬塔（如 🌪️×2），升級按鈕顯示 `🌪️🌪️🌪️`（三個），應顯示 `🌪️🌪️`（兩個）。

### 根本原因
`PURE_TOWERS[elem].icon` 是固定的三元素圖示（設計給 LV6 用），但 LV5 升級按鈕直接沿用 `pure.icon`。

| 位置 | 用途 | 問題 |
|------|------|------|
| game.js L942（LV4→LV5 按鈕） | 升級到 LV5 的按鈕 | `pure.icon` → 三元素 ❌ |
| game.js L975（picks<2 的 LV6 提示） | 預覽 LV6 | `pure.icon` → 三元素 ✅ 正確 |
| game.js L1052（LV5→LV6 按鈕） | 升級到 LV6 | `pure.icon` → 三元素 ✅ 正確 |
| game.js L730（info panel）| 已升塔的資訊面板 | `ELEM[t.elem].icon + '×2'` ✅ 正確 |
| game.js L3066（canvas 渲染）| 地圖塔圖示 | `ELEM[tw.elem].icon + '×2'` ✅ 正確 |

**只需修改 L942 一處**：`${pure.icon}` → `${ELEM[t.elem].icon + ELEM[t.elem].icon}`

---

## 問題 2 — skill-editor 匯出格式與 towers.js 不符（2 個缺漏）

### 缺漏 A：INFUSIONS 匯出遺失 `score_adj`

| 實際 towers.js | skill-editor 匯出 |
|---------------|-----------------|
| `lv4: { damage, atkSpd, range, aoe, cost, score_adj, desc, skills }` | `lv4: { damage, atkSpd, range, aoe, cost, desc, skills }` |

`score_adj` 完全遺漏，一旦用 skill-editor 輸出並貼回 towers.js，36 個注入塔的評分調整係數全部消失。

### 缺漏 B：PURE_TOWERS 匯出遺失整個 `lv5`

| 實際 towers.js | skill-editor 匯出 |
|---------------|-----------------|
| 每個元素有 `lv5` + `lv6` 兩個物件 | 只匯出 `lv6` |

`lv5` 資料（6 × 純屬中級）完全遺失。

### 額外問題 C：skill-editor UI 無法顯示或編輯 PURE_TOWERS lv5

- 側欄列表：`if (!pure.lv6) continue;` → 只列 lv6 塔，完全沒有 lv5 入口
- 點擊後進入的編輯 panel：只讀取 `pure.lv6`

---

## 修改步驟

| 步驟 | 檔案 | 內容 |
|------|------|------|
| Step 1 | `js/game.js` | LV4→LV5 升級按鈕 icon 改為雙元素 |
| Step 2 | `skill-editor.html` | 匯出加入 score_adj（INFUSIONS）+ lv5（PURE_TOWERS）；UI 加入 lv5 編輯入口 |

## 執行順序
1. `execute pure-lv5-icon-and-editor/step1`
2. `execute pure-lv5-icon-and-editor/step2`
