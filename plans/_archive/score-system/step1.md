# Step 1：SKILL_DEFS 加入評分定義欄位

**目標**：在 `js/skills.js` 的每個技能定義加入 `scoreBase`、`scorePrimary`、`scoreRef`

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/js/skills.js`

---

## 欄位定義

| 欄位 | 型別 | 說明 |
|------|------|------|
| `scoreBase` | number | 在 reference 參數下的技能分數（設計師自行定義） |
| `scorePrimary` | string \| null | 用於線性縮放的主要參數名；null = 不縮放（固定 scoreBase） |
| `scoreRef` | number \| null | scorePrimary 的 reference 值；null = 不縮放 |

**縮放公式**：`computedScore = scoreBase × (params[scorePrimary] / scoreRef) × scoreWeight`
若 scorePrimary 為 null：`computedScore = scoreBase × scoreWeight`

---

## 具體修改

每個技能的 defaults 行後面加上評分三欄。
格式：`scoreBase: N, scorePrimary: 'param' | null, scoreRef: N | null`

### 塔：傷害類

```javascript
burn:       { ..., scoreBase: 35, scorePrimary: 'dot',       scoreRef: 0.30 },
ignite:     { ..., scoreBase: 15, scorePrimary: 'flat',      scoreRef: 0.20 },
detonate:   { ..., scoreBase: 25, scorePrimary: 'ratio',     scoreRef: 0.80 },
chain:      { ..., scoreBase: 30, scorePrimary: 'targets',   scoreRef: 2    },
execute:    { ..., scoreBase: 20, scorePrimary: null,        scoreRef: null  },
hpPct:      { ..., scoreBase: 40, scorePrimary: 'pct',       scoreRef: 0.03 },
lifedrain:  { ..., scoreBase: 10, scorePrimary: 'pct',       scoreRef: 0.15 },
```

### 塔：控制類

```javascript
chill:      { ..., scoreBase: 30, scorePrimary: 'cap',       scoreRef: 40   },
freeze:     { ..., scoreBase: 40, scorePrimary: 'dur',       scoreRef: 1.0  },
warp:       { ..., scoreBase: 35, scorePrimary: 'dur',       scoreRef: 1.0  },
knockback:  { ..., scoreBase: 15, scorePrimary: null,        scoreRef: null  },
```

### 塔：弱化類

```javascript
shred:         { ..., scoreBase: 25, scorePrimary: 'amt',    scoreRef: 0.05 },
vulnerability: { ..., scoreBase: 25, scorePrimary: 'amt',    scoreRef: 0.05 },
```

### 塔：增益類

```javascript
ramp:        { ..., scoreBase: 20, scorePrimary: 'cap',      scoreRef: 0.5  },
aura_dmg:    { ..., scoreBase: 40, scorePrimary: 'pct',      scoreRef: 0.15 },
aura_atkSpd: { ..., scoreBase: 35, scorePrimary: 'bonus',    scoreRef: 0.2  },
aura_range:  { ..., scoreBase: 20, scorePrimary: 'bonus',    scoreRef: 0.5  },
```

### 塔：特殊類

```javascript
multishot:   { ..., scoreBase: 30, scorePrimary: null,       scoreRef: null  },
pierce:      { ..., scoreBase: 20, scorePrimary: 'dmgUp',    scoreRef: 0.15 },
zone:        { ..., scoreBase: 25, scorePrimary: null,       scoreRef: null  },
killGold:    { ..., scoreBase:  5, scorePrimary: 'bonus',    scoreRef: 0.15 },
unstable:    { ..., scoreBase: -5, scorePrimary: null,       scoreRef: null  },
permaBuff:   { ..., scoreBase: 30, scorePrimary: null,       scoreRef: null  },
```

### 敵人/送兵技能（enemy 類不需要 scoreBase，填 0/null 即可）

```javascript
regen:        { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
armorStack:   { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
enrage:       { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
shield:       { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
charge:       { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
dodge:        { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
tenacity:     { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
blink:        { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
splitOnDeath: { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
antiElement:  { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
stealth:      { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
summon:       { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
phaseShift:   { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
fortify:      { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
resilient:    { ..., scoreBase: 0, scorePrimary: null, scoreRef: null },
```

---

## 定位方法

Grep: `burn:` → 找第一個技能定義行號
Read ±2 行確認 context
逐條 Edit（或分段 Read 後 Edit 每個 group）

---

## 影響範圍

只新增欄位，不改動現有欄位。skill-editor / game.js 讀取 SKILL_DEFS 的地方不受影響（不需要 scoreBase）。
