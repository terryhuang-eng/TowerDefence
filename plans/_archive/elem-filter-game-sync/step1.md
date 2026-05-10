# Step 1：js/game.js — mkEnemy 隨機抗性改用 getActiveKeys()

## 目標檔案
`js/game.js`

## 影響範圍
- `mkEnemy()` 函數內 `resist === 'random'` 和 `resist === 'random_dual'` 兩個分支（L1857, L1860）

---

## 修改說明

**定位**：`mkEnemy()` 函數，`let resist = def.resist;` 之後（約 L1856）

修改前：
```javascript
if (resist === 'random') {
  const re = ELEM_KEYS[Math.floor(Math.random() * ELEM_KEYS.length)];
  resist = { [re]: 0.5 };
} else if (resist === 'random_dual') {
  const shuffled = [...ELEM_KEYS].sort(() => Math.random() - 0.5);
  resist = { [shuffled[0]]: 0.4, [shuffled[1]]: 0.4 };
}
```

修改後：
```javascript
if (resist === 'random') {
  const ak = getActiveKeys();
  const re = ak[Math.floor(Math.random() * ak.length)];
  resist = { [re]: 0.5 };
} else if (resist === 'random_dual') {
  const ak = getActiveKeys();
  const shuffled = [...ak].sort(() => Math.random() - 0.5);
  resist = { [shuffled[0]]: 0.4, [shuffled[1]]: 0.4 };
}
```

> `random_dual` 若 `ak.length < 2`（只啟用 1 元素），`shuffled[1]` 為 `undefined` → `resist` 的 key 為 `undefined`，實際不影響 doDmg（只讀有效 key）。屬於極端配置，無需特別處理。

---

## 驗證
- config.js `activeElems: ['fire','water','wind']`，含 `resist: 'random'` 的波次 → 怪物抗性只出現 fire/water/wind
- `resist: 'random_dual'` → 兩個抗性元素都在 activeElems 範圍內
- `activeElems: null`（全開）→ 行為與修改前完全一致
