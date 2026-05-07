// ============================================================
// AutoTest Bot — 自動化平衡測試系統
// 載入方式：在 index.html 的 </body> 前加上 <script src="autotest.js"></script>
// 或在 console 執行：fetch('autotest.js').then(r=>r.text()).then(eval)
// 使用：AutoTest.run('balanced') 或 AutoTest.runAll()
// ============================================================

const AutoTest = (() => {

  const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];

  // ── 策略定義 ──
  // ── 策略分兩組 ──
  // A 組：經濟分配測試（固定元素，比較不同資源配置）
  // B 組：塔型強度測試（固定均衡經濟，比較不同元素組合）
  // 放塔規則統一與 AI 一致（aiMaxTowers, aiTowerCost, 交替箭砲, 路徑旁等距）
  const STRATEGIES = {
    // ═══ A 組：經濟分配 ═══
    balanced: {
      name: '均衡型',
      group: 'A',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'water', 'fire', 'water'],
    },
    income_rush: {
      name: '經濟衝刺型',
      group: 'A',
      towerBudgetRatio: 0.30, sendBudgetRatio: 0.65,
      elemPicks: ['fire', 'fire', 'fire', 'fire'],
    },
    tower_first: {
      name: '防守優先型',
      group: 'A',
      towerBudgetRatio: 0.80, sendBudgetRatio: 0.10,
      elemPicks: ['fire', 'water', 'fire', 'water'],
    },
    all_in_send: {
      name: '極端進攻型',
      group: 'A',
      towerBudgetRatio: 0.15, sendBudgetRatio: 0.80,
      elemPicks: ['fire', 'fire', 'fire', 'fire'],
    },

    // ═══ B 組：純屬（6 種）═══
    pure_fire: {
      name: '🔥 純火',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'fire', 'fire', 'fire'],
    },
    pure_water: {
      name: '💧 純水',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'water', 'water', 'water'],
    },
    pure_earth: {
      name: '⛰️ 純土',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'earth', 'earth', 'earth'],
    },
    pure_wind: {
      name: '🌪️ 純風',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['wind', 'wind', 'wind', 'wind'],
    },
    pure_thunder: {
      name: '⚡ 純雷',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'thunder', 'thunder', 'thunder'],
    },
    pure_none: {
      name: '⬜ 純無',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['none', 'none', 'none', 'none'],
    },
    // ═══ B 組：混屬（五角環相鄰對）═══
    mix_fire_water: {
      name: '🔥💧 火水',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'water', 'fire', 'water'],
    },
    mix_water_earth: {
      name: '💧⛰️ 水土',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'earth', 'water', 'earth'],
    },
    mix_earth_wind: {
      name: '⛰️🌪️ 土風',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'wind', 'earth', 'wind'],
    },
    mix_wind_thunder: {
      name: '🌪️⚡ 風雷',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['wind', 'thunder', 'wind', 'thunder'],
    },
    mix_thunder_fire: {
      name: '⚡🔥 雷火',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'fire', 'thunder', 'fire'],
    },
    // ═══ B 組：混屬（none 相關，5 種）═══
    mix_fire_none: {
      name: '🔥⬜ 火無',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'none', 'fire', 'none'],
    },
    mix_water_none: {
      name: '💧⬜ 水無',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'none', 'water', 'none'],
    },
    mix_earth_none: {
      name: '⛰️⬜ 土無',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'earth', 'none'],
    },
    mix_wind_none: {
      name: '🌪️⬜ 風無',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['wind', 'none', 'wind', 'none'],
    },
    mix_thunder_none: {
      name: '⚡⬜ 雷無',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'none', 'thunder', 'none'],
    },
    // ═══ B 組：混屬（非相鄰非 none，5 種）═══
    mix_fire_earth: {
      name: '🔥⛰️ 火土',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'earth', 'fire', 'earth'],
    },
    mix_fire_wind: {
      name: '🔥🌪️ 火風',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'wind', 'fire', 'wind'],
    },
    mix_water_wind: {
      name: '💧🌪️ 水風',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'wind', 'water', 'wind'],
    },
    mix_water_thunder: {
      name: '💧⚡ 水雷',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'thunder', 'water', 'thunder'],
    },
    mix_earth_thunder: {
      name: '⛰️⚡ 土雷',
      group: 'B',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'thunder', 'earth', 'thunder'],
    },

    // ═══ C 組：三屬代表（5 種）═══
    triple_fire_water_earth: {
      name: '♨️ 溫泉（火水土）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'water', 'earth', 'fire'],
    },
    triple_fire_water_wind: {
      name: '🌀 颶風（火水風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'water', 'wind', 'fire'],
    },
    triple_earth_thunder_wind: {
      name: '🧲 磁力（土雷風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'thunder', 'wind', 'earth'],
    },
    triple_water_thunder_wind: {
      name: '⛈️ 暴風（水雷風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'thunder', 'wind', 'water'],
    },
    triple_earth_fire_thunder: {
      name: '🌋 火山（土火雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'fire', 'thunder', 'earth'],
    },
    // ═══ C 組：三屬 非無 補完（5 種）═══
    triple_fire_thunder_water: {
      name: '🌋 間歇（火水雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'water', 'thunder', 'fire'],
    },
    triple_earth_fire_wind: {
      name: '🏭 熔爐（土火風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'fire', 'wind', 'earth'],
    },
    triple_fire_thunder_wind: {
      name: '⚡🔥 雷焰（火雷風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'thunder', 'wind', 'fire'],
    },
    triple_earth_water_wind: {
      name: '🌿 沼澤（土水風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'water', 'wind', 'earth'],
    },
    triple_earth_thunder_water: {
      name: '☠️ 腐蝕（土雷水）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'thunder', 'water', 'earth'],
    },
    // ═══ C 組：三屬 反克制（含 none）×5 ═══
    triple_fire_none_thunder: {
      name: '🌬️ 逆風（火無雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'none', 'thunder', 'fire'],
    },
    triple_fire_none_water: {
      name: '🔌 逆雷（火無水）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'none', 'water', 'fire'],
    },
    triple_earth_none_water: {
      name: '🧊 逆焰（土無水）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'water', 'earth'],
    },
    triple_earth_none_wind: {
      name: '🏜️ 逆潮（土無風）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'wind', 'earth'],
    },
    triple_none_thunder_wind: {
      name: '💨 逆岩（雷風無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'wind', 'none', 'thunder'],
    },
    // ═══ C 組：三屬 非相鄰無 ×5 ═══
    triple_earth_fire_none: {
      name: '☄️ 隕石（火土無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'earth', 'none', 'fire'],
    },
    triple_fire_none_wind: {
      name: '🔥🌪️ 燎原（火風無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['fire', 'wind', 'none', 'fire'],
    },
    triple_none_water_wind: {
      name: '🌫️ 迷霧（水風無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['water', 'wind', 'none', 'water'],
    },
    triple_none_thunder_water: {
      name: '🕳️ 吞噬（雷水無）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['thunder', 'water', 'none', 'thunder'],
    },
    triple_earth_none_thunder: {
      name: '🎲 混沌（土無雷）',
      group: 'C',
      towerBudgetRatio: 0.60, sendBudgetRatio: 0.35,
      elemPicks: ['earth', 'none', 'thunder', 'earth'],
    },

    // ═══ D 組：Lv4 單塔隔離測試（sendBudgetRatio=0，純防守）═══
    // elemPicks 格式：[底元素, 注入元素, 底元素, 注入元素]
    // 火底 × 6 注入
    d_fire_fire:     { name: '🔥🔥 暴焰', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','fire','fire','fire'] },
    d_fire_thunder:  { name: '🔥⚡ 電漿', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','thunder','fire','thunder'] },
    d_fire_water:    { name: '🔥💧 蒸汽', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','water','fire','water'] },
    d_fire_wind:     { name: '🔥🌪️ 烈焰', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','wind','fire','wind'] },
    d_fire_earth:    { name: '🔥⛰️ 熔岩', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','earth','fire','earth'] },
    d_fire_none:     { name: '🔥⬜ 純炎', group: 'D', sendBudgetRatio: 0, elemPicks: ['fire','none','fire','none'] },
    // 水底 × 6 注入
    d_water_water:   { name: '💧💧 深寒', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','water','water','water'] },
    d_water_fire:    { name: '💧🔥 沸騰', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','fire','water','fire'] },
    d_water_thunder: { name: '💧⚡ 感電', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','thunder','water','thunder'] },
    d_water_wind:    { name: '💧🌪️ 颶流', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','wind','water','wind'] },
    d_water_earth:   { name: '💧⛰️ 泥濘', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','earth','water','earth'] },
    d_water_none:    { name: '💧⬜ 純水', group: 'D', sendBudgetRatio: 0, elemPicks: ['water','none','water','none'] },
    // 風底 × 6 注入
    d_wind_wind:     { name: '🌪️🌪️ 狂風', group: 'D', sendBudgetRatio: 0, elemPicks: ['wind','wind','wind','wind'] },
    d_wind_fire:     { name: '🌪️🔥 燎原', group: 'D', sendBudgetRatio: 0, elemPicks: ['wind','fire','wind','fire'] },
    d_wind_water:    { name: '🌪️💧 冰颶', group: 'D', sendBudgetRatio: 0, elemPicks: ['wind','water','wind','water'] },
    d_wind_thunder:  { name: '🌪️⚡ 雷暴', group: 'D', sendBudgetRatio: 0, elemPicks: ['wind','thunder','wind','thunder'] },
    d_wind_earth:    { name: '🌪️⛰️ 沙暴', group: 'D', sendBudgetRatio: 0, elemPicks: ['wind','earth','wind','earth'] },
    d_wind_none:     { name: '🌪️⬜ 純風', group: 'D', sendBudgetRatio: 0, elemPicks: ['wind','none','wind','none'] },
  };

  // ── Snapshot 結構 ──
  function takeSnapshot(game) {
    const ai = game.ai || {};
    return {
      wave: game.wave,
      state: game.state,
      // 經濟
      gold: Math.floor(game.gold),
      income: game.income,
      // 戰力
      towerCount: game.towers.length,
      towerLevels: game.towers.map(t => t.level),
      avgTowerLevel: game.towers.length > 0
        ? +(game.towers.reduce((s, t) => s + t.level, 0) / game.towers.length).toFixed(1) : 0,
      estimatedDPS: estimateDPS(game),
      elemPicks: { ...game.elemPicks },
      // 存活
      hp: game.hp,
      // AI
      aiGold: Math.floor(ai.gold || 0),
      aiIncome: ai.income || 0,
      aiTowerCount: (ai.towers || []).length,
      aiHp: ai.hp ?? game.aiHp ?? 99999,
      aiHpDmg: 99999 - (ai.hp ?? 99999),
    };
  }

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

  // ── Bot 決策邏輯 ──
  class Bot {
    constructor(game, strategyId) {
      this.game = game;
      this.strategyId = strategyId;
      this.strategy = STRATEGIES[strategyId];
      this._pathSet = null;
      this.snapshots = [];
      this.waveKillGold = 0;
      this.waveSendSpent = 0;
      this.botTowerLevel = 1; // 與 AI 的 aiTowerLevel 對應
    }

    // 每波開始前做決策
    decide() {
      const g = this.game;
      const s = this.strategy;

      // 依波次更新目標等級（與 AI 一致）
      if (g.wave >= 2) this.botTowerLevel = Math.max(this.botTowerLevel, 2);
      if (g.wave >= 4) this.botTowerLevel = Math.max(this.botTowerLevel, 3);
      if (g.wave >= 9) this.botTowerLevel = Math.max(this.botTowerLevel, 4);
      if (g.wave >= 13) this.botTowerLevel = Math.max(this.botTowerLevel, 5);

      // D 組：依 elemPicks 數量提前解鎖等級上限，全金幣投入塔，不送兵
      if (s.group === 'D') {
        const totalPicks = Object.values(g.elemPicks).reduce((a, b) => a + b, 0);
        if (totalPicks >= 1) this.botTowerLevel = Math.max(this.botTowerLevel, 3);
        if (totalPicks >= 2) this.botTowerLevel = Math.max(this.botTowerLevel, 4);
        this.placeTowers(g.gold);
        this.upgradeTowers(g.gold);
        return;
      }

      const availableGold = g.gold;
      const waveFactor = Math.min(1, g.wave / 10);
      const towerRatio = s.towerBudgetRatio + (1 - waveFactor) * 0.15;
      const sendRatio = s.sendBudgetRatio - (1 - waveFactor) * 0.10;

      const towerBudget = Math.floor(availableGold * Math.min(0.9, towerRatio));
      const sendBudget = Math.floor(availableGold * Math.max(0.05, sendRatio));

      this.placeTowers(towerBudget);
      const placeSpent = availableGold - g.gold;
      this.upgradeTowers(Math.max(0, towerBudget - placeSpent));
      this.sendTroops(sendBudget);
    }

    // 放塔邏輯與 AI 一致（路徑旁等距放置）
    placeTowers(budget) {
      const g = this.game;
      const diffCfg = CONFIG.difficulty[g.difficulty] || CONFIG.difficulty.x1;
      const maxTowers = g.wave >= 13 ? diffCfg.aiMaxTowers + 2 : g.wave >= 7 ? diffCfg.aiMaxTowers + 1 : diffCfg.aiMaxTowers;
      const towerCost = CONFIG.towerCost || 50;
      let remaining = budget;

      if (!this._pathSet) {
        this._pathSet = new Set(g.path.map(p => `${p.x},${p.y}`));
      }
      const occupied = new Set(g.towers.map(tw => `${tw.x},${tw.y}`));
      const pathLen = g.path.length;

      while (g.towers.length < maxTowers && remaining >= towerCost && g.gold >= towerCost) {
        const spacing = pathLen / (maxTowers + 1);
        const idx = g.towers.length;
        const pathIdx = Math.floor(spacing * (idx + 1));
        const pathPos = g.path[Math.min(pathIdx, pathLen - 1)];

        let placed = false;
        for (const d of dirs) {
          const nx = pathPos.x + d.dx, ny = pathPos.y + d.dy;
          const key = `${nx},${ny}`;
          if (!this._pathSet.has(key) && !occupied.has(key) &&
              nx >= 0 && nx < CONFIG.gridCols && ny >= 0 && ny < CONFIG.gridRows &&
              g.grid[ny][nx] === 0) {
            const basicType = idx % 2 === 0 ? 'cannon' : 'arrow';
            const before = g.gold;
            g.doPlaceTower(nx, ny, basicType);
            remaining -= before - g.gold;
            occupied.add(key);
            placed = true;
            break;
          }
        }
        if (!placed) break;
      }
    }

    upgradeTowers(budget) {
      const g = this.game;
      const s = this.strategy;
      let spent = 0;

      const sortedTowers = [...g.towers].sort((a, b) => a.level - b.level);

      for (const t of sortedTowers) {
        if (t.level >= this.botTowerLevel) continue;

        // Basic Lv1 → Lv2
        if (t.level === 1 && this.botTowerLevel >= 2) {
          const bDef = BASIC_TOWERS[t.basicType || 'arrow'];
          const nextData = bDef.levels[1];
          const cost = nextData.cost;
          if (spent + cost <= budget && g.gold >= cost) {
            g.gold -= cost;
            spent += cost;
            t.level = 2;
            t.totalCost = (t.totalCost || 0) + cost;
            Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
          }
          continue;
        }

        // Basic Lv2 → Element Lv3（優先選策略指定元素）
        if (t.level === 2 && !t.elem && this.botTowerLevel >= 3) {
          const totalPicks = Object.values(g.elemPicks).reduce((a, b) => a + b, 0);
          const stratElem = s.elemPicks[totalPicks] || null;
          const availElems = ELEM_KEYS.filter(e => g.elemPicks[e] > 0);
          if (availElems.length === 0) continue;
          // 優先用策略元素，沒有就取第一個有的
          const elem = (stratElem && g.elemPicks[stratElem] > 0) ? stratElem : availElems[0];
          const eb = ELEM_BASE[elem]?.[t.basicType || 'arrow'];
          if (!eb) continue;
          if (spent + eb.cost <= budget && g.gold >= eb.cost) {
            g.gold -= eb.cost;
            spent += eb.cost;
            t.level = 3;
            t.elem = elem;
            t.infuseElem = null;
            t.totalCost = (t.totalCost || 0) + eb.cost;
            Object.assign(t, { damage: eb.damage, atkSpd: eb.atkSpd, range: eb.range, aoe: eb.aoe, skills: eb.skills || [] });
          }
          continue;
        }

        // Lv3 → Lv4（注入第二元素，優先注入相同元素）
        if (t.level === 3 && t.elem && !t.infuseElem && this.botTowerLevel >= 4) {
          const totalPicks = Object.values(g.elemPicks).reduce((a, b) => a + b, 0);
          if (totalPicks < 2) continue;
          // 優先：策略指定的注入元素（elemPicks[1]），再 fallback 到同元素或任意有效元素
          let injElem = null;
          const stratInfuse = s.elemPicks[1] || null;
          if (stratInfuse && stratInfuse !== t.elem &&
              (g.elemPicks[stratInfuse] || 0) >= 1 &&
              INFUSIONS[t.elem]?.[stratInfuse]) {
            injElem = stratInfuse;
          }
          if (!injElem && (g.elemPicks[t.elem] || 0) >= 2) {
            injElem = t.elem;
          }
          if (!injElem) {
            injElem = ELEM_KEYS.find(e => e !== t.elem && (g.elemPicks[e] || 0) >= 1) || null;
          }
          if (!injElem || !INFUSIONS[t.elem]?.[injElem]) continue;
          const lvData = INFUSIONS[t.elem][injElem].lv4;
          if (spent + lvData.cost <= budget && g.gold >= lvData.cost) {
            g.gold -= lvData.cost;
            spent += lvData.cost;
            t.level = 4;
            t.infuseElem = injElem;
            t.totalCost = (t.totalCost || 0) + lvData.cost;
            Object.assign(t, { damage: lvData.damage, atkSpd: lvData.atkSpd, range: lvData.range, aoe: lvData.aoe, skills: lvData.skills || [] });
          }
          continue;
        }

        // Lv4 → Lv5（三屬塔路線，需第三個不同元素）
        if (t.level === 4 && t.infuseElem && t.elem !== t.infuseElem && this.botTowerLevel >= 5) {
          const totalPicks = Object.values(g.elemPicks).reduce((a, b) => a + b, 0);
          if (totalPicks < 3) continue;
          const e3 = ELEM_KEYS.find(e => e !== t.elem && e !== t.infuseElem && (g.elemPicks[e] || 0) >= 1);
          if (!e3) continue;
          const key = g.getTripleKey ? g.getTripleKey(t.elem, t.infuseElem, e3) : [t.elem, t.infuseElem, e3].sort().join('_');
          const triple = TRIPLE_TOWERS?.[key];
          if (!triple) continue;
          const lvData = triple.lv5;
          if (spent + lvData.cost <= budget && g.gold >= lvData.cost) {
            g.gold -= lvData.cost;
            spent += lvData.cost;
            t.level = 5;
            t.thirdElem = e3;
            t.totalCost = (t.totalCost || 0) + lvData.cost;
            Object.assign(t, { damage: lvData.damage, atkSpd: lvData.atkSpd, range: lvData.range, aoe: lvData.aoe, skills: lvData.skills || [] });
          }
        }
      }
    }

    sendTroops(budget) {
      const g = this.game;
      let remaining = Math.min(budget, g.gold);
      this.waveSendSpent = 0;
      const nextWave = g.wave + 1; // getSendQuota 用的是下一波（因為 pre_wave 時 wave 還沒 ++）

      // 從低階到高階送，配額內盡量送滿
      for (const send of INCOME_SENDS) {
        const quota = getSendQuota(send.id, nextWave);
        const used = g.sendUsed[send.id] || 0;
        let canSend = quota - used;

        while (canSend > 0 && remaining >= send.cost && g.gold >= send.cost) {
          // 執行送兵
          g.gold -= send.cost;
          g.income += send.income;
          remaining -= send.cost;
          this.waveSendSpent += send.cost;
          g.sendUsed[send.id] = (g.sendUsed[send.id] || 0) + 1;
          canSend--;

          // 加入 playerSendQueue（會在 startWave 時處理）
          for (let i = 0; i < send.count; i++) {
            g.playerSendQueue.push({
              id: send.id, name: send.name, icon: send.icon,
              hp: send.hp, speed: send.speed, armor: send.armor,
              dmgToBase: send.dmgToBase, color: send.color,
              passive: send.passive, count: 1,
            });
          }
        }
      }
    }

    // 元素選擇策略（按預定義順序選）
    pickElement() {
      const g = this.game;
      const s = this.strategy;
      const totalPicks = Object.values(g.elemPicks).reduce((a, b) => a + b, 0);

      // 使用策略定義的 elemPicks 序列
      const pick = (s.elemPicks && s.elemPicks[totalPicks]) || 'fire';

      // 執行 pick
      g.elemPicks[pick]++;
      const incomeBonus = 15;
      g.income += incomeBonus;
      if (g.mode === 'pve') g.ai.income += incomeBonus;

      // 關閉 overlay，進入 pre_wave
      const overlay = document.getElementById('reward-overlay');
      if (overlay) overlay.style.display = 'none';
      g.state = 'pre_wave';
      g.myReady = false;
      if (g.readyPlayers) g.readyPlayers.clear();

      return pick;
    }

    recordSnapshot(extra = {}) {
      const snap = takeSnapshot(this.game);
      Object.assign(snap, extra);
      this.snapshots.push(snap);
    }
  }

  // ── 測試執行器 ──
  async function runTest(strategyId, options = {}) {
    const {
      difficulty = 'x1',
      speed = 50,        // 每幀跑 N 次 update（50 ≈ 每幀模擬 2.5 秒遊戲時間）
      verbose = true,
    } = options;

    if (verbose) console.log(`\n🤖 開始測試: ${STRATEGIES[strategyId].name} (${strategyId}) | 難度: ${difficulty} | 速度: ×${speed}`);

    // 取得或建立 game instance
    const game = window._game;
    if (!game) {
      console.error('找不到 _game instance。請先開始遊戲。');
      return null;
    }

    // 重置遊戲（重新初始化）
    game.gold = CONFIG.startGold;
    game.hp = CONFIG.startHP;
    game.maxHp = CONFIG.startHP;
    game.income = CONFIG.baseIncome;
    game.wave = 0;
    game.time = 0;
    game.towers = [];
    game.enemies = [];
    game.spawnQueue = [];
    game.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
    game.sendUsed = {};
    game.playerSendQueue = [];
    game.state = 'pre_wave';
    game.difficulty = difficulty;
    game.selectedTower = null;
    game.pendingPlace = null;
    game.myReady = false;
    game.readyPlayers = new Set();
    game.aiTowerLevel = 1;
    game.aiBaseElem = null;
    game.aiInfuseElem = null;
    game.aiElemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
    game._aiPathSet = null; // 重建 AI 路徑快取

    // 重建 grid
    if (game.initGrid) game.initGrid();

    // 隱藏所有 overlay
    ['reward-overlay', 'game-over-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // 重置 AI
    if (game.ai) {
      const aiStart = CONFIG.aiStartGold?.[difficulty] || 350;
      game.ai.gold = aiStart;
      game.ai.income = CONFIG.aiBaseIncome || 50;
      game.ai.hp = 99999;
      game.ai.maxHp = 99999;
      game.ai.towers = [];
      game.ai.totalSent = [];
    }

    const bot = new Bot(game, strategyId);
    const originalSpeed = game.gameSpeed || 1;
    const originalLoop = Game.prototype.loop;

    // 加速：覆蓋 loop，每幀跑多次 update 並跳過渲染
    game.gameSpeed = 1;
    const ticksPerFrame = speed;
    const simDt = 0.05;
    game._turboActive = true;
    let _turboFrameCount = 0;
    game.loop = function turboLoop(now) {
      if (!this._turboActive) return; // 測試結束，停止 turbo loop
      this.lastTime = now;
      if (this.state !== 'won' && this.state !== 'lost') {
        for (let i = 0; i < ticksPerFrame; i++) {
          if (this.state === 'won' || this.state === 'lost') break;
          if (this.state === 'reward' || this.state === 'pre_wave') break;
          this.update(simDt);
          this.time += simDt;
        }
      }
      _turboFrameCount++;
      if (_turboFrameCount % 8 === 0) { // 每 8 幀才 render
        this.render();
        this.updateHUD();
      }
      requestAnimationFrame(this.loop.bind(this));
    };
    // 確保 loop 在跑（前一次測試可能中斷了 rAF 鏈）
    requestAnimationFrame(game.loop.bind(game));

    // 記錄初始狀態
    bot.recordSnapshot({ event: 'init' });

    if (verbose) console.log(`  初始: 💰${game.gold}g | 收入${game.income} | HP${game.hp}`);

    // ── 主循環：每波自動執行 ──
    const result = await new Promise((resolve) => {
      let checkInterval;
      let lastWave = -1;
      let waitingForElemPick = false;

      checkInterval = setInterval(() => {
        // 遊戲結束
        if (game.state === 'won' || game.state === 'lost') {
          clearInterval(checkInterval);
          const survived = game.state === 'won';
          bot.recordSnapshot({ event: 'end', survived });
          if (verbose) {
            console.log(`  ${survived ? '✅ 存活' : '❌ 死亡'} W${game.wave} | 💰${Math.floor(game.gold)}g | HP${game.hp}`);
          }
          resolve({
            strategy: strategyId,
            strategyName: STRATEGIES[strategyId].name,
            difficulty,
            survived,
            finalWave: game.wave,
            finalHP: game.hp,
            finalGold: Math.floor(game.gold),
            finalIncome: game.income,
            snapshots: bot.snapshots,
          });
          return;
        }

        // 元素選擇
        if (game.state === 'reward') {
          const pick = bot.pickElement();
          if (verbose) console.log(`  🔮 W${game.wave} 選元素: ${ELEM[pick].icon} ${ELEM[pick].name}`);
          waitingForElemPick = false;
          return;
        }

        // pre_wave → bot 做決策然後開波
        if (game.state === 'pre_wave' && game.wave !== lastWave) {
          lastWave = game.wave;

          // 記錄上波結束 snapshot
          if (game.wave > 0) {
            bot.recordSnapshot({ event: `wave_${game.wave}_end` });
          }

          // Bot 決策
          bot.decide();

          // 記錄決策後 snapshot
          bot.recordSnapshot({ event: `wave_${game.wave + 1}_pre` });

          if (verbose && (game.wave + 1) % 4 === 0) {
            const snap = bot.snapshots[bot.snapshots.length - 1];
            console.log(`  W${game.wave + 1} 前: 💰${snap.gold}g | 收入${snap.income} | ${snap.towerCount}塔(avg Lv${snap.avgTowerLevel}) | DPS~${snap.estimatedDPS} | HP${snap.hp}`);
          }

          // 開波
          game.startWave();
        }

        // 超時保護（30 秒真實時間）
      }, 16); // 每 16ms 檢查一次

      // 30 秒超時（速度提升後不再需要那麼長）
      setTimeout(() => {
        clearInterval(checkInterval);
        bot.recordSnapshot({ event: 'timeout' });
        resolve({
          strategy: strategyId,
          strategyName: STRATEGIES[strategyId].name,
          difficulty,
          survived: false,
          finalWave: game.wave,
          finalHP: game.hp,
          finalGold: Math.floor(game.gold),
          finalIncome: game.income,
          snapshots: bot.snapshots,
          timeout: true,
        });
      }, 30000);
    });

    // 還原設定
    game._turboActive = false; // 停止 turbo loop
    game.gameSpeed = originalSpeed;
    game.loop = originalLoop;
    // 不重啟正常 loop（下一個測試會自己啟動 turbo，全部測完由 runAll 恢復）

    return result;
  }

  // ── 確保 game instance 存在 ──
  async function ensureGame(options = {}) {
    if (!window._game) {
      document.getElementById('start-screen').style.display = 'none';
      const g = new Game(options.difficulty || 'x1', 'pve');
      window._game = g;
      await new Promise(r => requestAnimationFrame(r));
    }
  }

  // ── 自訂難度注入 ──
  // 從 slider 讀取的 hpMult 動態注入到 CONFIG.difficulty
  // countMult 使用公式：(hpMult - 1) * 0.5 + 1（HP 漲 1.0 時 count 漲 0.5）
  function getDiffId(hpMult) {
    return 'test_' + Math.round(hpMult * 10);
  }
  function injectDifficulty(hpMult) {
    const id = getDiffId(hpMult);
    const countMult = 1 + (hpMult - 1) * 0.5;
    const base = CONFIG.difficulty.x1;
    CONFIG.difficulty[id] = { label: `${hpMult.toFixed(1)}×`, hpMult, countMult, aiHp: base.aiHp, aiBaseIncome: base.aiBaseIncome, aiStartGold: base.aiStartGold, aiTowerCost: base.aiTowerCost, aiMaxTowers: base.aiMaxTowers };
    return id;
  }

  // ── 跑指定組別，單一難度 ──
  async function runGroup(group, options = {}) {
    const overlay = document.getElementById('autotest-overlay');
    const statusEl = document.getElementById('autotest-status');
    const resultsEl = document.getElementById('autotest-results');

    if (overlay) {
      overlay.style.display = 'flex';
      resultsEl.innerHTML = '';
    }

    // 從 slider 讀取難度
    const hpMult = parseFloat(document.getElementById('autotest-diff')?.value || '1.0');
    const diffId = injectDifficulty(hpMult);
    const diffLabel = `${hpMult.toFixed(1)}×`;

    await ensureGame(options);

    const strategyIds = Object.keys(STRATEGIES).filter(id => STRATEGIES[id].group === group);
    const groupName = group === 'A' ? '經濟分配' : group === 'B' ? '塔型強度' : group === 'C' ? '三屬組合' : 'Lv4 隔離';
    const totalRuns = strategyIds.length;
    let runCount = 0;

    const allResults = [];

    for (const sid of strategyIds) {
      runCount++;
      if (statusEl) statusEl.textContent = `${groupName} ${diffLabel}：${runCount}/${totalRuns} — ${STRATEGIES[sid].name}`;
      const r = await runTest(sid, { ...options, difficulty: diffId, speed: 200, verbose: false });
      if (r) allResults.push(r);
    }

    if (statusEl) statusEl.textContent = `${groupName}測試完成！${totalRuns} 策略 @ ${diffLabel}`;
    if (resultsEl) {
      if (group === 'D') {
        appendTowerSummary(resultsEl, allResults, `🔬 Lv4 隔離測試排名 — ${diffLabel}`);
      } else {
        appendRankTable(resultsEl, allResults, `${groupName} — ${diffLabel}`);
      }
    }

    return allResults;
  }

  // ── 跑所有策略（單一難度）──
  async function runAll(options = {}) {
    const overlay = document.getElementById('autotest-overlay');
    const statusEl = document.getElementById('autotest-status');
    const resultsEl = document.getElementById('autotest-results');

    if (overlay) {
      overlay.style.display = 'flex';
      resultsEl.innerHTML = '';
    }

    const hpMult = parseFloat(document.getElementById('autotest-diff')?.value || '1.0');
    const diffId = injectDifficulty(hpMult);
    const diffLabel = `${hpMult.toFixed(1)}×`;

    await ensureGame(options);

    const aIds = Object.keys(STRATEGIES).filter(id => STRATEGIES[id].group === 'A');
    const bIds = Object.keys(STRATEGIES).filter(id => STRATEGIES[id].group === 'B');
    const cIds = Object.keys(STRATEGIES).filter(id => STRATEGIES[id].group === 'C');
    const totalRuns = aIds.length + bIds.length + cIds.length;
    let runCount = 0;

    const aResults = [], bResults = [], cResults = [];

    for (const sid of [...aIds, ...bIds, ...cIds]) {
      runCount++;
      if (statusEl) statusEl.textContent = `全測 ${diffLabel}：${runCount}/${totalRuns} — ${STRATEGIES[sid].name}`;
      const r = await runTest(sid, { ...options, difficulty: diffId, speed: 200, verbose: false });
      if (r) {
        if (aIds.includes(sid)) aResults.push(r);
        else if (bIds.includes(sid)) bResults.push(r);
        else cResults.push(r);
      }
    }

    if (statusEl) statusEl.textContent = `全部完成！${totalRuns} 策略 @ ${diffLabel}`;
    if (resultsEl) {
      appendRankTable(resultsEl, aResults, `A 組：經濟分配 — ${diffLabel}`);
      appendRankTable(resultsEl, bResults, `B 組：塔型強度 — ${diffLabel}`);
      appendRankTable(resultsEl, cResults, `C 組：三屬組合 — ${diffLabel}`);
    }

    return [...aResults, ...bResults, ...cResults];
  }

  // ── 單一策略結果卡片 ──
  function appendResultCard(container, r) {
    if (!r) return;
    const issues = detectIssues(r);
    const incomeSnaps = r.snapshots.filter(s => s.event?.includes('_pre'));
    const hpSnaps = r.snapshots.filter(s => s.event?.includes('_end'));

    const card = document.createElement('div');
    card.style.cssText = 'background:#0f3460;border:1px solid #333;border-radius:6px;padding:10px;margin-bottom:8px;';

    let html = `<div style="font-weight:bold;color:${r.survived ? '#4ecdc4' : '#e94560'};margin-bottom:4px;">
      ${r.survived ? '✅' : '❌'} ${r.strategyName}（${r.strategy}）${r.timeout ? ' <span style="color:#ffd93d">超時</span>' : ''}
    </div>`;
    html += `<div style="color:#ccc;">最終：W${r.finalWave} | HP ${r.finalHP} | 💰${r.finalGold}g | 收入 ${r.finalIncome}</div>`;

    if (incomeSnaps.length > 0) {
      html += `<div style="color:#888;font-size:11px;margin-top:4px;">
        收入曲線：${incomeSnaps.map(s => s.income).join(' → ')}<br>
        塔配置：${incomeSnaps.filter((_, i) => i % 2 === 0 || i === incomeSnaps.length - 1).map(s => `W${s.wave + 1}:${s.towerCount}塔Lv${s.avgTowerLevel}`).join(' | ')}
      </div>`;
    }
    if (hpSnaps.length > 0) {
      html += `<div style="color:#888;font-size:11px;">HP曲線：${hpSnaps.map(s => s.hp).join(' → ')}</div>`;
    }
    if (issues.length > 0) {
      html += `<div style="color:#ffd93d;font-size:11px;margin-top:4px;">
        ${issues.map(i => `• ${i}`).join('<br>')}
      </div>`;
    }

    card.innerHTML = html;
    container.appendChild(card);
  }

  // ── 綜合評估 ──
  function appendSummary(container, results) {
    const div = document.createElement('div');
    div.style.cssText = 'background:#1a2a4e;border:1px solid #ffd93d;border-radius:6px;padding:10px;margin-top:8px;';

    const balanced = results.find(r => r.strategy === 'balanced');
    const allIn = results.find(r => r.strategy === 'all_in_send');
    const tower = results.find(r => r.strategy === 'tower_first');
    const income = results.find(r => r.strategy === 'income_rush');

    let html = '<div style="color:#ffd93d;font-weight:bold;margin-bottom:6px;">📈 綜合評估</div>';

    if (balanced) {
      html += `<div style="color:#ccc;">均衡型：${balanced.survived ? '✅ 存活' : '❌ 死亡'}（HP=${balanced.finalHP}）— ${balanced.survived ? '基準難度 OK' : '⚠️ 基準難度可能偏高'}</div>`;
    }
    if (tower) {
      html += `<div style="color:#ccc;">防守優先：${tower.survived ? '✅ 存活' : '❌ 死亡'}（HP=${tower.finalHP}）— ${tower.survived ? '防守路線可行' : '⚠️ 純防守也死，整體偏難'}</div>`;
    }
    if (income) {
      html += `<div style="color:#ccc;">經濟衝刺：${income.survived ? '✅ 存活' : '❌ 死亡'}（HP=${income.finalHP}）— ${income.survived ? '經濟路線可行' : '經濟路線不穩，符合預期'}</div>`;
    }
    if (allIn) {
      html += `<div style="color:#ccc;">極端進攻：${allIn.survived ? '✅ 存活' : '❌ 死亡'}（HP=${allIn.finalHP}）— ${allIn.survived ? '⚠️ 防守壓力可能不足' : '✅ 純進攻無法存活，合理'}</div>`;
    }

    // 總結
    const surviveCount = results.filter(r => r.survived).length;
    html += `<div style="margin-top:6px;color:#ffd93d;font-size:13px;">
      ${surviveCount}/4 策略存活 — ${
        surviveCount === 0 ? '❌ 整體過難，需降低怪物強度或提高經濟' :
        surviveCount === 1 ? '⚠️ 偏難，只有一種策略可行' :
        surviveCount === 2 ? '✅ 平衡尚可，有取捨空間' :
        surviveCount === 3 ? '✅ 平衡良好' :
        '⚠️ 全部存活，防守壓力可能不足'
      }
    </div>`;

    div.innerHTML = html;
    container.appendChild(div);
  }

  // ── 排名表（單難度） ──
  function appendRankTable(container, results, title) {
    if (!results.length) return;
    const div = document.createElement('div');
    div.style.cssText = 'background:#1a2a4e;border:1px solid #ffd93d;border-radius:6px;padding:10px;margin-top:8px;';

    // 按存活波次排序，同波次比 HP
    const sorted = [...results].sort((a, b) => {
      if (a.survived !== b.survived) return a.survived ? -1 : 1;
      if (a.finalWave !== b.finalWave) return b.finalWave - a.finalWave;
      return b.finalHP - a.finalHP;
    });

    let html = `<div style="color:#ffd93d;font-weight:bold;margin-bottom:6px;">📊 ${title}</div>`;
    html += '<table style="width:100%;border-collapse:collapse;font-size:11px;color:#ccc;">';
    html += '<tr style="color:#888;border-bottom:1px solid #333;">';
    html += '<th style="text-align:left;padding:3px 6px;">#</th>';
    html += '<th style="text-align:left;padding:3px 6px;">策略</th>';
    html += '<th style="text-align:center;padding:3px 6px;">結果</th>';
    html += '<th style="text-align:center;padding:3px 6px;">存活波</th>';
    html += '<th style="text-align:center;padding:3px 6px;">HP</th>';
    html += '<th style="text-align:center;padding:3px 6px;">AI傷害</th>';
    html += '<th style="text-align:center;padding:3px 6px;">塔數</th>';
    html += '<th style="text-align:center;padding:3px 6px;">Income</th>';
    html += '</tr>';

    sorted.forEach((r, i) => {
      const s = STRATEGIES[r.strategy];
      const last = r.snapshots[r.snapshots.length - 1];
      const color = r.survived ? '#4ecdc4' : (r.finalWave >= 15 ? '#ffd93d' : '#e94560');
      const icon = r.survived ? '✅' : '❌';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

      html += `<tr style="border-bottom:1px solid #222;">`;
      html += `<td style="padding:3px 6px;">${medal}</td>`;
      html += `<td style="padding:3px 6px;white-space:nowrap;">${s.name}</td>`;
      html += `<td style="text-align:center;padding:3px 6px;color:${color}">${icon}</td>`;
      html += `<td style="text-align:center;padding:3px 6px;color:${color}">W${r.finalWave}</td>`;
      html += `<td style="text-align:center;padding:3px 6px;">${r.finalHP}</td>`;
      const aiDmg = last?.aiHpDmg ?? 0;
      html += `<td style="text-align:center;padding:3px 6px;">${aiDmg > 0 ? `-${aiDmg}` : '0'}</td>`;
      html += `<td style="text-align:center;padding:3px 6px;">${last?.towerCount ?? '—'}</td>`;
      html += `<td style="text-align:center;padding:3px 6px;">${last?.income ?? '—'}</td>`;
      html += '</tr>';
    });
    html += '</table>';

    div.innerHTML = html;
    container.appendChild(div);
  }

  function appendTowerSummary(container, results, label = '🏆 塔型強度排名') {
    if (results.length === 0) return;
    const div = document.createElement('div');
    div.style.cssText = 'background:#1a2a4e;border:1px solid #4ecdc4;border-radius:6px;padding:10px;margin-top:8px;';

    // 按存活波次排序（越多越好），同波次比 HP
    const sorted = [...results].sort((a, b) => {
      if (a.finalWave !== b.finalWave) return b.finalWave - a.finalWave;
      return b.finalHP - a.finalHP;
    });

    let html = `<div style="color:#4ecdc4;font-weight:bold;margin-bottom:6px;">${label}</div>`;
    html += '<table style="width:100%;border-collapse:collapse;font-size:11px;color:#ccc;">';
    html += '<tr style="color:#888;border-bottom:1px solid #333;"><th style="text-align:left;padding:2px 4px;">#</th><th style="text-align:left;">塔型</th><th>存活波</th><th>HP</th><th>DPS</th><th>AI傷害</th><th>評價</th></tr>';

    sorted.forEach((r, i) => {
      const lastSnap = r.snapshots[r.snapshots.length - 1];
      const dps = lastSnap?.estimatedDPS || 0;
      const aiHp = lastSnap?.aiHpDmg ?? 0;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      const color = r.survived ? '#4ecdc4' : (r.finalWave >= 15 ? '#ffd93d' : '#e94560');

      let rating = '';
      if (r.survived) rating = '✅ 通關';
      else if (r.finalWave >= 16) rating = '接近通關';
      else if (r.finalWave >= 10) rating = '中期崩';
      else rating = '早期崩';

      html += `<tr style="border-bottom:1px solid #222;">
        <td style="padding:2px 4px;">${medal}</td>
        <td style="color:${color}">${r.strategyName}</td>
        <td style="text-align:center;">W${r.finalWave}</td>
        <td style="text-align:center;">${r.finalHP}</td>
        <td style="text-align:center;">${dps}</td>
        <td style="text-align:center;">${aiHp > 0 ? `-${aiHp}` : '0'}</td>
        <td style="text-align:center;">${rating}</td>
      </tr>`;
    });
    html += '</table>';

    // 元素強弱分析
    const elemResults = {};
    for (const r of results) {
      const s = STRATEGIES[r.strategy];
      if (!s) continue;
      const mainElem = s.elemPicks?.[0] || 'fire';
      if (!elemResults[mainElem]) elemResults[mainElem] = [];
      elemResults[mainElem].push(r);
    }

    html += '<div style="margin-top:8px;color:#ffd93d;font-size:11px;font-weight:bold;">元素整體表現：</div>';
    for (const [elem, rs] of Object.entries(elemResults)) {
      const avgWave = (rs.reduce((s, r) => s + r.finalWave, 0) / rs.length).toFixed(1);
      const avgHP = (rs.reduce((s, r) => s + r.finalHP, 0) / rs.length).toFixed(0);
      const icon = ELEM[elem]?.icon || elem;
      html += `<div style="color:#ccc;font-size:11px;">${icon} ${elem}：平均存活 W${avgWave}，平均 HP=${avgHP}</div>`;
    }

    div.innerHTML = html;
    container.appendChild(div);
  }

  function detectIssues(result) {
    const issues = [];
    const snaps = result.snapshots;

    // HP 曲線分析
    const endSnaps = snaps.filter(s => s.event?.includes('_end'));
    const w10snap = endSnaps.find(s => s.wave >= 9 && s.wave <= 11);
    if (w10snap && w10snap.hp < 15) {
      issues.push(`⚠️ W${w10snap.wave} HP=${w10snap.hp}，前中期生存壓力過大`);
    }

    // Income 成長分析
    const preSnaps = snaps.filter(s => s.event?.includes('_pre'));
    for (let i = 1; i < preSnaps.length; i++) {
      const prev = preSnaps[i - 1].income;
      const curr = preSnaps[i].income;
      if (i > 2 && i < preSnaps.length - 2 && curr - prev < 1) {
        issues.push(`⚠️ W${preSnaps[i].wave + 1} 前 income 成長停滯 (${prev}→${curr})`);
        break; // 只報第一個
      }
    }

    // 金幣枯竭
    for (const s of preSnaps) {
      if (s.gold < 20 && s.wave < 15) {
        issues.push(`⚠️ W${s.wave + 1} 前金幣只剩 ${s.gold}g，經濟崩潰`);
        break;
      }
    }

    // 塔等級落後
    const lateSnaps = preSnaps.filter(s => s.wave >= 9);
    for (const s of lateSnaps) {
      if (s.avgTowerLevel < 2.5 && s.wave >= 10) {
        issues.push(`⚠️ W${s.wave + 1} 平均塔等級 ${s.avgTowerLevel}，升級進度落後`);
        break;
      }
    }

    // AI 比較
    const lastSnap = snaps[snaps.length - 1];
    if ((lastSnap.aiHpDmg ?? 0) < 10) {
      issues.push(`⚠️ AI 幾乎未受到傷害（${lastSnap.aiHpDmg ?? 0} dmg），送兵壓力極低`);
    }

    return issues;
  }

  // ── 公開 API ──
  return {
    run: runTest,
    runAll,
    runGroup,
    strategies: STRATEGIES,
    detectIssues,
  };

})();

// 掛到 window
window.AutoTest = AutoTest;

// 按 P 鍵切換測試面板
{
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      const panel = document.getElementById('autotest-panel');
      if (!panel) return;
      panel.style.display = panel.style.display === 'none' ? '' : 'none';
    }
  });
}

// 綁定 slider 與按鈕
{
  // slider 即時更新標籤
  const slider = document.getElementById('autotest-diff');
  const label = document.getElementById('autotest-diff-label');
  if (slider && label) {
    slider.oninput = () => { label.textContent = parseFloat(slider.value).toFixed(1) + '×'; };
  }

  const btnIds = ['autotest-a', 'autotest-b', 'autotest-c', 'autotest-d', 'autotest-all'];
  const btnLabels = { 'autotest-a': 'A 經濟', 'autotest-b': 'B 塔型', 'autotest-c': 'C 三屬', 'autotest-d': 'D 塔型', 'autotest-all': '全測' };

  function bindTestBtn(btnId, testFn) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.onclick = () => {
      btnIds.forEach(id => {
        const b = document.getElementById(id);
        if (b) { b.disabled = true; b.style.opacity = '0.4'; }
      });
      if (slider) slider.disabled = true;
      btn.textContent = '🤖 測試中...';
      testFn().then(() => {
        btnIds.forEach(id => {
          const b = document.getElementById(id);
          if (b) { b.disabled = false; b.style.opacity = '1'; }
        });
        if (slider) slider.disabled = false;
        btn.textContent = btnLabels[btnId];
      }).catch(err => {
        btnIds.forEach(id => {
          const b = document.getElementById(id);
          if (b) { b.disabled = false; b.style.opacity = '1'; }
        });
        if (slider) slider.disabled = false;
        btn.textContent = btnLabels[btnId];
        const statusEl = document.getElementById('autotest-status');
        if (statusEl) statusEl.textContent = '錯誤：' + err.message;
      });
    };
  }
  bindTestBtn('autotest-a',   () => AutoTest.runGroup('A'));
  bindTestBtn('autotest-b',   () => AutoTest.runGroup('B'));
  bindTestBtn('autotest-c',   () => AutoTest.runGroup('C'));
  bindTestBtn('autotest-d',   () => AutoTest.runGroup('D'));
  bindTestBtn('autotest-all', () => AutoTest.runAll());
}
