# Step 5：skills.js — ramp 切換衰減參數 + frostbite 標記廢棄

## 目標
1. 為 `ramp` 技能加入 `switchLoss` 參數（切換目標時扣除的 ramp 層數，非歸零）
2. 將 `frostbite` 標記為 deprecated，加入說明避免誤用

## 改動位置
`js/skills.js`

---

## 改動一：ramp 加入 switchLoss 參數

### 定位
Grep `ramp.*越攻越快` 找到 ramp 的 SKILL_DEFS 定義（約第 48 行）。

### 原本
```js
ramp: { category: 'tower', group: 'buff', name: '越攻越快',
  defaults: {perHit:0.03, cap:0.5},
  desc: '連攻同目標攻速 +perHit，上限 +cap', ... },
```

### 替換為
```js
ramp: { category: 'tower', group: 'buff', name: '越攻越快',
  defaults: {perHit:0.03, cap:0.5, switchLoss:3},
  desc: '連攻同目標攻速 +perHit，上限 +cap；切換目標時扣 switchLoss 層（非歸零）',
  scoreBase: 8, scorePrimary: 'cap', scoreRef: 0.5 },
```

**參數說明：**
| 參數 | 預設值 | 意義 |
|------|-------|------|
| perHit | 0.03 | 每次攻擊同一目標 +0.03 攻速加成 |
| cap | 0.5 | 最高 +0.5 攻速加成（+50%）|
| switchLoss | 3 | 切換目標時扣除的層數（以 perHit 為單位） |

**switchLoss 換算說明：**
```
切換後 _rampBonus = max(0, _rampBonus - switchLoss × perHit)
例：ramp 疊到 0.3（10 層），切換目標
  → 扣除 3 × 0.03 = 0.09
  → 剩餘 0.3 - 0.09 = 0.21（保留了 70%）
```

---

## 改動二：frostbite 標記廢棄

### 定位
Grep `frostbite.*凍傷` 找到 frostbite 定義（約第 34 行）。

### 修改 desc 加入廢棄標記
```js
frostbite: { category: 'tower', group: 'damage', name: '凍傷',
  defaults: {dmgPct:0.02, dur:3},
  desc: '⚠️ [廢棄] 功能與 hpPct 高度重疊，不再分配給純屬塔。命中施加凍傷，每秒 dmgPct×maxHP 水系傷害，持續 dur 秒。',
  scoreBase: 30, scorePrimary: 'dmgPct', scoreRef: 0.02 },
```

**不刪除的原因：**
- 現有波次/敵人資料可能有殘留參照
- 標記廢棄後，skill-editor 和說明頁可用文字提示替代刪除

---

## 改動三：getSkillDesc 更新 ramp + frostbite case

### 定位
Grep `case 'ramp'` 找到 getSkillDesc 中的 ramp case。

### 替換 ramp case
```js
case 'ramp': return `⚡ 越攻越快：連攻同一目標每次 +${p.perHit} 攻速（上限 +${p.cap}）；切換目標扣 ${p.switchLoss} 層，不歸零`;
```

### 替換 frostbite case（若存在）
```js
case 'frostbite': return `⚠️ [廢棄] 凍傷：每秒 ${(p.dmgPct*100).toFixed(1)}% maxHP 水系傷害，持續 ${p.dur}s。不再用於純屬塔。`;
```

---

## 驗證方式
- skill-editor.html 確認 ramp 的參數列出 switchLoss 欄位
- frostbite 說明顯示「⚠️ [廢棄]」前綴
