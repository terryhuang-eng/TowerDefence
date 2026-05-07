# Step 2：summon / phaseShift — 清除死代碼或補定義

## 目標

處理 game.js 中 `hasSkill(e, 'summon')` 和 `hasSkill(e, 'phaseShift')` 的孤立判斷。

## 現況

- `js/game.js` L2554：`if (hasSkill(e, 'summon')) { ... }` — 有召喚邏輯（每 8 秒生成小怪）
- `js/game.js` L2568：`if (hasSkill(e, 'phaseShift')) { ... }` — 有相位邏輯（phaseIdx）
- `js/skills.js` SKILL_DEFS：**沒有** summon 或 phaseShift 的定義
- 結果：`hasSkill` 永遠回傳 false → 死代碼

## 選項分析

| 選項 | 適合時機 |
|------|---------|
| A：清除 game.js 中的死代碼 | 確定近期不會實作 summon/phaseShift |
| B：補入 SKILL_DEFS + 實作參數 | 打算在某波怪物啟用這兩個 skill |

## 建議：選項 B（補定義）

summon 的 game.js 邏輯已存在，補定義成本低：

### 在 js/skills.js SKILL_DEFS 中加入（enemy 區塊）

```js
summon:     { category: 'enemy', group: 'passive', name: '召喚',   defaults: { cd: 8, count: 1, hpRatio: 0.3 }, desc: '每 cd 秒召喚 count 個小怪（HP ×hpRatio）' },
phaseShift: { category: 'enemy', group: 'passive', name: '相位偏移', defaults: { interval: 5, dmgReduce: 0.5 },   desc: '週期性切換相位（受傷 ×dmgReduce）' },
```

### 同步確認 game.js 邏輯讀取 params

- summon：`stSk.cd`、`stSk.count`、`stSk.hpRatio` 是否已正確讀取
- phaseShift：`phaseIdx` 的邏輯是否完整

## 依賴

- 可獨立執行
- step1 不影響本步驟
