# Step 1 — 新增 frostbite（凍傷）技能定義與遊戲邏輯

## 目標
在 `js/skills.js` 新增 `frostbite` 技能定義，並在 `js/game.js` 實作凍傷 DOT 邏輯。

**設計原則（依使用者確認）：**
- 凍傷是**獨立 DOT 效果**，與冰冷緩速（chillStacks）完全分離，互不干擾
- 凍傷由塔命中時觸發，有自己的 duration，不依賴 chillStacks 高低
- 凍傷傷害需歸因到來源塔（分數計算）
- 緩速的分數占比調低，實際殺傷貢獻轉移到凍傷

---

## 影響範圍
- `js/skills.js`：SKILL_DEFS 新增 `frostbite` 條目
- `js/game.js`：塔命中後施加凍傷、每幀 DOT 計算、傷害歸因

---

## 技能定義（js/skills.js）

在 SKILL_DEFS 的 `chill` 條目後新增：

```javascript
frostbite: {
  category: 'tower',
  group: 'dot',
  name: '凍傷',
  defaults: { dmgPct: 0.02, dur: 3 },
  desc: '命中時施加凍傷，持續 dur 秒，每秒造成目標 maxHP × dmgPct 的水系傷害（獨立於冰冷效果）'
},
```

| 參數 | 預設 | 說明 |
|------|------|------|
| dmgPct | 0.02 | 每秒傷害 = maxHP × 2%（水系，受元素三角影響） |
| dur | 3 | 持續秒數，每次命中重置計時 |

---

## 遊戲邏輯（js/game.js）

### 1. 塔命中時施加凍傷（在現有 applyHitEffects 或 tower attack 區塊）

搜尋：`getSkill(tower, 'chill')` 附近，在其後加入：

```javascript
// 凍傷（獨立 DOT，不依賴 chillStacks）
const fbSk = getSkill(tower, 'frostbite');
if (fbSk) {
  // 多塔時取最高 dmgPct，並刷新 duration
  enemy.frostbiteDmgPct = Math.max(enemy.frostbiteDmgPct || 0, fbSk.dmgPct);
  enemy.frostbiteDur    = Math.max(enemy.frostbiteDur || 0, fbSk.dur);
  enemy.frostbiteSrc    = tower.id; // 傷害來源（分數歸因用）
}
```

### 2. 每幀 DOT 計算（在 chillStacks 衰減區塊附近）

搜尋：`e.chillDecay` 或 chillStacks 衰減邏輯，在其後加入：

```javascript
// 凍傷 DOT
if (e.frostbiteDur > 0) {
  e.frostbiteDur -= dt;
  const rawDmg = e.frostbiteDmgPct * e.maxHp * dt;
  const actualDmg = applyElemAdv('water', e.elem, rawDmg);
  e.hp = Math.max(0, e.hp - actualDmg);

  // 傷害分數歸因（與 burn DOT 同邏輯）
  if (e.frostbiteSrc != null) {
    const srcTower = getTowerById(e.frostbiteSrc);
    if (srcTower) srcTower.totalDmg = (srcTower.totalDmg || 0) + actualDmg;
  }

  if (e.frostbiteDur <= 0) {
    e.frostbiteDmgPct = 0;
    e.frostbiteSrc    = null;
  }
}
```

### 3. 敵人初始化（resetEnemy 或 spawnEnemy）

確保新敵人清空凍傷欄位：

```javascript
e.frostbiteDur    = 0;
e.frostbiteDmgPct = 0;
e.frostbiteSrc    = null;
```

### 4. 狀態欄顯示（約 line 2274 附近）

在 chillStacks 顯示後加入：

```javascript
if (enemy.frostbiteDur > 0) {
  statusHtml += `<span style="color:#88ccff">🥶凍傷 ${Math.round(enemy.frostbiteDmgPct * 100 * 10) / 10}%/s × ${enemy.frostbiteDur.toFixed(1)}s</span> `;
}
```

---

## 分數設計說明

| 效果 | 分數貢獻方式 | 占比意圖 |
|------|------------|---------|
| 冰冷緩速（chill） | 間接（延長敵人在射程時間）→ 不直接計分 | 小（輔助定位） |
| 凍傷 DOT（frostbite） | 直接傷害歸因到 srcTower.totalDmg | 大（主要輸出定位） |

> 緩速不直接計分（現況已如此），凍傷透過 totalDmg 累積讓純水塔有實質傷害分數。

---

## 完成標準
- [ ] SKILL_DEFS 有 `frostbite` 條目，defaults 正確
- [ ] 塔命中且有 frostbite 技能時，敵人獲得 `frostbiteDur` / `frostbiteDmgPct`
- [ ] 每幀 DOT 計算套用元素三角（水被火克 ×0.7）
- [ ] 傷害歸因到來源塔的 `totalDmg`
- [ ] 狀態欄顯示凍傷狀態
- [ ] 敵人死亡 / 新生時正確清空凍傷欄位
