# Step 3：改進 estimateDPS — 技能加權

## 目標

修正 `autotest.js` 的 `estimateDPS()` 函數，加入技能效果貢獻，讓 B/C/D 組的排名更可信。

## 影響範圍

**檔案：autotest.js**
**位置：L328-336**（`function estimateDPS`）

## 現況

```js
function estimateDPS(game) {
  let dps = 0;
  for (const tw of game.towers) {
    let d = tw.damage * tw.atkSpd;
    if (tw.aoe > 0) d *= 2; // 粗估 AOE 命中 2 目標
    dps += d;
  }
  return Math.round(dps);
}
```

問題：完全無視技能 → 燎原塔（高技能低傷害）永遠排在暴焰後面。

## 修改方案

```js
function estimateDPS(game) {
  let dps = 0;
  for (const tw of game.towers) {
    // 基礎 DPS
    let d = tw.damage * tw.atkSpd;

    // AOE 命中係數（aoe=1 → ×3, aoe=1.5 → ×4, aoe=2 → ×5）
    const aoeTargets = tw.aoe > 0 ? Math.max(2, 1 + Math.round(tw.aoe * 2)) : 1;
    d *= aoeTargets;

    // 技能加成
    for (const sk of (tw.skills || [])) {
      const p = sk.params || {};
      switch (sk.id) {
        case 'burn':
          d += (p.dot ?? 0.20) * tw.damage * 3 * tw.atkSpd; break;
        case 'ignite':
          d += (p.flat ?? 0.20) * tw.damage * tw.atkSpd * 0.4; break;
        case 'detonate':
          d += (p.ratio ?? 1.0) * tw.damage * tw.atkSpd * 0.2; break;
        case 'chill':
          d *= 1 + Math.min((p.perStack ?? 0.02) * 20, (p.cap ?? 40) * (p.perStack ?? 0.02)); break;
        case 'shred':
          d *= 1 + (p.amt ?? 0.05) * 5; break; // 約 5 層碎甲
        case 'vulnerability':
          d *= 1 + (p.amt ?? 0.05) * 3; break;
        case 'chain':
          d *= 1 + (p.targets ?? 2) * (p.decay ?? 0.5); break;
        case 'hpPct':
          d += (p.pct ?? 0.02) * 500 / (p.every ?? 3) * tw.atkSpd; break; // 標準 500 HP
        case 'ramp':
          d *= 1 + (p.cap ?? 0.3) / 2; break;
        case 'pierce':
          d *= 1 + (p.dmgUp ?? 0.10) * 1.5; break;
        case 'multishot':
          d *= (p.count ?? 2); break;
        case 'execute':
          d *= 1.10; break;
        case 'warp':
          d *= 1.08; break;
        case 'knockback':
          d *= 1.10; break;
        case 'zone':
          d *= 1.15; break;
        // aura_* / killGold / lifedrain / permaBuff / unstable 不影響自身 DPS 估算
      }
    }

    dps += d;
  }
  return Math.round(dps);
}
```

## 驗證方法

改完後重跑 B 組全測，觀察：
1. 燎原塔（burn+ramp+pierce）排名是否從末段提升
2. 暴焰塔（burn×3強化）是否仍在前段
3. 感電塔（chill+chain）是否排在深寒塔附近

若排名直覺上不合理，調整對應技能的加成係數。

## 工作量

約 30-40 行，修改一個函數，不影響其他邏輯。

## 依賴

無（獨立修改）。先做此步驟，讓後續 D 組測試的排名可信度提升。
