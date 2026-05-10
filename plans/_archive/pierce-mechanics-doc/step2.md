# Step 2：pierce 改為直線穿透 + 傷害遞減

## 前置

step1 完成（docs/mechanics.md 建立），確認目前 pierce 實作在 game.js 約 2837 行。

## 修改範圍

**單一檔案**：`js/game.js`，只改 pierce 的 `if (pierceSk)` 區塊

---

## 定位

**定位指令**：`Grep "pierce: 穿透射程內全體"` → 找到行號 → Read ±20 行確認整個 if 區塊

---

## 現有程式碼（目前行為：圓形全打，越後面越痛）

```js
// pierce: 穿透射程內全體，每穿一體增傷
const twDmgElem = tw.dmgType || tw.elem;
const pierceSk = getSkill(tw, 'pierce');
if (pierceSk) {
  const pUp = pierceSk.dmgUp;
  targets.forEach((e, i) => this.doDmg(e, Math.floor(effDmg * (1 + i * pUp)), twDmgElem, tw));
  this.addFx(tw.x, tw.y, 2, ...);
  ...
  continue;
}
```

---

## 新程式碼（直線穿透，越後面越不痛）

完整替換 `if (pierceSk)` 區塊：

```js
// pierce: 直線穿透，沿「塔→主目標」方向，每穿一體傷害遞減
const twDmgElem = tw.dmgType || tw.elem;
const pierceSk = getSkill(tw, 'pierce');
if (pierceSk) {
  const pDown = pierceSk.dmgUp;           // 語意重新定義為衰減率，欄位名保持不變
  const PIERCE_WIDTH = 0.6;               // 直線寬度（格），越寬越容易打到旁邊敵人
  const MIN_RATIO    = 0.3;               // 最低傷害下限（effDmg 的 30%）
  const tp = this.ePos(target);
  const dx = tp.x - tw.x;
  const dy = tp.y - tw.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;                    // 單位方向向量
  const uy = dy / len;
  // 篩選直線上的敵人
  const lineTargets = targets.filter(e => {
    const ep = this.ePos(e);
    const ex = ep.x - tw.x;
    const ey = ep.y - tw.y;
    const t   = ex * ux + ey * uy;       // 沿直線的投影距離
    const px  = ex - t * ux;             // 垂直分量
    const py  = ey - t * uy;
    return t > 0 && Math.hypot(px, py) <= PIERCE_WIDTH;
  }).sort((a, b) => {
    // 按沿直線距離排序（近 → 遠）
    const ap = this.ePos(a), bp = this.ePos(b);
    const ta = (ap.x - tw.x) * ux + (ap.y - tw.y) * uy;
    const tb = (bp.x - tw.x) * ux + (bp.y - tw.y) * uy;
    return ta - tb;
  });
  lineTargets.forEach((e, i) => {
    const ratio = Math.max(MIN_RATIO, 1 - i * pDown);
    this.doDmg(e, Math.floor(effDmg * ratio), twDmgElem, tw);
  });
  this.addFx(tw.x, tw.y, 2, (tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')) + '44', 0.2);
  const tp2 = this.ePos(target);
  this.projectiles.push({x:tw.x, y:tw.y, tx:tp2.x, ty:tp2.y, color:(tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')), t:0.15});
  continue;
}
```

---

## 邏輯說明

### 直線篩選
- 從 `targets`（射程圓圈內所有敵人）篩出在直線上的
- `t > 0`：在塔的前方（不打背後）
- 垂直距離 ≤ `PIERCE_WIDTH`：在直線旁 0.6 格以內

### 排序
- 舊：依 pathIdx 降序（最前端先打）
- 新：依直線距離升序（最近先打），主目標排 i=0

### 傷害
- `i=0`（主目標，最近）：`effDmg × 1.0`（100%）
- `i=1`：`effDmg × (1 − pDown)` 例 0.85（pDown=0.15）
- `i=n`：`effDmg × max(0.3, 1 − n×pDown)`（下限 30%）
- 注意：穿透塔的 `dmgUp` 原本是增傷，現在是遞減率，數值含義改變

---

## 驗證方式

1. 選一個有 pierce 的塔（如磐石塔 Lv5，dmgUp=0.2）
2. 確認炮彈只打到路徑直線方向上的敵人，不打旁邊路徑的敵人
3. 確認主目標傷害 = effDmg，第二個 = effDmg×0.8，第三個 = effDmg×0.6

## ⚠️ 注意事項

- `this.ePos(target)` 會被呼叫兩次（篩選時建 tp，FX 時建 tp2），因為 tp 是區域變數已用於方向計算；可提取為共用但優先確保正確性
- `PIERCE_WIDTH = 0.6` 是建議初始值，若路徑彎曲密集可能需要調小；路徑寬鬆可調大
- 若 `len = 0`（塔與目標同位置），`|| 1` 防除零，方向向量為 (0,0)，所有 t=0 被過濾，等同無穿透
