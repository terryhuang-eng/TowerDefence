# fix-sandbox-none-elem

## 問題分析

**Sandbox 下 LV4 升級選項缺少「無屬性」注入**

### 根源

`index.html` sandbox 面板的「元素解鎖」區塊只有 5 個按鈕（🔥💧🌪️⛰️⚡），**缺少 `none`（⬜）按鈕**。

兩個缺失點：

| 位置 | 問題 |
|------|------|
| Line 534-539：`sb-elem-btn` HTML | 無 `data-elem="none"` 按鈕 |
| Line 627：`sbUnlockAll` handler | 陣列 `['fire','water','wind','earth','thunder']` 缺 `'none'` |

### 影響範圍

`getAvailableInjects(baseElem)` 在 game.js:433 迭代 `ELEM_KEYS`，對非同元素要求 `elemPicks[e] >= 1`。因為 sandbox 永遠不會設定 `elemPicks['none']`，所有以下塔型都無法在 sandbox 測試：

- LV4：混沌焰、虛空泉、重力塔、相位塔、賞金塔、虛空（6 種）
- LV5（含 none 的三屬）：逆風塔、逆雷塔、逆焰塔、逆潮塔、逆岩塔、燎原塔、迷霧塔、吞噬塔、隕石塔、混沌塔（10 種）
- LV6：混沌核

## 步驟清單

- [x] Step 1：修復 sandbox 面板（唯一步驟）

## 執行順序

只有 1 步，直接執行 step1.md。
