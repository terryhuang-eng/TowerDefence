# Step 1：刪除光環自身排除判斷

## 目標
刪除 `js/game.js` 光環預計算迴圈中的 `if (tw === src) continue;`，
讓持有光環技能的塔同樣受到自身光環加成。

## 影響範圍
- 唯一修改：`js/game.js` 1 行刪除
- 涉及邏輯：aura_dmg / aura_atkSpd / aura_range 三種光環技能
- 不影響：field 型技能（field_slow/field_shred/field_vuln）、攻擊邏輯、其他技能

## 具體修改

**定位**：Grep `if \(tw === src\) continue;`，確認行號後 Read ±3 行確認 context

**修改前**：
```js
    for (const src of this.towers) {
      const ad = getSkill(src, 'aura_dmg');
      const aa = getSkill(src, 'aura_atkSpd');
      const ar = getSkill(src, 'aura_range');
      if (!ad && !aa && !ar) continue;
      for (const tw of this.towers) {
        if (tw === src) continue;          // ← 刪除此行
        const dist = Math.hypot(tw.x - src.x, tw.y - src.y);
        if (ad && dist <= ad.radius) { tw._auraDmgFlat += ad.flat; tw._auraDmgPct += ad.pct; }
        if (aa && dist <= aa.radius) tw._auraAtkSpd = Math.min(GLOBAL_CAPS.atkSpdBonus, tw._auraAtkSpd + aa.bonus);
        if (ar && dist <= ar.radius) tw._auraRange += ar.bonus;
      }
    }
```

**修改後**：
```js
    for (const src of this.towers) {
      const ad = getSkill(src, 'aura_dmg');
      const aa = getSkill(src, 'aura_atkSpd');
      const ar = getSkill(src, 'aura_range');
      if (!ad && !aa && !ar) continue;
      for (const tw of this.towers) {
        const dist = Math.hypot(tw.x - src.x, tw.y - src.y);
        if (ad && dist <= ad.radius) { tw._auraDmgFlat += ad.flat; tw._auraDmgPct += ad.pct; }
        if (aa && dist <= aa.radius) tw._auraAtkSpd = Math.min(GLOBAL_CAPS.atkSpdBonus, tw._auraAtkSpd + aa.bonus);
        if (ar && dist <= ar.radius) tw._auraRange += ar.bonus;
      }
    }
```

## 定位流程（執行時必做）
1. `Grep "if \(tw === src\) continue;"` → 確認行號
2. `Read ±5 行` → 確認 context（應在雙層 for...of towers 迴圈中）
3. `Edit` 刪除該行（old_string 含足夠 context 以保唯一性）

## 驗收
- 純風 Lv6（range:4.5 + aura_range bonus:1）攻擊時 effRange = 5.5
- 純雷 Lv6（atkSpd:1.6 + aura_atkSpd bonus:0.25）atkTimer += dt × 1.6 × 1.25 = ×2.0 等效
- 純土 Lv6（damage:180 + aura_dmg pct:0.2）effDmg = floor(180 × 1.2) = 216
