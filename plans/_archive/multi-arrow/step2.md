# Step 2：game.js 實作多重箭攻擊邏輯

## 前置

step1 完成（skills.js 已有 multiArrow 定義）。

## 修改點（1 處，js/game.js）

**定位**：`Grep "chain: 連鎖跳躍到鄰近敵人"` → 找到行號 → Read ±20 行確認 chain 區塊結尾

chain 區塊結束後（`});` 之後），插入多重箭邏輯：

---

### 插入位置：chain if 區塊的 `});` 之後

目前程式碼結構（chain 後）：
```js
        const chainSk = getSkill(tw, 'chain');
        if (chainSk) {
          ...
          chainTargets.forEach((e, i) => {
            ...
          });
        }
        // ← 在此插入
```

插入：
```js
        // multiArrow: 每次攻擊同時射多支箭至不同目標，各 ×ratio 傷害
        const multiArrowSk = getSkill(tw, 'multiArrow');
        if (multiArrowSk) {
          const arrowTargets = targets
            .filter(e => e !== target)
            .slice(0, multiArrowSk.shots - 1);
          arrowTargets.forEach(e => {
            this.doDmg(e, Math.floor(effDmg * multiArrowSk.ratio), twDmgElem, null); // 副目標不觸發 proc（同 chain/pierce 規則）
            const ep = this.ePos(e);
            this.projectiles.push({x:tw.x, y:tw.y, tx:ep.x, ty:ep.y, color:twColor, t:0.12});
          });
        }
```

---

## 邏輯說明

- `targets` 已在攻擊開頭按 pathIdx 排序，`target = targets[0]`（最前端敵人）
- `filter(e => e !== target)`：排除主目標（主目標由正常攻擊處理）
- `.slice(0, shots-1)`：取 shots-1 個副目標（shots=2 → 1 個副目標）
- `doDmg(e, effDmg × ratio, elem, tw)`：`tw` 傳入 → proc 技能正常觸發（與 chain/pierce 行為一致）
- 每個副目標獨立射出一支視覺彈道（`projectiles.push`）

## `twColor` 確認

**定位**：`Grep "const twColor"` 確認 twColor 變數是否在此作用域可用。

若不存在，改用：
```js
(tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c'))
```

## 驗證方式

1. 在 `js/towers.js` 某個 lv4 塔的 skills 暫時加入 `makeSkill('multiArrow',{shots:2,ratio:0.65})`
2. 遊戲中放置該塔，等到射程內有 2+ 敵人
3. 確認副目標被扣血（effDmg × 0.65 四捨五入）
4. 確認副目標也疊加 proc 效果（若塔有 chill，確認副目標有 chillStacks）
5. 確認主目標仍受正常傷害（effDmg × 1.0）
