# 計畫：field 技能（以塔為中心的射程範圍效果）

## 問題分析

### 現有技能系統分三層：
| 類型 | 作用對象 | 觸發時機 | 代表技能 |
|------|---------|---------|---------|
| `aura_*` | 周圍友軍塔 | 每幀持續 | aura_dmg, aura_atkSpd, aura_range |
| `zone_*` | 命中位置周圍敵人 | 彈丸落點 | zone_slow, zone_shred |
| proc 類 | 攻擊目標（單體/跳躍） | 每次攻擊 | burn, shred, chill, vulnerability… |

**缺口**：沒有「以塔為中心，主動對攻擊範圍內所有敵人施加持續效果」的技能。

### field_* 技能概念
- **位置**：以塔格為中心
- **半徑**：獨立配置（預設等同 / 略小於攻擊射程）
- **時機**：每幀或每 interval 秒 tick 一次
- **對象**：所有在範圍內的敵人
- **特性**：不依賴彈丸命中，可設計純支援型「場效應塔」

---

## 效果適用性分析

### ✅ 高度適合

| 技能 ID | 名稱 | 效果機制 | tick 方式 | 設計價值 | 與現有技能差異 |
|---------|------|---------|---------|---------|--------------|
| `field_slow` | 範圍減速 | 維持 chillStacks ≥ target 層 | 每幀（aura 型，離開即衰退） | ⭐⭐⭐ 高 | zone_slow 是落點產生水窪；field_slow 是塔主動持續壓制 |
| `field_shred` | 範圍碎甲 | 維持 shredStacks ≥ target 層 | 每幀（aura 型） | ⭐⭐⭐ 高 | zone_shred 需要命中觸發；field_shred 可設計成「光環碎甲支援塔」 |
| `field_vuln` | 範圍易傷 | 維持 vulnStacks ≥ target 層 | 每幀（aura 型） | ⭐⭐⭐ 高 | 現有 vulnerability 是 per hit 疊層；field_vuln 是「易傷場」 |
| `field_stun` | 範圍暈眩 | 對範圍內敵人施加 stun 狀態 | CD 型（每 cd 秒脈衝一次） | ⭐⭐⭐ 高 | warp 是單體命中觸發；field_stun 是範圍週期性 CC |

### ✅ 適合

| 技能 ID | 名稱 | 效果機制 | tick 方式 | 設計價值 | 備注 |
|---------|------|---------|---------|---------|------|
| `field_burn` | 範圍灼燒 | 對範圍內敵人施加 burn 狀態 | 每 interval 秒刷新 | ⭐⭐ 中高 | 配合 detonate 有 AOE 引爆組合；burn 本身就有持續時間，不需要每幀疊 |
| `field_dmg` | 範圍傷害 | 每 interval 秒對範圍內所有敵人造成 flat 傷害 | CD 型 pulse | ⭐⭐ 中高 | 無彈丸視覺，「脈衝塔」概念；數值需謹慎（可能過強 AOE） |

### ⚠️ 需要審慎設計

| 技能 ID | 名稱 | 說明 | 問題 |
|---------|------|------|------|
| `field_freeze` | 範圍冰凍 | 直接定身（不需要疊 chill 層） | 極強 CC，需要長 cd（≥10s）或條件限制，否則破壞平衡 |
| `field_hpPct` | 範圍 %HP 傷害 | 對範圍所有敵人 %HP 每秒傷害 | 數值爆炸風險高；需要嚴格 per-enemy CD 控制 |

### ❌ 不適合做 field 版本

| 技能 | 原因 |
|------|------|
| `field_knockback` | knockback 需要方向性 + 物理反饋，群體同時 knockback 視覺混亂且遊戲性不佳 |
| `field_ignite` / `field_detonate` | 這兩個本身是「反應技能」（觸發型），改成 field 會失去組合深度 |
| `field_chain` / `field_pierce` | 彈丸特性技能，field 概念矛盾 |

---

## 建議實作清單（優先順序）

### 第一批（核心 field 技能）
1. `field_slow` — 範圍減速（aura 型，維持 chill 層）
2. `field_shred` — 範圍碎甲（aura 型，維持 shred 層）
3. `field_vuln` — 範圍易傷（aura 型，維持 vuln 層）
4. `field_stun` — 範圍暈眩（CD 脈衝型，可設定 dur + cd）

### 第二批（選擇性）
5. `field_burn` — 範圍灼燒（interval 刷新型）
6. `field_dmg` — 範圍傷害（CD 脈衝型）

---

## 技術設計

### 兩種 field 行為模式

**A. Aura 型（維持層數）**
- 用途：slow / shred / vuln
- 邏輯：每幀找到範圍內所有敵人，將其指定 stacks 強制維持在 ≥ target
- 離開範圍後：自然衰退（使用全域 decayRate）
- 實作位置：`game.js` 的 aura 預計算區塊旁邊

```
每幀：
  for (const tw of towers with field_slow) {
    for (const e of getEnemiesNear(tw, field_slow.radius)) {
      e.chillStacks = Math.max(e.chillStacks, field_slow.chillStacks);
    }
  }
```

**B. CD 脈衝型（週期性 pulse）**
- 用途：stun / dmg
- 邏輯：每個 field 技能有 `_fieldCd` 計時器，歸零時觸發，重置為 cd
- 視覺：觸發時在塔周圍播放 ring effect
- 實作位置：塔的 update 迴圈內

```
每幀：
  if (hasSkill(tw, 'field_stun')) {
    tw._fieldStunCd = (tw._fieldStunCd || 0) - dt;
    if (tw._fieldStunCd <= 0) {
      tw._fieldStunCd = field_stun.cd;
      for (const e of getEnemiesNear(tw, field_stun.radius)) {
        e.stunTimer = Math.max(e.stunTimer || 0, field_stun.dur);
      }
      // 播放 ring effect
    }
  }
```

**C. Interval 刷新型（定期覆寫 buff 狀態）**
- 用途：burn
- 邏輯：每 interval 秒對範圍內敵人施加/覆寫 burn（延長持續時間）
- 與 A 的差異：burn 有獨立 dur，不是 stack 數值

---

## SKILL_DEFS 新增草案

```js
// field_* 系列（以塔為中心，對範圍內敵人持續施加效果）
field_slow  : { category: 'tower', group: 'field', name: '範圍減速場', defaults: {radius:2, chillStacks:40}, desc: '以塔為中心，範圍內所有敵人持續維持 chillStacks 層冰冷。離開範圍後自然衰退。', scoreBase: 25, scorePrimary: 'chillStacks', scoreRef: 40 },
field_shred : { category: 'tower', group: 'field', name: '範圍碎甲場', defaults: {radius:2, shredStacks:15}, desc: '以塔為中心，範圍內所有敵人持續維持 shredStacks 層碎甲。', scoreBase: 35, scorePrimary: 'shredStacks', scoreRef: 15 },
field_vuln  : { category: 'tower', group: 'field', name: '範圍易傷場', defaults: {radius:2, vulnStacks:10}, desc: '以塔為中心，範圍內所有敵人持續維持 vulnStacks 層易傷。', scoreBase: 35, scorePrimary: 'vulnStacks', scoreRef: 10 },
field_stun  : { category: 'tower', group: 'field', name: '範圍暈眩脈衝', defaults: {radius:2, dur:0.8, cd:6}, desc: '每 cd 秒對範圍內所有敵人暈眩 dur 秒。', scoreBase: 50, scorePrimary: 'dur', scoreRef: 0.8 },
field_burn  : { category: 'tower', group: 'field', name: '範圍灼燒場', defaults: {radius:2, dot:0.2, dur:3, interval:1}, desc: '每 interval 秒對範圍內所有敵人施加/覆寫灼燒（dot×DPS，持續 dur 秒）。', scoreBase: 30, scorePrimary: 'dot', scoreRef: 0.2 },
field_dmg   : { category: 'tower', group: 'field', name: '範圍傷害脈衝', defaults: {radius:2, flat:0.5, cd:2}, desc: '每 cd 秒對範圍內所有敵人造成 flat×ATK 傷害。', scoreBase: 40, scorePrimary: 'flat', scoreRef: 0.5 },
```

---

## 執行步驟

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1 | `js/skills.js` | 新增 field_slow / field_shred / field_vuln / field_stun / field_burn / field_dmg 到 SKILL_DEFS；更新 getSkillDesc switch-case |
| step2 | `js/game.js` | 實作 aura 型（field_slow/shred/vuln）每幀處理；實作 CD 脈衝型（field_stun/dmg）更新邏輯；實作 interval 型（field_burn）；新增 ring effect 視覺 |
