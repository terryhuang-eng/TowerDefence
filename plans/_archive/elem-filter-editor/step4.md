# Step 4：game.js AI 選元素過濾 + 波次隨機抗性過濾

## 目標檔案
`js/game.js`

## 影響範圍
- AI 選元素邏輯：4 個位置的 `ELEM_KEYS` → `getActiveKeys()`
- 波次隨機抗性：1 個位置的 `ELEM_KEYS.filter(...)` → `getActiveKeys().filter(...)`

---

## 修改說明

### A. AI 基礎元素（L1686）

**定位**：`if (this.wave >= 3 && !this.aiBaseElem)` 區塊

修改前：
```javascript
this.aiBaseElem = ELEM_KEYS[Math.floor(Math.random() * ELEM_KEYS.length)];
```
修改後：
```javascript
const _ak = getActiveKeys();
this.aiBaseElem = _ak[Math.floor(Math.random() * _ak.length)];
```

### B. AI 第2元素 — others 清單（L1695）

**定位**：`if (this.wave >= 6 && this.getTotalAiPicks() < 2)` 內的 `const others = ...`

修改前：
```javascript
const others = ELEM_KEYS.filter(e => e !== this.aiBaseElem);
```
修改後：
```javascript
const others = getActiveKeys().filter(e => e !== this.aiBaseElem);
```

### C. AI 注入元素判斷（L1701）

**定位**：`if (!this.aiInfuseElem)` 內的 `const avail = ...`

修改前：
```javascript
const avail = ELEM_KEYS.filter(e => e !== this.aiBaseElem ? (this.aiElemPicks[e] || 0) >= 1 : (this.aiElemPicks[e] || 0) >= 2);
```
修改後：
```javascript
const avail = getActiveKeys().filter(e => e !== this.aiBaseElem ? (this.aiElemPicks[e] || 0) >= 1 : (this.aiElemPicks[e] || 0) >= 2);
```

### D. AI 第3元素（L1707）

**定位**：`if (this.wave >= 9 && this.getTotalAiPicks() < 3)` 內的 `const others3 = ...`

修改前：
```javascript
const others3 = ELEM_KEYS.filter(e => e !== this.aiBaseElem && e !== this.aiInfuseElem);
```
修改後：
```javascript
const others3 = getActiveKeys().filter(e => e !== this.aiBaseElem && e !== this.aiInfuseElem);
```

### E. 波次隨機抗性（L1413）

**定位**：`showWavePreview()` 或波次抗性計算內的 `const noResist = ELEM_KEYS.filter(...)`

先 Grep 確認行號：`noResist` 關鍵字在 game.js 的位置

修改前：
```javascript
const noResist = ELEM_KEYS.filter(e => !resistElems.includes(e));
```
修改後：
```javascript
const noResist = getActiveKeys().filter(e => !resistElems.includes(e));
```

> **原因**：若怪物出現「雷抗」但玩家只有火/水/風，這個抗性對玩家毫無意義，也無法透過元素剋制來處理。限制為 activeElems 才能讓抗性機制有意義。

---

## 邊界情況

### AI 第3元素選不到
若 `activeElems` 只有 2 個元素（如火/水），`others3` 為空陣列，`pick3` 會 fallback `this.aiBaseElem`。
這是合理行為：只有 2 元素時 AI 無法走三屬路線（TRIPLE 需要 3 個不同元素組合）。
`if (TRIPLE_TOWERS[key]) this.aiThirdElem = pick3;` 這個條件會自然保護（fire_fire_fire 不存在）。

### 只有 1 個啟用元素
`getActiveKeys()` 只回傳 1 個元素：AI 只能走純屬路線（Lv4 同元素注入 → Lv5/Lv6 純屬）。
玩家元素選卡只有 1 個選項（強制選該元素）。
功能正常，但遊戲體驗近乎固定路線——屬於使用者自選配置的結果，無需特別處理。

---

## 驗證
- config.js 設 `activeElems: ['fire', 'water', 'wind']`，開啟 PvE 遊戲
- 打到 W3 後確認 AI 基礎元素只有 fire/water/wind（可加 `console.log(this.aiBaseElem)` 暫時確認）
- W6 後確認 AI 第2元素同樣在 fire/water/wind 範圍內
- 波次 resist: 'random' 的怪物，只出現 fire/water/wind 的抗性（暫時 console.log 波次抗性確認）
- config.js 還原 `activeElems: null`：遊戲行為與修改前完全一致
