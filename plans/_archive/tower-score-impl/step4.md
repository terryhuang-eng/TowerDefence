# Step 4：dps-calc.html — 加入塔分數顯示

## 目標
在現有 dps-calc.html 加入 **Score 欄位**，顯示每座塔的：
- `DPS_score`：純戰鬥力分（不含特效）
- `Effect_score`：特效貢獻分
- `raw_total`：DPS_score + Effect_score
- `score_adj`：設計調整係數（來自 towers.js）
- `effective`：raw_total × score_adj（最終評分）
- 等級目標比對色碼（綠/黃/紅）

## 影響範圍
- 檔案：`dps-calc.html`
- 對象：scoring 計算函式 + 表格顯示
- **不動現有 DPS/eDPS 欄位**，新增 Score 欄

---

## 現有結構確認（來自 grep 結果）

- L129：`<th data-sort="dps">DPS</th>` — 目前欄位
- L187：`function calcEffectiveDPS(t, enemyHP, enemyArmor)` — 效能 DPS 函式
- L243：hpPct 計算（需更新支援 cap）
- L300：`function getParam(...)` — 可調整技能參數
- L315：`function calcSkillContrib(...)` — 單技能貢獻

---

## 新增內容

### A. Score 計算函式（新增）

```js
// Lv 目標分數（由現有塔反推）
const LV_TARGET = { 1: 100, 2: 178, 3: 325, 4: 410, 5: 580, 6: 750 };
const LV_ACCEPTABLE = 0.15; // ±15%

function calcTowerScore(t) {
  const lv = t.lv;
  const aoe_mod = 1 + (t.aoe || 0) * 0.7;
  const range_mod = (t.range || 3.0) / 3.0;
  const K = 2.841;

  const dps_score = t.damage * t.atkSpd * range_mod * aoe_mod * K;

  let effect_score = 0;
  (t.skills || []).forEach(sk => {
    const p = sk.params || {};
    const hit_mod = aoe_mod; // 命中型效果 × aoe_mod

    switch (sk.type) {
      case 'burn':        effect_score += (p.dot || 0) * 150 * hit_mod; break;
      case 'ignite':      effect_score += (p.flat || 0) * 80; break;          // 不乘 aoe_mod
      case 'detonate':    effect_score += (p.ratio || 0) * 35 * hit_mod; break;
      case 'shred':       effect_score += (p.cap || 0) * 90 * hit_mod; break;
      case 'chill': {
        const maxSlow = Math.min((p.perStack||0) * (p.cap||0), 1.0);
        effect_score += maxSlow * 50 * hit_mod;
        break;
      }
      case 'freeze':      effect_score += (p.dur || 0) * 40 * hit_mod; break;
      case 'warp':        effect_score += ((p.dur||0)/(p.cd||6)*80 + 10) * hit_mod; break;
      case 'hpPct': {
        // 雙段評分：一般×0.6 + Boss加權×0.4
        const sn = (p.pct||0)/(p.every||3)*1500;
        const boss_cap_score = Math.min(120/(p.every||3)*1.5, (p.pct||0)*7000/(p.every||3)*1.5);
        effect_score += sn * 0.6 + boss_cap_score * 0.4;
        break;
      }
      case 'vuln':        effect_score += (p.cap || 0) * 70 * hit_mod; break;
      case 'execute':     effect_score += (p.threshold||0)*(p.mult||1)*20 * hit_mod; break;
      case 'unstable':    effect_score += 8; break;
      case 'knockback':   effect_score += (p.dist || 0) * 8; break;
      case 'ramp':        effect_score += (p.cap || 0) * 60; break;          // 不乘 aoe_mod
      case 'chain':       effect_score += (p.targets||0)*(p.decay||0)*50; break; // 不乘 aoe_mod
      case 'pierce':      effect_score += (p.dmgUp || 0) * 150; break;
      case 'killGold':    effect_score += (p.bonus || 0) * 4; break;         // 降分後 ×4
      case 'permaBuff':   effect_score += 55; break;
      case 'aura_dmg': {
        const r = p.radius || 2;
        effect_score += (p.pct || 0) * 350 * (1 + r * 0.4);
        break;
      }
      case 'aura_range': {
        const r = p.radius || 2;
        effect_score += (p.bonus || 0) * 60 * (1 + r * 0.4);
        break;
      }
      case 'aura_atkSpd': {
        const r = p.radius || 2;
        effect_score += (p.bonus || 0) * 350 * (1 + r * 0.4);
        break;
      }
      case 'zone':        effect_score += 50 * aoe_mod; break;
    }
  });

  const raw_total = Math.round(dps_score + effect_score);
  const score_adj = t.score_adj || 1.0;
  const effective = Math.round(raw_total * score_adj);
  const target = LV_TARGET[lv] || 410;
  const ratio = effective / target;

  return {
    dps_score: Math.round(dps_score),
    effect_score: Math.round(effect_score),
    raw_total,
    score_adj,
    effective,
    target,
    ratio,
    color: ratio >= (1 - LV_ACCEPTABLE) && ratio <= (1 + LV_ACCEPTABLE)
      ? '#4c4'   // 綠：±15% 正常
      : ratio >= 0.75 && ratio <= 1.40
      ? '#cc4'   // 黃：偏高或偏低
      : '#c44'   // 紅：明顯失衡
  };
}
```

### B. hpPct 更新（更新現有 L244~246）

```js
// 現有
addDPS += pct * enemyHP * spd / (every || 3);

// 更新後（支援 cap）
const hpRaw = pct * enemyHP * spd / (every || 3);
const hpCapped = p.cap ? Math.min(pct * p.cap / (every || 3), hpRaw) : hpRaw;
addDPS += hpCapped;
```

### C. 表格欄位（在現有 th 列加入）

```html
<th data-sort="score_eff" title="塔設計分（目標410/Lv4）">Score</th>
```

### D. 表格列顯示（在 render 函式的 td 列加入）

```js
const sc = calcTowerScore(t);
// 在塔名後加入 score cell
`<td style="color:${sc.color};font-weight:bold;" title="DPS:${sc.dps_score} Effect:${sc.effect_score} raw:${sc.raw_total} adj:${sc.score_adj}">${sc.effective}<br><span style="font-size:9px;color:#888">${Math.round(sc.ratio*100)}%</span></td>`
```

---

## 定位方式

```
1. Grep 找：function calcEffectiveDPS  → Read ±5 行，找插入點加 calcTowerScore 函式
2. Grep 找：<th data-sort="dps">       → Read ±3 行，找 th 插入點
3. Grep 找：data-sort="edps"           → 找 render 中 td 的格式，確認插入位置
4. Grep 找：case 'hpPct'（dps-calc）  → 找 L341~345，更新 hpPct cap 邏輯
```

---

## 注意
- step2、step3 完成後才執行（需要 towers.js 的 `cap` 和 `score_adj` 欄位）
- 完成後提醒執行 `/clear`
