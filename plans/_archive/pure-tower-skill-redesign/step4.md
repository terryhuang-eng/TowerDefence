# Step 4：towers.js — 更新 PURE_TOWERS.none 技能組

## 目標
將 `js/towers.js` 中 `PURE_TOWERS.none` 的 lv5/lv6 技能替換為新設計。
同時更新 LV4 INFUSIONS 中 none×none 的技能（加入 killGold 基礎層）。

---

## 改動一：PURE_TOWERS.none

### 定位
Grep `none.*混沌核` 或 `PURE_TOWERS` 找到 none 區段（約第 420 行附近）。

### 原本
```js
none: { name: '混沌核', icon: '⬜⬜⬜',
  lv5: { damage: 85, atkSpd: 1.3, range: 3.5, aoe: 0, cost: 350, dmgType: 'none', desc: '純無強化：定身+擊退增強',
    skills: [makeSkill('warp',{dur:1.3,cd:4}), makeSkill('knockback',{dist:2.5,cd:6})] },
  lv6: { damage: 170, atkSpd: 1.4, range: 4, aoe: 0, cost: 600, dmgType: 'none', desc: '三純無終極：不穩定超高傷+多重射擊',
    skills: [makeSkill('unstable',{variance:0.6}), makeSkill('multishot',{every:3,shots:3,killBonus:0.5,killDur:3,count:2})] },
},
```

### 替換為
```js
none: { name: '混沌核', icon: '⬜⬜⬜',
  lv5: { damage: 70, atkSpd: 1.4, range: 4, aoe: 0, cost: 350, dmgType: 'none', score_adj: 1,
    desc: '純無強化：擊殺獎金 + 財富積累（持有金幣轉化傷害）',
    skills: [makeSkill('killGold',{bonus:0.5}), makeSkill('wealthScale',{divisor:25,cap:30})] },
  lv6: { damage: 80, atkSpd: 1.4, range: 4, aoe: 0, cost: 600, dmgType: 'none', score_adj: 1,
    desc: '純無終極：擊殺獎金 + 財富積累（強化）+ 利息（每波依持有金幣直接加金）',
    skills: [makeSkill('killGold',{bonus:1.0}), makeSkill('wealthScale',{divisor:20,cap:50}), makeSkill('interest',{rate:0.05,cap:40})] },
},
```

**參數設計邏輯：**
| 參數 | LV5 | LV6 | 說明 |
|------|-----|-----|------|
| baseDmg | 70 | 80 | 刻意低於其他純塔（靠 wealthScale 動態補足）|
| killGold.bonus | 0.5 | 1.0 | LV5 每殺多 50%，LV6 每殺多 100%（雙倍）|
| wealthScale.divisor | 25 | 20 | LV6 換算效率更高（每 20g 就 +1 傷）|
| wealthScale.cap | 30 | 50 | LV6 上限更高 |
| interest.rate | — | 0.05 | LV6 獨有，5% 利率 |
| interest.cap | — | 40 | LV6 每波利息上限 |

**有效傷害預覽（LV6，wealthScale）：**
```
baseDmg = 80
持有 100g：+5  → 85 有效傷害
持有 300g：+15 → 95 有效傷害
持有 600g：+30 → 110 有效傷害
持有 1000g：+50（封頂）→ 130 有效傷害
```

---

## 改動二：INFUSIONS none×none（LV4）

### 定位
Grep `none.*none.*虛空` 找到 `INFUSIONS.none.none` 區段。

### 確認或更新
LV4 none×none 應有基礎 killGold（建議 bonus: 0.3），若現有技能是 warp+knockback，替換：

```js
none: { name: '虛空塔', icon: '⬜⬜',
  lv4: { damage: 55, atkSpd: 1.4, range: 4, aoe: 0, cost: 250, score_adj: 1, dmgType: 'none',
    desc: '無屬注入：無弱點穩定輸出 + 基礎擊殺獎金',
    skills: [makeSkill('killGold',{bonus:0.3})] },
},
```

**設計理由：** LV4 建立「殺敵賺錢」的基礎習慣，財富積累和利息作為 LV5/LV6 的升級誘因。

---

## 驗證方式
- 遊戲中升無塔到 LV5：確認面板顯示「擊殺獎金」和「財富積累」技能
- 升到 LV6：確認三個技能都顯示
- skill-editor.html 確認兩個新技能在 none 塔的技能欄位正確顯示
- 確認 warp/knockback 不再出現在純無塔
