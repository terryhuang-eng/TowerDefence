# Step 1 — js/game.js：4 個傷害點加 sandbox 追蹤

## 目標
在 `window.SANDBOX.fireDmg` 累計每種效果的傷害量。
只在 sandbox 模式（`window.SANDBOX`）下生效，不影響正常遊戲。

## 資料結構
`window.SANDBOX.fireDmg` 物件（已存在時累加，不存在時不執行）：
```js
{
  direct: 0,   // 一般攻擊傷害（有 burn skill 的塔）
  burn:   0,   // 灼燒 DOT 傷害
  ignite: 0,   // 引燃觸發傷害
  detonate: 0  // 引爆觸發傷害
}
```

## 修改說明

### 修改點 A：applyDamage() — 記錄直接攻擊傷害
定位：`applyDamage` 函式中，`enemy.hp -= dmg`（有效傷害扣血）之後。
條件：`tower && getSkill(tower,'burn') && window.SANDBOX?.fireDmg`

```js
if (window.SANDBOX?.fireDmg && tower && getSkill(tower,'burn')) {
  window.SANDBOX.fireDmg.direct += dmg;
}
```

> `dmg` 為已套護甲後的有效傷害值（與 hp 扣除量對應）。

### 修改點 B：引燃 ignite — game.js:2415
緊接在 `enemy.hp -= Math.floor(baseDmg * igniteSk.flat);` 之後：
```js
if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.ignite += Math.floor(baseDmg * igniteSk.flat);
```

### 修改點 C：引爆 detonate — game.js:2430（單體）與 AOE 分支
單體分支 `enemy.hp -= detDmg` 之後：
```js
if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.detonate += detDmg;
```
AOE 分支 `forEach` 內 `e.hp -= detDmg` 之後（已在 forEach 裡，每隻怪各計一次）：
```js
if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.detonate += detDmg;
```

### 修改點 D：灼燒 DOT — game.js:2619
`e.hp -= e.burnDmg * dt;` 之後：
```js
if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.burn += e.burnDmg * dt;
```

## 注意事項
- 不需要初始化 `fireDmg`（由 step2 的 index.html 初始化，重置按鈕也在那裡）
- `applyDamage` 裡的 `dmg` 是護甲後的值，確保 direct 和 burn/ignite/detonate 口徑一致（burn DOT 也吃護甲，detonate 不吃護甲，這是設計規格，不需統一）
- 行號僅供參考，需 Grep 確認實際行號再 Edit
