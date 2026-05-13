# mobile-ux-redesign — 手機操作體驗重新設計

## 根本問題

**手機的遊戲動作迴圈被 sidebar 抽屜打斷**

PC 上 sidebar 始終可見，玩家隨時看到金幣/送兵/升塔。
手機上 sidebar 收在右側抽屜，每次操作都要：
開漢堡選單 → 找目標 → 操作 → 關抽屜 → 回看地圖

遊戲動作迴圈 = 每波固定頻率：
```
pre_wave 階段：蓋塔 → 升塔 → 送兵 → Ready
wave 階段：（被動等待）
元素選擇：偶爾出現
```

最高頻操作：**Ready 按鈕（每波都要按）、送兵按鈕、升塔確認**
全部藏在 sidebar 裡 → 每波至少打開/關閉抽屜 2-3 次。

---

## 技術現況

| 問題 | 當前狀態 |
|------|---------|
| sidebar | `position:fixed; right:-100%` 抽屜，需漢堡開關 |
| Ready/波次按鈕 | 在 sidebar 的 `#wave-info` 區塊 |
| 送兵按鈕 | 在 sidebar 的 `#income-section` 區塊 |
| 升塔面板 | sidebar 的 `#upgrade-panel`（選塔後顯示） |
| touch 事件 | 無 `touchstart`/`touchend`，靠 click 模擬 |
| canvas | 手機填滿 100vh，`touch-action: manipulation`（無 300ms）|

> 注意：`touch-action: manipulation` 已消除大部分點擊延遲，touch 事件優先級較低。

---

## 核心設計方向：Canvas 底部常駐 HUD

**原則**：Canvas 佔滿螢幕（不縮減），在 Canvas 上疊加 position:absolute 的 HUD 元素，不需要打開 sidebar 就能完成所有核心操作。

Sidebar 改為補充資訊用途（戰報、說明、PVP 狀態），不影響主要流程。

---

## 三個方案對比

### 方案 A：最小改動（僅 Ready 按鈕釘住）
- 把 Ready/Start Wave 按鈕從 sidebar 移到 canvas overlay（右下角固定）
- **解決最高痛點**，工時最小
- 送兵/升塔仍需開 sidebar

### 方案 B：底部 HUD 條（推薦）
在 Canvas 底部加一條常駐 HUD overlay，包含：
- 左：金幣 + 波次資訊
- 中：送兵快捷按鈕（只顯示當前可負擔的兵種）
- 右：Ready 按鈕
- 選塔後 HUD 切換為升塔選項（不需開 sidebar）

**解決所有高頻操作**，sidebar 降為輔助資訊。

### 方案 C：完整重構（sidebar 改底部 Sheet）
把整個 sidebar 改為由下往上滑出的 bottom sheet，更符合手機操作習慣（大拇指可達）。工時最大。

---

## 推薦：方案 B — 底部 HUD 條

### 視覺佈局（手機直向）
```
┌────────────────────────────┐
│  [info-bar: HP/Gold/Wave]  │  ← 現有，保留
│                            │
│       Canvas 地圖           │
│       (遊戲主體)            │
│                            │
│                            │
├────────────────────────────┤
│  💰230  ⚔️1  ⚔️2  💀1  [READY] │  ← 新增底部 HUD
└────────────────────────────┘
```

選塔後 HUD 切換：
```
├────────────────────────────┤
│  [升Lv2 +80g] [賣] [元素A] [元素B]  │  ← 升塔 HUD 模式
└────────────────────────────┘
```

### 設計細節

**送兵顯示規則**：
- 只顯示 quota > 0 的兵種
- 金幣不足的顯示灰色（可點但扣不了就不處理）
- 已排隊的顯示計數角標

**Ready 按鈕**：
- pre_wave 狀態：常亮，脈動動畫（現有樣式）
- wave 中：顯示剩餘怪物數 / 進度條
- PVP：顯示「已 Ready」狀態

**升塔 HUD**：
- 點塔 → HUD 從送兵模式切換到升塔模式
- 點空白處 / 點 ✕ → 返回送兵模式
- 按鈕數量依升塔選項動態生成（Lv3 需選元素時展開選項）

**Sidebar 改為資訊輔助**（仍保留，不刪除）：
- 完整的戰報、說明、PVP 狀態
- 手機上主要流程已不需要開 sidebar

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 底部 HUD HTML + CSS 骨架 | ⬜ | 新增 #mobile-hud overlay，定義手機媒體查詢內的 HUD 樣式 | index.html |
| step2 | HUD 送兵模式：金幣 + 兵種按鈕 + Ready | ⬜ | buildMobileHud() 方法，在 rebuildSidebar() 後同步更新 | js/game.js |
| step3 | HUD 升塔模式：選塔切換 + 升塔/賣塔按鈕 | ⬜ | 點塔後 HUD 切換，升塔選項動態生成 | js/game.js |
| step4 | HUD 狀態同步：wave 中隱藏送兵、顯示進度 | ⬜ | state change 時更新 HUD 顯示邏輯 | js/game.js |

> Sidebar 維持原樣，不刪除任何現有功能。HUD 是疊加的新層。

---

## 不在此計畫範圍

- touch 事件（`touch-action: manipulation` 已夠用）
- sidebar 底部 sheet 改版（方案 C，工時過大）
- PC 版任何改動（PC sidebar 正常運作，不動）
- 橫向模式特別處理
