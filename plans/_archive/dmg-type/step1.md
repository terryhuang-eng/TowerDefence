# Step 1：js/towers.js — 加入 dmgType 欄位

## 目標

在 `ELEM_BASE` 各塔定義中加入可選的 `dmgType` 欄位。
預設為 `null`（不寫或明確填 null），有需要時才指定元素字串。

## 影響範圍

**檔案：js/towers.js**

改動位置：`ELEM_BASE` 的每一筆塔定義（共 12 筆：6元素 × 2基底）

---

## 修改說明

### 目前格式（以火弓手為例）

```js
arrow: { name: '焰弓手', icon: '🏹🔥', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0, cost: 130,
  desc: '灼燒射手（burn+ignite+detonate）',
  skills: [makeSkill('burn'), makeSkill('ignite'), makeSkill('detonate')] },
```

### 修改後格式

```js
arrow: { name: '焰弓手', icon: '🏹🔥', damage: 45, atkSpd: 1.4, range: 3.5, aoe: 0, cost: 130,
  dmgType: null,  // null = 用塔基底元素（fire）；可改為 'water' 等
  desc: '灼燒射手（burn+ignite+detonate）',
  skills: [makeSkill('burn'), makeSkill('ignite'), makeSkill('detonate')] },
```

### 全部 12 筆

以下所有塔都加 `dmgType: null`（預設，維持現有行為）：

| 塔 | 目前 elem | dmgType 預設 | 備註 |
|----|-----------|-------------|------|
| 焰弓手 🏹🔥 | fire | null | |
| 焰砲台 💣🔥 | fire | null | |
| 冰弓手 🏹💧 | water | null | |
| 潮砲台 💣💧 | water | null | |
| 岩射手 🏹⛰️ | earth | null | |
| 岩砲台 💣⛰️ | earth | null | |
| 風弓手 🏹🌪️ | wind | null | |
| 風砲台 💣🌪️ | wind | null | |
| 雷弓手 🏹⚡ | thunder | null | |
| 雷砲台 💣⚡ | thunder | null | |
| 虛空弓 🏹⬜ | none | null | |
| 虛空砲 💣⬜ | none | null | |

---

## 範圍限制

- 本步驟**只改 ELEM_BASE**（Lv3 基底塔）
- INFUSIONS / TRIPLE_TOWERS / PURE_TOWERS / BASIC_TOWERS 暫不加（如有需要可另立步驟）
- 不改任何 game.js 邏輯，此步驟純資料定義
