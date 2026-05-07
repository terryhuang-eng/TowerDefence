# 塔防 3→6 元素擴展：快速摘要

**編製日期**：2026-04-25

---

## 核心發現

### 好消息
✅ **無硬編碼 3 元素假設** — 除了一個地方外，所有邏輯都透過 `ELEM_KEYS` 和 `CONFIG.elemAdv` 動態查詢，天生支援多元素

### 必改單點
❌ **game.js 行 16**：elemPicks 初始化
```javascript
// 舊 — 硬編碼
this.elemPicks = { fire: 0, water: 0, wind: 0 };

// 新 — 動態（推薦）
this.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
```

---

## 改動工作量估計

| 檔案 | 工作 | 預估時間 | 難度 |
|------|------|---------|------|
| js/towers.js | 新增 ELEM 定義 | 10 分 | 簡單 |
| js/towers.js | 新增 3 種 TOWERS | 20 分 | 簡單 |
| js/towers.js | 新增 27 個 INFUSIONS | 2-3 小時 | 中等 |
| js/towers.js | 新增 6 種 ELEM_BASE | 15 分 | 簡單 |
| js/config.js | 擴展 elemAdv 表 | 10 分 | 簡單 |
| js/game.js | elemPicks 初始化 | 5 分 | 簡單 |
| js/game.js | aiElemPicks 初始化 | 5 分 | 簡單 |
| js/waves.js | 更新怪物 elem | 15 分 | 簡單 |
| 其他檔案 | 檢查+測試 | 30 分 | 簡單 |
| **總計** | | **~4 小時** | |

**瓶頸**：INFUSIONS 的 27 個新分支的數值+技能設計

---

## 關鍵改動位置

```
js/config.js
  ├─ 行 21-26  elemAdv 相剋表 → 6×6 matrix
  └─ 無其他改動

js/towers.js
  ├─ 行 4-9    ELEM + ELEM_KEYS → 新增 earth/light/dark
  ├─ 行 35-63  TOWERS → 新增 3 種塔（earth/light/dark）
  ├─ 行 71-138 INFUSIONS → 新增 27 分支（6基底×6注入 - 9現存）
  └─ 行 144-163 ELEM_BASE → 新增 6 種（3元素×2基底）

js/game.js
  ├─ 行 16     elemPicks = { fire:0, water:0, wind:0 } → 動態初始化 ⚠️
  ├─ 行 ~1472  aiElemPicks 初始化 → 同樣動態改
  └─ 行 1206, 1997, 2005, 2118 — 相剋計算（無改✅）

js/waves.js
  └─ 視需要更新怪物 elem 欄位（保持 3-4 個元素活躍）

其他檔案
  └─ 無改動（所有 UI/邏輯都透過 ELEM_KEYS 迴圈）
```

---

## 相剋表設計（建議）

現狀三角：火→風→水→火

建議新方案：
```
三角 A（原有）：
  火 克 風 克 水 克 火

三角 B（新增）：
  聖 克 暗 克 土 克 聖

跨三角：（選擇弱化）
  火 被 土弱化 0.7
  水 被 聖弱化 0.7
  風 被 暗弱化 0.7
  ...
```

預設表（待驗證）：
```javascript
{
  fire:  { wind:1.3, earth:0.7, light:1.2, dark:0.8, water:0.7 },
  water: { fire:1.3, dark:0.7, earth:1.2, light:0.8, wind:0.7 },
  wind:  { water:1.3, light:0.7, dark:1.2, earth:0.8, fire:0.7 },
  earth: { wind:1.3, light:0.7, fire:1.2, dark:0.8, water:0.7 },
  light: { dark:1.3, earth:0.7, water:1.2, fire:0.8, wind:0.7 },
  dark:  { light:1.3, water:0.7, wind:1.2, earth:0.8, fire:0.7 }
}
```

---

## 新元素屬性建議

| 元素 | 名稱 | 圖示 | 顏色 | 類型 | 特性 |
|------|------|------|------|------|------|
| earth | 土 | ⛰️ | #a68642 | 防守 | 護甲成長、減傷 |
| light | 聖 | ✨ | #ffff00 | 治癒 | 回血、淨化、群體 |
| dark | 暗 | ⚫ | #8b2fa7 | 吸血 | 生命汲取、個體 |

---

## 開發流程

### 階段 1：資料結構（1-2 小時）
1. ✏️ js/towers.js：ELEM + ELEM_KEYS（驗證長度 = 6）
2. ✏️ js/towers.js：TOWERS 新增 3 種
3. ✏️ js/towers.js：ELEM_BASE 新增 6 種
4. ✏️ js/config.js：elemAdv 表 → 6×6
5. ✏️ js/game.js：elemPicks/aiElemPicks 動態初始化
6. 🧪 確認：遊戲啟動，元素選擇 UI 顯示 6 張卡片

### 階段 2：注入分支設計（2-3 小時）
7. ✏️ js/towers.js：INFUSIONS 新增 27 分支
   - 每分支：名稱、圖示、lv3/lv4 數值、技能組合
   - 參考：現有 9 分支的設計模式
8. 🧪 遊戲測試：升級至 Lv4，驗證所有分支可選

### 階段 3：怪物和平衡（30 分鐘）
9. ✏️ js/waves.js：視需要新增/修改怪物 elem
10. 🧪 通關測試：確認新元素怪物與塔相互克制

### 階段 4：驗證（30 分鐘）
11. 🧪 全檢查表驗收（見下方）

---

## 驗證檢查清單

開發完畢後執行：

```
🎮 遊戲啟動
  ☐ 進入遊戲無錯誤
  ☐ 元素選擇 UI 顯示 6 張卡片（而非 3 張）
  ☐ 每張卡片顯示正確的圖示、顏色、名稱

🏗️ 塔升級
  ☐ Lv2→Lv3 選元素：6 個元素都可選
  ☐ Lv3→Lv4 注入：每個基底元素都有 6 個注入選項
  ☐ Lv4→Lv5：純元素路線（6 種，每種色彩一致）

⚔️ 戰鬥數值
  ☐ 相剋計算正常（新元素間的 1.3x / 0.7x 應用）
  ☐ AI 隨機元素選擇：能選出 6 種中任意一種
  ☐ 隨機怪物抗性：random/random_dual 能從 6 元素中抽取

🌊 波次怪物
  ☐ 新怪物出現（elem 欄位設定正確）
  ☐ 波次預覽顯示弱點/抗性正確（新元素相剋計算）

💾 存檔相容
  ☐ 舊存檔讀入時，elemPicks 默認新元素為 0（無錯誤）
```

---

## 常見陷阱

1. **忘記改 game.js 行 16** → elemPicks 不包含新元素 → 選擇 crash
2. **INFUSIONS 結構不完整** → 升級至 Lv4 時缺少注入選項
3. **ELEM_BASE 少於 6 種** → ELEM_KEYS 迴圈時陣列不完整
4. **elemAdv 查表 crash** → 新元素未在表中定義
5. **難度倍率** → CONFIG.difficulty 無需改，對所有元素等效

---

## 檔案存放位置

詳細改動清單：
📄 `/tower-defense-prototype/EXPANSION_3TO6_CHECKLIST.md`（本完整規劃文件）

---

**規劃狀態**：✅ 完成  
**實施狀態**：⏳ 待開始  
**預計完成**：～4 小時（含設計 INFUSIONS）
