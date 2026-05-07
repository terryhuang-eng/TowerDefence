# Plan Index: complete-triple-coverage

## 問題摘要

autotest.js C 組（三屬策略）只有 5 種，但 TRIPLE_TOWERS 共 20 種 Lv5 三屬塔，缺少 15 種。

| 分類 | TRIPLE_TOWERS 總數 | C 組已有 | 缺少 |
|------|-------------------|---------|------|
| 非無 ×10（不含 none 的三元素組合）| 10 | 5 | **5** |
| 反克制 ×5（none + X + 克X）| 5 | 0 | **5** |
| 非相鄰無 ×5（none + 非相鄰兩元素）| 5 | 0 | **5** |
| **合計** | **20** | **5** | **15** |

## 目前 C 組已覆蓋（5 種）

| ID | 塔名 | elemPicks |
|----|------|-----------|
| triple_earth_fire_water | 溫泉塔 ♨️ | ['fire', 'water', 'earth', 'fire'] |
| triple_fire_water_wind | 颶風塔 🌀 | ['fire', 'water', 'wind', 'fire'] |
| triple_earth_thunder_wind | 磁力塔 🧲 | ['earth', 'thunder', 'wind', 'earth'] |
| triple_water_thunder_wind | 暴風塔 ⛈️ | ['water', 'thunder', 'wind', 'water'] |
| triple_earth_fire_thunder | 火山塔 🌋 | ['earth', 'fire', 'thunder', 'earth'] |

## 步驟清單

| Step | 檔案 | 內容 | 風險 |
|------|------|------|------|
| [step1](step1.md) | `autotest.js` | 新增 15 種缺失的 C 組三屬策略 | 低 |

## 執行順序

Step 1（單步，全部在 autotest.js STRATEGIES 物件的 C 組段落新增）

## 驗證目標
- C 組策略：5 個 → 20 個
- 所有 20 種 TRIPLE_TOWERS 均有對應測試策略
- 含 none 的 10 種三屬塔（逆系列 + 非相鄰無系列）首次可被測試
