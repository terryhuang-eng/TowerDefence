# Step 3：修正 Skill Editor 描述顯示 + 評分 cap 說明

## 目標
1. **3a**：技能 row 的描述改用 `getSkillDesc()` 渲染（顯示實際數值，不顯示變數名）
2. **3b**：評分基準面板的 `cap` 欄位加上語意說明

只改 `skill-editor.html`，不改 `js/skills.js`。

---

## 3a：技能描述改用渲染文字

### 問題位置
`skill-editor.html` 內渲染每個技能 row 的地方，`.sk-desc` 目前直接取 `SKILL_DEFS[type].desc`。

### 找法
在 `skill-editor.html` 的 `<script>` 區塊 Grep `sk-desc`，找到 innerHTML 組裝的地方。

### 修改方式
找到類似這樣的程式碼：
```js
const desc = SKILL_DEFS[sk.type]?.desc ?? '';
// 或 skillDef.desc
```

改為：
```js
const desc = (typeof getSkillDesc === 'function')
  ? getSkillDesc(sk.type, sk.params)
  : (SKILL_DEFS[sk.type]?.desc ?? '');
```

`getSkillDesc` 已定義在 `js/skills.js`（line ~100+），會渲染如：
- 原本：`每次攻擊疊 1 層，每層減速 perStack`
- 修改後：`❄️ 冰冷：每攻擊 -50% 速度（最多 40 層）`

### 注意
若 `sk.params` 還未設定（新加的技能 row）要做 fallback，避免渲染爆錯：
```js
const desc = (typeof getSkillDesc === 'function' && sk.params)
  ? getSkillDesc(sk.type, sk.params)
  : (SKILL_DEFS[sk.type]?.desc ?? '');
```

---

## 3b：評分基準面板 cap 加說明

### 問題位置
`skill-editor.html` 的 `renderScoreDefsPanel`（或類似函數），渲染 `#score-defs-body`。

### 目前顯示格式
每列大約是：`[技能名] [base輸入框] ([primary]/[ref])`
chill 那列顯示：`冰冷 | 30 | (cap/40)`

### 修改方式
在渲染 scorePrimary 標籤時，對 `chill` 的 `cap` 加上括號說明：

**方法一（最簡單）**：直接在 chill 列的 label 後加 title tooltip
找到渲染 `score-def-ref` 的地方，對 chill 特殊處理：
```js
const refLabel = def.scorePrimary === 'cap' && key === 'chill'
  ? `cap（層數上限）/ ${def.scoreRef}`
  : def.scorePrimary
    ? `${def.scorePrimary} / ${def.scoreRef}`
    : '—';
```

**方法二（通用）**：在 SKILL_DEFS 後加一個 paramDescs 對照表（改 skills.js）
```js
// 在 skills.js 最底部加：
const PARAM_DESCS = {
  chill: { cap: '層數上限', perStack: '每層減速%' },
  freeze: { threshold: '觸發層數', dur: '定身秒數' },
  // ...
};
```
然後 skill-editor.html 渲染時查這張表。

**推薦**：方法一（只改 skill-editor.html 一個地方），避免跨檔案改動。

---

## 影響範圍
- `skill-editor.html` 共 2 處：
  1. renderSkillRow（或等效函數）的 `.sk-desc` 取值邏輯
  2. renderScoreDefsPanel（或等效函數）的 chill cap label

### 找目標行的方式
```
Grep: "sk-desc"         → 找 3a 的位置
Grep: "score-defs-body" → 找 3b 的位置（或 "scoreRef"）
```
