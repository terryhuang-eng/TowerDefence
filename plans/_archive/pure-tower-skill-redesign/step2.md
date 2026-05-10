# Step 2：skills.js — 新增 wealthScale + interest 技能定義

## 目標
在 `js/skills.js` 的 SKILL_DEFS 加入兩個新技能，所有參數以 `defaults` 常數形式定義，可直接調整。

## 改動位置
`js/skills.js`

---

## 1. SKILL_DEFS 新增兩個技能

### 定位
Grep `permaBuff` 找到最後一個 special 技能（約第 60 行），在其後加入：

```js
  wealthScale : { category: 'tower', group: 'special', name: '財富積累', defaults: {divisor:20, cap:50},
    desc: '持有每 divisor g = +1 傷害，上限 +cap（即時讀取，花錢則下降）',
    scoreBase: 0, scorePrimary: null, scoreRef: null },
  interest    : { category: 'tower', group: 'special', name: '利息',     defaults: {rate:0.05, cap:40},
    desc: '每波結算時依持有金幣給予 rate×100% 金幣，上限 cap g（直接加金，非永久收入）',
    scoreBase: 0, scorePrimary: null, scoreRef: null },
```

**參數說明（全部可調）：**
| 技能 | 參數 | 預設值 | 意義 |
|------|------|-------|------|
| wealthScale | divisor | 20 | 每幾金幣換 +1 傷害 |
| wealthScale | cap | 50 | 最多加多少傷害 |
| interest | rate | 0.05 | 利率（5%）|
| interest | cap | 40 | 每波最多拿幾金幣 |

---

## 2. getSkillDesc 加入兩個 case

### 定位
Grep `case 'permaBuff'` 找到 getSkillDesc switch 的末尾，在其後加入：

```js
    case 'wealthScale': return `💰 財富積累：持有每 ${p.divisor}g = +1 傷害（上限 +${p.cap}），花錢後傷害即時下降`;
    case 'interest':    return `📈 利息：每波結算時獲得持有金幣 × ${(p.rate*100).toFixed(0)}%（上限 ${p.cap}g，直接加金）`;
```

---

## 3. getSkillBrief 加入兩個 case

### 定位
Grep `case 'permaBuff'` 找到 getSkillBrief switch 的對應位置，加入：

```js
    case 'wealthScale': return `💰 財富積累`;
    case 'interest':    return `📈 利息`;
```

---

## 驗證方式
- 開啟遊戲，在 skill-editor.html 確認兩個技能出現在 special 群組
- 確認 desc 顯示正常（含插值參數）
