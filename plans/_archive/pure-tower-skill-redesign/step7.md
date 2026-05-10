# Step 7：towers.js — PURE_TOWERS 五元素完整重寫

## 目標
按照確認的六屬設計，重寫 `PURE_TOWERS` 中 fire/water/earth/wind/thunder 五座純塔的 lv5/lv6 技能組。

## 改動位置
`js/towers.js`，`PURE_TOWERS` 區段（約第 389 行）

---

## 定位方式
Grep `PURE_TOWERS` 找到區段起始，整段替換 fire/water/earth/wind/thunder 的 lv5/lv6。

---

## 改動：逐元素新定義

### 🔥 fire（業炎塔）

**設計：** 慢攻速 + 高單體 + burn（含 ignite）→ LV5 還沒有 detonate，LV6 才解鎖

**原本：**
```js
fire: { name: '業炎塔', icon: '🔥🔥🔥',
  lv5: { ... skills: [burn+ignite+detonate] },
  lv6: { ... skills: [burn+ignite+detonate all-in] },
},
```

**替換為：**
```js
fire: { name: '業炎塔', icon: '🔥🔥🔥',
  lv5: { damage: 130, atkSpd: 1.2, range: 3.5, aoe: 0, cost: 350, score_adj: 1, dmgType: 'fire',
    desc: '純火強化：灼燒強化（含引燃），穩定 DOT 輸出',
    skills: [makeSkill('burn',{dot:0.45,dur:3}), makeSkill('ignite',{flat:0.35})] },
  lv6: { damage: 170, atkSpd: 1.2, range: 3.5, aoe: 0, cost: 600, score_adj: 1, dmgType: 'fire',
    desc: '純火終極：灼燒+引燃+引爆（燃爆達 3 層真傷，無視護甲）',
    skills: [makeSkill('burn',{dot:0.5,dur:4}), makeSkill('ignite',{flat:0.4}), makeSkill('detonate',{ratio:1.0,radius:1.5})] },
},
```

**梯度：** LV5 = burn + ignite（中等 DOT + 覆蓋爆傷），LV6 = 解鎖 detonate（燃爆節奏系統）

---

### 💧 water（冰河塔）

**設計：** 中攻速 + AOE + chill（自增效）→ LV5 緩速，LV6 解鎖 %HP 侵蝕

**替換為：**
```js
water: { name: '冰河塔', icon: '💧💧💧',
  lv5: { damage: 65, atkSpd: 1.1, range: 4, aoe: 1.4, cost: 350, score_adj: 1, dmgType: 'water',
    desc: '純水強化：AOE 冰冷（疊加中），緩速延長敵人在射程內的時間',
    skills: [makeSkill('chill',{stacksPerHit:4})] },
  lv6: { damage: 85, atkSpd: 1.2, range: 4, aoe: 1.6, cost: 600, score_adj: 1, dmgType: 'water',
    desc: '純水終極：AOE 冰冷（疊加中）+ %HP 侵蝕真傷（每 2 攻擊）',
    skills: [makeSkill('chill',{stacksPerHit:5}), makeSkill('hpPct',{pct:0.04,every:2,cd:0.5,cap:120})] },
},
```

**梯度：** LV5 = 強化冰冷疊加（4層/hit），LV6 = 再加 hpPct 侵蝕（高HP/高護甲殺手）

---

### ⛰️ earth（磐石塔）

**設計：** 慢攻速 + 大射程 + pierce（後排遞增）→ LV6 加傷害光環

**替換為：**
```js
earth: { name: '磐石塔', icon: '⛰️⛰️⛰️',
  lv5: { damage: 140, atkSpd: 0.8, range: 4.5, aoe: 0, cost: 350, score_adj: 1, dmgType: 'earth',
    desc: '純土強化：穿透貫穿（後排+dmgUp傷害），大射程重型砲擊',
    skills: [makeSkill('pierce',{dmgUp:0.2})] },
  lv6: { damage: 180, atkSpd: 0.8, range: 5, aoe: 0, cost: 600, score_adj: 1, dmgType: 'earth',
    desc: '純土終極：穿透貫穿（強化）+ 傷害光環（全場 +20% 傷害）',
    skills: [makeSkill('pierce',{dmgUp:0.25}), makeSkill('aura_dmg',{radius:2.5,flat:0,pct:0.20})] },
},
```

**梯度：** LV5 = 穿透（dmgUp 0.2），LV6 = 穿透強化（0.25）+ 傷害光環全場加成

---

### 🌪️ wind（颶風塔）

**設計：** 中攻速 + ramp（切換衰減）→ LV6 加射程光環（注意：現況 LV6 誤設為 aura_dmg，此步驟修正）

**替換為：**
```js
wind: { name: '颶風塔', icon: '🌪️🌪️🌪️',
  lv5: { damage: 70, atkSpd: 1.8, range: 4.5, aoe: 0, cost: 350, score_adj: 1, dmgType: 'wind',
    desc: '純風強化：越攻越快（切換目標扣層，不歸零），中等單體持續輸出',
    skills: [makeSkill('ramp',{perHit:0.05,cap:0.6,switchLoss:3})] },
  lv6: { damage: 90, atkSpd: 1.8, range: 4.5, aoe: 0, cost: 600, score_adj: 1, dmgType: 'wind',
    desc: '純風終極：越攻越快（強化）+ 射程光環（全場 +1 射程）',
    skills: [makeSkill('ramp',{perHit:0.06,cap:0.8,switchLoss:3}), makeSkill('aura_range',{radius:2.5,bonus:1.0})] },
},
```

**梯度：** LV5 = ramp（cap 0.6），LV6 = ramp 強化（cap 0.8）+ 射程光環
**修正點：** 原 LV6 是 aura_dmg，改回設計正確的 aura_range

---

### ⚡ thunder（雷神塔）

**設計：** 快攻速 + multishot（三連射）→ LV6 加射速光環

**替換為：**
```js
thunder: { name: '雷神塔', icon: '⚡⚡⚡',
  lv5: { damage: 100, atkSpd: 1.5, range: 3.5, aoe: 0, cost: 350, score_adj: 1, dmgType: 'thunder',
    desc: '純雷強化：三連射（每 3 攻觸發），快速多目標爆發',
    skills: [makeSkill('multishot',{every:3,shots:3,killBonus:0.3,killDur:2})] },
  lv6: { damage: 120, atkSpd: 1.6, range: 4, aoe: 0, cost: 600, score_adj: 1, dmgType: 'thunder',
    desc: '純雷終極：三連射（每 2 攻觸發）+ 射速光環（全場 +25% 攻速）',
    skills: [makeSkill('multishot',{every:2,shots:3,killBonus:0.5,killDur:3}), makeSkill('aura_atkSpd',{radius:2.5,bonus:0.25})] },
},
```

**梯度：** LV5 = 每 3 攻三連射，LV6 = 每 2 攻三連射（更頻繁）+ 全場攻速光環

---

## 驗證方式
- 升級到 LV5/LV6 後在 skill-editor 確認技能正確
- 純火 LV5 無 detonate，LV6 有 detonate
- 純水 LV6 無 frostbite/freeze，有 hpPct
- 純土 LV5/6 無 shred/vulnerability，有 pierce
- 純風 LV6 是 aura_range（不是 aura_dmg）
- 純雷 LV5/6 無 hpPct/chain/execute，有 multishot
