# step1 — 修正 `_getMobileUpgradeOptions` 升級選項

## 目標

1. **1a**：Lv4 純屬塔 `picks >= 3` 時同時顯示 Lv5 + Lv6 → 改為只顯示 Lv5（`if` → `if / else if`）
2. **1b**：Lv5 純屬塔無升級選項 → 新增 `else if (lv === 5)` 分支提供 Lv5 → Lv6

## 目標檔案

`js/game.js`

## 影響範圍

`_getMobileUpgradeOptions` 函數，約第 1234-1278 行。
不影響桌面版 `rebuildSidebar`。

---

## 修改說明

### 1a：Lv4 pure route — if 改 if/else if

**位置**：`else if (lv === 4 && tw.infuseElem)` 內，`tw.infuseElem === tw.elem` 分支。

**現狀**：
```js
if (pure.lv5 && picks >= 2) {
  // 加 Lv5 選項
}
if (pure.lv6 && picks >= 3 && lv6Count < maxLv6) {
  // 加 Lv6 選項（picks >= 3 時與上方同時成立）
}
```

**修正**：
```js
if (pure.lv5 && picks >= 2) {
  // 加 Lv5 選項（不管 picks 是否 >= 3，Lv4 只能升 Lv5）
} else if (pure.lv6 && picks >= 3 && lv6Count < maxLv6) {
  // 僅在無 lv5 資料時才直接顯示 Lv6（理論上不應發生，保留為後備）
}
```

實際上只要資料完整，`pure.lv5` 必定存在，Lv6 分支永不觸發。
改成 `else if` 確保邏輯正確：Lv4 永遠只顯示一個升級選項。

---

### 1b：新增 Lv5 → Lv6 分支

**位置**：在 `else if (lv === 4 && tw.infuseElem)` 整個 else-if 之後新增：

```js
} else if (lv === 5 && tw.infuseElem === tw.elem && !tw.thirdElem && PURE_TOWERS[tw.elem]) {
  const pure = PURE_TOWERS[tw.elem];
  const picks = this.elemPicks[tw.elem] || 0;
  const lv6Count = this.countLv6Towers();
  const maxLv6 = CONFIG.maxLv6Towers ?? 1;
  if (pure.lv6 && picks >= 3 && lv6Count < maxLv6) {
    const nd6 = pure.lv6;
    opts.push({ label: `${ELEM[tw.elem].icon}×3 Lv6`, cost: nd6.cost, action: () => {
      if (this.countLv6Towers() >= maxLv6) return;
      tw.level = 6; tw.thirdElem = tw.elem;
      tw.totalCost = (tw.totalCost || 0) + nd6.cost;
      Object.assign(tw, { damage: nd6.damage, atkSpd: nd6.atkSpd, range: nd6.range, aoe: nd6.aoe, skills: nd6.skills || [] });
      if (nd6.dmgType !== undefined) tw.dmgType = nd6.dmgType || null;
      if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: tw.x, y: tw.y, level: 6, elem: tw.elem, infuseElem: tw.infuseElem, thirdElem: tw.elem });
    }});
  }
}
```

條件與桌面版 `rebuildSidebar`（第 1080 行）完全一致：
- `lv === 5`
- `infuseElem === elem`（純屬路線）
- `!thirdElem`（確認沒有 third elem，即尚未達到 Lv6）
- picks >= 3、lv6Count < maxLv6
