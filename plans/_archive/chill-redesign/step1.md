# Step 1：skills.js — 全域常數 + SKILL_DEFS.chill 改參數

## 目標
1. GLOBAL_CAPS 新增 `chillPerStack` 和 `chillMaxStacks`
2. SKILL_DEFS.chill 的 defaults / scorePrimary / scoreRef 改為對應新設計

只改 `js/skills.js`，共 2 處。

---

## 修改一：GLOBAL_CAPS 新增冰冷全域值

**位置**：`js/skills.js` line 6，`const GLOBAL_CAPS = {` 區塊內

**現況**：
```js
const GLOBAL_CAPS = {
  slowPct: 0.75,  // 減速上限 75%
  ...
};
```

**改為**（在 `slowPct` 後插入兩行）：
```js
const GLOBAL_CAPS = {
  slowPct: 0.75,      // 減速上限 75%
  chillPerStack: 0.02, // 每層冰冷 -2% 速度（全域固定）
  chillMaxStacks: 38,  // = ceil(slowPct / chillPerStack)，達上限需要的層數
  ...
};
```

---

## 修改二：SKILL_DEFS.chill 換參數

**位置**：`js/skills.js` line 30

**現況**：
```js
chill : { category: 'tower', group: 'control', name: '冰冷', defaults: {perStack:0.02,cap:40}, desc: '每次攻擊疊 1 層，每層減速 perStack', scoreBase: 30, scorePrimary: 'cap', scoreRef: 40 },
```

**改為**：
```js
chill : { category: 'tower', group: 'control', name: '冰冷', defaults: {stacksPerHit:1}, desc: '每次攻擊疊 stacksPerHit 層，全域每層 -2% 速度（上限 75%）', scoreBase: 5, scorePrimary: 'stacksPerHit', scoreRef: 1 },
```

**說明**：
- `stacksPerHit: 1`：預設每次 +1 層
- `scoreBase: 5`：1 層 = 5 分，與 scorePrimary/scoreRef=1 組合 → N層 = N×5 分
- `scorePrimary: 'stacksPerHit'`：評分直接反映疊層速度

---

## 預期結果
- 所有 chill 塔的 skill params 只有一個 `stacksPerHit` 數字
- 評分公式：`5 × (stacksPerHit / 1)` = `stacksPerHit × 5`
- 範例：1層=5分，5層=25分，10層=50分
