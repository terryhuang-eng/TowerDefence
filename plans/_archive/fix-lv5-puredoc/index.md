# THINK: Lv5 純屬規則錯誤分析

**觸發**：think sandbox目前升級LV5純屬塔的規則有誤
**日期**：2026-05-04

---

## 問題摘要

用戶指出：「V5純屬是LV4的升級版不需要三個純屬，三個純屬是LV6」

這個陳述**完全正確** — 但錯誤不在程式碼，在**文件（CLAUDE.md）**。

---

## 現行系統（程式碼實際狀態）

| 等級 | 資料來源 | 描述 | 升級條件 |
|-----|---------|------|---------|
| Lv1-2 | BASIC_TOWERS | 箭塔/砲塔 | — |
| Lv3 | ELEM_BASE | 元素基底塔（12種） | 需要第1次 element pick |
| Lv4 | INFUSIONS | 雙屬塔（36分支） | 需要第2次 element pick（同屬或異屬） |
| **Lv5** | **TRIPLE_TOWERS** | **三屬塔（20種）** | **Lv4 混屬（base≠infuse）→ 再選第3元素，只需 1+ pick** |
| **Lv6** | **PURE_TOWERS** | **純屬終極塔（6種）** | **Lv4 純屬（base==infuse）→ 需要 3 同元素 picks + 精華閾值** |

程式碼路徑（`game.js` ~L376-387）：
- **純屬路線**：Lv4（base==infuse）→ **直接跳 Lv6**（需 3 picks + essenceLv6Threshold）
- **混屬路線**：Lv4（base≠infuse）→ **Lv5 TRIPLE_TOWERS**（第3元素只需 1 pick）

---

## 錯誤所在

### ❌ 錯誤1：`CLAUDE.md` 升級路徑描述（主要錯誤）

**位置**：`projects/tower-defense-prototype/CLAUDE.md`，`## 升級路徑（5 階）`

**現行錯誤內容**：
```
## 升級路徑（5 階）
元素塔 Lv4 (+250g=510g)（INFUSIONS.lv4，9 分支）
      ↓ 需要 3 個相同元素
純元素塔 Lv5 (+400g=910g)（INFUSIONS.lv5，3 純路線）
```

**錯誤點**：
1. 標題說「5 階」— 實際上已是 **6 階**
2. 「需要 3 個相同元素」→ 這是 **Lv6** 的條件，不是 Lv5
3. 「純元素塔 Lv5」→ 目前 Lv5 是 **三屬塔（TRIPLE_TOWERS）**，純屬是 Lv6
4. 「INFUSIONS.lv5」— 這個結構早已移至 TRIPLE_TOWERS，不再存在
5. 「9 分支」— 實際上 INFUSIONS 已擴展為 36 分支（6×6）

### ❌ 錯誤2：`CLAUDE.md` 關鍵結構說明

**位置**：`## 關鍵結構` 的 INFUSIONS 條目

**現行錯誤**：
```
INFUSIONS：元素注入分支（lv3/lv4/lv5），9 種路線（Lv4-5 使用）
```

**錯誤點**：
- lv5 已移至 TRIPLE_TOWERS（v7 改版時），INFUSIONS 只剩 lv4 資料
- 分支數為 36（不是 9）
- 括號說 Lv4-5 使用，但 Lv5 不再用 INFUSIONS

### ❌ 錯誤3：`EXPANSION_3TO6_CHECKLIST.md` 的殘留舊說明

**位置**：第 181 行、第 211 行

- 第 181 行：「每個分支含 lv3/lv4/lv5 三層」— lv5 已移出 INFUSIONS
- 第 211 行：「INFUSIONS 的 if 條件（lv5 需要 3 pick 同元素）」— 舊規則殘留，現已廢棄

---

## 程式碼本身無誤

確認 `game.js` 邏輯正確：

| 邏輯位置 | 條件 | 正確性 |
|---------|------|-------|
| L379 `canLv6` | `elemPicks >= 3 && essence >= threshold` | ✅ Lv6 才需要 3 picks |
| L385-386 | `getAvailableThirdElems` + `avail3rd.length > 0 → return 5` | ✅ Lv5 不需要 3 picks |
| TRIPLE_TOWERS 所有 key | 三個**不同**元素（包含 'none'）| ✅ 無重複元素 key |
| PURE_TOWERS | 單一純屬，lv6 資料 | ✅ 正確對應 Lv6 |

---

## 步驟清單

| 步驟 | 檔案 | 內容 | 優先度 |
|-----|------|------|-------|
| step1 | `CLAUDE.md` | 修正升級路徑：5階→6階，加入 Lv5/Lv6 正確描述 | **必改** |
| step2 | `CLAUDE.md` | 修正關鍵結構的 INFUSIONS 條目 | **必改** |
| step3 | `EXPANSION_3TO6_CHECKLIST.md` | 修正第 181/211 行舊說明（非必要，為規劃文件） | 可選 |

---

## 執行順序

1. `execute fix-lv5-puredoc/step1.md` — 修正 CLAUDE.md 升級路徑
2. `execute fix-lv5-puredoc/step2.md` — 修正 CLAUDE.md 關鍵結構
