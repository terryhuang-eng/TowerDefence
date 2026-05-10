# Step 1：pierce / chain / multishot 副目標改傳 null

## 原則

`doDmg(enemy, dmg, elem, tower)` 的第四參數：
- 主目標 → 傳 `tw`（proc 正常）
- 副目標 → 傳 `null`（只算傷害）

## 修改點（共 3 處，均在 js/game.js）

---

### 修改點 A：pierce 副目標

**定位**：`Grep "pierce: 直線穿透"` → 找到行號 → Read ±15 行確認 lineTargets.forEach 區塊

**舊**：
```js
          lineTargets.forEach((e, i) => {
            const ratio = Math.max(MIN_RATIO, 1 - i * pDown);
            this.doDmg(e, Math.floor(effDmg * ratio), twDmgElem, tw);
          });
```

**新**：
```js
          lineTargets.forEach((e, i) => {
            const ratio = Math.max(MIN_RATIO, 1 - i * pDown);
            this.doDmg(e, Math.floor(effDmg * ratio), twDmgElem, e === target ? tw : null);
          });
```

`e === target`：主目標（射程內 pathIdx 最高的敵人）保留 proc；其餘穿透目標傳 null。

---

### 修改點 B：chain 副目標

**定位**：`Grep "chain: 連鎖跳躍到鄰近敵人"` → 找到行號 → Read ±10 行確認 chainTargets.forEach

**舊**：
```js
          chainTargets.forEach((e, i) => {
            const chainDmg = Math.floor(effDmg * Math.pow(chainSk.decay, i + 1));
            this.doDmg(e, chainDmg, twDmgElem, tw);
```

**新**：
```js
          chainTargets.forEach((e, i) => {
            const chainDmg = Math.floor(effDmg * Math.pow(chainSk.decay, i + 1));
            this.doDmg(e, chainDmg, twDmgElem, null);
```

chain 的 `chainTargets` 已用 `filter(e => e !== target)` 排除主目標，因此全部為副目標，一律傳 `null`。

---

### 修改點 C：multishot 額外發射

**定位**：`Grep "multishot: 每 N 次多連射"` → 找到行號 → Read ±20 行確認 for loop 結構

**舊**：
```js
        for (let s = 0; s < shots; s++) {
          const shotTarget = s === 0 ? target : (targets[s] || target);
          if (tw.aoe > 0) {
            const p = this.ePos(shotTarget);
            this.getEnemiesNear(p.x, p.y, tw.aoe).forEach(e => this.doDmg(e, effDmg, twDmgElem, tw));
            this.addFx(p.x, p.y, tw.aoe * 0.5, (tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')) + '44', 0.2);
          } else {
            this.doDmg(shotTarget, effDmg, twDmgElem, tw);
          }
        }
```

**新**：
```js
        for (let s = 0; s < shots; s++) {
          const shotTarget = s === 0 ? target : (targets[s] || target);
          const shotTower = s === 0 ? tw : null;
          if (tw.aoe > 0) {
            const p = this.ePos(shotTarget);
            this.getEnemiesNear(p.x, p.y, tw.aoe).forEach(e => this.doDmg(e, effDmg, twDmgElem, shotTower));
            this.addFx(p.x, p.y, tw.aoe * 0.5, (tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')) + '44', 0.2);
          } else {
            this.doDmg(shotTarget, effDmg, twDmgElem, shotTower);
          }
        }
```

`s === 0` 是主目標（正常 proc）；`s > 0` 是三連射的額外發射（不 proc）。

---

## 關於 multiArrow

`multi-arrow/step2.md` 的插入程式碼已設計為副目標傳 `null`（`doDmg(e, dmg, elem, null)`），執行前請確認 step2.md 符合此原則。若尚未調整，需在執行前先更新 step2.md。

---

## 驗證方式

1. 放一座有 `chill` 技能的塔 + chain 技能
2. 觀察連鎖跳躍到的敵人是否**不**被疊冰冷層（只有主目標有冰冷狀態圖示）
3. 放一座有 `chill` 技能的塔 + pierce 技能
4. 觀察穿透的後方敵人是否**不**被疊冰冷層
5. 放一座有 `burn` 技能的塔 + multishot 技能
6. 三連射爆發時，確認只有主目標（第一發）出現 🔥 灼燒，額外發射的目標不疊 burn
