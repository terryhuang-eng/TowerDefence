# Step 2：game.js — 實作 field_* 技能邏輯

## 目標
在遊戲主迴圈中加入 field 技能的三種執行模式：
1. **Aura 型**（field_slow / field_shred / field_vuln）：每幀維持敵人 stacks 不低於閾值
2. **CD 脈衝型**（field_stun / field_dmg）：每 cd 秒觸發一次，播放視覺
3. **Interval 刷新型**（field_burn）：每 interval 秒覆寫 burn 狀態

## 影響範圍
- 檔案：`js/game.js`
- 插入點 1（Aura 型）：現有 aura 預計算區塊（`// 預計算 aura 增益` 附近，約行 2773）
- 插入點 2（CD / Interval 型）：塔攻擊迴圈內，zone 處理之後（約行 2947 附近）
- 插入點 3（視覺）：effects / ring 繪製區

## 需確認的敵人狀態欄位
執行前 grep 確認：
- `e.stunTimer` — 是否已存在（field_stun 會用到）
- `e.chillStacks`, `e.shredStacks`, `e.vulnStacks` — 已存在
- `e.burnDot`, `e.burnDur` — burn 相關欄位名稱

## 修改 1：Aura 型（每幀）

插入位置：緊接在 aura_dmg / aura_atkSpd / aura_range 處理迴圈之後（約 2789 行後）

```js
    // Field：以塔為中心，對範圍內敵人維持 stacks（aura 型）
    for (const tw of this.towers) {
      const fSlow  = getSkill(tw, 'field_slow');
      const fShred = getSkill(tw, 'field_shred');
      const fVuln  = getSkill(tw, 'field_vuln');
      if (!fSlow && !fShred && !fVuln) continue;
      this.getEnemiesNear(tw.x, tw.y, fSlow ? fSlow.radius : fShred ? fShred.radius : fVuln.radius).forEach(e => {
        if (fSlow)  { e.chillStacks = Math.max(e.chillStacks || 0, fSlow.chillStacks); e.chillDecay = 0; }
        if (fShred) { e.shredStacks = Math.max(e.shredStacks || 0, fShred.shredStacks); e.shredDecay = 0; }
        if (fVuln)  { e.vulnStacks  = Math.max(e.vulnStacks  || 0, fVuln.vulnStacks);  e.vulnDecay  = 0; }
      });
    }
```

注意：若多個 field_* 半徑不同，需分別取範圍（三個 skill 各自取各自 radius）。完整版本：

```js
    // Field aura 型：以塔為中心維持敵人 debuff stacks
    for (const tw of this.towers) {
      const fSlow  = getSkill(tw, 'field_slow');
      const fShred = getSkill(tw, 'field_shred');
      const fVuln  = getSkill(tw, 'field_vuln');
      if (fSlow) {
        this.getEnemiesNear(tw.x, tw.y, fSlow.radius).forEach(e => {
          e.chillStacks = Math.max(e.chillStacks || 0, fSlow.chillStacks); e.chillDecay = 0;
        });
      }
      if (fShred) {
        this.getEnemiesNear(tw.x, tw.y, fShred.radius).forEach(e => {
          e.shredStacks = Math.max(e.shredStacks || 0, fShred.shredStacks); e.shredDecay = 0;
        });
      }
      if (fVuln) {
        this.getEnemiesNear(tw.x, tw.y, fVuln.radius).forEach(e => {
          e.vulnStacks = Math.max(e.vulnStacks || 0, fVuln.vulnStacks); e.vulnDecay = 0;
        });
      }
    }
```

## 修改 2：CD 脈衝型 + Interval 型（在塔攻擊迴圈，zone 處理後）

插入位置：緊接在 `this.zones = this.zones.filter(...)` 之後（約 2959 行）

```js
    // Field pulse 型（field_stun / field_dmg）及 interval 型（field_burn）
    for (const tw of this.towers) {
      const fStun = getSkill(tw, 'field_stun');
      const fDmg  = getSkill(tw, 'field_dmg');
      const fBurn = getSkill(tw, 'field_burn');
      if (!fStun && !fDmg && !fBurn) continue;

      // field_stun
      if (fStun) {
        if (tw._fieldStunCd === undefined) tw._fieldStunCd = 0;
        tw._fieldStunCd -= dt;
        if (tw._fieldStunCd <= 0) {
          tw._fieldStunCd = fStun.cd;
          this.getEnemiesNear(tw.x, tw.y, fStun.radius).forEach(e => {
            e.stunTimer = Math.max(e.stunTimer || 0, fStun.dur);
          });
          // ring 視覺 effect
          this.effects.push({ x: tw.x, y: tw.y, r: fStun.radius, type: 'ring', color: 'rgba(255,220,50,0.5)', dur: 0.4, t: 0 });
        }
      }

      // field_dmg
      if (fDmg) {
        if (tw._fieldDmgCd === undefined) tw._fieldDmgCd = 0;
        tw._fieldDmgCd -= dt;
        if (tw._fieldDmgCd <= 0) {
          tw._fieldDmgCd = fDmg.cd;
          const dmgAmt = (tw.damage || 10) * fDmg.flat;
          this.getEnemiesNear(tw.x, tw.y, fDmg.radius).forEach(e => {
            const armor = e.armor || 0;
            const actualDmg = dmgAmt * (1 - armor);
            e.hp -= Math.max(1, actualDmg);
            this.addDmgText(e.x, e.y, Math.round(actualDmg));
          });
          this.effects.push({ x: tw.x, y: tw.y, r: fDmg.radius, type: 'ring', color: 'rgba(255,100,50,0.4)', dur: 0.3, t: 0 });
        }
      }

      // field_burn
      if (fBurn) {
        if (tw._fieldBurnCd === undefined) tw._fieldBurnCd = 0;
        tw._fieldBurnCd -= dt;
        if (tw._fieldBurnCd <= 0) {
          tw._fieldBurnCd = fBurn.interval;
          const burnDps = (tw.damage || 10) * fBurn.dot;
          this.getEnemiesNear(tw.x, tw.y, fBurn.radius).forEach(e => {
            e.burnDot = burnDps;
            e.burnTimer = fBurn.dur;
          });
          this.effects.push({ x: tw.x, y: tw.y, r: fBurn.radius, type: 'ring', color: 'rgba(255,80,0,0.35)', dur: 0.3, t: 0 });
        }
      }
    }
```

## 修改 3：ring effect 視覺繪製

搜尋 effects 繪製區（約 3155 行），確認是否有 ring type。若無，新增：

```js
      } else if (f.type === 'ring') {
        const cs = CONFIG.cellSize;
        const progress = f.t / f.dur;  // 0→1
        const alpha = (1 - progress) * 0.7;
        ctx.beginPath();
        ctx.arc(this.offsetX + f.x*cs + cs/2, this.offsetY + f.y*cs + cs/2, f.r * cs * (0.7 + 0.3*progress), 0, Math.PI*2);
        ctx.strokeStyle = f.color.replace(/[\d.]+\)$/, alpha + ')');
        ctx.lineWidth = 3;
        ctx.stroke();
```

## 修改 4：確認 stunTimer 欄位（若不存在需新增處理）

Grep `stunTimer` in game.js，若尚無，需在敵人移動/更新迴圈中加入：
```js
      // stun 處理
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        e.stunTimer = Math.max(0, e.stunTimer);
        // stunTimer > 0 時敵人停止移動（在速度計算時加判斷）
      }
```
並在移動更新中加 `if (e.stunTimer > 0) return;`（或 `continue`）。

## 完成標準
- field_slow / field_shred / field_vuln：在範圍內敵人被維持 stacks，離開後自然衰退
- field_stun：每 cd 秒暈眩 + ring 視覺效果出現
- field_dmg：每 cd 秒範圍傷害 + ring 視覺效果
- field_burn：每 interval 秒覆寫 burn 狀態 + ring 視覺效果
- 不修改 skills.js（step1 已完成）
