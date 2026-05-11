# Step 3：towers.js — 移除所有 hpPct 的 ,cap:120

## 目標
移除 `js/towers.js` 中所有 `makeSkill('hpPct',...)` 裡的 `,cap:120`（共 12 處）。

## 安全性確認

- `cap:120` 在 towers.js 中**只出現在 hpPct 的 params 裡**
- `ramp` 的 cap 值為小數（0.3 / 0.5 / 0.8 / 2 等），不是 120，不會被誤刪
- `replace_all: true` 對 `,cap:120}` → `}` 可安全執行

## 具體修改

**單一 Edit，replace_all: true**：

old_string：`,cap:120}`
new_string：`}`

替換後各 hpPct makeSkill 範例：
```js
// 前
makeSkill('hpPct',{pct:0.03,every:3,cd:1,cap:120})
makeSkill('hpPct',{pct:0.04,every:2,cd:0,cap:120})

// 後
makeSkill('hpPct',{pct:0.03,every:3,cd:1})
makeSkill('hpPct',{pct:0.04,every:2,cd:0})
```

## 驗收
- `Grep ",cap:120"` in towers.js → 應回傳 0 筆
- `Grep "hpPct"` in towers.js → 確認所有 hpPct makeSkill 仍存在（只是少了 cap 參數）
- `Grep "cap:0\." in towers.js` → ramp 等其他 cap 應不受影響
