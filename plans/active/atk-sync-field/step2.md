# Step 2：game.js — 實作 cycle_* 攻速同步邏輯

## 目標
在塔的攻擊迴圈「確認有目標之後」插入 cycle_* 觸發，對範圍內所有敵人施加效果。

## 影響範圍
- 檔案：`js/game.js`
- **唯一插入點**：約 2814 行之後（`const target = targets[0];` 之後）

## 插入點精確定位

執行前必做（⚠️ 強制定位流程）：
```
Grep: "const target = targets\[0\]"
Read ±10 行確認 context
```

預期 context（約 2813–2820）：
```js
        if (targets.length === 0) { tw.atkTimer = 0; break; }
        const target = targets[0];    ← 確認有目標

        tw.atkCount = (tw.atkCount || 0) + 1;
        // ... 以下是各種 proc 技能
```

## 修改 1：插入 cycle_* 處理（緊接 `const target = targets[0];` 之後）

```js
        // ── cycle_* 攻速同步場效應 ──
        const cycleStun  = getSkill(tw, 'cycle_stun');
        const cycleChill = getSkill(tw, 'cycle_chill');
        const cycleShred = getSkill(tw, 'cycle_shred');
        const cycleVuln  = getSkill(tw, 'cycle_vuln');
        const cycleBurn  = getSkill(tw, 'cycle_burn');

        if (cycleStun || cycleChill || cycleShred || cycleVuln || cycleBurn) {
          // 各技能可能有不同 radius，分別取範圍
          const _cycleEffects = [
            cycleStun  && { sk: cycleStun,  type: 'stun'  },
            cycleChill && { sk: cycleChill, type: 'chill' },
            cycleShred && { sk: cycleShred, type: 'shred' },
            cycleVuln  && { sk: cycleVuln,  type: 'vuln'  },
            cycleBurn  && { sk: cycleBurn,  type: 'burn'  },
          ].filter(Boolean);

          for (const { sk, type } of _cycleEffects) {
            const nearby = this.getEnemiesNear(tw.x, tw.y, sk.radius);
            if (nearby.length === 0) continue;

            nearby.forEach(e => {
              const ccMult = hasSkill(e, 'tenacity') ? (1 - getSkill(e, 'tenacity').ccReduce) : 1;
              if (type === 'stun') {
                const dur = Math.min(sk.dur, 2.0) * ccMult;  // hardcap 2.0s
                e.stunTimer = Math.max(e.stunTimer || 0, dur);
              } else if (type === 'chill') {
                e.chillStacks = Math.min((e.chillStacks || 0) + sk.stacksPerCycle, GLOBAL_CAPS.chillMaxStacks);
              } else if (type === 'shred') {
                e.shredStacks = Math.min((e.shredStacks || 0) + sk.stacksPerCycle, GLOBAL_CAPS.shredMaxStacks);
              } else if (type === 'vuln') {
                e.vulnStacks = Math.min((e.vulnStacks || 0) + sk.stacksPerCycle, GLOBAL_CAPS.vulnMaxStacks);
              } else if (type === 'burn') {
                e.burnDmg = (tw.damage || 10) * sk.dot;
                e.burnTimer = sk.dur;
              }
            });

            // ring 視覺
            const ringColor = {
              stun:  'rgba(255,220,50,0.5)',
              chill: 'rgba(100,200,255,0.4)',
              shred: 'rgba(200,120,50,0.4)',
              vuln:  'rgba(220,80,180,0.4)',
              burn:  'rgba(255,80,0,0.4)',
            }[type];
            this.effects.push({ x: tw.x, y: tw.y, r: sk.radius, type: 'ring', color: ringColor, dur: 0.25, t: 0 });
          }
        }
        // ── cycle_* end ──
```

## 修改 2：確認 ring effect 視覺已有繪製支援

Grep `type.*ring` in game.js 確認是否已有 ring 繪製邏輯。
- 若 range-skills/step2 已執行：ring 已存在，跳過
- 若尚未：新增繪製（見 range-skills/step2.md 修改 3）

## 注意事項

### CC 抗性（tenacity）
- cycle_stun 已套用 ccMult（tenacity 支援）
- chill / shred / vuln 的 cc 相關性較低，但若後續 freeze（由 chill 觸發）也算 CC，需注意

### hardcap
- `cycle_stun` dur 強制 `Math.min(sk.dur, 2.0)`，確保不超過 2 秒
- stacks 類由 GLOBAL_CAPS 限制（已有）

### burnDmg vs burnDot 欄位名稱
執行前 Grep `burnDmg\|burnDot\|burnTimer` 確認敵人 burn 欄位實際名稱（現有搜尋顯示 `burnDmg, burnTimer`，確認一致）

## 完成標準
- 有目標的攻擊同時對範圍內所有敵人觸發 cycle_* 效果
- 無目標（break 前）不觸發任何 cycle_* 效果
- ring 視覺每次攻擊閃一下
- tenacity 敵人的 stunTimer 正確縮減
- 不修改 skills.js（step1 已完成）
