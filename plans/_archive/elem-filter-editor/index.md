# 計畫：元素過濾器 — Editor + Game 完整同步

## 目標
1. **Skill Editor**：「設定」頁新增元素開關 + 相剋矩陣調整；塔列表自動過濾至啟用元素組合
2. **遊戲本體**：元素選卡UI、AI選元素邏輯、隨機抗性生成，全部跟隨 `CONFIG.activeElems`
3. **同步機制**：skill-editor 匯出 `CONFIG.activeElems` → config.js → 遊戲自動讀取

原始 const（ELEM_BASE / INFUSIONS / TRIPLE_TOWERS / PURE_TOWERS）**不觸碰**，所有已儲存技能/數值**保留**。

---

## 架構設計

### 資料流向
```
skill-editor.html
  └── [設定頁] 元素開關 (checkbox × 6)
        │
        └── 匯出 CONFIG.activeElems = ['fire','water','wind']
              │
              ▼
         js/config.js  (CONFIG.activeElems)
              │
              ├── js/game.js getActiveKeys() helper
              │     ├── 元素選卡 UI (W3/W6/W9/W12)
              │     ├── AI 選元素邏輯
              │     └── 波次隨機抗性生成
              └── skill-editor.html (Editor 過濾塔列表)
```

### 相容性原則
- `CONFIG.activeElems` 未定義時 fallback `ELEM_KEYS`（現有遊戲不受影響）
- 所有改動以「wrap 過濾」方式進行，不移除任何現有資料

---

## 遊戲端觸點分析

### 需要修改的 game.js 位置

| 位置 | 行號 | 現狀 | 問題 |
|------|------|------|------|
| 元素選卡 UI | L1329 | `for (const ek of ELEM_KEYS)` | 玩家能選到非啟用元素 |
| AI 基礎元素 | L1686 | `ELEM_KEYS[Math.random...]` | AI 可選到非啟用元素 |
| AI 第2元素 | L1695 | `ELEM_KEYS.filter(e => e !== ...)` | 同上 |
| AI 第3元素 | L1707 | `ELEM_KEYS.filter(e => e !== ...)` | 同上 |
| AI 注入判斷 | L1701 | `ELEM_KEYS.filter(e => ...)` | 同上 |
| 波次隨機抗性 | L1413 | `ELEM_KEYS.filter(...)` | 怪物可出現非啟用元素抗性，玩家無法反制 |

### 自動限縮（不需改動）

| 位置 | 行號 | 原因 |
|------|------|------|
| `getAvailableElements()` | L468 | `elemPicks[e] > 0`，未被選過的元素自然為 0 |
| `getAvailableInjects()` | L431 | 同上，玩家沒有 picks 就不出現 |
| `getAvailableThirdElems()` | L415 | 同上 |

---

## 注意事項

### ⚠️ 1. 相剋矩陣的覆蓋問題
目前的 `CONFIG.elemAdv` 是五角環（火→水→土→風→雷→火）。
若只啟用火/水/風三元素，相剋變成線性（火→水、水→土 無效、風→雷 無效），可能出現某些元素塔「無剋制對象」。
**解法**：skill-editor 的 elemAdv 矩陣已可編輯，使用者需搭配調整相剋關係（如火克水、水克風、風克火形成三角）。editor 可加入提示文字提醒。

### ⚠️ 2. PVP 多人同步
PVP 各玩家各自載入 config.js，若配置不一致會造成不同選項。
**MVP 暫不處理**：PVP 場景假設所有玩家使用相同 config.js。進階方案是 Host 在 waveStart 時廣播 activeElems，但超出本計畫範圍。

### ⚠️ 3. 波次怪物的 `resist: 'random'` / `'random_dual'`
L1413 的隨機抗性生成目前從整個 ELEM_KEYS 選：
```javascript
const noResist = ELEM_KEYS.filter(e => !resistElems.includes(e));
```
若啟用元素為火/水/風，但怪物卻出現「雷抗」，玩家沒有雷元素塔可反制，這個抗性毫無意義（甚至有利玩家）。
**需修改**：隨機抗性從 `getActiveKeys()` 中選取。

### ⚠️ 4. none 元素的特殊性
`none`（虛空）在 `CONFIG.elemAdv` 中沒有任何剋制關係，INFUSIONS['none'][x] 需確認全部存在。
若啟用 none，確認 INFUSIONS 中 none×activeElems 組合有定義（現行 const 已定義 6×6=36 個，包含 none）。✅ 無問題。

### ⚠️ 5. ELEM_WAVES 與 pick 次數不變
`ELEM_WAVES = [3, 6, 9, 12]`（4 次選卡）的**次數**不受元素數量影響，只是每次的選項縮小。這是預期行為（3 元素時仍選 4 次，只是每次從 3 個選）。無需修改。

### ℹ️ 6. 技能與效果完全不需修改
INFUSIONS/TRIPLE 的技能（burn, freeze 等）是資料層，不依賴元素列表長度。只要塔能升到對應等級，技能就正常運作。✅ 零改動。

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | skill-editor.html | activeElems 資料層 + 設定頁元素開關 UI + elemAdv 矩陣縮小 + 匯出支援 |
| step2.md | skill-editor.html | 塔列表過濾（renderList + getTowerByFlatIdx 同步） |
| step3.md | js/config.js + js/game.js | config 加 activeElems 預設值；game 加 getActiveKeys() helper；元素選卡 UI 過濾 |
| step4.md | js/game.js | AI 選元素邏輯過濾 + 波次隨機抗性過濾 |

---

## 驗證清單
- [ ] Editor 全選：塔列表與現在一致；匯出 activeElems 包含全部 6 元素
- [ ] Editor 只選火水風：Lv3 剩 6、Lv4 剩 9、TRIPLE 只剩 fire_water_wind、PURE 剩 3
- [ ] 匯出後開啟遊戲：元素選卡只顯示火水風
- [ ] AI 只選火水風元素塔（log 確認）
- [ ] 波次隨機抗性只出現火水風（log 確認）
- [ ] 不改 config.js（未加 activeElems）：遊戲行為與現在完全相同（向後相容）
- [ ] PVP：暫無需測試（已知限制）
