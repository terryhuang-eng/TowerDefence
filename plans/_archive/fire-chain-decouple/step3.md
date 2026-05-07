# step3 — burn 係數改用 DPS，score 折入 effectiveDPS

## 目標
將 burn DOT 的每秒傷害從 `baseDmg × dot` 改為 `DPS × dot`，讓 burn 強度與塔的 DPS 線性對應，而非偶然取決於單次傷害值。同步更新 skill-editor 的分數計算，把 burn 的貢獻折入 effectiveDPS。

## 影響範圍
- `js/game.js`：`doDmg()` 中 burnDmg 計算（第 2429 行）
- `js/skills.js`：burn 定義加入 `foldedIntoDPS: true` 旗標
- `skill-editor.html`：`computeScoreBreakdown()`（約 957–969 行）

---

## 修改 1：js/game.js（第 2429 行）

**定位**：`Grep 'enemy.burnDmg = baseDmg'` → 確認行號 → Read ±5 行

```js
// 改前：
enemy.burnDmg = baseDmg * burnSk.dot;

// 改後：
const burnCoeff = tower ? (tower.damage * tower.atkSpd) : baseDmg;
enemy.burnDmg = burnCoeff * burnSk.dot;
```

**說明**：
- `tower` 在 `doDmg(enemy, baseDmg, elem, tower)` 中可能為 null（非塔傷害來源），需要 fallback 到 `baseDmg`
- `burnCoeff = DPS`（damage × atkSpd）讓相同 DPS 的塔產生相同 burn 強度
- ignite / detonate 不改（維持 `baseDmg × param`，避免 atkSpd² 效應）

---

## 修改 2：js/skills.js

**定位**：`Grep "burn.*scoreBase"` 找到 burn 定義行

加入 `foldedIntoDPS: true` 欄位：

```js
burn: {
  category: 'tower', group: 'damage', name: '灼燒',
  defaults: {dot:0.3,dur:3},
  desc: '每秒 dot×DPS 傷害，持續 dur 秒。吃護甲。覆蓋時觸發 ignite',
  scoreBase: 25, scorePrimary: 'dot', scoreRef: 0.3,
  foldedIntoDPS: true    // ← 新增
},
```

**說明**：
- `foldedIntoDPS: true` 是給 skill-editor 識別的旗標，不影響遊戲邏輯
- 同時更新 desc，反映係數改為 DPS

---

## 修改 3：skill-editor.html（computeScoreBreakdown，約 930–969 行）

**定位**：`Grep 'const dpsRaw'` → 確認在 computeScoreBreakdown 函數中 → Read ±15 行

### A. 計算 rows 時，foldedIntoDPS 技能 score 歸零

在現有 `rows` 計算的 map callback 中，加入 guard（在計算 score 之後）：

```js
// 加在 score 計算完成後、return 之前：
if (def.foldedIntoDPS) {
  return { name: def.name, score: 0, foldedIntoDPS: true };
}
```

### B. effectiveDPS 折入 burn dotBonus

```js
// 改前：
const effectiveDPS = Math.round(dpsRaw * aoeMultiplier * 10) / 10;

// 改後：
const burnSkill = skills.find(s => s.enabled && s.type === 'burn');
const dotBonus  = burnSkill ? (burnSkill.params?.dot ?? 0.3) : 0;
const effectiveDPS = Math.round(dpsRaw * aoeMultiplier * (1 + dotBonus) * 10) / 10;
```

---

## 預期效果

**Lv4 火+火弓手（damage=80, atkSpd=1.2, dot=0.45）**

| 項目 | 改前 | 改後 |
|------|------|------|
| burnDmg/s（in-game） | 80 × 0.45 = 36/s | 96 × 0.45 = 43.2/s |
| burn score | 25 × (0.45/0.3) = 37.5 pts | 0 pts（折入 DPS） |
| effectiveDPS（score） | 96 | 96 × 1.45 = 139.2 |
| dpsScoreActual | 96 × (160/120) = 128 | 139.2 × (160/120) = 185.6 |
| 總 skill score 貢獻 | +37.5 pts（獨立） | +0（已在 DPS 分內） |

**⚠️ 注意**：step3 執行後，帶 burn 的塔 DPS 分數會提高（因為 dotBonus 折入），原本的 `score_adj` 或 `scoreTarget` 可能需要微調。建議執行後在 skill-editor 重新審視所有火系塔的平衡度。

---

## 不影響的項目
- ignite / detonate 的係數（仍為 `baseDmg × param`）
- burn 的遊戲觸發邏輯（仍為每次攻擊刷新，burnTimer 機制不變）
- burn 在 score 面板上的顯示（由 step2 負責顯示標記）
