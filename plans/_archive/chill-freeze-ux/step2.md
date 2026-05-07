# Step 2：freeze 收斂至 LV6 純水塔（冰河塔 lv6）

## 目標
將 freeze 技能從 深寒（lv4）和 冰河塔（lv5）移除，只保留 冰河塔 lv6。
讓玩家修完 Bug1 後可以自行測試 lv6 的 freeze 參數，不受低階塔干擾。

**不調整任何數值**，只改技能組的組成。

---

## 影響範圍
只改 `js/towers.js`，共 2 處。

---

## 修改一：深寒 lv4 移除 freeze

**位置**：INFUSIONS → water → water（約 line 173~175）

**現況**：
```js
water: { name: '深寒', icon: '💧💧',
  lv4: { damage: 44, atkSpd: 2, range: 3.5, aoe: 1.2, cost: 250, score_adj: 0.79, dmgType: 'water', desc: '冰凍 0.8s（30層觸發）',
    skills: [makeSkill('chill',{perStack:0.5,cap:40}), makeSkill('freeze',{dur:0.8,threshold:2})] },
},
```

**改為**：
```js
water: { name: '深寒', icon: '💧💧',
  lv4: { damage: 44, atkSpd: 2, range: 3.5, aoe: 1.2, cost: 250, score_adj: 0.79, dmgType: 'water', desc: '強力冰冷 AOE（每層 -50% 速度）',
    skills: [makeSkill('chill',{perStack:0.5,cap:40})] },
},
```

---

## 修改二：冰河塔 lv5 移除 freeze

**位置**：PURE_TOWERS → water → lv5（約 line 396~398）

**現況**：
```js
water: { name: '冰河塔', icon: '💧💧💧',
  lv5: { damage: 70, atkSpd: 1.1, range: 4, aoe: 1.5, cost: 350, dmgType: 'water', desc: '純水強化：冰冷+冰凍增強（繼承深寒技能組）',
    skills: [makeSkill('chill',{perStack:0.04,cap:55}), makeSkill('freeze',{dur:1.2,threshold:30})] },
```

**改為**：
```js
water: { name: '冰河塔', icon: '💧💧💧',
  lv5: { damage: 70, atkSpd: 1.1, range: 4, aoe: 1.5, cost: 350, dmgType: 'water', desc: '純水強化：冰冷增強 AOE',
    skills: [makeSkill('chill',{perStack:0.04,cap:55})] },
```

---

## 保留不變：冰河塔 lv6（約 line 399~400）

```js
lv6: { damage: 100, atkSpd: 1.2, range: 4, aoe: 1.8, cost: 600, dmgType: 'water', desc: '三純水終極：強冰冷AOE+冰凍',
  skills: [makeSkill('chill',{perStack:0.03,cap:60}), makeSkill('freeze',{dur:2,threshold:50})] },
```
→ 不動，留給用戶在 Bug1 修完後自行測試 threshold/dur 是否合適。

---

## 預期結果
| 塔 | 修改前 | 修改後 |
|----|--------|--------|
| 深寒 lv4 | chill(0.5, cap40) + freeze(dur0.8, th2) | chill(0.5, cap40) |
| 冰河塔 lv5 | chill(0.04, cap55) + freeze(dur1.2, th30) | chill(0.04, cap55) |
| 冰河塔 lv6 | chill(0.03, cap60) + freeze(dur2, th50) | 不變 |
