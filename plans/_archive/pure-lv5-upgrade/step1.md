# Step 1 — 新增 PURE_TOWERS lv5 資料

## 目標
在 `js/towers.js` 的 `PURE_TOWERS` 每個元素中加入 `lv5` stats。

## 影響範圍
- **檔案**：`js/towers.js`
- **位置**：lines 428-447（PURE_TOWERS 物件）

## Stats 設計原則
| 階段 | LV4 infusion（INFUSIONS 參考值） | LV5 純屬（新增） | LV6 純屬（已有） |
|------|--------------------------------|----------------|----------------|
| cost | +250g | +350g | +600g |
| DPS 倍率 | 基準 1× | ~1.5× | ~2.5× |
| 特色 | 雙屬雙技能 | 單屬強化，1 個核心技能 | 單屬終極，2-3 技能全套 |

LV5 純屬 stats 參照 LV6 做約 60% 縮放（damage/atkSpd），range 相同，技能精簡版（1 個）。

## 具體修改

在 `PURE_TOWERS` 中，各元素的 `lv6:` **前面**加入 `lv5:` 欄位。

### 火系（fire）
```javascript
lv5: { damage: 130, atkSpd: 1.5, range: 3.5, aoe: 0, cost: 350, desc: '純火強化：燃燒增傷',
  skills: [makeSkill('burn', {dot:0.3, dur:3})] },
```

### 水系（water）
```javascript
lv5: { damage: 60, atkSpd: 1.0, range: 4.0, aoe: 1.5, cost: 350, desc: '純水強化：群體冰冷',
  skills: [makeSkill('chill', {perStack:0.02, cap:50})] },
```

### 土系（earth）
```javascript
lv5: { damage: 110, atkSpd: 0.8, range: 3.5, aoe: 1.0, cost: 350, desc: '純土強化：碎甲',
  skills: [makeSkill('shred', {amt:0.07, dur:5, cap:0.5})] },
```

### 風系（wind）
```javascript
lv5: { damage: 80, atkSpd: 1.7, range: 4.0, aoe: 0, cost: 350, desc: '純風強化：連擊加速',
  skills: [makeSkill('ramp', {perHit:0.06, cap:0.4})] },
```

### 雷系（thunder）
```javascript
lv5: { damage: 100, atkSpd: 1.2, range: 4.5, aoe: 0, cost: 350, desc: '純雷強化：%HP傷害',
  skills: [makeSkill('hpPct', {pct:0.05, every:2, cd:0.5, cap:80})] },
```

### 無系（none）
```javascript
lv5: { damage: 105, atkSpd: 1.2, range: 4.0, aoe: 0, cost: 350, desc: '純無強化：不穩定增傷',
  skills: [makeSkill('unstable', {variance:0.5})] },
```

## 結果
每個 PURE_TOWERS entry 結構從：
```javascript
fire: { name: '業炎塔', icon: '🔥🔥🔥',
  lv6: { ... } }
```
改為：
```javascript
fire: { name: '業炎塔', icon: '🔥🔥🔥',
  lv5: { ... },
  lv6: { ... } }
```
