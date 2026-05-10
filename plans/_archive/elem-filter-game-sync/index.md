# 計畫：activeElems 遊戲端完整同步（補漏）

## 問題背景

elem-filter-editor 計畫（已封存）處理了大部分同步，但有兩個位置遺漏。

---

## 升級塔種類：已正確，不需修改

升級面板的過濾是透過 **elemPicks 串聯**自動完成：

```
activeElems → pick UI (getActiveKeys()) → elemPicks 只有 activeElems 會有值
                                             ↓
                                    getAvailableElements()   → Lv3 元素選擇
                                    getAvailableInjects()    → Lv4 注入選擇
                                    getAvailableThirdElems() → Lv5 第三元素
```

三個函數都對 `ELEM_KEYS` 迭代但過濾 `elemPicks[e] > 0`，因為 player 只能 pick activeElems，非啟用元素的 picks 永遠為 0 → 自然不出現。**不需額外修改。**

---

## 兩個遺漏位置

### 問題 1：mkEnemy 隨機抗性（🔴 功能性 bug）

**位置**：`js/game.js` L1857, L1860（`mkEnemy()` 函數）

```javascript
// L1856-1861（現行）
if (resist === 'random') {
  const re = ELEM_KEYS[Math.floor(Math.random() * ELEM_KEYS.length)];
  resist = { [re]: 0.5 };
} else if (resist === 'random_dual') {
  const shuffled = [...ELEM_KEYS].sort(() => Math.random() - 0.5);
  resist = { [shuffled[0]]: 0.4, [shuffled[1]]: 0.4 };
}
```

**問題**：elem-filter-editor/step4 只修正了 `showWavePreview()` 的顯示用 `noResist`（L1424），未修正 `mkEnemy()` 的**實際執行時**隨機抗性生成。

若 `activeElems = ['fire','water','wind']`，wave 的 `resist: 'random'` 仍可能分配 earth/thunder/none 抗性 → 玩家無法反制，實質上是白白降低怪物難度（等於沒有有效抗性）。

### 問題 2：元素持有顯示面板（🟡 視覺問題）

**位置**：`js/game.js` L600

```javascript
const elemsHtml = ELEM_KEYS.map(e => { ... });  // 顯示全部 6 元素
```

`activeElems = ['fire','water','wind']` 時，面板仍顯示「⛰️ 土 ×0 / ⚡ 雷 ×0 / ⬜ 無 ×0」，視覺雜訊，但不影響功能。

---

## 步驟清單

| 步驟 | 檔案 | 內容 | 優先度 |
|------|------|------|--------|
| step1.md | js/game.js | mkEnemy random/random_dual 改用 getActiveKeys() | 🔴 必做 |
| step2.md | js/game.js | 元素持有顯示面板只顯示 activeElems | 🟡 選做 |

## 驗證清單
- [ ] config.js `activeElems: ['fire','water','wind']`，含 `resist: 'random'` 的波次 → 怪物只出現火/水/風抗性
- [ ] `resist: 'random_dual'` 同上 → 兩個抗性都在 activeElems 範圍內
- [ ] 元素持有面板只顯示啟用元素，非啟用元素不出現
