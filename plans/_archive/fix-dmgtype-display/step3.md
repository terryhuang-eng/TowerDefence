# Step 3：game.js 升級路徑支援 dmgType 傳遞

**目標**：讓 data object 上設定的 `dmgType`（非 null）能複製到 tower instance，使「特殊傷害類型覆蓋」功能真正生效

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/js/game.js`

---

## 背景

目前所有升級路徑：
```javascript
Object.assign(t, { damage: data.damage, atkSpd: data.atkSpd, range: data.range, aoe: data.aoe, skills: data.skills || [] });
```
沒有複製 `dmgType`，導致即使 data 有設定 `dmgType`，tower instance 上永遠是 undefined。

傷害計算：
```javascript
const twDmgElem = tw.dmgType || tw.elem;
```
永遠走 `tw.elem`。

---

## 定位方法

Grep: `Object.assign(t,` → 找所有升級路徑的 Object.assign
確認行號，每個加入 dmgType 傳遞邏輯

---

## 升級路徑清單

| 路徑 | 大約行號 | data 變數名 |
|-----|---------|------------|
| Lv1→2 (basic) | ~817 | `nextData` |
| Lv2→3 (elem) | ~861 | `eb` |
| Lv3→4 (infusion) | ~905 | `lvData` |
| Lv4→5 (triple) | ~980 | `nextData` |
| Lv4→6 (pure) | ~946 | `nextData` |

---

## 具體修改模式

每個 Object.assign 後加一行：

```javascript
Object.assign(t, { damage: data.damage, atkSpd: data.atkSpd, range: data.range, aoe: data.aoe, skills: data.skills || [] });
if (data.dmgType !== undefined) t.dmgType = data.dmgType || null;  // null = 依 tw.elem
```

這樣：
- `data.dmgType = 'water'` → `t.dmgType = 'water'`（覆蓋，用水元素傷害）
- `data.dmgType = null` → `t.dmgType = null`（明確無覆蓋，走 tw.elem）
- `data.dmgType = undefined`（舊資料未設此欄位）→ 不覆蓋，維持現有行為

---

## 影響範圍

影響 `js/game.js` 5 個升級路徑，不影響現有遊戲行為（因為現有 data 全部 `dmgType: null`，null 不會覆蓋 tw.elem）。
