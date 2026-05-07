# Step 2 — 調整純水路線塔技能（深寒 + 冰河塔）

## 目標
- 移除 `深寒`（水水 Lv4）的 `shred`，加入 `frostbite`
- 冰河塔 Lv5、Lv6 加入 `frostbite`（各有差異化強度）
- 調整 `chill` 數值：緩速占比降低，殺傷貢獻轉移至凍傷

**範圍限制（依使用者確認）：僅動純水路線（深寒 + 冰河塔），其他水系注入塔不動。**

---

## 影響範圍
- `js/towers.js`：INFUSIONS.water.water（深寒）、PURE_TOWERS.water（冰河 Lv5/Lv6）

---

## 具體修改

### 深寒（水水 Lv4）— 搜尋 `'深寒'`

**現有：**
```javascript
water: {
  name: '深寒', icon: '💧💧', damage: 60, atkSpd: 1.1, aoe: 1.2,
  skills: [
    makeSkill('chill', {stacksPerHit: 10}),
    makeSkill('shred', {amt: 0.1, dur: 3, cap: 0.5})
  ]
}
```

**修改為：**
```javascript
water: {
  name: '深寒', icon: '💧💧', damage: 60, atkSpd: 1.1, aoe: 1.2,
  skills: [
    makeSkill('chill', {stacksPerHit: 8}),          // 10 → 8（緩速稍降，分數轉給凍傷）
    makeSkill('frostbite', {dmgPct: 0.025, dur: 4}) // 2.5% maxHP/s，4 秒
  ]
}
```

**改動說明：**
- 移除 `shred`：深寒不再替其他元素碎甲，失去「combo 放大器」定位
- chill 稍降（10→8）：緩速仍強但占比降低
- frostbite：每次 AOE 攻擊對命中的所有敵人施加凍傷，純水流主力傷害輸出

**深寒定位**：雙水 AOE 控場 + 凍傷殺傷，純水流的核心塔之一

---

### 冰河塔 Lv5 — 搜尋 `'冰河塔'` 的 `lv5`

**現有：**
```javascript
lv5: {
  damage: 70, atkSpd: 1.1, range: 4, aoe: 1.5, cost: 350, dmgType: 'water',
  skills: [makeSkill('chill', {stacksPerHit: 3})]
}
```

**修改為：**
```javascript
lv5: {
  damage: 70, atkSpd: 1.1, range: 4, aoe: 1.5, cost: 350, dmgType: 'water',
  skills: [
    makeSkill('chill', {stacksPerHit: 4}),            // 3 → 4
    makeSkill('frostbite', {dmgPct: 0.03, dur: 4})    // 3% maxHP/s，4 秒
  ]
}
```

---

### 冰河塔 Lv6 — 搜尋 `'冰河塔'` 的 `lv6`

**現有：**
```javascript
lv6: {
  damage: 100, atkSpd: 1.2, range: 4, aoe: 1.8, cost: 600, dmgType: 'water',
  skills: [
    makeSkill('chill', {stacksPerHit: 5}),
    makeSkill('freeze', {dur: 2, threshold: 50})
  ]
}
```

**修改為：**
```javascript
lv6: {
  damage: 100, atkSpd: 1.2, range: 4, aoe: 1.8, cost: 600, dmgType: 'water',
  skills: [
    makeSkill('chill', {stacksPerHit: 5}),
    makeSkill('freeze', {dur: 2, threshold: 50}),
    makeSkill('frostbite', {dmgPct: 0.04, dur: 5})   // 4% maxHP/s，5 秒
  ]
}
```

**Lv6 三技能協同：**
- chill → freeze：積累後觸發定身
- freeze 期間：chillStacks 不衰減 → 維持高緩速
- frostbite：獨立 DOT，freeze 定身期間凍傷持續累積（不因 freeze 中斷）
- 結果：Lv6 純水對 Boss 的殺傷路線 = 緩速拖延 + 持續凍傷

---

## 純水塔數值對比（修改後）

| 塔 | dmgPct/s | dur | 每次 AOE | 備注 |
|----|---------|-----|---------|------|
| 深寒 Lv4 | 2.5% maxHP | 4s | aoe 1.2 | 移除碎甲 |
| 冰河 Lv5 | 3.0% maxHP | 4s | aoe 1.5 | — |
| 冰河 Lv6 | 4.0% maxHP | 5s | aoe 1.8 | + freeze |

> 數值為初始設定，需實測調整。對 Boss（7000 HP）：Lv6 凍傷 = 280 HP/s（被火克 → 196 HP/s），約 35 秒凍傷傷害可造成 7000 HP Boss 損失約 ~6860 HP（若持續維持 dur）—— 需搭配普通攻擊或 freeze 控場完成擊殺。

---

## 完成標準
- [ ] 深寒無 `shred`，有 `frostbite`，chill 值為 8
- [ ] 冰河 Lv5 有 `frostbite`（dmgPct: 0.03）
- [ ] 冰河 Lv6 有 `frostbite`（dmgPct: 0.04）並保留 freeze
- [ ] 其他水系注入塔（蒸汽、泥沼等）**不動**
- [ ] 測試：純水流（多座深寒 + 冰河）可在 W17+ 殺死 Boss
