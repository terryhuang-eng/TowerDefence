// ============================================================
// GAME
// ============================================================

/**
 * 回傳目前啟用的元素 key 陣列。
 * CONFIG.activeElems 為 null/undefined 時 fallback 全部元素。
 */
function getActiveKeys() {
  return (CONFIG.activeElems && CONFIG.activeElems.length > 0)
    ? CONFIG.activeElems
    : ELEM_KEYS;
}

class Game {
  constructor(difficulty, mode, pvpNet) {
    // 連線模式
    this.mode = mode || 'pve';  // 'pve' | 'pvp'
    this.pvpNet = pvpNet || null; // N-player network object
    this.isHost = pvpNet ? pvpNet.isHost : false;
    // N-player ready tracking
    this.readyPlayers = new Set(); // 已 ready 的 peerId
    this.alivePlayers = pvpNet ? new Set(pvpNet.chain) : new Set(); // 存活玩家
    this.myReady = false;

    // v6: 不選起始元素，使用基礎塔
    this.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));

    // PVP 全玩家狀態追蹤
    this.pvpPlayerStates = {}; // { peerId: { name, hp, income, elems } }

    this.gold = CONFIG.startGold;
    this.hp = CONFIG.startHP;
    this.income = CONFIG.baseIncome;
    this.wave = 0;
    this.time = 0;
    this.state = 'pre_wave';

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.effects = [];
    this.zones = [];

    this.selectedTower = null;
    this.selectedBasicType = 'arrow'; // 預設放基礎塔類型
    this.pendingPlace = null;

    this.maxHp = CONFIG.startHP;

    // 送兵次數追蹤
    this.sendUsed = {}; // per-type send count, reset each wave

    // 對手狀態（PVE=AI控制, PVP=對手玩家控制）
    this.aiElemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
    this.aiTowerLevel = 1; // basic Lv1
    this.aiInfuseElem = null;
    this.aiThirdElem = null; // AI 第三元素（Lv5 三屬）
    this.aiBaseElem = null; // AI 的元素（W3 後隨機選）

    this.aiEssencePerElem = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));

    this.difficulty = difficulty || 'x1';
    const diff = CONFIG.difficulty[this.difficulty] || CONFIG.difficulty.x1;
    const aiStartGold = this.mode === 'pvp' ? CONFIG.startGold : diff.aiStartGold;

    const aiHpVal = this.mode === 'pvp' ? CONFIG.startHP : diff.aiHp;
    this.ai = {
      hp: aiHpVal,
      maxHp: aiHpVal,
      gold: aiStartGold,
      income: this.mode === 'pvp' ? CONFIG.baseIncome : diff.aiBaseIncome,
      towers: [],
      totalSent: [],
      lastAction: '',
    };

    // 玩家送兵排隊 + 對手防線上的活動單位
    this.playerSendQueue = [];
    this.aiLaneTroops = [];
    this.aiLaneProjectiles = [];

    // PVP: 對手送來的兵（加入我方 spawnQueue 尾端）
    this.pvpIncomingSends = [];

    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.hoveredCell = null;
    this.announceTimer = 0;
    this.gameSpeed = this.mode === 'pvp' ? 8 : 1;

    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.initGrid();
    this.setupEvents();

    // 螢幕旋轉/視窗大小改變時重新計算 canvas 尺寸（不重建 grid）
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // 直接進入 pre_wave（基礎塔，無元素）
    this.state = 'pre_wave';
    this.rebuildSidebar();
    this.showPreWave();

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  // ── PVP 網路通訊 ──
  // 送兵相關 → 只送給攻擊對象（attackTargetId）
  // 塔/元素/HP/ready/gameOver → 廣播給所有人
  netSend(msg) {
    if (!this.pvpNet) return;
    const directTypes = ['sendTroop']; // 只送給攻擊目標
    if (directTypes.includes(msg.type)) {
      this.pvpNet.sendTo(this.pvpNet.attackTargetId, msg);
    } else {
      this.pvpNet.broadcast(msg);
    }
  }

  onNetMsg(data) {
    if (!data || !data.type) return;
    const fromId = data._from || null;
    // N-player: 判斷來源是攻擊目標（我看他防守）還是防守來源（他送兵給我）
    const isFromAttackTarget = this.pvpNet && fromId === this.pvpNet.attackTargetId;
    const isFromDefender = this.pvpNet && fromId === this.pvpNet.defendFromId;
    const senderLabel = this.getPlayerLabel(fromId);

    switch (data.type) {
      case 'hello':
        this.addBattleLog('ai', `⚔️ ${senderLabel}已連線！`);
        break;
      case 'ready':
        if (fromId) this.readyPlayers.add(fromId);
        this.addBattleLog('ai', `⚔️ ${senderLabel}已準備（${this.readyPlayers.size}/${this.alivePlayers.size - 1}）`);
        if (this.myReady) this.checkAllReady();
        break;
      case 'sendTroop': {
        // 只處理來自 defendFromId 的送兵（對我的攻擊）
        if (!isFromDefender) break;
        const s = INCOME_SENDS.find(s => s.id === data.troopId);
        if (!s) break;
        for (let i = 0; i < s.count; i++) {
          this.pvpIncomingSends.push(s);
        }
        this.addBattleLog('ai', `⚔️ ${senderLabel}送出 ${s.icon}${s.name}×${s.count}`);
        break;
      }
      case 'cancelTroop': {
        if (!isFromDefender) break;
        const cs2 = INCOME_SENDS.find(s => s.id === data.troopId);
        if (!cs2) break;
        let cancelRemoved = 0;
        for (let i = this.pvpIncomingSends.length - 1; i >= 0 && cancelRemoved < cs2.count; i--) {
          if (this.pvpIncomingSends[i].id === data.troopId) {
            this.pvpIncomingSends.splice(i, 1);
            cancelRemoved++;
          }
        }
        if (cancelRemoved > 0) this.addBattleLog('ai', `↩️ ${senderLabel}取消了 ${cs2.icon}${cs2.name}`);
        break;
      }
      case 'towerBuilt': {
        // 只顯示攻擊目標的塔（AI lane 顯示的是我攻擊的對象）
        if (!isFromAttackTarget) break;
        const aiOffsetY = CONFIG.gridRows + 1;
        const bx = data.x != null ? data.x : 0;
        const by = (data.y != null ? data.y : 0) + aiOffsetY;
        this.ai.towers.push({ x: bx, y: by, pathIdx: 0, atkTimer: 0, level: data.level || 1, basicType: data.basicType || 'arrow' });
        this.addBattleLog('ai', `⚔️ ${senderLabel}蓋了${data.basicType === 'cannon' ? '💣砲塔' : '🏹箭塔'}（${bx},${data.y}）`);
        break;
      }
      case 'towerSold': {
        if (!isFromAttackTarget) break;
        const aiOffY = CONFIG.gridRows + 1;
        const soldX = data.x != null ? data.x : -1;
        const soldY = (data.y != null ? data.y : -1) + aiOffY;
        this.ai.towers = this.ai.towers.filter(t => !(t.x === soldX && t.y === soldY));
        break;
      }
      case 'towerUpgraded': {
        if (!isFromAttackTarget) break;
        const aiOffY2 = CONFIG.gridRows + 1;
        const upX = data.x, upY = (data.y != null ? data.y : 0) + aiOffY2;
        const tw = this.ai.towers.find(t => t.x === upX && t.y === upY);
        if (tw) {
          tw.level = data.level || 1;
          if (data.elem) tw.elem = data.elem;
          if (data.infuseElem) tw.infuseElem = data.infuseElem;
          if (data.basicType) tw.basicType = data.basicType;
          this.addBattleLog('ai', `⚔️ ${senderLabel}升級塔 → Lv${tw.level}（${upX},${data.y}）`);
        }
        break;
      }
      case 'pickElement':
        this.addBattleLog('ai', `⚔️ ${senderLabel}選擇了 ${ELEM[data.elem]?.icon||''}${ELEM[data.elem]?.name||data.elem} 元素`);
        // 更新該玩家的元素狀態
        if (fromId && this.pvpPlayerStates[fromId]) {
          if (!this.pvpPlayerStates[fromId].elems) this.pvpPlayerStates[fromId].elems = {};
          this.pvpPlayerStates[fromId].elems[data.elem] = (this.pvpPlayerStates[fromId].elems[data.elem] || 0) + 1;
        }
        this.updatePvpStatusPanel();
        break;
      case 'statusUpdate':
        // 其他玩家的狀態更新
        if (fromId) {
          this.pvpPlayerStates[fromId] = {
            ...this.pvpPlayerStates[fromId],
            name: data.name || this.getPlayerLabel(fromId),
            hp: data.hp, income: data.income, elems: data.elems,
          };
          this.updatePvpStatusPanel();
        }
        break;
      case 'hpUpdate': {
        // 只關心攻擊目標的 HP（我送兵打他）
        if (!isFromAttackTarget) break;
        const prevHp = this.ai.hp;
        this.ai.hp = data.hp;
        this.ai.maxHp = data.maxHp || this.ai.maxHp;
        if (data.hp < prevHp) {
          const dmg = prevHp - data.hp;
          this.showAiDmgFloat(dmg);
          this.addBattleLog('player',
            `💥 你的兵突破！<span class="log-dmg">−${dmg}HP</span>（${senderLabel}剩${Math.ceil(data.hp)}）`
          );
        }
        this.updateAiBar();
        break;
      }
      case 'goldUpdate':
        if (isFromAttackTarget) this.ai.gold = data.gold;
        break;
      case 'gameOver':
        // 某玩家宣告死亡
        this.onPlayerEliminated(fromId);
        break;
      case 'waveStart':
        // Host 通知所有人同時開始波次
        if (!this.isHost) this.pvpAllReady();
        break;
      case 'playerEliminated':
        // Host 廣播：某玩家被淘汰，鏈重組
        this.onChainReorg(data.eliminatedId, data.newChain);
        break;
    }
  }

  // 取得玩家在環形鏈中的標籤（P1, P2, ...）
  getPlayerLabel(peerId) {
    if (!this.pvpNet || !peerId) return '對手';
    // 先找名稱
    if (this.pvpNet.players) {
      const p = this.pvpNet.players.find(p => p.id === peerId);
      if (p && p.name) return p.name;
    }
    const idx = this.pvpNet.chain.indexOf(peerId);
    if (idx >= 0) return `P${idx + 1}`;
    return '玩家';
  }

  onPeerDisconnect() {
    this.addBattleLog('ai', '❌ 連線中斷');
    this.announce('連線中斷！');
  }

  // N-player: 玩家被淘汰（HP <= 0 或斷線）
  onPlayerEliminated(eliminatedId) {
    if (!this.pvpNet) return;
    this.alivePlayers.delete(eliminatedId);
    this.readyPlayers.delete(eliminatedId);
    const label = this.getPlayerLabel(eliminatedId);
    this.addBattleLog('ai', `💀 ${label}被淘汰！`);

    // 檢查是否我是最後存活的
    const myId = this.pvpNet.myId;
    const alive = [...this.alivePlayers];
    if (alive.length === 1 && alive[0] === myId) {
      this.endGame(true, 'last_standing');
      return;
    }

    // Host 負責重組鏈並廣播
    if (this.isHost) {
      const newChain = this.pvpNet.chain.filter(id => this.alivePlayers.has(id));
      this.netSend({ type: 'playerEliminated', eliminatedId, newChain });
      this.onChainReorg(eliminatedId, newChain);
    }
  }

  // 鏈重組：更新攻擊/防守目標
  onChainReorg(eliminatedId, newChain) {
    if (!this.pvpNet) return;
    this.alivePlayers.delete(eliminatedId);
    this.pvpNet.chain = newChain;
    const myId = this.pvpNet.myId;
    const myIdx = newChain.indexOf(myId);
    if (myIdx < 0) return; // 我不在鏈中（我已被淘汰）

    const nextIdx = (myIdx + 1) % newChain.length;
    const prevIdx = (myIdx - 1 + newChain.length) % newChain.length;
    const newAttack = newChain[nextIdx];
    const newDefend = newChain[prevIdx];

    // 如果攻擊目標改變，清空 AI lane 顯示
    if (newAttack !== this.pvpNet.attackTargetId) {
      this.ai.towers = [];
      this.aiLaneTroops = [];
      this.aiLaneProjectiles = [];
      this.addBattleLog('player', `🔄 攻擊目標改為 ${this.getPlayerLabel(newAttack)}`);
    }
    if (newDefend !== this.pvpNet.defendFromId) {
      this.addBattleLog('player', `🔄 防守來源改為 ${this.getPlayerLabel(newDefend)}`);
    }

    this.pvpNet.attackTargetId = newAttack;
    this.pvpNet.defendFromId = newDefend;
    this.updateAiBar();

    // 檢查是否只剩自己
    if (newChain.length === 1 && newChain[0] === myId) {
      this.endGame(true, 'last_standing');
    }
  }

  onPlayerDisconnect(peerId) {
    this.onPlayerEliminated(peerId);
  }

  // N-player ready 機制：所有存活玩家都 ready 才開始（Host 協調）
  checkAllReady() {
    if (!this.myReady) return;
    const othersAlive = [...this.alivePlayers].filter(id => id !== this.pvpNet.myId);
    const allOthersReady = othersAlive.every(id => this.readyPlayers.has(id));
    if (allOthersReady) {
      if (this.isHost) {
        // Host：廣播 waveStart 給所有人，然後自己也開始
        this.netSend({ type: 'waveStart' });
        this.pvpAllReady();
      }
      // 非 Host：等待 Host 的 waveStart 訊息
    }
  }

  pvpAllReady() {
    this.myReady = false;
    this.readyPlayers.clear();
    this.startWave();
  }

  // ── 計算塔等級上限 ──
  // v7 升級系統：
  // Lv1→2 基礎升級 | Lv2→3 選單元素 | Lv3→4 選第二元素(雙屬) | Lv4→5 選第三元素(三屬)
  maxTowerLevel(t) {
    const totalPicks = this.getTotalPicks();

    if (typeof t === 'string') {
      if (t === 'arrow' || t === 'cannon') {
        return totalPicks >= 1 ? 3 : 2;
      }
      // 元素字串：該元素塔的理論上限
      const picks = this.elemPicks[t] || 0;
      if (picks === 0) return 2;
      if (totalPicks >= 3) return 5;
      if (totalPicks >= 2) return 4;
      return 3;
    }

    // 塔物件
    if (!t.elem) {
      return totalPicks >= 1 ? 3 : 2;
    }

    // Lv6 純屬塔（thirdElem === elem === infuseElem）
    if (t.thirdElem && t.thirdElem === t.elem && t.infuseElem === t.elem) return 6;
    // Lv5 三屬塔（已有 thirdElem）
    if (t.thirdElem) return 5;

    // Lv4 雙屬塔（已有 infuseElem）
    if (t.infuseElem) {
      // 純屬雙注（base==infuse）→ 可走 Lv6 路線
      if (t.infuseElem === t.elem) {
        const picks = this.elemPicks[t.elem] || 0;
        const canLv6 = picks >= 3 && PURE_TOWERS[t.elem] &&
                       this.countLv6Towers() < (CONFIG.maxLv6Towers ?? 1);
        if (canLv6) return 6;
        const canLv5 = picks >= 2 && PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5;
        if (canLv5) return 5;
      }
      // 混屬雙注 → 可走 Lv5 路線
      const avail3rd = this.getAvailableThirdElems(t.elem, t.infuseElem);
      if (avail3rd.length > 0) return 5;
      return 4;
    }

    // Lv3 塔（有 base elem，無 inject）→ 檢查能否注入
    const canInjectSame = (this.elemPicks[t.elem] || 0) >= 2;
    const canInjectDiff = ELEM_KEYS.some(e => e !== t.elem && (this.elemPicks[e] || 0) >= 1);
    if (canInjectSame || canInjectDiff) {
      if (totalPicks >= 3) return 5;
      return 4;
    }
    return 3;
  }

  // 取得三屬 key（排序後 join）
  getTripleKey(e1, e2, e3) {
    return [e1, e2, e3].sort().join('_');
  }

  // 檢查三屬塔是否存在
  hasTripleTower(e1, e2, e3) {
    const key = this.getTripleKey(e1, e2, e3);
    return !!TRIPLE_TOWERS[key];
  }

  // 取得 Lv4→Lv5 可用的第三元素列表
  getAvailableThirdElems(baseElem, infuseElem) {
    const thirds = [];
    for (const e of ELEM_KEYS) {
      // 第三元素需要至少 1 pick（若與 base/infuse 相同則需要更多）
      const needed = [baseElem, infuseElem].filter(x => x === e).length + 1;
      if ((this.elemPicks[e] || 0) >= needed) {
        // 檢查 TRIPLE_TOWERS 是否有這個組合
        if (this.hasTripleTower(baseElem, infuseElem, e)) {
          thirds.push(e);
        }
      }
    }
    return thirds;
  }

  // 取得 Lv3→Lv4 可用的注入元素列表
  getAvailableInjects(baseElem) {
    const injects = [];
    for (const e of ELEM_KEYS) {
      if (e === baseElem) {
        if ((this.elemPicks[e] || 0) >= 2) injects.push(e);
      } else {
        if ((this.elemPicks[e] || 0) >= 1) injects.push(e);
      }
    }
    return injects;
  }

  // 取得 AI 塔的 stats（按等級+注入）
  getAiTowerStats(level, tw) {
    const lv = level || this.aiTowerLevel;
    // AI 塔有 basicType（arrow/cannon），跟玩家一樣走 Basic → Element 路線
    const basicType = (tw && tw.basicType) || 'arrow';
    if (lv <= 2) {
      return BASIC_TOWERS[basicType].levels[lv - 1];
    }
    const elem = this.aiBaseElem || 'fire';
    if (lv === 3) return ELEM_BASE[elem][basicType];
    const inf = this.aiInfuseElem || elem;
    if (lv === 4) return INFUSIONS[elem][inf].lv4;
    // Lv6: 純屬塔（AI 純屬路線）
    if (lv >= 6 && this.aiThirdElem === elem && inf === elem) {
      if (PURE_TOWERS[elem]) return PURE_TOWERS[elem].lv6;
    }
    // Lv5: 三屬塔
    if (lv >= 5 && this.aiThirdElem) {
      const key = this.getTripleKey(elem, inf, this.aiThirdElem);
      if (TRIPLE_TOWERS[key]) return TRIPLE_TOWERS[key].lv5;
    }
    return INFUSIONS[elem][inf].lv4; // fallback
  }

  // 計算目前場上 Lv6 塔數量
  countLv6Towers() {
    return this.towers.filter(t => t.level >= 6).length;
  }

  // 取得可用的元素列表
  getAvailableElements() {
    return ELEM_KEYS.filter(e => this.elemPicks[e] > 0);
  }

  // 取得總 picks 數
  getTotalPicks() {
    return Object.values(this.elemPicks).reduce((a,b) => a+b, 0);
  }

  get oppName() {
    if (this.mode !== 'pvp') return 'AI';
    if (this.pvpNet) return this.getPlayerLabel(this.pvpNet.attackTargetId);
    return '對手';
  }

  getTotalAiPicks() {
    return Object.values(this.aiElemPicks).reduce((a,b) => a+b, 0);
  }

  // 取得塔的顏色
  getTowerColor(t) {
    if (typeof t === 'string') {
      if (t === 'arrow') return '#c8a86c';
      if (t === 'cannon') return '#8888aa';
      return ELEM[t] ? ELEM[t].color : '#888';
    }
    if (!t.elem) {
      return t.basicType === 'cannon' ? '#8888aa' : '#c8a86c';
    }
    return ELEM[t.elem].color;
  }

  // ── Grid ──
  initGrid() {
    const wrap = document.getElementById('canvas-wrap');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);

    const topPad = 40;  // info-bar
    const botPad = 40;  // ai-bar
    const totalRows = CONFIG.gridRows + 1 + 10 + 1; // 10 player + 1 gap + 10 AI + 1 base overflow
    this.cellSize = Math.min(Math.floor(w / CONFIG.gridCols), Math.floor((h - topPad - botPad) / totalRows));
    this.offsetX = Math.floor((w - CONFIG.gridCols * this.cellSize) / 2);
    this.offsetY = topPad + Math.floor((h - topPad - botPad - totalRows * this.cellSize) / 2);

    this.grid = Array.from({length: CONFIG.gridRows}, () => Array(CONFIG.gridCols).fill(0));

    // 玩家 U 型螺旋路徑（外圈→U轉→內圈基地）
    this.path = [];
    const cols = CONFIG.gridCols;
    for (let x = 0; x < cols - 2; x++) this.path.push({x, y: 0});
    for (let y = 1; y <= 3; y++) this.path.push({x: cols-3, y});
    for (let x = cols-4; x >= 2; x--) this.path.push({x, y: 3});
    for (let y = 4; y <= 6; y++) this.path.push({x: 2, y});
    for (let x = 3; x < cols - 2; x++) this.path.push({x, y: 6});
    for (let y = 7; y <= 9; y++) this.path.push({x: cols-3, y});
    for (let x = cols-4; x >= 0; x--) this.path.push({x, y: 9});

    for (const p of this.path) {
      if (p.y >= 0 && p.y < CONFIG.gridRows && p.x >= 0 && p.x < CONFIG.gridCols)
        this.grid[p.y][p.x] = 1;
    }

    // AI 防線路徑
    const aiStartRow = CONFIG.gridRows + 1;
    this.aiPath = [];
    for (let x = 0; x < cols - 2; x++) this.aiPath.push({x, y: aiStartRow});
    for (let y = aiStartRow+1; y <= aiStartRow+3; y++) this.aiPath.push({x: cols-3, y});
    for (let x = cols-4; x >= 2; x--) this.aiPath.push({x, y: aiStartRow + 3});
    for (let y = aiStartRow+4; y <= aiStartRow+6; y++) this.aiPath.push({x: 2, y});
    for (let x = 3; x < cols - 2; x++) this.aiPath.push({x, y: aiStartRow + 6});
    for (let y = aiStartRow+7; y <= aiStartRow+9; y++) this.aiPath.push({x: cols-3, y});
    for (let x = cols-4; x >= 0; x--) this.aiPath.push({x, y: aiStartRow + 9});
  }

  resizeCanvas() {
    const wrap = document.getElementById('canvas-wrap');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (w <= 0 || h <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    const topPad = 40;
    const botPad = 40;
    const totalRows = CONFIG.gridRows + 1 + 10 + 1;
    this.cellSize = Math.min(Math.floor(w / CONFIG.gridCols), Math.floor((h - topPad - botPad) / totalRows));
    this.offsetX = Math.floor((w - CONFIG.gridCols * this.cellSize) / 2);
    this.offsetY = topPad + Math.floor((h - topPad - botPad - totalRows * this.cellSize) / 2);
  }

  // ── Sidebar ──
  rebuildSidebar() {
    const totalPicks = this.getTotalPicks();
    const available = this.getAvailableElements();

    // 塔型資訊
    let picksStr = '';
    if (totalPicks > 0) {
      picksStr = available.map(e => {
        return `${ELEM[e].icon} ${ELEM[e].name} ×${this.elemPicks[e]}`;
      }).join(' ');
    } else {
      picksStr = '<span style="color:#888">尚無元素（W3 後解鎖）</span>';
    }

    document.getElementById('class-title').innerHTML = `🏰 塔防 v6.0`;
    const teamDiv = document.getElementById('team-chars');
    teamDiv.innerHTML = `
      <div style="font-size:11px; line-height:1.6;">
        ${picksStr}
      </div>
      <div style="font-size:10px; color:#888; margin-top:4px;">
        放塔類型：${BASIC_KEYS.map(k => {
          const b = BASIC_TOWERS[k];
          return `<span style="cursor:pointer;padding:2px 6px;border-radius:4px;border:1px solid ${this.selectedBasicType === k ? '#e94560' : '#555'};background:${this.selectedBasicType === k ? '#2a1a3e' : '#1a1a3e'};color:${k === 'arrow' ? '#c8a86c' : '#8888aa'}" onclick="window._game.selectedBasicType='${k}';window._game.rebuildSidebar();">${b.icon}${b.name}</span>`;
        }).join(' ')}
      </div>
    `;

    // 元素持有顯示
    const elemDiv = document.getElementById('unlocked-elems');
    const elemsHtml = getActiveKeys().map(e => {
      const count = this.elemPicks[e];
      if (count === 0) return `<span class="elem-tag" style="background:#33333322;border-color:#555;color:#555">${ELEM[e].icon} ${ELEM[e].name} ×0</span>`;
      return `<span class="elem-tag" style="background:${ELEM[e].color}22;border-color:${ELEM[e].color};color:${ELEM[e].color}">${ELEM[e].icon} ${ELEM[e].name} ×${count}</span>`;
    }).join('');
    elemDiv.innerHTML = elemsHtml;

    this.showUpgradePanel();
    this.showIncomeSection();

    // PVP 狀態面板 + 廣播自己狀態
    if (this.mode === 'pvp') {
      this.updatePvpStatusPanel();
      this.broadcastMyStatus();
    }
  }

  broadcastMyStatus() {
    if (!this.pvpNet) return;
    const myName = this.pvpNet.players?.find(p => p.id === this.pvpNet.myId)?.name || 'Player';
    this.netSend({
      type: 'statusUpdate',
      name: myName,
      hp: this.hp, income: this.income,
      elems: {...this.elemPicks},
    });
  }

  updatePvpStatusPanel() {
    const panel = document.getElementById('pvp-status-panel');
    const div = document.getElementById('pvp-players-info');
    if (!panel || !div || !this.pvpNet) return;
    panel.style.display = 'block';

    const myId = this.pvpNet.myId;
    const chain = this.pvpNet.chain || [];
    let html = '';
    for (const pid of chain) {
      const isMe = pid === myId;
      const state = isMe
        ? { name: this.pvpNet.players?.find(p => p.id === pid)?.name || 'You', hp: this.hp, income: this.income, elems: this.elemPicks }
        : (this.pvpPlayerStates[pid] || { name: this.getPlayerLabel(pid), hp: '?', income: '?', elems: {} });
      const alive = this.alivePlayers.has(pid);
      const color = isMe ? '#4ecdc4' : (alive ? '#ffd93d' : '#666');
      const elemsStr = state.elems ? ELEM_KEYS.filter(e => (state.elems[e] || 0) > 0).map(e => `${ELEM[e].icon}×${state.elems[e]}`).join(' ') : '';
      const isTarget = pid === this.pvpNet.attackTargetId;
      const isFrom = pid === this.pvpNet.defendFromId;
      let roleTag = '';
      if (isTarget) roleTag = ' <span style="color:#e94560">⚔️攻擊</span>';
      if (isFrom) roleTag = ' <span style="color:#ff6b35">🛡️防守</span>';
      html += `<div style="color:${color};${alive ? '' : 'text-decoration:line-through;'}">
        <b>${state.name}</b>${isMe ? ' (你)' : ''}${roleTag}
        | ❤️${state.hp} | 📈+${state.income} | ${elemsStr || '無元素'}
      </div>`;
    }
    div.innerHTML = html;
  }

  // 取得塔目前等級的 stats（考慮基礎塔/元素基底/雙屬/三屬）
  getTowerLvData(t) {
    // Basic Lv1-2
    if (t.level <= 2 && !t.elem) {
      const bDef = BASIC_TOWERS[t.basicType || 'arrow'];
      return bDef.levels[t.level - 1];
    }
    // Lv3 元素基底（單元素，無注入）
    if (t.level === 3 && t.elem && !t.infuseElem) {
      return ELEM_BASE[t.elem][t.basicType || 'arrow'];
    }
    // Lv5 純屬塔（level=5, infuseElem=elem, thirdElem=null）
    if (t.level === 5 && t.elem && t.infuseElem === t.elem && !t.thirdElem) {
      if (PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5) return PURE_TOWERS[t.elem].lv5;
    }
    // Lv6 純屬塔
    if (t.level >= 6 && t.thirdElem === t.elem && t.infuseElem === t.elem) {
      if (PURE_TOWERS[t.elem]) return PURE_TOWERS[t.elem].lv6;
    }
    // Lv5 三屬塔
    if (t.level >= 5 && t.thirdElem && t.elem && t.infuseElem) {
      const key = this.getTripleKey(t.elem, t.infuseElem, t.thirdElem);
      if (TRIPLE_TOWERS[key]) return TRIPLE_TOWERS[key].lv5;
    }
    // Lv4 雙屬塔
    if (t.infuseElem && t.elem) {
      return INFUSIONS[t.elem][t.infuseElem].lv4;
    }
    // fallback: basic tower
    const bDef = BASIC_TOWERS[t.basicType || 'arrow'];
    return bDef.levels[Math.min(t.level, 2) - 1];
  }

  showUpgradePanel() {
    const panel = document.getElementById('upgrade-panel');
    const info = document.getElementById('upgrade-info');
    const opts = document.getElementById('upgrade-options');

    if (!this.selectedTower) { panel.style.display = 'none'; return; }
    const t = this.selectedTower;
    panel.style.display = 'block';

    // 技能點擊說明（事件委派，掛在 panel 上避免早期 return 跳過）
    if (!panel._specialTipBound) {
      panel._specialTipBound = true;
      panel.addEventListener('click', (ev) => {
        const tip = ev.target.closest('.skill-tip');
        if (!tip) return;
        ev.stopPropagation();
        const skillsJson = tip.dataset.skills;
        const skills = skillsJson ? JSON.parse(skillsJson) : [];
        const detailDiv = document.getElementById('special-detail');
        if (!detailDiv) return;
        if (detailDiv.style.display === 'block' && detailDiv.dataset.key === skillsJson) {
          detailDiv.style.display = 'none';
        } else {
          detailDiv.style.whiteSpace = 'pre-line';
          detailDiv.textContent = getSkillDesc(skills);
          detailDiv.dataset.key = skillsJson;
          detailDiv.style.display = 'block';
        }
      });
    }

    const curLvData = this.getTowerLvData(t);
    const isBasic = !t.elem;
    const bDef = isBasic ? BASIC_TOWERS[t.basicType || 'arrow'] : null;

    // 顯示名稱（元素塔只顯示元素圖示，同元素疊加顯示數字）
    let towerName, towerIcon;
    if (isBasic) {
      towerIcon = bDef.icon;
      towerName = bDef.name;
    } else if (t.thirdElem) {
      // Lv5 三屬塔
      const key = this.getTripleKey(t.elem, t.infuseElem, t.thirdElem);
      const triple = TRIPLE_TOWERS[key];
      towerName = triple ? triple.name : '???';
      towerIcon = triple ? triple.icon : '❓';
    } else if (t.infuseElem) {
      const inf = INFUSIONS[t.elem][t.infuseElem];
      towerName = inf.name;
      if (t.elem === t.infuseElem) {
        towerIcon = ELEM[t.elem].icon + '×2';
      } else {
        towerIcon = ELEM[t.elem].icon + ELEM[t.infuseElem].icon;
      }
    } else {
      // Lv3 元素基底（無注入）
      const eb = ELEM_BASE[t.elem][t.basicType || 'arrow'];
      towerIcon = ELEM[t.elem].icon;
      towerName = eb.name;
    }

    // 顯示等級標籤
    let lvLabel;
    if (t.level <= 2) lvLabel = `Basic Lv${t.level}`;
    else lvLabel = `元素 Lv${t.level - 2}`;

    const sellRate = (t.level <= 3 || this.randomMode) ? 1.0 : 0.8;
    const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * sellRate);
    const curSkills = curLvData.skills || [];
    const skillTag = curSkills.length > 0
      ? ` | <span class="skill-tip" data-skills='${JSON.stringify(curSkills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(curSkills)} ℹ️</span>`
      : '';
    let statsHtml = `<div>${towerIcon} ${towerName} ${lvLabel}</div>
      <div style="color:#aaa;font-size:10px">
        DMG ${curLvData.damage} | SPD ${curLvData.atkSpd} | RNG ${curLvData.range}
        ${curLvData.aoe > 0 ? ' | AOE ' + curLvData.aoe : ''}
        ${skillTag}
      </div>
      <div style="color:#888;font-size:10px">${curLvData.desc}</div>
      <div id="special-detail" style="display:none;background:#1a1a3e;border:1px solid #ffd93d;border-radius:4px;padding:4px 6px;margin-top:3px;font-size:10px;color:#eee;"></div>
      <div style="margin-top:4px;font-size:10px;color:#aaa;">投入: ${t.totalCost || CONFIG.towerCost}g | 賣出: ${sellValue}g</div>`;

    // 賣塔按鈕（所有狀態都顯示）
    const sellBtn = document.createElement('div');
    sellBtn.className = 'upgrade-opt';
    sellBtn.style.background = '#3a1a1a';
    sellBtn.style.borderColor = '#e94560';
    sellBtn.innerHTML = `🗑️ <span>賣塔　回收 💰${sellValue}</span>`;
    sellBtn.onclick = () => this.sellTower(t);

    const maxLv = this.maxTowerLevel(t);

    // 已滿級
    if (t.level >= maxLv) {
      info.innerHTML = statsHtml;
      opts.innerHTML = '';
      if (t.level >= 6) {
        opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">已達最高等級（純屬 Lv6）</div>';
      } else if (t.level >= 5) {
        opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">已達最高等級（三屬 Lv5）</div>';
      } else if (t.level === 4) {
        const avail3rd = t.infuseElem ? this.getAvailableThirdElems(t.elem, t.infuseElem) : [];
        if (avail3rd.length === 0) {
          opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">需要第3個元素才能升Lv5（W3/W6/W9/W12 選取）</div>';
        } else {
          opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">已達目前最高等級</div>';
        }
      } else if (t.level === 3 && !t.infuseElem) {
        const availInjects = this.getAvailableInjects(t.elem);
        if (availInjects.length === 0) {
          opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">需要第2個元素才能注入升級（W3/W6/W9/W12 選取）</div>';
        } else {
          opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">已達目前最高等級</div>';
        }
      } else if (t.level === 2 && isBasic && this.getTotalPicks() === 0) {
        opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">需要元素才能繼續升級（W3/W6/W9/W12 通關後選取）</div>';
      } else {
        opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">已達目前最高等級</div>';
      }
      opts.appendChild(sellBtn);
      return;
    }

    opts.innerHTML = '';

    // === Basic Lv1 → Lv2：純數值升級 ===
    if (t.level === 1 && isBasic) {
      const nextData = bDef.levels[1];
      const cost = nextData.cost;
      info.innerHTML = statsHtml + `
        <div style="margin-top:4px;color:#4ecdc4;font-size:11px;">
          ▶ Basic Lv2：DMG ${nextData.damage} | SPD ${nextData.atkSpd} | RNG ${nextData.range}
          ${nextData.aoe > 0 ? ' | AOE ' + nextData.aoe : ''}
        </div>
        <div style="color:#888;font-size:10px">${nextData.desc}</div>`;

      const btn = document.createElement('div');
      btn.className = 'upgrade-opt';
      btn.style.opacity = this.gold >= cost ? '1' : '0.4';
      btn.innerHTML = `⬆️ <span>升級 Lv2　💰${cost}</span>`;
      btn.onclick = () => {
        if (this.gold < cost) return;
        this.gold -= cost;
        t.level = 2;
        t.totalCost = (t.totalCost || 0) + cost;
        Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
        if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
        if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 2, basicType: t.basicType });
        this.rebuildSidebar();
      };
      opts.appendChild(btn);
      opts.appendChild(sellBtn);
      return;
    }

    // === Basic Lv2 → Lv3：選擇單元素轉換為元素塔 ===
    if (t.level === 2 && isBasic) {
      const totalPicks = this.getTotalPicks();
      if (totalPicks === 0) {
        info.innerHTML = statsHtml;
        opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">需要元素才能轉換（W3/W6/W9/W12 通關後選取）</div>';
        opts.appendChild(sellBtn);
        return;
      }

      info.innerHTML = statsHtml + `
        <div style="margin-top:4px;color:#e94560;font-size:11px;">
          ▶ Lv3 — 選擇元素轉換（${bDef.name}基底 → 元素塔）
        </div>`;

      const avail = this.getAvailableElements();
      const basicType = t.basicType || 'arrow';
      for (const elem of avail) {
        const eb = ELEM_BASE[elem][basicType];
        const btn = document.createElement('div');
        btn.className = 'upgrade-opt';
        btn.style.opacity = this.gold >= eb.cost ? '1' : '0.4';
        btn.innerHTML = `
          <span style="font-size:14px">${eb.icon}</span>
          <span style="color:${ELEM[elem].color}">${eb.name}</span>
          <span style="color:#aaa;font-size:10px">DMG${eb.damage} SPD${eb.atkSpd} RNG${eb.range}${eb.aoe > 0 ? ' AOE'+eb.aoe : ''}${eb.skills && eb.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(eb.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(eb.skills)} ℹ️</span>` : ''}</span>
          <span style="color:#888;font-size:10px">${eb.desc}</span>
          <span>💰${eb.cost}</span>`;
        btn.onclick = () => {
          if (this.gold < eb.cost) return;
          this.gold -= eb.cost;
          t.level = 3;
          t.elem = elem;
          t.infuseElem = null; // 尚未注入
          t.totalCost = (t.totalCost || 0) + eb.cost;
          Object.assign(t, { damage: eb.damage, atkSpd: eb.atkSpd, range: eb.range, aoe: eb.aoe, skills: eb.skills || [] });
          if (eb.dmgType !== undefined) t.dmgType = eb.dmgType || null;
          if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 3, elem, basicType: t.basicType });
          this.rebuildSidebar();
        };
        opts.appendChild(btn);
      }
      opts.appendChild(sellBtn);
      return;
    }

    // === Lv3 → Lv4：選擇第二元素注入 ===
    if (t.level === 3 && t.elem && !t.infuseElem) {
      const availInjects = this.getAvailableInjects(t.elem);
      if (availInjects.length === 0) {
        info.innerHTML = statsHtml;
        opts.innerHTML = '<div style="color:#ffd93d;font-size:11px">需要第2個元素才能注入（W3/W6/W9/W12 通關後選取）</div>';
        opts.appendChild(sellBtn);
        return;
      }

      info.innerHTML = statsHtml + `
        <div style="margin-top:4px;color:#e94560;font-size:11px;">
          ▶ Lv4 — 選擇注入元素（${ELEM[t.elem].icon}${ELEM[t.elem].name}基底 + 第二元素）
        </div>`;

      for (const injElem of availInjects) {
        const inf = INFUSIONS[t.elem][injElem];
        const lvData = inf.lv4;
        const pureTag = t.elem === injElem ? ' <span style="color:#ffd93d;font-size:9px">[純元素→可升Lv5]</span>' : '';
        const btn = document.createElement('div');
        btn.className = 'upgrade-opt';
        btn.style.opacity = this.gold >= lvData.cost ? '1' : '0.4';
        btn.innerHTML = `
          <span style="font-size:14px">${inf.icon}</span>
          <span style="color:${ELEM[t.elem].color}">${inf.name}${pureTag}</span>
          <span style="color:#aaa;font-size:10px">DMG${lvData.damage} SPD${lvData.atkSpd} RNG${lvData.range}${lvData.aoe > 0 ? ' AOE'+lvData.aoe : ''}${lvData.skills && lvData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(lvData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(lvData.skills)} ℹ️</span>` : ''}</span>
          <span style="color:#888;font-size:10px">${lvData.desc}</span>
          <span>💰${lvData.cost}</span>`;
        btn.onclick = () => {
          if (this.gold < lvData.cost) return;
          this.gold -= lvData.cost;
          t.level = 4;
          t.infuseElem = injElem;
          t.totalCost = (t.totalCost || 0) + lvData.cost;
          Object.assign(t, { damage: lvData.damage, atkSpd: lvData.atkSpd, range: lvData.range, aoe: lvData.aoe, skills: lvData.skills || [] });
          if (lvData.dmgType !== undefined) t.dmgType = lvData.dmgType || null;
          if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 4, elem: t.elem, infuseElem: injElem });
          this.rebuildSidebar();
        };
        opts.appendChild(btn);
      }
      opts.appendChild(sellBtn);
      return;
    }

    // === Lv4 → Lv5（三屬塔，選第三元素）或 Lv4 → Lv6（純屬路線）===
    if (t.level === 4 && t.infuseElem) {
      // 純屬路線：base==infuse → 可升 Lv6
      if (t.infuseElem === t.elem && PURE_TOWERS[t.elem]) {
        const pure = PURE_TOWERS[t.elem];
        const picks = this.elemPicks[t.elem] || 0;
        if (pure.lv5 && picks >= 2) {
          // 純屬路線：先升 Lv5（強化版）
          const nextData = pure.lv5;
          info.innerHTML = statsHtml + `
            <div style="margin-top:4px;color:#ffd93d;font-size:11px;">
              ▶ Lv5 — 純屬強化（${ELEM[t.elem].icon}×2 → 純屬中級）
            </div>`;
          const btn = document.createElement('div');
          btn.className = 'upgrade-opt';
          btn.style.opacity = this.gold >= nextData.cost ? '1' : '0.4';
          btn.innerHTML = `
            <span style="font-size:14px">${ELEM[t.elem].icon + ELEM[t.elem].icon}</span>
            <span style="color:${ELEM[t.elem].color}">${pure.name} Lv5</span>
            <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
            <span style="color:#888;font-size:10px">${nextData.desc}</span>
            <span>💰${nextData.cost}</span>`;
          btn.onclick = () => {
            if (this.gold < nextData.cost) return;
            this.gold -= nextData.cost;
            t.level = 5;
            t.totalCost = (t.totalCost || 0) + nextData.cost;
            Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
            if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
            if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 5, elem: t.elem, infuseElem: t.infuseElem, thirdElem: null });
            this.rebuildSidebar();
          };
          opts.appendChild(btn);
        } else {
          // picks < 2，顯示未解鎖的 Lv6 路線提示
          const lv6Count = this.countLv6Towers();
          const maxLv6 = CONFIG.maxLv6Towers ?? 1;
          const nextData = pure.lv6;
          const has3rdPick = picks >= 3;
          const atLimit = lv6Count >= maxLv6;
          info.innerHTML = statsHtml + `
            <div style="margin-top:4px;color:#ffd93d;font-size:11px;">
              ▶ Lv6 — 純屬終極路線（${ELEM[t.elem].icon}×3，全場限 ${maxLv6} 座，目前 ${lv6Count}）
            </div>`;
          const btn = document.createElement('div');
          btn.className = 'upgrade-opt';
          btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && !atLimit) ? '1' : '0.4';
          const pickHint = picks >= 2 ? (has3rdPick ? '' : ` <span style="color:#e94560">需第3次${ELEM[t.elem].name}pick</span>`) : ` <span style="color:#e94560">需第2次${ELEM[t.elem].name}pick</span>`;
          const limitHint = atLimit ? ` <span style="color:#e94560">Lv6上限已達（${lv6Count}/${maxLv6}）</span>` : '';
          btn.innerHTML = `
            <span style="font-size:14px">${pure.icon}</span>
            <span style="color:${ELEM[t.elem].color}">${pure.name}</span>
            <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
            <span style="color:#888;font-size:10px">${nextData.desc}</span>
            <span>💰${nextData.cost}${pickHint}${limitHint}</span>`;
          btn.onclick = () => {
            if (this.gold < nextData.cost || !has3rdPick || atLimit) return;
            this.gold -= nextData.cost;
            t.level = 6;
            t.thirdElem = t.elem;
            t.totalCost = (t.totalCost || 0) + nextData.cost;
            Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
            if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
            if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 6, elem: t.elem, infuseElem: t.infuseElem, thirdElem: t.elem });
            this.rebuildSidebar();
          };
          opts.appendChild(btn);
        }
      } else {
        // 混屬路線：選第三元素升 Lv5
        const avail3rd = this.getAvailableThirdElems(t.elem, t.infuseElem);
        if (avail3rd.length > 0) {
          info.innerHTML = statsHtml + `
            <div style="margin-top:4px;color:#e94560;font-size:11px;">
              ▶ Lv5 — 選擇第三元素（${ELEM[t.elem].icon}${ELEM[t.infuseElem].icon} + 第三元素 → 三屬塔）
            </div>`;

          for (const e3 of avail3rd) {
            const key = this.getTripleKey(t.elem, t.infuseElem, e3);
            const triple = TRIPLE_TOWERS[key];
            if (!triple) continue;
            const nextData = triple.lv5;
            const btn = document.createElement('div');
            btn.className = 'upgrade-opt';
            btn.style.opacity = this.gold >= nextData.cost ? '1' : '0.4';
            btn.innerHTML = `
              <span style="font-size:14px">${triple.icon}</span>
              <span style="color:${ELEM[e3].color}">${triple.name}</span>
              <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
              <span style="color:#888;font-size:10px">${nextData.desc}</span>
              <span>💰${nextData.cost}</span>`;
            btn.onclick = () => {
              if (this.gold < nextData.cost) return;
              this.gold -= nextData.cost;
              t.level = 5;
              t.thirdElem = e3;
              t.totalCost = (t.totalCost || 0) + nextData.cost;
              Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
              if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
              if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 5, elem: t.elem, infuseElem: t.infuseElem, thirdElem: e3 });
              this.rebuildSidebar();
            };
            opts.appendChild(btn);
          }
        }
      }
    }

    // === Lv5 純屬 → Lv6 純屬終極 ===
    if (t.level === 5 && t.infuseElem === t.elem && !t.thirdElem && PURE_TOWERS[t.elem]) {
      const pure = PURE_TOWERS[t.elem];
      const lv6Count = this.countLv6Towers();
      const maxLv6 = CONFIG.maxLv6Towers ?? 1;
      const nextData = pure.lv6;
      const picks = this.elemPicks[t.elem] || 0;
      const has3rdPick = picks >= 3;
      const atLimit = lv6Count >= maxLv6;
      info.innerHTML = statsHtml + `
        <div style="margin-top:4px;color:#ffd93d;font-size:11px;">
          ▶ Lv6 — 純屬終極（${ELEM[t.elem].icon}×3，全場限 ${maxLv6} 座，目前 ${lv6Count}）
        </div>`;
      const btn = document.createElement('div');
      btn.className = 'upgrade-opt';
      btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && !atLimit) ? '1' : '0.4';
      const pickHint = has3rdPick ? '' : ` <span style="color:#e94560">需第3次${ELEM[t.elem].name}pick</span>`;
      const limitHint = atLimit ? ` <span style="color:#e94560">Lv6上限已達（${lv6Count}/${maxLv6}）</span>` : '';
      btn.innerHTML = `
        <span style="font-size:14px">${pure.icon}</span>
        <span style="color:${ELEM[t.elem].color}">${pure.name}</span>
        <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
        <span style="color:#888;font-size:10px">${nextData.desc}</span>
        <span>💰${nextData.cost}${pickHint}${limitHint}</span>`;
      btn.onclick = () => {
        if (this.gold < nextData.cost || !has3rdPick || atLimit) return;
        this.gold -= nextData.cost;
        t.level = 6;
        t.thirdElem = t.elem;
        t.totalCost = (t.totalCost || 0) + nextData.cost;
        Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
        if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
        if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 6, elem: t.elem, infuseElem: t.infuseElem, thirdElem: t.elem });
        this.rebuildSidebar();
      };
      opts.appendChild(btn);
      opts.appendChild(sellBtn);
      return;
    }

    opts.appendChild(sellBtn);

    // special-tip 點擊已由 panel 事件委派處理（見上方）
  }

  // 精華里程碑檢查（總精華達到門檻時觸發送兵 HP 加成）

  sellTower(t) {
    const sellRate = (t.level <= 3 || this.randomMode) ? 1.0 : 0.8;
    const sellValue = Math.floor((t.totalCost || CONFIG.towerCost) * sellRate);
    this.gold += sellValue;
    this.grid[t.y][t.x] = 0;
    this.towers = this.towers.filter(tw => tw !== t);
    this.selectedTower = null;
    if (this.mode === 'pvp') this.netSend({ type: 'towerSold', x: t.x, y: t.y });
    this.rebuildSidebar();
    this.addBattleLog('player', `🗑️ 賣塔 回收 <span class="log-dmg">+${sellValue}g</span>`);
  }

  // ── LTW 送兵系統 ──
  showIncomeSection() {
    const div = document.getElementById('income-section');
    const isPreWave = this.state === 'pre_wave';
    const baseIncome = CONFIG.baseIncome;
    const investedIncome = this.income - baseIncome;
    const aiTowerCount = this.ai.towers.length;
    const nextWave = this.wave + 1;

    // 已排隊的兵（按 sendId 分組，顯示取消按鈕）
    let queueHtml = '';
    if (this.playerSendQueue.length > 0 && isPreWave) {
      const grouped = {};
      for (const s of this.playerSendQueue) {
        const k = s.id;
        if (!grouped[k]) grouped[k] = { icon: s.icon, name: s.name, count: 0, cost: s.cost, income: s.income, sendCount: s.count };
        grouped[k].count++;
      }
      // 顯示的是「購買次數」而非個別兵數
      const tags = Object.entries(grouped).map(([id, g]) => {
        const purchases = g.count / g.sendCount;
        return `<span class="send-queue-tag">${g.icon}${g.name}×${purchases}<button class="send-cancel-btn" data-cancel-id="${id}" title="取消（退還80%金幣）">✕</button></span>`;
      }).join('');
      queueHtml = `<div style="margin:4px 0;">已排隊：${tags}</div>`;
    } else if (this.playerSendQueue.length > 0) {
      const grouped = {};
      for (const s of this.playerSendQueue) grouped[s.icon + s.name] = (grouped[s.icon + s.name] || 0) + 1;
      queueHtml = `<div style="margin:4px 0;">已排隊：${
        Object.entries(grouped).map(([k,v]) => `<span class="send-queue-tag">${k}×${v}</span>`).join('')
      }</div>`;
    }

    div.innerHTML = `
      <div style="margin-bottom:4px; line-height:1.6;">
        💰 <b style="color:#ffd93d">${Math.floor(this.gold)}</b>g
        收入: <b style="color:#4ecdc4">+${this.income}</b>/波
        <span style="color:#666;font-size:10px">（基礎${baseIncome}+送兵${investedIncome}）</span>
      </div>
      <div style="font-size:10px;color:#888;margin-bottom:2px;">
        ${this.oppName} 有 <b style="color:#e94560">${aiTowerCount}</b> 座塔 — 你的兵開戰後要跑過${this.oppName}防線
      </div>
      ${queueHtml}
      ${isPreWave ? `
        <div style="font-size:10px;color:#888;margin-bottom:4px;">
          送兵排隊 → 開戰後跑${this.oppName}防線 → 活著到達扣${this.oppName}血
        </div>
        <div id="send-btns"></div>
      ` : `<div style="font-size:10px;color:#666;">戰鬥中… 看下方${this.oppName}防線</div>`}
    `;

    if (!isPreWave) return;

    // 綁定取消按鈕
    div.querySelectorAll('.send-cancel-btn').forEach(btn => {
      btn.onclick = (ev) => {
        ev.stopPropagation();
        const cancelId = btn.dataset.cancelId;
        this.cancelOneSend(cancelId);
      };
    });

    const container = document.getElementById('send-btns');
    if (!container) return;

    for (const s of INCOME_SENDS) {
      const quota = getSendQuota(s.id, nextWave);
      const used = this.sendUsed[s.id] || 0;
      const remaining = quota - used;
      const canAfford = this.gold >= s.cost;
      const canSend = remaining > 0;
      const locked = quota === 0;

      const btn = document.createElement('button');
      btn.className = 'send-btn';
      btn.disabled = locked || !canAfford || !canSend;
      if (locked) {
        const unlockCh = s.quota.findIndex(q => q > 0);
        const unlockWave = unlockCh >= 0 ? unlockCh * 4 + 1 : '?';
        btn.innerHTML = `
          <span class="send-icon" style="opacity:0.3">${s.icon}</span>
          <div class="send-info">
            <div class="send-name" style="color:#666">${s.name}　💰${s.cost}　🔒 W${unlockWave}解鎖</div>
          </div>
        `;
      } else {
        btn.innerHTML = `
          <span class="send-icon">${s.icon}</span>
          <div class="send-info">
            <div class="send-name">${s.name}　💰${s.cost}　→　+${s.income}/波　<span style="color:${remaining > 0 ? '#8f8' : '#e94560'};font-size:10px">剩${remaining}/${quota}</span></div>
            <div class="send-detail">${s.desc}（HP:${s.hp} ×${s.count}　到達扣${s.dmgToBase}血/隻）</div>
          </div>
        `;
      }
      btn.onclick = () => {
        if (locked) return;
        const curQuota = getSendQuota(s.id, nextWave);
        const curUsed = this.sendUsed[s.id] || 0;
        if (this.gold < s.cost || curUsed >= curQuota) return;
        this.gold -= s.cost;
        this.income += s.income;
        this.sendUsed[s.id] = curUsed + 1;
        for (let i = 0; i < s.count; i++) {
          this.playerSendQueue.push({...s});
        }
        // PVP: 通知對手我送了兵
        if (this.mode === 'pvp') {
          this.netSend({ type: 'sendTroop', troopId: s.id });
        }
        this.rebuildSidebar();
      };
      container.appendChild(btn);
    }
  }

  // 取消一次送兵（退還 80% 金幣）
  cancelOneSend(sendId) {
    const sendDef = INCOME_SENDS.find(s => s.id === sendId);
    if (!sendDef) return;
    // 從 queue 中移除該兵種的 count 隻（一次購買的量）
    let removed = 0;
    for (let i = this.playerSendQueue.length - 1; i >= 0 && removed < sendDef.count; i--) {
      if (this.playerSendQueue[i].id === sendId) {
        this.playerSendQueue.splice(i, 1);
        removed++;
      }
    }
    if (removed === 0) return;
    // 退還 80% 金幣，扣回 income
    this.gold += Math.floor(sendDef.cost * 0.8);
    this.income -= sendDef.income;
    this.sendUsed[sendId] = Math.max(0, (this.sendUsed[sendId] || 0) - 1);
    // PVP: 通知對手取消
    if (this.mode === 'pvp') {
      this.netSend({ type: 'cancelTroop', troopId: sendId });
    }
    this.rebuildSidebar();
  }

  // AI 受傷浮動數字
  showAiDmgFloat(dmg) {
    const bar = document.getElementById('ai-bar');
    const float = document.createElement('div');
    float.className = 'ai-dmg-float';
    float.textContent = `-${dmg}`;
    float.style.left = `${bar.offsetWidth / 2 + Math.random() * 60 - 30}px`;
    float.style.bottom = '30px';
    bar.appendChild(float);
    setTimeout(() => float.remove(), 1000);
  }

  // 更新 AI 狀態面板
  updateAiBar() {
    const pct = Math.max(0, this.ai.hp / this.ai.maxHp * 100);
    document.getElementById('ai-hp-fill').style.width = pct + '%';
    document.getElementById('ai-hp-text').textContent = `${Math.ceil(this.ai.hp)}/${this.ai.maxHp}`;
    document.getElementById('ai-tower-val').textContent = this.ai.towers.length;
    document.getElementById('ai-gold-val').textContent = Math.floor(this.ai.gold);
    document.getElementById('ai-income-val').textContent = this.ai.income;

    // AI 角色名
    const charEl = document.getElementById('ai-char-name');
    if (this.aiBaseElem) {
      charEl.textContent = `${ELEM[this.aiBaseElem].icon}${ELEM[this.aiBaseElem].name}`;
      charEl.style.color = ELEM[this.aiBaseElem].color;
    } else {
      charEl.textContent = this.mode === 'pvp' ? `⚔️ ${this.oppName}` : '🤖 AI';
      charEl.style.color = '#888';
    }

    // 塔效果詳情（顯示 AI 各塔混合 DPS）
    const n = this.ai.towers.length;
    const aiElemColor = this.aiBaseElem ? ELEM[this.aiBaseElem].color : '#888';
    const aiLvLabel = this.aiTowerLevel <= 2 ? `Basic Lv${this.aiTowerLevel}` : `元素Lv${this.aiTowerLevel - 2}`;
    let aiInfName = '';
    if (this.aiTowerLevel >= 5 && this.aiThirdElem && this.aiBaseElem && this.aiInfuseElem) {
      const key = this.getTripleKey(this.aiBaseElem, this.aiInfuseElem, this.aiThirdElem);
      aiInfName = TRIPLE_TOWERS[key] ? ' '+TRIPLE_TOWERS[key].name : '';
    } else if (this.aiTowerLevel >= 4 && this.aiBaseElem && this.aiInfuseElem) {
      aiInfName = ' '+INFUSIONS[this.aiBaseElem][this.aiInfuseElem].name;
    }
    let totalDps = 0;
    for (const t of this.ai.towers) {
      const s = this.getAiTowerStats(t.level, t);
      totalDps += s.damage * s.atkSpd;
    }
    document.getElementById('ai-tower-detail').innerHTML =
      n > 0
        ? `<span style="color:${aiElemColor}">${aiLvLabel}${aiInfName} ×${n}塔 → 總DPS ${totalDps.toFixed(0)}</span>`
        : `<span style="color:#666">尚未蓋塔</span>`;

    // AI 上一波行動
    const actionEl = document.getElementById('ai-action-info');
    if (this.ai.lastAction) {
      actionEl.textContent = this.ai.lastAction;
    }
  }

  // ── 戰報日誌 ──
  addBattleLog(type, html) {
    const log = document.getElementById('battle-log');
    const line = document.createElement('div');
    line.className = type === 'player' ? 'log-player' : 'log-ai';
    line.innerHTML = html;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 50) log.removeChild(log.firstChild);
  }

  // ── 元素選擇系統（Boss 過關獎勵）──
  showElementScreen() {
    const overlay = document.getElementById('reward-overlay');
    const cardsDiv = document.getElementById('reward-cards');
    const title = overlay.querySelector('h2');

    // 找到下一個 Boss 波
    let nextBossIdx = -1;
    for (let i = this.wave; i < CONFIG.totalWaves; i++) {
      if (WAVES[i]?.isBoss) { nextBossIdx = i; break; }
    }
    const wavesUntilBoss = nextBossIdx >= 0 ? nextBossIdx - this.wave + 1 : -1;
    const bossHint = nextBossIdx >= 0
      ? `<div style="color:#ffd93d;font-size:12px;margin-top:4px;">⚠️ ${wavesUntilBoss} 波後是 BOSS：W${nextBossIdx+1} ${WAVES[nextBossIdx].icon} ${WAVES[nextBossIdx].name}（HP:${WAVES[nextBossIdx].hp}）</div>`
      : '';
    title.innerHTML = `🔮 W${this.wave} 過關 — 選擇元素${bossHint}`;

    overlay.style.display = 'flex';
    cardsDiv.innerHTML = '';

    for (const ek of getActiveKeys()) {
      const card = document.createElement('div');
      card.className = 'reward-card';
      const curPicks = this.elemPicks[ek];
      const totalPicks = this.getTotalPicks();

      // 顯示注入可能性
      let infuseInfo = '';
      if (curPicks > 0) {
        infuseInfo = `目前持有 ×${curPicks} → ×${curPicks+1}`;
        if (curPicks + 1 >= 3) infuseInfo += '<br><span style="color:#ffd93d">可解鎖元素Lv3！</span>';
      } else {
        infuseInfo = `新解鎖！可將 Basic Lv2 塔轉為${ELEM[ek].name}元素塔`;
        if (totalPicks === 0) infuseInfo += '<br><span style="color:#aaa">（1 pick → 可轉元素 Lv3）</span>';
      }

      card.innerHTML = `
        <div class="reward-icon">${ELEM[ek].icon}</div>
        <div class="reward-name" style="color:${ELEM[ek].color}">${ELEM[ek].name}元素</div>
        <div class="reward-desc">${infuseInfo}</div>
      `;
      card.onclick = () => {
        this.elemPicks[ek]++;
        if (this.mode === 'pvp') this.netSend({ type: 'pickElement', elem: ek });

        // Boss 過關 income 階段加成
        const incomeBonus = 15;
        this.income += incomeBonus;
        if (this.mode === 'pve') this.ai.income += incomeBonus;

        this.announce(`選擇 ${ELEM[ek].icon} ${ELEM[ek].name}！收入 +${incomeBonus}`);

        // 元素解鎖後，基礎塔選擇保持不變（放塔仍用箭/砲）

        overlay.style.display = 'none';
        this.state = 'pre_wave';
        this.myReady = false;
        this.readyPlayers.clear();
        this.showPreWave();
        this.rebuildSidebar();
      };
      cardsDiv.appendChild(card);
    }
  }

  // ── Pre-wave ──
  showPreWave() {
    this.showIncomeSection();
    this.showWavePreview();
  }

  showWavePreview() {
    const infoDiv = document.getElementById('wave-info');
    const nextIdx = this.wave;
    if (nextIdx >= CONFIG.totalWaves) {
      infoDiv.innerHTML = '<div style="color:#4c4">所有波次已清除！</div>';
      return;
    }
    const w = WAVES[nextIdx];
    const total = CONFIG.totalWaves;

    let resistHtml = '<span style="color:#666">無</span>';
    let weakHtml = '';
    if (w.resist === 'random') {
      resistHtml = '<span style="color:#c66">隨機單抗</span>';
      weakHtml = '<span style="color:#6c6">隨機（看抗性反推）</span>';
    } else if (w.resist === 'random_dual') {
      resistHtml = '<span style="color:#c66">隨機雙抗</span>';
      weakHtml = '<span style="color:#6c6">隨機（看抗性反推）</span>';
    } else if (typeof w.resist === 'object' && Object.keys(w.resist).length > 0) {
      resistHtml = Object.entries(w.resist).map(([e,v]) => {
        const el = ELEM[e];
        if (!el) return `<span style="color:#888">${e}${Math.round(v*100)}%</span>`;
        return `<span class="resist-tag" style="background:${el.color}33;border:1px solid ${el.color}">${el.icon}${el.name}抗${Math.round(v*100)}%</span>`;
      }).join('');
      // 弱點：哪個元素克制有抗性的元素
      const resistElems = Object.keys(w.resist);
      const weakSet = new Set();
      for (const re of resistElems) {
        for (const [atk, advMap] of Object.entries(CONFIG.elemAdv)) {
          if (advMap[re] && advMap[re] > 1) weakSet.add(atk);
        }
      }
      // 也找出沒有抗性的元素（打起來不會被減傷）
      const noResist = getActiveKeys().filter(e => !resistElems.includes(e));
      let parts = [];
      for (const e of weakSet) {
        const el = ELEM[e];
        parts.push(`<span class="weak-tag" style="color:${el.color};border-color:${el.color}">${el.icon}${el.name}克制</span>`);
      }
      for (const e of noResist) {
        const el = ELEM[e];
        parts.push(`<span style="color:${el.color};font-size:10px">${el.icon}${el.name}無抗</span>`);
      }
      weakHtml = parts.join(' ');
    }

    let passiveHtml = '<span style="color:#666">無</span>';
    if (w.skills && w.skills.length > 0) {
      passiveHtml = `<span class="passive-tag">${getSkillBrief(w.skills)}</span>`;
    }

    let extraHtml = '';
    if (w.extra) {
      extraHtml = `<div style="margin-top:3px; color:#e94560">+ 附帶小兵 ×${w.extra.count} (HP:${w.extra.hp})</div>`;
    }
    if (w.mix) {
      const mp = w.mix.skills ? getSkillBrief(w.mix.skills) : '';
      extraHtml = `<div style="margin-top:3px; color:#cc8">+ 混合 ×${w.mix.count} (HP:${w.mix.hp}) ${mp}</div>`;
    }

    const diff = CONFIG.difficulty[this.difficulty];
    const effHp = Math.round(w.hp * diff.hpMult);
    const effCount = Math.round(w.count * diff.countMult);

    const oppLabel = this.mode === 'pvp' ? '⚔️ 對手' : '🤖 AI';
    let aiPreviewHtml = '';
    if (this.mode === 'pve') {
      const aiNextGold = this.ai.gold + this.ai.income;
      const aiBudget = Math.floor(aiNextGold * 0.8);
      aiPreviewHtml = `<div style="margin-top:3px; color:#ffd93d; font-size:10px;">
        🤖 AI: ${this.ai.towers.length}座塔 | 預算~${aiBudget}g → 蓋塔+送兵
      </div>`;
    } else {
      aiPreviewHtml = `<div style="margin-top:3px; color:#4ecdc4; font-size:10px;">
        ⚔️ 對手: ${this.ai.towers.length}座塔 | 對手送兵會在開波後出現
      </div>`;
    }

    // Boss 標記（本波是 Boss 時才顯示醒目警告）
    const isBoss = !!w.isBoss;
    const bossLabel = isBoss ? '<span style="color:#ffd93d;font-weight:bold;"> ⭐ BOSS</span>' : '';
    const hasTenacity = w.skills && w.skills.some(s => s.type === 'tenacity');
    const bossTenacityNote = hasTenacity ? '<br><span style="color:#ffd93d;font-size:10px;">⚠️ 韌性：所有控場效果減半</span>' : '';
    const bossWarning = isBoss ? `<div style="background:#4a2020;border:1px solid #e94560;border-radius:6px;padding:6px 8px;margin-top:4px;text-align:center;">
      <span style="color:#ffd93d;font-weight:bold;">⚠️ BOSS 波！W${nextIdx+1} ${w.icon} ${w.name}</span><br>
      <span style="color:#ccc;font-size:10px;">HP:${Math.round(w.hp * diff.hpMult)} ×${Math.round(w.count * diff.countMult)}　💰${w.killGold||0}g/隻　確保單體火力充足！</span>
    </div>` : '';

    infoDiv.innerHTML = `
      <div class="wave-preview">
        <div class="label">${oppLabel} 進攻：Wave ${nextIdx+1}/${total} — ${w.icon} ${w.name}${bossLabel}</div>
        <div class="detail">
          數量: ${effCount} | HP: ${effHp} | 護甲: ${Math.round(w.armor*100)}% | 💰${w.killGold||0}g/隻<br>
          抗性: ${resistHtml}<br>
          ${weakHtml ? `弱點: ${weakHtml}<br>` : ''}
          被動: ${passiveHtml}${bossTenacityNote}
          ${extraHtml}
          ${aiPreviewHtml}
        </div>
      </div>
      ${bossWarning}
      ${nextIdx + 1 < total ? this.miniPreview(nextIdx + 1) : ''}
      ${this.state === 'pre_wave' ? `
        <button class="income-btn" id="start-wave-btn" style="width:100%;margin-top:6px;padding:8px;font-size:13px;font-weight:bold;">
          ▶ 開始 Wave ${nextIdx+1}
        </button>
      ` : '<div style="color:#aaa;text-align:center;margin-top:4px;">戰鬥中...</div>'}
    `;

    const startBtn = document.getElementById('start-wave-btn');
    const topReadyBtn = document.getElementById('pvp-ready-topbar');
    if (startBtn) {
      if (this.mode === 'pvp') {
        const readyCount = this.readyPlayers.size;
        const totalOthers = this.alivePlayers.size - 1;
        const readyText = this.myReady ? `⏳ 等待中...（${readyCount}/${totalOthers}）` : `✓ 準備 Wave ${nextIdx+1}`;
        const readyOpacity = this.myReady ? '0.5' : '1';
        startBtn.textContent = readyText;
        startBtn.style.opacity = readyOpacity;
        startBtn.style.background = this.myReady ? '#1a1a3e' : '#1a3a3e';
        startBtn.style.borderColor = '#4ecdc4';
        const doReady = () => {
          if (this.myReady) return;
          this.myReady = true;
          this.netSend({ type: 'ready' });
          this.showWavePreview(); // 刷新顯示
          this.checkAllReady();
        };
        startBtn.onclick = doReady;
        // Topbar 準備按鈕也同步
        if (topReadyBtn) {
          topReadyBtn.style.display = this.state === 'pre_wave' ? '' : 'none';
          topReadyBtn.textContent = this.myReady ? `⏳ ${readyCount}/${totalOthers}` : `✓ 準備 W${nextIdx+1}`;
          topReadyBtn.style.opacity = readyOpacity;
          topReadyBtn.onclick = doReady;
        }
      } else {
        startBtn.onclick = () => this.startWave();
        if (topReadyBtn) topReadyBtn.style.display = 'none';
      }
    } else {
      // 戰鬥中：隱藏 topbar 按鈕
      if (topReadyBtn) topReadyBtn.style.display = 'none';
    }
  }

  miniPreview(idx) {
    if (idx >= CONFIG.totalWaves) return '';
    const w = WAVES[idx];
    let resistStr = '';
    if (w.resist === 'random') resistStr = ' | 隨機單抗';
    else if (w.resist === 'random_dual') resistStr = ' | 隨機雙抗';
    else if (typeof w.resist === 'object' && Object.keys(w.resist).length > 0) {
      resistStr = ' | ' + Object.entries(w.resist).map(([e,v]) => `${ELEM[e]?.icon||e}${Math.round(v*100)}%`).join('');
    }
    const passiveStr = w.skills && w.skills.length > 0 ? ' | ' + getSkillBrief(w.skills) : '';
    return `<div style="margin-top:4px; font-size:10px; color:#666">
      Wave ${idx+1}: ${w.icon} ${w.name} (HP:${w.hp} 💰${w.killGold||0}g${resistStr}${passiveStr})${w.isBoss ? ' ⭐BOSS' : ''}
    </div>`;
  }

  // ── Start wave ──
  startWave() {
    this.wave++;
    if (this.wave > CONFIG.totalWaves) { this.endGame(true, 'survived'); return; }

    // 重置塔的每波戰鬥狀態
    for (const tw of this.towers) {
      tw._rampBonus = 0;
      tw._rampTarget = null;
      tw.atkTimer = 0;
    }

    // income 不在這裡收！改到 wave clear 後才收（叫兵的 income 是投資，要打完一波才回收）
    this.state = 'spawning';

    // 重置送兵計數
    this.sendUsed = {}; // per-type send count, reset each wave

    // 戰報
    this.addBattleLog('player', `── Wave ${this.wave} 開始 ──`);

    // AI 也不在波頭收 income
    if (this.mode === 'pve') {
      // AI income 同樣延後到 wave clear
    }

    // AI 決策（PVE only）/ PVP 由對手操作
    let aiSends = [];
    if (this.mode === 'pve' && !window.SANDBOX?.noAiSend) {
      aiSends = this.aiDecideSends();
    }

    const w = WAVES[this.wave - 1];
    const diff = CONFIG.difficulty[this.difficulty];
    const sbHp = window.SANDBOX?.hpMult || 1;
    const sbCount = window.SANDBOX?.countMult || 1;
    const effCount = Math.round(w.count * diff.countMult * sbCount);

    // === 玩家地圖的敵人 ===
    // 波次怪先出 → 對手送兵殿後
    this.spawnQueue = [];
    for (let i = 0; i < effCount; i++) this.spawnQueue.push(this.mkEnemy(w, 1, diff.hpMult * sbHp));
    if (w.extra) for (let i = 0; i < Math.round(w.extra.count * diff.countMult * sbCount); i++)
      this.spawnQueue.push(this.mkEnemy(w.extra, 1, diff.hpMult * sbHp));
    if (w.mix) for (let i = 0; i < Math.round(w.mix.count * diff.countMult * sbCount); i++)
      this.spawnQueue.push(this.mkEnemy(w.mix, 1, diff.hpMult * sbHp));

    if (this.mode === 'pve') {
      // PVE: AI 送兵殿後
      for (const send of aiSends) {
        for (let i = 0; i < send.count; i++) {
          const e = this.mkEnemy(send.enemy, 1, diff.hpMult);
          e.isAiSend = true;
          e.sendIcon = send.icon;
          this.spawnQueue.push(e);
        }
      }
    } else {
      // PVP: 對手送的兵
      for (const s of this.pvpIncomingSends) {
        const skills = s.skills || [];
        const e = this.mkEnemy({ hp: s.hp, speed: s.speed, armor: s.armor, resist: {}, skills, color: s.color, name: s.name, dmgToBase: s.dmgToBase }, 1, 1);
        e.isAiSend = true;
        e.sendIcon = s.icon;
        this.spawnQueue.push(e);
      }
      this.pvpIncomingSends = [];
    }

    // === AI 防線上的兵 ===
    this.aiLaneTroops = [];
    this.aiLaneProjectiles = [];
    this.aiLaneSpawnQueue = [];

    for (let i = 0; i < effCount; i++) {
      const waveHp = Math.round(w.hp * diff.hpMult);
      this.aiLaneSpawnQueue.push({
        hp: waveHp, maxHp: waveHp, speed: w.speed || 1.0, armor: w.armor || 0,
        dmgToBase: w.dmgToBase || 2, color: w.color, icon: w.icon || '👾', name: w.name,
        pathIdx: 0, isWave: true,
      });
    }
    if (w.extra) {
      for (let i = 0; i < Math.round(w.extra.count * diff.countMult); i++) {
        const eHp = Math.round(w.extra.hp * diff.hpMult);
        this.aiLaneSpawnQueue.push({
          hp: eHp, maxHp: eHp, speed: w.extra.speed || 1.0, armor: w.extra.armor || 0,
          dmgToBase: 1, color: w.extra.color, icon: w.extra.icon || w.icon || '👾', name: w.name + '(隨從)',
          pathIdx: 0, isWave: true,
        });
      }
    }

    for (const s of this.playerSendQueue) {
      this.aiLaneSpawnQueue.push({
        hp: s.hp, maxHp: s.hp, speed: s.speed, armor: s.armor,
        dmgToBase: s.dmgToBase, color: s.color, icon: s.icon, name: s.name,
        skills: s.skills || [], pathIdx: 0,
      });
    }
    if (this.playerSendQueue.length > 0) {
      const grouped = {};
      for (const s of this.playerSendQueue) grouped[s.icon + s.name] = (grouped[s.icon + s.name] || 0) + 1;
      this.addBattleLog('player',
        `⚔️ 你的兵出發：${Object.entries(grouped).map(([k,v]) => `${k}×${v}`).join(' ')} → 衝向 AI ${this.ai.towers.length}座塔！`
      );
    }
    this.playerSendQueue = [];
    this.aiLaneSpawnTimer = 0;
    this.spawnTimer = 0;

    const aiSendStr = this.ai.totalSent.length > 0
      ? ` | 🤖送: ${this.ai.totalSent.map(s => s.icon + s.name).join('')}`
      : '';
    const bossAnnounce = w.isBoss ? ' ⭐BOSS' : '';
    this.announce(`Wave ${this.wave}/${CONFIG.totalWaves}: ${w.icon||''} ${w.name}${bossAnnounce}${aiSendStr}`);

    this.updateAiBar();
    this.showWavePreview();
    this.rebuildSidebar();
  }

  // AI 決策
  aiDecideSends() {
    const ai = this.ai;
    const waveProgress = this.wave / CONFIG.totalWaves;
    ai.totalSent = [];

    const sendRatio = Math.min(0.7, Math.max(0.1, waveProgress * 0.8));
    const totalBudget = Math.floor(ai.gold * 0.85);
    const towerBudget = Math.floor(totalBudget * (1 - sendRatio));
    const sendBudget = totalBudget - towerBudget;

    // AI 升級塔（隨遊戲進度，配合 5 章 × 4 波結構）
    // Ch1(W1-4): Basic Lv1-2, Ch2(W5-8): Lv3, Ch3(W9-12): Lv4, Ch4(W13+): Lv5
    if (this.wave >= 2) this.aiTowerLevel = Math.max(this.aiTowerLevel, 2);
    if (this.wave >= 4) this.aiTowerLevel = Math.max(this.aiTowerLevel, 3);
    if (this.wave >= 9) this.aiTowerLevel = Math.max(this.aiTowerLevel, 4);
    if (this.wave >= 13) this.aiTowerLevel = Math.max(this.aiTowerLevel, 5);

    // AI 在 W3/W6/W9/W12 後獲取元素（共 4 次）
    if (this.wave >= 3 && !this.aiBaseElem) {
      const _ak = getActiveKeys();
      this.aiBaseElem = _ak[Math.floor(Math.random() * _ak.length)];
      this.aiElemPicks[this.aiBaseElem] = 1;
      this.aiInfuseElem = null; // Lv3 = 單元素，尚未注入
    }
    if (this.wave >= 6 && this.getTotalAiPicks() < 2) {
      // 第 2 元素：50% 同元素，50% 隨機不同
      if (Math.random() < 0.5) {
        this.aiElemPicks[this.aiBaseElem]++;
      } else {
        const others = getActiveKeys().filter(e => e !== this.aiBaseElem);
        const pick = others[Math.floor(Math.random() * others.length)];
        this.aiElemPicks[pick] = (this.aiElemPicks[pick] || 0) + 1;
      }
      // 2 picks → AI 可注入（選同元素或不同）
      if (!this.aiInfuseElem) {
        const avail = getActiveKeys().filter(e => e !== this.aiBaseElem ? (this.aiElemPicks[e] || 0) >= 1 : (this.aiElemPicks[e] || 0) >= 2);
        this.aiInfuseElem = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : this.aiBaseElem;
      }
    }
    if (this.wave >= 9 && this.getTotalAiPicks() < 3) {
      // 第 3 元素：隨機選一個新元素（優先不同，讓三屬塔可用）
      const others3 = getActiveKeys().filter(e => e !== this.aiBaseElem && e !== this.aiInfuseElem);
      const pick3 = others3.length > 0 ? others3[Math.floor(Math.random() * others3.length)] : this.aiBaseElem;
      this.aiElemPicks[pick3] = (this.aiElemPicks[pick3] || 0) + 1;
      // 選定第三元素用於 Lv5
      if (!this.aiThirdElem && this.aiBaseElem && this.aiInfuseElem) {
        const key = this.getTripleKey(this.aiBaseElem, this.aiInfuseElem, pick3);
        if (TRIPLE_TOWERS[key]) this.aiThirdElem = pick3;
      }
    }
    if (this.wave >= 12 && this.getTotalAiPicks() < 4) {
      // 若三屬路線可用，50% 機率加 thirdElem（確保 thirdElem 有 picks）
      // 另 50% 加 baseElem（保留純屬 Lv6 路線可能）
      const addElem = (this.aiThirdElem && Math.random() < 0.5)
        ? this.aiThirdElem
        : this.aiBaseElem;
      this.aiElemPicks[addElem] = (this.aiElemPicks[addElem] || 0) + 1;
    }

    // === 蓋塔 ===
    // 後期提高塔數上限
    const diffCfg = CONFIG.difficulty[this.difficulty] || CONFIG.difficulty.x1;
    const aiMaxTowers = this.wave >= 13 ? diffCfg.aiMaxTowers + 2 : this.wave >= 7 ? diffCfg.aiMaxTowers + 1 : diffCfg.aiMaxTowers;
    let towersBuilt = 0;
    let towerSpent = 0;
    let towerRemaining = towerBudget;
    // 建立 AI 路徑 set 和已佔用格 set
    if (!this._aiPathSet) {
      this._aiPathSet = new Set(this.aiPath.map(p => `${p.x},${p.y}`));
    }
    const aiOccupied = new Set(ai.towers.map(tw => `${tw.x},${tw.y}`));
    const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];

    while (towerRemaining >= diffCfg.aiTowerCost && ai.towers.length < aiMaxTowers) {
      const pathLen = this.aiPath.length;
      const spacing = pathLen / (aiMaxTowers + 1);
      const idx = ai.towers.length;
      const pathIdx = Math.floor(spacing * (idx + 1));
      const pathPos = this.aiPath[Math.min(pathIdx, pathLen - 1)];

      // 在路徑旁邊找空格放塔（不在路徑上）
      let placed = false;
      for (const d of dirs) {
        const nx = pathPos.x + d.dx, ny = pathPos.y + d.dy;
        const key = `${nx},${ny}`;
        if (!this._aiPathSet.has(key) && !aiOccupied.has(key) && ny >= CONFIG.gridRows + 1) {
          towerRemaining -= diffCfg.aiTowerCost;
          ai.gold -= diffCfg.aiTowerCost;
          const basicType = idx % 2 === 0 ? 'cannon' : 'arrow';
          ai.towers.push({ x: nx, y: ny, pathIdx: pathIdx, atkTimer: 0, level: this.aiTowerLevel, basicType });
          aiOccupied.add(key);
          towersBuilt++;
          towerSpent += diffCfg.aiTowerCost;
          placed = true;
          break;
        }
      }
      if (!placed) break; // 找不到空位就停
    }

    // 升級現有 AI 塔（需花金幣，逐塔逐級升）
    const aiUpgradeCosts = { 2: 80, 3: 130, 4: 250, 5: 400 }; // Lv1→2: 80, Lv2→3: 130, ...
    for (const tw of ai.towers) {
      while (tw.level < this.aiTowerLevel) {
        const nextLv = tw.level + 1;
        const cost = aiUpgradeCosts[nextLv] || 999;
        if (towerRemaining >= cost) {
          towerRemaining -= cost;
          ai.gold -= cost;
          towerSpent += cost;
          tw.level = nextLv;
        } else {
          break;
        }
      }
    }

    // === 送兵（受配額限制，與玩家相同） ===
    let sendRemaining = sendBudget;
    const sends = [];
    const aiSendUsed = {}; // 本波 AI 已送數量（per-type）
    const available = [...AI_SENDS].reverse();

    for (const s of available) {
      const quota = getSendQuota(s.id, this.wave);
      if (quota <= 0) continue;
      while ((aiSendUsed[s.id] || 0) < quota && sendRemaining >= s.cost) {
        sendRemaining -= s.cost;
        ai.gold -= s.cost;
        ai.income += s.income;
        sends.push(s);
        ai.totalSent.push(s);
        aiSendUsed[s.id] = (aiSendUsed[s.id] || 0) + 1;
      }
    }

    // === 送兵後二次升級：用剩餘金幣補升落後的塔 ===
    let extraUpgradeSpent = 0;
    const aiUpgradeCosts2 = aiUpgradeCosts;
    for (const tw of ai.towers) {
      while (tw.level < this.aiTowerLevel) {
        const nextLv = tw.level + 1;
        const cost = aiUpgradeCosts2[nextLv] || 999;
        if (ai.gold >= cost) {
          ai.gold -= cost;
          extraUpgradeSpent += cost;
          towerSpent += cost;
          tw.level = nextLv;
        } else {
          break;
        }
      }
    }

    const parts = [];
    if (towersBuilt > 0) parts.push(`蓋${towersBuilt}塔（共${ai.towers.length}座）`);
    if (sends.length > 0) {
      const grouped = {};
      for (const s of sends) grouped[s.name] = (grouped[s.name] || 0) + s.count;
      const detail = Object.entries(grouped).map(([name, cnt]) => `${name}×${cnt}`).join('、');
      const totalIncome = sends.reduce((sum, s) => sum + s.income, 0);
      parts.push(`送兵 ${detail}（+${totalIncome}inc）`);
    }
    ai.lastAction = parts.length > 0 ? `W${this.wave}: ${parts.join(' + ')}` : `W${this.wave}: 存錢`;

    if (towersBuilt > 0 || sends.length > 0) {
      this.addBattleLog('ai',
        `🤖 AI 行動：${parts.join(' + ')}（花${towerSpent + sendBudget - sendRemaining}g，剩${Math.floor(ai.gold)}g）`
      );
    } else {
      this.addBattleLog('ai', `🤖 AI 存錢中（金:${Math.floor(ai.gold)}）`);
    }

    return sends;
  }

  mkEnemy(def, speedMult, hpMult = 1) {
    let resist = def.resist;
    if (resist === 'random') {
      const ak = getActiveKeys();
      const re = ak[Math.floor(Math.random() * ak.length)];
      resist = { [re]: 0.5 };
    } else if (resist === 'random_dual') {
      const ak = getActiveKeys();
      const shuffled = [...ak].sort(() => Math.random() - 0.5);
      resist = { [shuffled[0]]: 0.4, [shuffled[1]]: 0.4 };
    }
    const hp = Math.round(def.hp * hpMult);
    return {
      hp, maxHp: hp, speed: def.speed, armor: def.armor,
      resist: {...(resist||{})}, skills: [...(def.skills||[])],
      color: def.color, name: def.name||'敵人', icon: def.icon||null, elem: def.elem||null, dmgToBase: def.dmgToBase||1, isBoss: !!def.isBoss, killGold: def.killGold||0, speedMult,
      pathIdx: 0, chillStacks: 0, chillDecay: 0, stunTimer: 0,
      burnDmg: 0, burnTimer: 0, burnStacks: 0,
      frostbiteDur: 0, frostbiteDmgPct: 0,
      armorStacks: 0, shredStacks: 0, shredDecay: 0,
      vulnStacks: 0, vulnDecay: 0,
      _resilientReduction: 0, _hpPctCd: 0,
      baseSpeed: def.speed,
      focusHits: {}, revealed: true,
      adaptDmg: {}, phaseIdx: 0, summonTimer: 0,
    };
  }

  announce(text) {
    this.announceTimer = 2;
    const el = document.getElementById('wave-announce');
    el.textContent = text;
    el.style.opacity = 1;
  }

  // ── Events ──
  toGrid(e) {
    const r = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / r.width, sy = this.canvas.height / r.height;
    const mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sy;
    return { gx: Math.floor((mx - this.offsetX) / this.cellSize), gy: Math.floor((my - this.offsetY) / this.cellSize) };
  }

  setupEvents() {
    this.canvas.addEventListener('click', (e) => {
      // 關閉塔類型選擇 popup（如果有）
      this.closeTowerSelectPopup();
      this.hideEnemyTooltip();

      // 先檢查是否點到敵人
      const clickedEnemy = this.findEnemyAtClick(e);
      if (clickedEnemy) {
        this.showEnemyTooltip(clickedEnemy, e);
        this.pendingPlace = null;
        return;
      }

      const { gx, gy } = this.toGrid(e);
      if (gx < 0 || gx >= CONFIG.gridCols || gy < 0 || gy >= CONFIG.gridRows) return;

      // 放塔（空格）— 第一次點擊預覽，第二次確認蓋塔
      if (this.grid[gy][gx] === 0) {
        if (this.pendingPlace && this.pendingPlace.x === gx && this.pendingPlace.y === gy) {
          // 第二次點擊：確認蓋塔
          this.placeTower(gx, gy);
          this.pendingPlace = null;
        } else {
          // 第一次點擊：標記預覽位置
          this.pendingPlace = { x: gx, y: gy };
          this.selectedTower = null;
          this.rebuildSidebar();
        }
        return;
      }

      // 選取已有的塔
      if (this.grid[gy][gx] === 2) {
        const t = this.towers.find(t => t.x === gx && t.y === gy);
        if (t) {
          this.selectedTower = (this.selectedTower === t) ? null : t;
          this.pendingPlace = null;
          this.rebuildSidebar();
        }
        return;
      }

      // 取消選取
      this.selectedTower = null;
      this.pendingPlace = null;
      this.rebuildSidebar();
    });

    this.canvas.addEventListener('mousemove', (e) => { this.hoveredCell = this.toGrid(e); });

    // Speed button
    const speedBtn = document.getElementById('speed-btn');
    if (this.mode === 'pvp') {
      // PVP 鎖定 8x，不可更改
      speedBtn.textContent = '▶▶▶▶ ×8（鎖定）';
      speedBtn.style.background = '#e94560';
      speedBtn.style.opacity = '0.6';
      speedBtn.style.cursor = 'default';
    } else {
      const speeds = [1, 2, 4, 8];
      const labels = ['▶ ×1', '▶▶ ×2', '▶▶▶ ×4', '▶▶▶▶ ×8'];
      speedBtn.onclick = () => {
        const idx = (speeds.indexOf(this.gameSpeed) + 1) % speeds.length;
        this.gameSpeed = speeds[idx];
        speedBtn.textContent = labels[idx];
        speedBtn.style.background = this.gameSpeed > 1 ? '#e94560' : '#1a1a3e';
      };
    }

    // AI HP +1 button
    const aiHpBtn = document.getElementById('ai-hp-btn');
    if (this.mode === 'pvp') {
      const oppLabel = this.oppName;
      aiHpBtn.textContent = `⚔️ ${oppLabel} +1 HP`;
      document.querySelector('#ai-bar > div > span').innerHTML = `⚔️ ${oppLabel} <span id="ai-char-name"></span>`;
    }
    aiHpBtn.onclick = () => {
      this.ai.hp = Math.min(this.ai.hp + 1, this.ai.maxHp);
      this.updateHUD();
    };

    // Info button
    document.getElementById('info-btn').onclick = () => this.showInfoOverlay();

    // Sidebar toggle (mobile drawer)
    const sidebarEl = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const closeSidebar = () => { sidebarEl.classList.remove('open'); backdrop.classList.remove('show'); };
    document.getElementById('sidebar-toggle').onclick = () => {
      const isOpen = sidebarEl.classList.toggle('open');
      backdrop.classList.toggle('show', isOpen);
    };
    backdrop.onclick = closeSidebar;
  }

  showInfoOverlay() {
    const overlay = document.getElementById('info-overlay');
    const content = document.getElementById('info-content');
    const nextIdx = this.wave;
    const oppLabel = this.oppName;
    const diff = CONFIG.difficulty[this.difficulty];
    const era = Math.min(4, Math.floor((nextIdx) / 4));
    const self = this;

    const tabs = [
      { id: 'tab-rules', label: '📜 規則', build: buildRulesTab },
      { id: 'tab-waves', label: '🌊 波次', build: buildWavesTab },
      { id: 'tab-sends', label: '🏃 送兵', build: buildSendsTab },
      { id: 'tab-towers', label: '🏗️ 塔', build: buildTowersTab },
    ];

    // Tab bar
    let html = '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">';
    for (const t of tabs) {
      html += `<button class="info-tab-btn" data-tab="${t.id}" style="padding:6px 14px;border:1px solid #555;border-radius:4px 4px 0 0;background:#1a1a3e;color:#aaa;cursor:pointer;font-size:12px;">${t.label}</button>`;
    }
    html += '</div><div id="info-tab-content"></div>';
    content.innerHTML = html;

    // Tab click
    const btns = content.querySelectorAll('.info-tab-btn');
    function switchTab(tabId) {
      btns.forEach(b => {
        const active = b.dataset.tab === tabId;
        b.style.background = active ? '#2a1a3e' : '#1a1a3e';
        b.style.color = active ? '#ffd93d' : '#aaa';
        b.style.borderBottom = active ? '2px solid #ffd93d' : '1px solid #555';
      });
      const tab = tabs.find(t => t.id === tabId);
      document.getElementById('info-tab-content').innerHTML = tab ? tab.build() : '';
    }
    btns.forEach(b => b.onclick = () => switchTab(b.dataset.tab));
    switchTab('tab-rules');

    overlay.style.display = 'flex';

    // 技能 tooltip（事件委派）
    overlay.onclick = (ev) => {
      const tip = ev.target.closest('.skill-tip');
      if (!tip) return;
      ev.stopPropagation();
      const skills = tip.dataset.skills ? JSON.parse(tip.dataset.skills) : [];
      const desc = getSkillDesc(skills);
      let ttDiv = document.getElementById('info-special-tooltip');
      if (!ttDiv) {
        ttDiv = document.createElement('div');
        ttDiv.id = 'info-special-tooltip';
        ttDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a3e;border:2px solid #ffd93d;border-radius:8px;padding:12px 16px;color:#eee;font-size:13px;max-width:350px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.8);white-space:pre-line;';
        ttDiv.onclick = () => ttDiv.style.display = 'none';
        document.body.appendChild(ttDiv);
      }
      ttDiv.textContent = desc;
      ttDiv.style.display = 'block';
    };

    // === Tab builders ===
    function buildRulesTab() {
      return `
        <h3 style="color:#95e1d3;margin:8px 0 4px;">🔥💧🌪️ 元素克制</h3>
        <div style="font-size:11px;">
          🔥火 → 🌪️風（×1.3） | 🌪️風 → 💧水（×1.3） | 💧水 → 🔥火（×1.3）<br>
          被克制 ×0.7 | 無關係 ×1.0
        </div>
        <h3 style="color:#ffd93d;margin:12px 0 4px;">💰 經濟系統</h3>
        <div style="font-size:11px;">
          起始金幣: ${CONFIG.startGold}g<br>
          基礎收入: ${CONFIG.baseIncome}g/波（保底）<br>
          擊殺金（波次怪）: 每隻怪物獨立金額（見波次預覽），Boss 擊殺金額更高<br>
          擊殺金（AI送兵）: ${CONFIG.killGoldAiSend}g（固定）<br>
          <b style="color:#4ecdc4;">送兵 = 主要 income 成長手段</b>，不送兵後期會缺錢
        </div>
        <h3 style="color:#ff6b35;margin:12px 0 4px;">🏗️ 升級路徑</h3>
        <div style="font-size:11px;">
          基礎塔 Lv1 (50g) → Lv2 (+80g) → 元素 Lv1 (+150g) → Lv2 (+250g) → Lv3 (+400g)<br>
          元素選擇: W3 / W6 / W9 / W12 通關後各選一次（共4次）<br>
          1 pick → 純元素路線 only（最高 Lv1）<br>
          2 picks → 可選混合路線（最高 Lv2）<br>
          3 picks 同元素 → 純元素 Lv3（最強）
        </div>
        <h3 style="color:#c6c;margin:12px 0 4px;">⚡ 技能一覽</h3>
        <div style="font-size:11px;">
          ${Object.entries(SKILL_DEFS).map(([k,v]) => `<b>${v.name}</b>：${v.desc}`).join('<br>')}
        </div>
        <h3 style="color:#e94560;margin:12px 0 4px;">⚔️ 傷害計算</h3>
        <div style="font-size:11px;">
          原始傷害 × 元素克制(elemAdv) × (1-護甲) × (1-抗性)<br>
          護甲上限 80% | 最低傷害 1
        </div>
      `;
    }

    function buildWavesTab() {
      let h = '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
      h += '<tr style="color:#ffd93d;border-bottom:1px solid #444;"><th>波</th><th>名稱</th><th>數量</th><th>HP</th><th>護甲</th><th>元素</th><th>抗性</th><th>被動</th></tr>';
      for (let i = 0; i < WAVES.length; i++) {
        const w = WAVES[i];
        const isCurrent = i === nextIdx;
        const bg = isCurrent ? 'background:#2a1a3e;' : (i < nextIdx ? 'opacity:0.5;' : '');
        const effHp = Math.round(w.hp * diff.hpMult);
        const effCount = Math.round(w.count * diff.countMult);
        let resistStr = '—';
        if (w.resist === 'random') resistStr = '隨機單抗';
        else if (w.resist === 'random_dual') resistStr = '隨機雙抗';
        else if (typeof w.resist === 'object' && Object.keys(w.resist).length > 0) {
          resistStr = Object.entries(w.resist).map(([e,v]) => `${ELEM[e]?.icon||e}${Math.round(v*100)}%`).join(' ');
        }
        const elemStr = w.elem ? `${ELEM[w.elem]?.icon||''}${ELEM[w.elem]?.name||w.elem}` : '—';
        const passiveStr = w.skills && w.skills.length > 0 ? getSkillBrief(w.skills) : '—';
        const bossTag = w.isBoss ? '⭐' : '';
        const marker = isCurrent ? '➤ ' : '';
        const eraLabel = (i % 4 === 0) ? `<td colspan="8" style="color:#ffd93d;padding:4px 0;font-size:10px;border-bottom:1px solid #555;">${['📦 Ch1 基礎塔期 W1-4','🔮 Ch2 1元素期 W5-8','🔮🔮 Ch3 2元素期 W9-12','🔮🔮🔮 Ch4 3元素期 W13-16','⭐ Ch5 全開期 W17-20'][Math.floor(i/4)]}</td></tr><tr style="${bg}border-bottom:1px solid #333;">` : '';
        h += (i % 4 === 0 ? `<tr>${eraLabel}` : `<tr style="${bg}border-bottom:1px solid #333;">`) +
          `<td style="white-space:nowrap;">${marker}${bossTag}W${i+1}</td><td>${w.name}</td><td>${effCount}</td><td>${effHp}</td><td>${Math.round(w.armor*100)}%</td><td>${elemStr}</td><td style="font-size:10px;">${resistStr}</td><td style="font-size:10px;">${passiveStr}</td></tr>`;
      }
      h += '</table>';
      return h;
    }

    function buildSendsTab() {
      let h = `<div style="font-size:11px;color:#aaa;margin-bottom:6px;">送兵增加永久 income，兵會跑${oppLabel}防線，活著到底扣${oppLabel}血量</div>`;
      h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
      h += '<tr style="color:#ffd93d;border-bottom:1px solid #444;"><th>兵種</th><th>費用</th><th>income</th><th>數量</th><th>HP</th><th>護甲</th><th>被動</th><th>配額(本期)</th></tr>';
      for (const s of INCOME_SENDS) {
        const quota = s.quota[era];
        const used = self.sendUsed[s.id] || 0;
        const locked = quota === 0;
        const passiveStr = s.skills && s.skills.length > 0 ? getSkillBrief(s.skills) : '—';
        const style = locked ? 'opacity:0.4;' : '';
        h += `<tr style="${style}border-bottom:1px solid #333;"><td>${s.icon} ${s.name}</td><td>${s.cost}g</td><td style="color:#4ecdc4;">+${s.income}</td><td>×${s.count}</td><td>${s.hp}</td><td>${Math.round(s.armor*100)}%</td><td style="font-size:10px;">${passiveStr}</td><td>${locked ? '🔒未解鎖' : `${used}/${quota}`}</td></tr>`;
      }
      h += '</table>';
      h += '<h3 style="color:#ffd93d;margin:12px 0 4px;">📊 配額表（每波重置，每 2 波調整）</h3>';
      h += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:10px;">';
      h += '<tr style="color:#ffd93d;border-bottom:1px solid #444;"><th>兵種</th>';
      for (let t = 0; t < 10; t++) {
        const w1 = t * 2 + 1, w2 = t * 2 + 2;
        h += `<th>W${w1}-${w2}</th>`;
      }
      h += '</tr>';
      for (const s of INCOME_SENDS) {
        h += `<tr style="border-bottom:1px solid #333;"><td>${s.icon} ${s.name}</td>`;
        for (let t = 0; t < 10; t++) {
          const v = s.quota[t];
          h += `<td style="${v === 0 ? 'color:#666' : ''}">${v || '🔒'}</td>`;
        }
        h += '</tr>';
      }
      h += '</table></div>';
      return h;
    }

    function buildTowersTab() {
      // 基礎塔
      let h = '<h3 style="color:#c8a86c;margin:8px 0 4px;">🏹💣 基礎塔</h3>';
      h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
      h += '<tr style="color:#ffd93d;border-bottom:1px solid #444;"><th>塔</th><th>Lv</th><th>傷害</th><th>攻速</th><th>射程</th><th>AOE</th><th>DPS</th><th>費用</th></tr>';
      for (const k of BASIC_KEYS) {
        const b = BASIC_TOWERS[k];
        for (let lv = 0; lv < b.levels.length; lv++) {
          const l = b.levels[lv];
          const dps = (l.damage * l.atkSpd).toFixed(1);
          h += `<tr style="border-bottom:1px solid #333;"><td>${b.icon} ${b.name}</td><td>Lv${lv+1}</td><td>${l.damage}</td><td>${l.atkSpd}</td><td>${l.range}</td><td>${l.aoe || '—'}</td><td>${dps}</td><td>${lv === 0 ? l.cost : '+' + l.cost}g</td></tr>`;
        }
      }
      h += '</table>';
      // 元素塔 Lv4 雙屬
      h += `<h3 style="color:#ff6b35;margin:12px 0 4px;">🔮 雙屬塔 Lv4（${Object.keys(INFUSIONS).length}基底）</h3>`;
      for (const [base, injects] of Object.entries(INFUSIONS)) {
        h += `<div style="color:${ELEM[base].color};margin:8px 0 2px;font-weight:bold;">${ELEM[base].icon} ${ELEM[base].name}底</div>`;
        h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
        h += '<tr style="color:#ffd93d;border-bottom:1px solid #444;"><th>分支</th><th>傷害</th><th>攻速</th><th>射程</th><th>AOE</th><th>DPS</th><th>特效</th><th>費用</th></tr>';
        for (const [inject, branch] of Object.entries(injects)) {
          const l = branch.lv4;
          if (!l) continue;
          const dps = (l.damage * l.atkSpd).toFixed(1);
          const isPure = base === inject;
          const pureTag = isPure ? ' <span style="color:#ffd93d;">★純</span>' : '';
          const skillsHtml = l.skills && l.skills.length > 0 ? `<span class="skill-tip" data-skills='${JSON.stringify(l.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;" title="${getSkillBrief(l.skills)}">${getSkillBrief(l.skills)} ℹ️</span>` : '—';
          h += `<tr style="border-bottom:1px solid #333;"><td>${branch.icon} ${branch.name}${pureTag}</td><td>${l.damage}</td><td>${l.atkSpd}</td><td>${l.range}</td><td>${l.aoe || '—'}</td><td>${dps}</td><td style="font-size:10px;">${skillsHtml}</td><td>+${l.cost}g</td></tr>`;
        }
        h += '</table>';
      }
      // 三屬塔 Lv5
      h += `<h3 style="color:#ffd93d;margin:12px 0 4px;">⭐ 三屬塔 Lv5（${Object.keys(TRIPLE_TOWERS).length}種）</h3>`;
      h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
      h += '<tr style="color:#ffd93d;border-bottom:1px solid #444;"><th>名稱</th><th>組合</th><th>傷害</th><th>攻速</th><th>射程</th><th>AOE</th><th>DPS</th><th>特效</th><th>費用</th></tr>';
      for (const [key, triple] of Object.entries(TRIPLE_TOWERS)) {
        const l = triple.lv5;
        const elems = key.split('_').map(e => ELEM[e]?.icon || e).join('');
        const dps = (l.damage * l.atkSpd).toFixed(1);
        const skillsHtml = l.skills && l.skills.length > 0 ? `<span class="skill-tip" data-skills='${JSON.stringify(l.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;" title="${getSkillBrief(l.skills)}">${getSkillBrief(l.skills)} ℹ️</span>` : '—';
        h += `<tr style="border-bottom:1px solid #333;"><td>${triple.icon} ${triple.name}</td><td>${elems}</td><td>${l.damage}</td><td>${l.atkSpd}</td><td>${l.range}</td><td>${l.aoe || '—'}</td><td>${dps}</td><td style="font-size:10px;">${skillsHtml}</td><td>+${l.cost}g</td></tr>`;
      }
      h += '</table>';
      // 純屬塔 Lv6
      h += `<h3 style="color:#ff6bff;margin:12px 0 4px;">💎 純屬塔 Lv6（同元素×3，全場限 ${CONFIG.maxLv6Towers ?? 1} 座）</h3>`;
      h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
      h += '<tr style="color:#ff6bff;border-bottom:1px solid #444;"><th>名稱</th><th>元素</th><th>傷害</th><th>攻速</th><th>射程</th><th>AOE</th><th>DPS</th><th>特效</th><th>費用</th></tr>';
      for (const [elem, pure] of Object.entries(PURE_TOWERS)) {
        const l = pure.lv6;
        const dps = (l.damage * l.atkSpd).toFixed(1);
        const skillsHtml = l.skills && l.skills.length > 0 ? `<span class="skill-tip" data-skills='${JSON.stringify(l.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;" title="${getSkillBrief(l.skills)}">${getSkillBrief(l.skills)} ℹ️</span>` : '—';
        h += `<tr style="border-bottom:1px solid #333;"><td>${pure.icon} ${pure.name}</td><td>${ELEM[elem]?.icon || elem}</td><td>${l.damage}</td><td>${l.atkSpd}</td><td>${l.range}</td><td>${l.aoe || '—'}</td><td>${dps}</td><td style="font-size:10px;">${skillsHtml}</td><td>+${l.cost}g</td></tr>`;
      }
      h += '</table>';
      return h;
    }
  }

  closeTowerSelectPopup() {
    const existing = document.querySelector('.tower-select-popup');
    if (existing) existing.remove();
  }

  findEnemyAtClick(e) {
    const r = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / r.width, sy = this.canvas.height / r.height;
    const mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sy;
    const cs = this.cellSize;
    const hitR = cs * 0.4; // 點擊判定半徑

    // 檢查玩家地圖敵人
    for (const en of this.enemies) {
      const pos = this.ePos(en);
      const px = this.offsetX + pos.x * cs + cs / 2;
      const py = this.offsetY + pos.y * cs + cs / 2;
      if (Math.hypot(mx - px, my - py) <= hitR) return { enemy: en, lane: 'player' };
    }

    // 檢查AI地圖敵人
    for (const t of this.aiLaneTroops) {
      const pos = this.aiTroopPos(t);
      const px = this.offsetX + pos.x * cs + cs / 2;
      const py = this.offsetY + pos.y * cs + cs / 2;
      if (Math.hypot(mx - px, my - py) <= hitR) return { enemy: t, lane: 'ai' };
    }

    return null;
  }

  showEnemyTooltip(data, e) {
    const { enemy, lane } = data;
    const tt = document.getElementById('enemy-tooltip');
    const hpPct = Math.round(enemy.hp / enemy.maxHp * 100);

    let resistHtml = '<span style="color:#666">無抗性</span>';
    if (enemy.resist && Object.keys(enemy.resist).length > 0) {
      resistHtml = Object.entries(enemy.resist).map(([el, v]) => {
        if (v <= 0) return '';
        const e = ELEM[el];
        if (!e) return `${el} ${Math.round(v*100)}%`;
        return `<span style="color:${e.color}">${e.icon}${e.name} ${Math.round(v*100)}%</span>`;
      }).filter(Boolean).join(' ') || '<span style="color:#666">無</span>';
    }

    // 弱點計算（元素克制 + resist 反推）
    const weakSet = new Set();
    // 1. 元素屬性克制：敵人有 elem 屬性時，克制它的元素有 ×1.3 加成
    if (enemy.elem) {
      for (const [atk, advMap] of Object.entries(CONFIG.elemAdv)) {
        if (advMap[enemy.elem] > 1) weakSet.add(atk);
      }
    }
    // 2. resist 反推：有抗性的元素被哪個元素克制
    if (enemy.resist && Object.keys(enemy.resist).length > 0) {
      const resistElems = Object.keys(enemy.resist).filter(k => enemy.resist[k] > 0);
      for (const re of resistElems) {
        for (const [atk, advMap] of Object.entries(CONFIG.elemAdv)) {
          if (advMap[re] && advMap[re] > 1) weakSet.add(atk);
        }
      }
    }
    let weakHtml = '';
    if (weakSet.size > 0) {
      weakHtml = [...weakSet].map(el => {
        const e = ELEM[el];
        return `<span style="color:${e.color}">${e.icon}${e.name}</span>`;
      }).join(' ');
    }

    const armor = enemy.armor || 0;
    const armorStacks = enemy.armorStacks || 0;
    const totalArmor = Math.min(0.8, armor + armorStacks * 0.1);

    let passiveHtml = '<span style="color:#666">無</span>';
    if (enemy.skills && enemy.skills.length > 0) {
      passiveHtml = getSkillDesc(enemy.skills).replace(/\n/g, '<br>');
    }

    let statusHtml = '';
    if (enemy.burnTimer > 0) statusHtml += '<span style="color:#f64">🔥灼燒中</span> ';
    if (enemy.chillStacks > 0) { statusHtml += `<span style="color:#4cf">❄️冰冷${enemy.chillStacks}層（-${Math.round(Math.min(enemy.chillStacks*GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct)*100)}%）</span> `; }
    if (enemy.frostbiteDur > 0) { statusHtml += `<span style="color:#88ccff">🥶凍傷 ${(enemy.frostbiteDmgPct*100).toFixed(1)}%/s × ${enemy.frostbiteDur.toFixed(1)}s</span> `; }
    if (enemy.stunTimer > 0) statusHtml += '<span style="color:#ff0">💫暈眩中</span> ';
    if (enemy.shredStacks > 0) { statusHtml += `<span style="color:#fa8">🔩碎甲${enemy.shredStacks}層（-${Math.round(enemy.shredStacks * GLOBAL_CAPS.shredPerStack * 100)}%）</span> `; }
    if (enemy.vulnStacks > 0) { statusHtml += `<span style="color:#f88">💔易傷${enemy.vulnStacks}層（+${Math.round(enemy.vulnStacks * GLOBAL_CAPS.vulnPerStack * 100)}%）</span> `; }

    const elemHtml = enemy.elem && ELEM[enemy.elem]
      ? `<span style="color:${ELEM[enemy.elem].color}">${ELEM[enemy.elem].icon}${ELEM[enemy.elem].name}</span>`
      : '<span style="color:#666">無</span>';

    tt.innerHTML = `
      <div class="tt-name">${enemy.isBoss ? '⭐ ' : ''}${enemy.name || '敵人'}${hasSkill(enemy,'tenacity') ? ' <span style="color:#ffd93d;font-size:10px;">韌性（CC-' + Math.round(getSkill(enemy,'tenacity').ccReduce*100) + '%）</span>' : ''}${lane === 'ai' ? ' (AI線)' : ''}</div>
      <div class="tt-row">❤️ HP: <span>${Math.ceil(enemy.hp)}/${enemy.maxHp}</span> (${hpPct}%)</div>
      <div class="tt-row">🛡️ 護甲: <span>${Math.round(totalArmor*100)}%</span>${armorStacks > 0 ? ` (+${armorStacks}層)` : ''}</div>
      <div class="tt-row">🔮 元素: ${elemHtml}</div>
      <div class="tt-row">🔰 抗性: ${resistHtml}</div>
      ${weakHtml ? `<div class="tt-row">⚔️ 弱點: ${weakHtml}</div>` : ''}
      <div class="tt-row">💀 被動: ${passiveHtml}</div>
      ${statusHtml ? `<div class="tt-row">📋 狀態: ${statusHtml}</div>` : ''}
    `;

    const rect = this.canvas.getBoundingClientRect();
    const wrap = document.getElementById('canvas-wrap');
    let left = e.clientX - rect.left + 15;
    let top = e.clientY - rect.top - 10;
    // 避免超出右邊界
    if (left + 220 > wrap.clientWidth) left = left - 240;
    if (top + 200 > wrap.clientHeight) top = wrap.clientHeight - 200;
    if (top < 0) top = 0;

    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
    tt.style.display = 'block';
  }

  hideEnemyTooltip() {
    document.getElementById('enemy-tooltip').style.display = 'none';
  }

  placeTower(gx, gy) {
    if (this.gold < CONFIG.towerCost) return;
    // v6: 放基礎塔（箭塔或砲塔）
    const basicType = this.selectedBasicType || 'arrow';
    this.doPlaceTower(gx, gy, basicType);
  }

  doPlaceTower(gx, gy, basicType) {
    const bDef = BASIC_TOWERS[basicType];
    const lvData = bDef.levels[0]; // Lv1

    if (this.gold < lvData.cost) return;
    this.gold -= lvData.cost;
    this.grid[gy][gx] = 2;

    this.towers.push({
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      basicType: basicType,
      elem: null,        // 基礎塔無元素
      infuseElem: null,  // 升元素後才有
      x: gx, y: gy,
      level: 1,
      damage: lvData.damage,
      atkSpd: lvData.atkSpd,
      range: lvData.range,
      aoe: lvData.aoe,
      skills: lvData.skills || [],
      atkTimer: 0,
      atkCount: 0,
      totalCost: lvData.cost,
    });
    if (this.mode === 'pvp') this.netSend({ type: 'towerBuilt', x: gx, y: gy, level: 1, basicType });
    this.rebuildSidebar();
  }

  // ── Damage ──
  doDmg(enemy, baseDmg, elem, tower) {
    // dodge: 閃避
    const dodgeSk = getSkill(enemy, 'dodge');
    if (dodgeSk && Math.random() < dodgeSk.chance) return;

    let dmg = baseDmg;

    // unstable: 傷害隨機浮動
    if (tower) {
      const unstableSk = getSkill(tower, 'unstable');
      if (unstableSk) dmg *= (1 + (Math.random() * 2 - 1) * unstableSk.variance);
      // execute: HP < threshold 斬殺加倍
      const executeSk = getSkill(tower, 'execute');
      if (executeSk && enemy.hp / enemy.maxHp < executeSk.threshold) dmg *= executeSk.mult;
    }

    // 元素相剋：塔元素 vs 敵人元素屬性
    if (elem && enemy.elem && CONFIG.elemAdv[elem]) {
      const advMult = CONFIG.elemAdv[elem][enemy.elem];
      if (advMult) dmg *= advMult;
    }

    // Armor
    let armor = enemy.armor + (enemy.armorStacks || 0) * 0.1;
    const shredAmt = (enemy.shredStacks || 0) * GLOBAL_CAPS.shredPerStack;
    armor = Math.max(0, armor - shredAmt);
    dmg *= (1 - Math.min(armor, 0.8));

    // Resist
    const res = enemy.resist[elem] || 0;
    dmg *= (1 - res);

    // vulnerability: 易傷增傷
    const vulnAmt = (enemy.vulnStacks || 0) * GLOBAL_CAPS.vulnPerStack;
    if (vulnAmt > 0) dmg *= (1 + vulnAmt);

    // 最終傷害計算
    let finalDmg = Math.max(1, Math.floor(dmg));
    // fortify: 單次傷害上限
    const fortifySk = getSkill(enemy, 'fortify');
    if (fortifySk) finalDmg = Math.min(finalDmg, fortifySk.dmgCap);
    // resilient: 累積減傷
    if (enemy._resilientReduction > 0) finalDmg = Math.max(1, Math.floor(finalDmg * (1 - enemy._resilientReduction)));
    // phaseShift: 相位減傷
    if (enemy.resist._dmgReduce) finalDmg = Math.max(1, Math.floor(finalDmg * (1 - enemy.resist._dmgReduce)));

    enemy.hp -= finalDmg;
    if (window.SANDBOX?.fireDmg && tower && getSkill(tower, 'burn')) window.SANDBOX.fireDmg.direct += finalDmg;

    // 追蹤最後攻擊此怪的塔（用於擊殺加速）
    if (tower) enemy._lastHitTower = tower;

    // 護盾：額外 HP 層
    const shieldSkill = getSkill(enemy, 'shield');
    if (enemy.hp <= 0 && shieldSkill && !enemy._shieldUsed) {
      enemy.hp = 1;
      enemy._shieldUsed = true;
    }

    // tenacity: CC 效果減半（取代 isBoss 硬編碼）
    const ten = getSkill(enemy, 'tenacity');
    const ccMult = ten ? (1 - ten.ccReduce) : 1.0;

    // Post-damage 技能效果
    if (tower) {
      // burn: 灼燒 DOT
      const burnSk = getSkill(tower, 'burn');
      if (burnSk) {
        const igniteSk = getSkill(tower, 'ignite');
        const detSk = getSkill(tower, 'detonate');
        // 覆蓋灼燒時觸發引燃
        if (enemy.burnTimer > 0 && igniteSk) {
          const igniteDmg = Math.floor(baseDmg * igniteSk.flat);
          enemy.hp -= igniteDmg;
          if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.ignite += igniteDmg;
          const p = this.ePos(enemy);
          this.addFx(p.x, p.y, 0.3, '#ff6600', 0.2);
        }
        enemy.burnStacks = (enemy.burnStacks || 0) + 1;
        const burnCoeff = tower ? (tower.damage * tower.atkSpd) : baseDmg;
        enemy.burnDmg = burnCoeff * burnSk.dot;
        enemy.burnTimer = burnSk.dur;
        // 3 層引爆
        if (enemy.burnStacks >= 3 && detSk) {
          const detDmg = Math.floor(baseDmg * detSk.ratio);
          if (detSk.aoe) {
            const p = this.ePos(enemy);
            this.getEnemiesNear(p.x, p.y, detSk.aoe).forEach(e => {
              e.hp -= detDmg;
              if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.detonate += detDmg;
            });
            this.addFx(p.x, p.y, 1.0, '#ff4400', 0.4);
          } else {
            enemy.hp -= detDmg;
            if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.detonate += detDmg;
            const p = this.ePos(enemy);
            this.addFx(p.x, p.y, 0.5, '#ff4400', 0.3);
          }
          enemy.burnStacks = 0;
        }
      }

      // chill: 疊層減速
      const chillSk = getSkill(tower, 'chill');
      if (chillSk) {
        enemy.chillStacks = Math.min(GLOBAL_CAPS.chillMaxStacks, (enemy.chillStacks || 0) + (chillSk.stacksPerHit || 1));
        enemy.chillDecay = 0; // 重置衰減計時

        // freeze: 冰冷達門檻觸發冰凍
        const freezeSk = getSkill(tower, 'freeze');
        if (freezeSk && enemy.chillStacks >= freezeSk.threshold) {
          enemy.stunTimer = Math.max(enemy.stunTimer, freezeSk.dur * ccMult);
          enemy.chillStacks = 0;
        }
      }

      // frostbite: 獨立凍傷 DOT（與冰冷緩速分離）
      const fbSk = getSkill(tower, 'frostbite');
      if (fbSk) {
        enemy.frostbiteDmgPct = Math.max(enemy.frostbiteDmgPct || 0, fbSk.dmgPct);
        enemy.frostbiteDur    = Math.max(enemy.frostbiteDur    || 0, fbSk.dur);
      }

      // shred: 碎甲 debuff
      const shredSk = getSkill(tower, 'shred');
      if (shredSk) {
        enemy.shredStacks = Math.min(GLOBAL_CAPS.shredMaxStacks, (enemy.shredStacks || 0) + (shredSk.stacksPerHit || 1));
        enemy.shredDecay = 0;
      }
      // vulnerability: 易傷 debuff
      const vulnSk = getSkill(tower, 'vulnerability');
      if (vulnSk) {
        enemy.vulnStacks = Math.min(GLOBAL_CAPS.vulnMaxStacks, (enemy.vulnStacks || 0) + (vulnSk.stacksPerHit || 1));
        enemy.vulnDecay = 0;
      }
      // hpPct: 每 N 次附加 %maxHP 傷害
      const hpPctSk = getSkill(tower, 'hpPct');
      if (hpPctSk && (tower.atkCount || 0) % hpPctSk.every === 0) {
        if (!enemy._hpPctCd || enemy._hpPctCd <= 0) {
          const rawHpDmg = Math.floor(enemy.maxHp * hpPctSk.pct);
          const hpDmg = Math.min(rawHpDmg, GLOBAL_CAPS.hpPctCap);
          enemy.hp -= hpDmg;
          enemy._hpPctCd = hpPctSk.cd;
        }
      }
      // lifedrain: 回復基地 HP
      const lifedrainSk = getSkill(tower, 'lifedrain');
      if (lifedrainSk) {
        this.hp = Math.min(this.maxHp, this.hp + Math.max(1, Math.floor(finalDmg * lifedrainSk.pct)));
      }
      // warp: 直接定身（cd 冷卻）
      const warpSk = getSkill(tower, 'warp');
      if (warpSk && (!tower._warpCd || tower._warpCd <= 0)) {
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, warpSk.dur * ccMult);
        tower._warpCd = warpSk.cd;
        const p = this.ePos(enemy);
        this.addFx(p.x, p.y, 0.4, '#aa00ff', 0.3);
      }
      // knockback: 擊退（cd 冷卻）
      const knockSk = getSkill(tower, 'knockback');
      if (knockSk && (!tower._knockCd || tower._knockCd <= 0)) {
        enemy.pathIdx = Math.max(0, enemy.pathIdx - knockSk.dist);
        tower._knockCd = knockSk.cd;
      }
      // chain: 連鎖跳躍（不在 doDmg 遞迴，由 tower attack 處理）
      // multishot / pierce: 在 tower attack 邏輯處理
    }

    // 被動效果
    const armorSk = getSkill(enemy, 'armorStack');
    if (armorSk) {
      enemy.armorStacks = Math.min(armorSk.cap / armorSk.perHit, (enemy.armorStacks || 0) + 1);
    }
    // resilient: 每被攻擊增加減傷
    const resilientSk = getSkill(enemy, 'resilient');
    if (resilientSk) {
      enemy._resilientReduction = Math.min(resilientSk.cap, (enemy._resilientReduction || 0) + resilientSk.stack);
    }
    if (hasSkill(enemy, 'antiElement') && elem) {
      const ae = getSkill(enemy, 'antiElement');
      enemy.adaptDmg[elem] = (enemy.adaptDmg[elem] || 0) + dmg;
      const top = Object.entries(enemy.adaptDmg).sort((a,b)=>b[1]-a[1])[0];
      if (top && top[1] > 80) enemy.resist[top[0]] = Math.min(0.5, (enemy.resist[top[0]]||0) + 0.005);
    }
  }

  // ── Helpers ──
  ePos(e) {
    const idx = Math.floor(Math.min(e.pathIdx, this.path.length - 1));
    const next = Math.min(idx + 1, this.path.length - 1);
    const t = e.pathIdx - idx;
    return { x: this.path[idx].x + (this.path[next].x - this.path[idx].x) * t,
             y: this.path[idx].y + (this.path[next].y - this.path[idx].y) * t };
  }

  aiTroopPos(t) {
    const idx = Math.floor(Math.min(t.pathIdx, this.aiPath.length - 1));
    const next = Math.min(idx + 1, this.aiPath.length - 1);
    const frac = t.pathIdx - idx;
    return { x: this.aiPath[idx].x + (this.aiPath[next].x - this.aiPath[idx].x) * frac,
             y: this.aiPath[idx].y + (this.aiPath[next].y - this.aiPath[idx].y) * frac };
  }

  getEnemiesNear(x, y, r) {
    return this.enemies.filter(e => { const p = this.ePos(e); return Math.hypot(p.x-x, p.y-y) <= r; });
  }

  addFx(x, y, r, color, dur) { this.effects.push({x, y, r, color, dur, t: 0}); }

  // ── Main loop ──
  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    if (this.state !== 'won' && this.state !== 'lost') {
      const sDt = dt * this.gameSpeed;
      this.time += sDt;
      this.update(sDt);
    }
    this.render();
    this.updateHUD();
    requestAnimationFrame(this.loop.bind(this));
  }

  updateHUD() {
    document.getElementById('hp-val').textContent = this.hp;
    document.getElementById('hp-max').textContent = this.maxHp;
    document.getElementById('gold-val').textContent = Math.floor(this.gold);
    document.getElementById('income-val').textContent = this.income;
    document.getElementById('wave-val').textContent = this.wave;
    document.getElementById('wave-total').textContent = CONFIG.totalWaves;
    const m = Math.floor(this.time/60), s = Math.floor(this.time%60);
    document.getElementById('time-val').textContent = `${m}:${s.toString().padStart(2,'0')}`;
    this.updateAiBar();
  }

  // ── Update ──
  update(dt) {
    // Announce
    if (this.announceTimer > 0) {
      this.announceTimer -= dt;
      if (this.announceTimer <= 0) document.getElementById('wave-announce').style.opacity = 0;
    }

    // Spawn
    if (this.state === 'spawning' && this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const e = this.spawnQueue.shift();
        e.pathIdx = 0;
        this.enemies.push(e);
        this.spawnTimer = 0.7;
      }
      if (this.spawnQueue.length === 0) this.state = 'fighting';
    }

    // Enemies
    for (const e of this.enemies) {
      if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }

      let spd = e.speed * (e.speedMult || 1);
      // chill 減速
      if (e.chillStacks > 0) {
        const chillSlow = Math.min(e.chillStacks * GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct);
        spd *= (1 - chillSlow);
        // chill 衰減：每秒 -chillDecayRate 層
        e.chillDecay = (e.chillDecay || 0) + dt;
        const decayStacks = Math.floor(e.chillDecay * GLOBAL_CAPS.chillDecayRate);
        if (decayStacks > 0) {
          e.chillStacks = Math.max(0, e.chillStacks - decayStacks);
          e.chillDecay -= decayStacks / GLOBAL_CAPS.chillDecayRate;
        }
      }
      const enrageSk = getSkill(e, 'enrage');
      if (enrageSk && e.hp / e.maxHp < enrageSk.hpThreshold) spd *= enrageSk.spdMult;
      // 衝鋒：進場 dur 秒速度加倍
      const chargeSk = getSkill(e, 'charge');
      if (chargeSk && (e._chargeTimer === undefined || e._chargeTimer > 0)) {
        if (e._chargeTimer === undefined) e._chargeTimer = chargeSk.dur;
        spd *= chargeSk.spdMult;
        e._chargeTimer -= dt;
      }
      e.pathIdx += spd * dt * 1.5;

      if (e.leaderIdx) {
        const leaderPos = e.leaderIdx();
        if (leaderPos !== undefined) e.pathIdx = Math.min(e.pathIdx, leaderPos + 1);
      }

      const regenSk = getSkill(e, 'regen');
      if (regenSk) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * regenSk.pct * dt);
      if (e.burnTimer > 0) { const burnDt = Math.min(dt, e.burnTimer); const _bdt = e.burnDmg * burnDt; e.hp -= _bdt; if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.burn += _bdt; e.burnTimer -= dt; }
      if (e.burnTimer <= 0) e.burnStacks = 0;
      // frostbite DOT（水系，受元素三角影響，獨立於冰冷）
      if (e.frostbiteDur > 0) {
        const fbDt = Math.min(dt, e.frostbiteDur);
        let _fbdt = e.frostbiteDmgPct * e.maxHp * fbDt;
        if (e.elem && CONFIG.elemAdv.water && CONFIG.elemAdv.water[e.elem]) _fbdt *= CONFIG.elemAdv.water[e.elem];
        e.hp -= _fbdt;
        if (window.SANDBOX?.waterDmg) window.SANDBOX.waterDmg.frostbite += _fbdt;
        e.frostbiteDur -= dt;
        if (e.frostbiteDur <= 0) e.frostbiteDmgPct = 0;
      }
      // shred/vuln 疊層衰減
      if (e.shredStacks > 0) {
        e.shredDecay = (e.shredDecay || 0) + dt;
        const sd = Math.floor(e.shredDecay * GLOBAL_CAPS.shredDecayRate);
        if (sd > 0) { e.shredStacks = Math.max(0, e.shredStacks - sd); e.shredDecay -= sd / GLOBAL_CAPS.shredDecayRate; }
      }
      if (e.vulnStacks > 0) {
        e.vulnDecay = (e.vulnDecay || 0) + dt;
        const vd = Math.floor(e.vulnDecay * GLOBAL_CAPS.vulnDecayRate);
        if (vd > 0) { e.vulnStacks = Math.max(0, e.vulnStacks - vd); e.vulnDecay -= vd / GLOBAL_CAPS.vulnDecayRate; }
      }
      // hpPct 冷卻衰減
      if (e._hpPctCd > 0) e._hpPctCd -= dt;
      // blink: 低 HP 向前閃現
      const blinkSk = getSkill(e, 'blink');
      if (blinkSk && e.hp / e.maxHp < blinkSk.hpTrigger) {
        if (!e._blinkCd || e._blinkCd <= 0) {
          e.pathIdx = Math.min(this.path.length - 0.1, e.pathIdx + blinkSk.dist);
          e._blinkCd = blinkSk.cd;
          const p = this.ePos(e);
          this.addFx(p.x, p.y, 0.5, '#ffff00', 0.2);
        } else {
          e._blinkCd -= dt;
        }
      }

      // stealth: 週期性隱身
      if (hasSkill(e, 'stealth')) {
        const stSk = getSkill(e, 'stealth');
        if (e._stealthTimer === undefined) e._stealthTimer = stSk.cd;
        e._stealthTimer -= dt;
        if (e._stealthTimer <= 0 && e.revealed) {
          e.revealed = false;
          e._stealthTimer = stSk.dur + stSk.cd;
        }
        if (!e.revealed && e._stealthTimer > stSk.cd) {
          // 隱身中，接近塔時揭露
          const p = this.ePos(e);
          for (const t of this.towers) { if (Math.hypot(t.x-p.x, t.y-p.y) <= 2) { e.revealed = true; e._stealthTimer = stSk.cd; break; } }
        }
      }

      const summonSk = getSkill(e, 'summon');
      if (summonSk) {
        e.summonTimer += dt;
        if (e.summonTimer >= summonSk.cd) {
          e.summonTimer = 0;
          const diff = CONFIG.difficulty[this.difficulty];
          for (let i = 0; i < summonSk.count; i++) {
            const m = this.mkEnemy({hp: Math.floor(e.maxHp * summonSk.hpRatio), speed: e.speed, armor: 0, resist: {}, skills: [], color: '#a44'}, e.speedMult, diff.hpMult);
            m.pathIdx = Math.max(0, e.pathIdx - 3 - i);
            m.leaderIdx = () => e.pathIdx;
            this.enemies.push(m);
          }
        }
      }

      const psSk = getSkill(e, 'phaseShift');
      if (psSk) {
        const ph = Math.floor((1 - e.hp/e.maxHp) * psSk.phases);
        if (ph !== e.phaseIdx) {
          e.phaseIdx = ph;
          const el = ELEM_KEYS[ph % ELEM_KEYS.length];
          e.resist = { [el]: 0.6, _dmgReduce: psSk.dmgReduce };
          // 弱點：相剋元素
          const weak = { fire:'water', water:'wind', wind:'fire' };
          if (weak[el]) e.resist[weak[el]] = -0.3;
        }
      }

      if (e.pathIdx >= this.path.length) {
        const dmg = e.dmgToBase || 1;
        if (!window.SANDBOX?.infHP) {
          this.hp -= dmg;
          if (this.mode === 'pvp') this.netSend({ type: 'hpUpdate', hp: this.hp, maxHp: this.maxHp });
          if (this.hp <= 0) {
            if (this.mode === 'pvp') this.netSend({ type: 'gameOver' });
            this.endGame(false); return;
          }
        }
        e.hp = 0; e._reachedEnd = true;
      }
    }

    // 擊殺獎勵（波次怪用各自 killGold，AI 送兵固定）
    for (const e of this.enemies) {
      if (e.hp <= 0 && !e._reachedEnd) {
        if (e.isAiSend) {
          this.gold += CONFIG.killGoldAiSend;
        } else {
          this.gold += e.killGold || 0;
        }
        // 擊殺加速：讀 multishot skill params
        if (e._lastHitTower) {
          const msSk = getSkill(e._lastHitTower, 'multishot');
          if (msSk) {
            e._lastHitTower._killRushBonus = msSk.killBonus;
            e._lastHitTower._killRushTimer = msSk.killDur;
          }
        }
        // killGold: 塔技能額外獎金
        if (e._lastHitTower) {
          const kgSk = getSkill(e._lastHitTower, 'killGold');
          if (kgSk) this.gold += Math.floor((e.killGold || CONFIG.killGoldAiSend) * kgSk.bonus);
          // permaBuff: 永久攻擊力
          const pbSk = getSkill(e._lastHitTower, 'permaBuff');
          if (pbSk) e._lastHitTower._permaBuff = (e._lastHitTower._permaBuff || 0) + pbSk.atkPerKill;
        }
        // splitOnDeath: 死亡分裂
        if (hasSkill(e, 'splitOnDeath')) {
          const splitSk = getSkill(e, 'splitOnDeath');
          for (let i = 0; i < splitSk.count; i++) {
            const m = this.mkEnemy({hp: Math.floor(e.maxHp * splitSk.hpRatio), speed: e.baseSpeed || e.speed, armor: e.armor, resist: {...e.resist}, skills: [], color: e.color, icon: e.icon}, 1, 1);
            m.pathIdx = Math.max(0, e.pathIdx - 0.5 * i);
            this.enemies.push(m);
          }
        }
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);

    // Tower attacks
    // 預計算 aura 增益（每幀遍歷一次）
    for (const tw of this.towers) {
      tw._auraDmgFlat = 0; tw._auraDmgPct = 0; tw._auraAtkSpd = 0; tw._auraRange = 0;
    }
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

    // Field aura 型：以塔為中心，每幀維持範圍內敵人的 debuff stacks
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

    for (const tw of this.towers) {
      // cooldown ticks
      if (tw._killRushTimer > 0) tw._killRushTimer -= dt;
      if (tw._warpCd > 0) tw._warpCd -= dt;
      if (tw._knockCd > 0) tw._knockCd -= dt;
      // ramp: 連攻同目標加速
      const rampSk = getSkill(tw, 'ramp');

      tw.atkTimer += dt * tw.atkSpd * (tw._killRushTimer > 0 ? (1 + (tw._killRushBonus || 0)) : 1) * (1 + (tw._auraAtkSpd || 0)) * (1 + (tw._rampBonus || 0));
      if (tw.atkTimer < 1) continue;

      let _shotsThisFrame = 0;
      while (tw.atkTimer >= 1 && _shotsThisFrame < 20) {
        tw.atkTimer -= 1;
        _shotsThisFrame++;

        const effRange = tw.range + (tw._auraRange || 0);
        const targets = this.enemies.filter(e => {
          if (hasSkill(e, 'stealth') && !e.revealed) return false;
          const p = this.ePos(e);
          return Math.hypot(p.x - tw.x, p.y - tw.y) <= effRange;
        }).sort((a, b) => b.pathIdx - a.pathIdx);

        if (targets.length === 0) { tw.atkTimer = 0; break; }
        const target = targets[0];

        // ── cycle_* 攻速同步場效應（有目標才觸發）──
        const cycleStun  = getSkill(tw, 'cycle_stun');
        const cycleChill = getSkill(tw, 'cycle_chill');
        const cycleShred = getSkill(tw, 'cycle_shred');
        const cycleVuln  = getSkill(tw, 'cycle_vuln');
        const cycleBurn  = getSkill(tw, 'cycle_burn');
        if (cycleStun || cycleChill || cycleShred || cycleVuln || cycleBurn) {
          const _cycleEffects = [
            cycleStun  && { sk: cycleStun,  type: 'stun',  color: '#ffdc32' },
            cycleChill && { sk: cycleChill, type: 'chill', color: '#64c8ff' },
            cycleShred && { sk: cycleShred, type: 'shred', color: '#c87832' },
            cycleVuln  && { sk: cycleVuln,  type: 'vuln',  color: '#dc50b4' },
            cycleBurn  && { sk: cycleBurn,  type: 'burn',  color: '#ff5000' },
          ].filter(Boolean);
          for (const { sk, type, color } of _cycleEffects) {
            const nearby = this.getEnemiesNear(tw.x, tw.y, sk.radius);
            if (nearby.length === 0) continue;
            nearby.forEach(e => {
              const ccMult = hasSkill(e, 'tenacity') ? (1 - getSkill(e, 'tenacity').ccReduce) : 1;
              if (type === 'stun') {
                e.stunTimer = Math.max(e.stunTimer || 0, Math.min(sk.dur, 2.0) * ccMult);
              } else if (type === 'chill') {
                e.chillStacks = Math.min((e.chillStacks || 0) + sk.stacksPerCycle, GLOBAL_CAPS.chillMaxStacks);
              } else if (type === 'shred') {
                e.shredStacks = Math.min((e.shredStacks || 0) + sk.stacksPerCycle, GLOBAL_CAPS.shredMaxStacks);
              } else if (type === 'vuln') {
                e.vulnStacks = Math.min((e.vulnStacks || 0) + sk.stacksPerCycle, GLOBAL_CAPS.vulnMaxStacks);
              } else if (type === 'burn') {
                e.burnDmg = (tw.damage || 10) * tw.atkSpd * sk.dot;
                e.burnTimer = sk.dur;
              }
            });
            this.effects.push({ x: tw.x, y: tw.y, r: sk.radius, type: 'ring', color, dur: 0.25, t: 0 });
          }
        }
        // ── cycle_* end ──

        tw.atkCount = (tw.atkCount || 0) + 1;
        // aura 傷害加成
        let effDmg = Math.floor((tw.damage + (tw._auraDmgFlat || 0)) * (1 + (tw._auraDmgPct || 0)) + (tw._permaBuff || 0));

        // ramp: 連攻同目標攻速提升
        if (rampSk) {
          if (tw._rampTarget === target) {
            tw._rampBonus = Math.min(rampSk.cap, (tw._rampBonus || 0) + rampSk.perHit);
          } else {
            tw._rampTarget = target;
            tw._rampBonus = Math.max(0, (tw._rampBonus || 0) - (rampSk.switchLoss || 0) * rampSk.perHit);
          }
        }

        // wealthScale：財富積累傷害加成
        const wsSk = getSkill(tw, 'wealthScale');
        if (wsSk) {
          effDmg += Math.min(Math.floor(this.gold / wsSk.divisor), wsSk.cap);
        }

        // pierce: 直線穿透，沿「塔→主目標」方向，每穿一體傷害遞減
        const twDmgElem = tw.dmgType || tw.elem;
        const pierceSk = getSkill(tw, 'pierce');
        if (pierceSk) {
          const pDown = pierceSk.dmgDown;
          const PIERCE_WIDTH = 0.6;
          const MIN_RATIO    = 0.3;
          const tp = this.ePos(target);
          const dx = tp.x - tw.x;
          const dy = tp.y - tw.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const lineTargets = targets.filter(e => {
            const ep = this.ePos(e);
            const ex = ep.x - tw.x;
            const ey = ep.y - tw.y;
            const t  = ex * ux + ey * uy;
            const px = ex - t * ux;
            const py = ey - t * uy;
            return t > 0 && Math.hypot(px, py) <= PIERCE_WIDTH;
          }).sort((a, b) => {
            const ap = this.ePos(a), bp = this.ePos(b);
            const ta = (ap.x - tw.x) * ux + (ap.y - tw.y) * uy;
            const tb = (bp.x - tw.x) * ux + (bp.y - tw.y) * uy;
            return ta - tb;
          });
          lineTargets.slice(0, pierceSk.count ?? 3).forEach((e, i) => {
            const ratio = Math.max(MIN_RATIO, 1 - i * pDown);
            this.doDmg(e, Math.floor(effDmg * ratio), twDmgElem, e === target ? tw : null);
          });
          this.addFx(tw.x, tw.y, 2, (tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')) + '44', 0.2);
          this.projectiles.push({x:tw.x, y:tw.y, tx:tp.x, ty:tp.y, color:(tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')), t:0.15});
          continue;
        }

        // multishot: 每 N 次多連射
        let shots = 1;
        const multiSk = getSkill(tw, 'multishot');
        if (multiSk && tw.atkCount % multiSk.every === 0) {
          shots = multiSk.shots;
        }

        for (let s = 0; s < shots; s++) {
          const shotTarget = s === 0 ? target : (targets[s] || target);
          const shotTower = s === 0 ? tw : null;
          if (tw.aoe > 0) {
            const p = this.ePos(shotTarget);
            this.getEnemiesNear(p.x, p.y, tw.aoe).forEach(e => this.doDmg(e, effDmg, twDmgElem, shotTower));
            this.addFx(p.x, p.y, tw.aoe * 0.5, (tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c')) + '44', 0.2);
          } else {
            this.doDmg(shotTarget, effDmg, twDmgElem, shotTower);
          }
        }

        const tp = this.ePos(target);
        const twColor = tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c');
        this.projectiles.push({x:tw.x, y:tw.y, tx:tp.x, ty:tp.y, color: twColor, t:0.15});

        // chain: 連鎖跳躍到鄰近敵人
        const chainSk = getSkill(tw, 'chain');
        if (chainSk) {
          const chainTargets = targets.filter(e => e !== target).slice(0, chainSk.targets);
          chainTargets.forEach((e, i) => {
            const chainDmg = Math.floor(effDmg * Math.pow(chainSk.decay, i + 1));
            this.doDmg(e, chainDmg, twDmgElem, null);
            const cp = this.ePos(e);
            this.addFx(cp.x, cp.y, 0.3, twColor + '88', 0.15);
          });
        }

        // multiArrow: 每次攻擊同時射多支箭至不同目標，各 ×ratio 傷害，副目標不觸發 proc
        const multiArrowSk = getSkill(tw, 'multiArrow');
        if (multiArrowSk) {
          const arrowTargets = targets
            .filter(e => e !== target)
            .slice(0, multiArrowSk.shots - 1);
          arrowTargets.forEach(e => {
            this.doDmg(e, Math.floor(effDmg * multiArrowSk.ratio), twDmgElem, null);
            const ep = this.ePos(e);
            this.projectiles.push({x:tw.x, y:tw.y, tx:ep.x, ty:ep.y, color:twColor, t:0.12});
          });
        }

        // zone: 在目標位置放區域效果
        const zSlowSk  = getSkill(tw, 'zone_slow');
        const zShredSk = getSkill(tw, 'zone_shred');
        if (zSlowSk) {
          this.zones.push({
            x: tp.x, y: tp.y, r: zSlowSk.radius, type: 'puddle',
            slowAmt: zSlowSk.chillStacks,
            shredTarget: 0,
            dur: 3, t: 0
          });
        }
        if (zShredSk) {
          this.zones.push({
            x: tp.x, y: tp.y, r: zShredSk.radius, type: 'puddle',
            slowAmt: 0,
            shredTarget: zShredSk.shredStacks,
            dur: 3, t: 0
          });
        }
      } // end while shots
    }

    // Zones
    for (const z of this.zones) {
      z.t += dt;
      if (z.type === 'puddle') {
        this.getEnemiesNear(z.x, z.y, z.r).forEach(e => {
          if (z.slowAmt) { e.chillStacks = Math.max(e.chillStacks || 0, z.slowAmt); e.chillDecay = 0; }
          if (z.shredTarget) { e.shredStacks = Math.max(e.shredStacks || 0, z.shredTarget); e.shredDecay = 0; }
        });
      }
    }
    this.zones = this.zones.filter(z => z.t < z.dur);

    // Field 脈衝型（field_stun / field_dmg）及 interval 型（field_burn）
    for (const tw of this.towers) {
      const fStun = getSkill(tw, 'field_stun');
      const fDmg  = getSkill(tw, 'field_dmg');
      const fBurn = getSkill(tw, 'field_burn');
      if (!fStun && !fDmg && !fBurn) continue;

      if (fStun) {
        if (tw._fieldStunCd === undefined) tw._fieldStunCd = 0;
        tw._fieldStunCd -= dt;
        if (tw._fieldStunCd <= 0) {
          tw._fieldStunCd = fStun.cd;
          this.getEnemiesNear(tw.x, tw.y, fStun.radius).forEach(e => {
            const ccMult = hasSkill(e, 'tenacity') ? (1 - getSkill(e, 'tenacity').ccReduce) : 1;
            e.stunTimer = Math.max(e.stunTimer || 0, fStun.dur * ccMult);
          });
          this.effects.push({ x: tw.x, y: tw.y, r: fStun.radius, type: 'ring', color: '#ffdc32', dur: 0.4, t: 0 });
        }
      }

      if (fDmg) {
        if (tw._fieldDmgCd === undefined) tw._fieldDmgCd = 0;
        tw._fieldDmgCd -= dt;
        if (tw._fieldDmgCd <= 0) {
          tw._fieldDmgCd = fDmg.cd;
          const dmgAmt = (tw.damage || 10) * fDmg.flat;
          this.getEnemiesNear(tw.x, tw.y, fDmg.radius).forEach(e => {
            const armor = e.armor || 0;
            const actualDmg = Math.max(1, dmgAmt * (1 - armor));
            e.hp -= actualDmg;
            this.addFx(e.x, e.y, 0.2, '#ff6432', 0.2);
          });
          this.effects.push({ x: tw.x, y: tw.y, r: fDmg.radius, type: 'ring', color: '#ff6432', dur: 0.3, t: 0 });
        }
      }

      if (fBurn) {
        if (tw._fieldBurnCd === undefined) tw._fieldBurnCd = 0;
        tw._fieldBurnCd -= dt;
        if (tw._fieldBurnCd <= 0) {
          tw._fieldBurnCd = fBurn.interval;
          const burnDps = (tw.damage || 10) * tw.atkSpd * fBurn.dot;
          this.getEnemiesNear(tw.x, tw.y, fBurn.radius).forEach(e => {
            e.burnDmg = burnDps;
            e.burnTimer = fBurn.dur;
          });
          this.effects.push({ x: tw.x, y: tw.y, r: fBurn.radius, type: 'ring', color: '#ff5000', dur: 0.3, t: 0 });
        }
      }
    }

    // Effects & projectiles
    for (const f of this.effects) f.t += dt;
    this.effects = this.effects.filter(f => f.t < f.dur);
    for (const p of this.projectiles) p.t -= dt;
    this.projectiles = this.projectiles.filter(p => p.t > 0);

    // === AI 防線模擬 ===
    if (this.aiLaneSpawnQueue && this.aiLaneSpawnQueue.length > 0) {
      this.aiLaneSpawnTimer = (this.aiLaneSpawnTimer || 0) - dt;
      if (this.aiLaneSpawnTimer <= 0) {
        const t = this.aiLaneSpawnQueue.shift();
        t.pathIdx = 0;
        this.aiLaneTroops.push(t);
        this.aiLaneSpawnTimer = 0.7;
      }
    }

    // Move troops along aiPath (with skills)
    for (const t of this.aiLaneTroops) {
      if (t.hp <= 0) continue;
      // regen
      const aiRegenSk = getSkill(t, 'regen');
      if (aiRegenSk) t.hp = Math.min(t.maxHp, t.hp + t.maxHp * aiRegenSk.pct * dt);
      // speed calculation
      let spd = t.speed;
      const aiEnrageSk = getSkill(t, 'enrage');
      if (aiEnrageSk && t.hp / t.maxHp < aiEnrageSk.hpThreshold) spd *= aiEnrageSk.spdMult;
      const aiChargeSk = getSkill(t, 'charge');
      if (aiChargeSk && (t._chargeTimer === undefined || t._chargeTimer > 0)) {
        if (t._chargeTimer === undefined) t._chargeTimer = aiChargeSk.dur;
        spd *= aiChargeSk.spdMult;
        t._chargeTimer -= dt;
      }
      t.pathIdx += spd * dt * 1.5;
      if (t.pathIdx >= this.aiPath.length) {
        t.hp = 0;
        if (this.mode === 'pvp') {
          // PVP: AI lane 只是視覺模擬，不直接扣對手 HP
          // 對手 HP 由對手的 hpUpdate 訊息同步
          this.showAiDmgFloat(t.dmgToBase);
          this.addBattleLog('player',
            `💥 ${t.icon}${t.name} 突破！（等待對手確認）`
          );
        } else {
          // PVE: 直接扣 AI HP
          this.ai.hp = Math.max(0, this.ai.hp - t.dmgToBase);
          this.showAiDmgFloat(t.dmgToBase);
          this.addBattleLog('player',
            `💥 ${t.icon}${t.name} 突破！<span class="log-dmg">−${t.dmgToBase}HP</span>（${this.oppName}剩${Math.ceil(this.ai.hp)}）`
          );
          if (this.ai.hp <= 0) {
            this.addBattleLog('player', `🎉 <span class="log-dmg">${this.oppName}基地被攻破！</span>`);
            this.endGame(true, 'ai_killed');
            return;
          }
        }
      }
    }

    // AI towers attack troops（用 TOWERS stats 按等級）
    for (const tw of this.ai.towers) {
      const aiTwStats = this.getAiTowerStats(tw.level, tw);

      tw.atkTimer = (tw.atkTimer || 0) + dt * aiTwStats.atkSpd;
      if (tw.atkTimer < 1) continue;

      const twPos = {x: tw.x, y: tw.y};
      const applyAiDmg = (troop, d) => {
        troop.hp -= Math.max(1, Math.floor(d));
        if (troop.hp <= 0 && hasSkill(troop, 'shield') && !troop._shieldUsed) {
          troop.hp = 1;
          troop._shieldUsed = true;
        }
      };

      let _aiShotsThisFrame = 0;
      while (tw.atkTimer >= 1 && _aiShotsThisFrame < 20) {
        tw.atkTimer -= 1;
        _aiShotsThisFrame++;

        let target = null, bestDist = Infinity;
        for (const t of this.aiLaneTroops) {
          if (t.hp <= 0) continue;
          const tp = this.aiTroopPos(t);
          const dist = Math.hypot(tp.x - twPos.x, tp.y - twPos.y);
          if (dist <= aiTwStats.range && dist < bestDist) {
            bestDist = dist;
            target = t;
          }
        }
        if (!target) break;

        let dmg = aiTwStats.damage;
        dmg *= (1 - Math.min(target.armor || 0, 0.8));

        if (aiTwStats.aoe > 0) {
          const tp = this.aiTroopPos(target);
          for (const t of this.aiLaneTroops) {
            if (t.hp <= 0) continue;
            const p2 = this.aiTroopPos(t);
            if (Math.hypot(p2.x - tp.x, p2.y - tp.y) <= aiTwStats.aoe) {
              const d = aiTwStats.damage * (1 - Math.min(t.armor || 0, 0.8));
              applyAiDmg(t, d);
            }
          }
        } else {
          applyAiDmg(target, dmg);
        }

        const tp = this.aiTroopPos(target);
        this.aiLaneProjectiles.push({
          x: twPos.x, y: twPos.y, tx: tp.x, ty: tp.y, t: 0.12, color: this.aiBaseElem ? ELEM[this.aiBaseElem].color : '#888'
        });
      } // end while ai shots
    }

    // Remove dead troops
    for (const t of this.aiLaneTroops) {
      if (t.hp <= 0 && t.pathIdx < this.aiPath.length) {
        const p = this.aiTroopPos(t);
        this.addFx(p.x, p.y, 0.3, t.color + '88', 0.3);
      }
    }
    this.aiLaneTroops = this.aiLaneTroops.filter(t => t.hp > 0);

    // AI lane projectiles
    for (const p of this.aiLaneProjectiles) p.t -= dt;
    this.aiLaneProjectiles = this.aiLaneProjectiles.filter(p => p.t > 0);

    // Wave clear
    const aiLaneClear = this.aiLaneTroops.length === 0 && (!this.aiLaneSpawnQueue || this.aiLaneSpawnQueue.length === 0);
    // PVP: 只看自己地圖清完就算波次結束（AI lane 是視覺模擬，不影響判定）
    const myLaneClear = this.enemies.length === 0 && this.spawnQueue.length === 0;
    const waveDone = this.mode === 'pvp' ? myLaneClear : (myLaneClear && aiLaneClear);
    if (this.state === 'fighting' && waveDone) {
      // Wave clear → 收取 income（叫兵的投資在這裡回收）
      this.gold += this.income;
      this.addBattleLog('player', `📈 Wave ${this.wave} 結算：收入 +${this.income}g（總金:${Math.floor(this.gold)}）`);

      // interest：利息結算（income 已入帳的金幣為基準）
      const interestTower = this.towers.find(tw => hasSkill(tw, 'interest'));
      if (interestTower) {
        const iSk = getSkill(interestTower, 'interest');
        const interestBonus = Math.min(Math.floor(this.gold * iSk.rate), iSk.cap);
        if (interestBonus > 0) {
          this.gold += interestBonus;
          this.addBattleLog('player', `💰 利息 +${interestBonus}g（持有 ${Math.floor(this.gold - interestBonus)}g × ${(iSk.rate*100).toFixed(0)}%，上限 ${iSk.cap}g）`);
        }
      }

      if (this.mode === 'pve') {
        this.ai.gold += this.ai.income;
        this.addBattleLog('ai', `🤖 AI 收入 +${this.ai.income}g（總金:${Math.floor(this.ai.gold)}）`);
      }

      if (this.wave >= CONFIG.totalWaves) {
        this.endGame(true, 'survived');
      } else if (ELEM_WAVES.includes(this.wave)) {
        // Boss 波過關 → 選元素
        this.state = 'reward';
        this.showElementScreen();
      } else {
        // 一般波過關 → 直接進入 pre_wave（不顯示獎勵畫面）
        this.state = 'pre_wave';
        this.myReady = false;
        this.readyPlayers.clear();
        this.showPreWave();
        this.rebuildSidebar();
      }
    }
  }

  // ── Render ──
  render() {
    const ctx = this.ctx, cs = this.cellSize;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid
    for (let y = 0; y < CONFIG.gridRows; y++) {
      for (let x = 0; x < CONFIG.gridCols; x++) {
        const px = this.offsetX + x * cs, py = this.offsetY + y * cs;
        ctx.fillStyle = this.grid[y][x] === 1 ? '#2a2a4a' : this.grid[y][x] === 3 ? '#8a7a5a' : '#0f0f2a';
        ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
      }
    }

    // Path markers
    if (this.path.length > 0) {
      ctx.font = `${cs*0.4}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const s = this.path[0], e = this.path[this.path.length-1];
      ctx.fillText('🚪', this.offsetX+s.x*cs+cs/2, this.offsetY+s.y*cs+cs/2);
      ctx.fillText('🏠', this.offsetX+e.x*cs+cs/2, this.offsetY+e.y*cs+cs/2);
    }

    // Zones
    for (const z of this.zones) {
      ctx.beginPath();
      ctx.arc(this.offsetX+z.x*cs+cs/2, this.offsetY+z.y*cs+cs/2, z.r*cs, 0, Math.PI*2);
      ctx.fillStyle = z.color; ctx.fill();
    }

    // Effects
    for (const f of this.effects) {
      const progress = f.t / f.dur;
      const a = Math.max(0, 1 - progress);
      if (f.type === 'ring') {
        // 向外擴展的圓環（pulse 視覺）
        const ringR = f.r * cs * (0.7 + 0.3 * progress);
        ctx.beginPath();
        ctx.arc(this.offsetX+f.x*cs+cs/2, this.offsetY+f.y*cs+cs/2, ringR, 0, Math.PI*2);
        ctx.strokeStyle = f.color + Math.floor(a * 200).toString(16).padStart(2,'0');
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        const radius = f.r * cs * (1 - progress * 0.5);
        if (radius <= 0) continue;
        ctx.beginPath();
        ctx.arc(this.offsetX+f.x*cs+cs/2, this.offsetY+f.y*cs+cs/2, radius, 0, Math.PI*2);
        ctx.strokeStyle = f.color + Math.floor(a*180).toString(16).padStart(2,'0');
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = f.color + Math.floor(a*30).toString(16).padStart(2,'0');
        ctx.fill();
      }
    }

    // Towers
    for (const tw of this.towers) {
      const px = this.offsetX+tw.x*cs, py = this.offsetY+tw.y*cs;
      const towerColor = (tw.elem ? ELEM[tw.elem].color : (tw.basicType === 'cannon' ? '#8888aa' : '#c8a86c'));
      // 塔圖示：基礎塔=🏹/💣，元素塔=元素圖示，三屬=專屬icon
      let towerIcon;
      if (!tw.elem) {
        towerIcon = BASIC_TOWERS[tw.basicType || 'arrow'].icon;
      } else if (tw.thirdElem) {
        const key = this.getTripleKey(tw.elem, tw.infuseElem, tw.thirdElem);
        const triple = TRIPLE_TOWERS[key];
        towerIcon = triple ? triple.icon : '❓';
      } else if (tw.infuseElem) {
        if (tw.elem === tw.infuseElem) {
          towerIcon = ELEM[tw.elem].icon + '×2';
        } else {
          towerIcon = ELEM[tw.elem].icon + ELEM[tw.infuseElem].icon;
        }
      } else {
        towerIcon = ELEM[tw.elem].icon;
      }

      if (this.selectedTower === tw) {
        ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2;
        ctx.strokeRect(px-1, py-1, cs+2, cs+2);
        const effRangeVis = tw.range + (tw._auraRange || 0);
        ctx.beginPath();
        ctx.arc(px+cs/2, py+cs/2, effRangeVis*cs, 0, Math.PI*2);
        ctx.strokeStyle = towerColor+'66'; ctx.lineWidth = 1; ctx.stroke();
        const arSk = getSkill(tw, 'aura_range');
        if (arSk) {
          ctx.beginPath();
          ctx.arc(px+cs/2, py+cs/2, arSk.radius*cs, 0, Math.PI*2);
          ctx.strokeStyle = '#44ff8844'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      if (this.hoveredCell?.gx === tw.x && this.hoveredCell?.gy === tw.y && this.selectedTower !== tw) {
        const effRangeVisH = tw.range + (tw._auraRange || 0);
        ctx.beginPath();
        ctx.arc(px+cs/2, py+cs/2, effRangeVisH*cs, 0, Math.PI*2);
        ctx.strokeStyle = towerColor+'33'; ctx.lineWidth = 1; ctx.stroke();
      }

      // 背景色隨等級加深
      const bgColors = ['#1a1a3e', '#1a2a3e', '#1a3a2e', '#2a2a1e', '#3a1a2e'];
      ctx.fillStyle = bgColors[Math.min(tw.level - 1, bgColors.length - 1)];
      ctx.fillRect(px+2, py+2, cs-4, cs-4);
      ctx.strokeStyle = towerColor;
      ctx.lineWidth = Math.min(tw.level, 3);
      ctx.strokeRect(px+2, py+2, cs-4, cs-4);

      // Icon
      ctx.font = `${cs*0.45}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(towerIcon, px+cs/2, py+cs/2);

      // Level number
      ctx.font = `bold ${cs*0.22}px sans-serif`; ctx.fillStyle = '#fff';
      ctx.fillText(`${tw.level}`, px+cs*0.15, py+cs*0.85);

      // Skill indicator
      if (tw.skills && tw.skills.length > 0) {
        ctx.font = `${cs*0.15}px sans-serif`; ctx.fillStyle = '#ffd93d';
        ctx.textAlign = 'right';
        ctx.fillText('★', px+cs-4, py+cs*0.85);
        ctx.textAlign = 'center';
      }
    }

    // Placement preview (pending = clicked once, hoveredCell = mouse hover)
    const previewCell = this.pendingPlace || this.hoveredCell;
    if (previewCell) {
      const pgx = previewCell.x !== undefined ? previewCell.x : previewCell.gx;
      const pgy = previewCell.y !== undefined ? previewCell.y : previewCell.gy;
      if (pgx >= 0 && pgx < CONFIG.gridCols && pgy >= 0 && pgy < CONFIG.gridRows && this.grid[pgy][pgx] === 0) {
        const basicType = this.selectedBasicType || 'arrow';
        const bDef = BASIC_TOWERS[basicType];
        const previewColor = basicType === 'cannon' ? '#8888aa' : '#c8a86c';
        const previewRange = bDef.levels[0].range;
        const isPending = this.pendingPlace && this.pendingPlace.x === pgx && this.pendingPlace.y === pgy;

        const px = this.offsetX+pgx*cs, py = this.offsetY+pgy*cs;
        ctx.fillStyle = previewColor + (isPending ? '55' : '33');
        ctx.fillRect(px, py, cs, cs);
        ctx.beginPath();
        ctx.arc(px+cs/2, py+cs/2, previewRange*cs, 0, Math.PI*2);
        ctx.strokeStyle = previewColor + (isPending ? '66' : '44'); ctx.lineWidth = isPending ? 2 : 1; ctx.stroke();

        // 顯示塔資訊（pending 狀態）
        if (isPending) {
          const lvData = bDef.levels[0];
          const dps = (lvData.damage * lvData.atkSpd).toFixed(0);
          const infoText = `${bDef.icon}${bDef.name} Lv1　💰${lvData.cost}　DPS:${dps}`;
          ctx.font = `bold ${cs*0.35}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          const infoX = px + cs/2, infoY = py - cs*0.3;
          ctx.strokeText(infoText, infoX, infoY);
          ctx.fillText(infoText, infoX, infoY);
          ctx.fillStyle = '#ff8'; ctx.font = `${cs*0.28}px sans-serif`;
          ctx.strokeText('再點一次確認蓋塔', infoX, infoY + cs*0.35);
          ctx.fillText('再點一次確認蓋塔', infoX, infoY + cs*0.35);
          ctx.textAlign = 'left';
        }
      }
    }

    // Projectiles
    for (const p of this.projectiles) {
      const prog = 1 - p.t/0.15;
      const px = p.x + (p.tx-p.x)*prog, py = p.y + (p.ty-p.y)*prog;
      ctx.beginPath(); ctx.arc(this.offsetX+px*cs+cs/2, this.offsetY+py*cs+cs/2, 3, 0, Math.PI*2);
      ctx.fillStyle = p.color; ctx.fill();
    }

    // Enemies
    for (const e of this.enemies) {
      const isStealth = hasSkill(e, 'stealth') && !e.revealed;
      if (isStealth) ctx.globalAlpha = 0.3;
      const pos = this.ePos(e);
      const px = Math.round(this.offsetX+pos.x*cs+cs/2), py = Math.round(this.offsetY+pos.y*cs+cs/2);

      // 大小根據 maxHp 縮放（基準 55hp=0.3, Boss 更大）
      const hpScale = e.isBoss
        ? Math.min(0.7, 0.45 + Math.log2(Math.max(1, e.maxHp / 400)) * 0.04)
        : Math.min(0.5, 0.28 + Math.log2(Math.max(1, e.maxHp / 55)) * 0.04);
      const sz = cs * hpScale;

      // Boss 光環
      if (e.isBoss) {
        const pulse = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
        ctx.beginPath(); ctx.arc(px, py, sz + 4, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(255,217,61,${pulse * 0.6})`; ctx.lineWidth = 2; ctx.stroke();
      }

      // 用 icon 繪製（送兵用 sendIcon，波次怪用 icon）
      const icon = e.isAiSend ? (e.sendIcon || '🤖') : (e.icon || null);
      if (icon) {
        ctx.font = `${sz*2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, px, py);
      } else {
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2);
        ctx.fillStyle = e.color; ctx.fill();
      }

      if (hasSkill(e, 'flying')) { ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2); ctx.strokeStyle='#7bf'; ctx.lineWidth=1; ctx.stroke(); }
      if (e.stunTimer > 0) { ctx.font=`${cs*0.25}px sans-serif`; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('💫', px, py-sz-4); }
      if (e.burnTimer > 0) { ctx.font=`${cs*0.2}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🔥', px+sz, py-sz); }
      if (e.isAiSend && !icon) { ctx.font=`${cs*0.18}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🤖', px-sz-2, py-sz); }

      // HP bar
      const bw = sz*2, bh = 3, bx = px-bw/2, by = py-sz-6;
      ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
      const hp = Math.max(0, e.hp/e.maxHp);
      ctx.fillStyle = hp > 0.5 ? '#4c4' : hp > 0.25 ? '#cc4' : '#c44';
      ctx.fillRect(bx, by, bw*hp, bh);

      // 抗性圖示
      let dx = px - 6;
      for (const [el, v] of Object.entries(e.resist)) {
        if (v > 0 && ELEM[el]) { ctx.beginPath(); ctx.arc(dx, py+sz+5, 2, 0, Math.PI*2); ctx.fillStyle=ELEM[el].color; ctx.fill(); dx+=5; }
      }

      ctx.globalAlpha = 1;
    }

    // ═══ AI 防線視覺化 ═══
    // 分隔線
    const sepY = this.offsetY + CONFIG.gridRows * cs + cs * 0.1;
    ctx.strokeStyle = this.mode === 'pvp' ? '#e94560' : '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.offsetX, sepY);
    ctx.lineTo(this.offsetX + CONFIG.gridCols * cs, sepY);
    ctx.stroke();

    const labelY = this.offsetY + (CONFIG.gridRows + 0.5) * cs;

    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${cs * 0.35}px sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const laneLabel = this.mode === 'pvp'
      ? `⚔️ ${this.oppName}防線 — ${this.aiBaseElem ? ELEM[this.aiBaseElem].icon + ELEM[this.aiBaseElem].name : this.oppName}`
      : `▼ AI 防線 — ${this.aiBaseElem ? ELEM[this.aiBaseElem].icon + ELEM[this.aiBaseElem].name : '🤖 AI'}`;
    ctx.fillText(laneLabel, this.offsetX, labelY);

    // AI lane grid cells
    const aiStartRow2 = CONFIG.gridRows + 1;
    if (!this._aiPathSet) {
      this._aiPathSet = new Set(this.aiPath.map(p => `${p.x},${p.y}`));
    }
    for (let y = aiStartRow2; y < aiStartRow2 + 10; y++) {
      for (let x = 0; x < CONFIG.gridCols; x++) {
        const px = this.offsetX + x * cs, py = this.offsetY + y * cs;
        const isPath = this._aiPathSet.has(`${x},${y}`);
        ctx.fillStyle = isPath ? '#2a2a4a' : '#0f0f2a';
        ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
      }
    }

    // AI 路徑
    if (this.aiPath.length > 1) {
      ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = cs * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.offsetX + this.aiPath[0].x * cs + cs / 2, this.offsetY + this.aiPath[0].y * cs + cs / 2);
      for (let i = 1; i < this.aiPath.length; i++) {
        ctx.lineTo(this.offsetX + this.aiPath[i].x * cs + cs / 2, this.offsetY + this.aiPath[i].y * cs + cs / 2);
      }
      ctx.stroke();
    }

    // 出發點
    const startP = this.aiPath[0];
    ctx.fillStyle = '#4c8';
    ctx.font = `${cs * 0.4}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚔️', this.offsetX + startP.x * cs - cs * 0.3, this.offsetY + startP.y * cs + cs / 2);

    // AI 基地
    const endP = this.aiPath[this.aiPath.length - 1];
    const baseX = this.offsetX + endP.x * cs;
    const baseY = this.offsetY + endP.y * cs;
    ctx.fillStyle = '#600';
    ctx.fillRect(baseX + cs * 0.8, baseY - cs * 0.1, cs * 1.2, cs * 1.2);
    ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2;
    ctx.strokeRect(baseX + cs * 0.8, baseY - cs * 0.1, cs * 1.2, cs * 1.2);
    ctx.fillStyle = '#e94560';
    ctx.font = `${cs * 0.5}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(this.mode === 'pvp' ? '⚔️' : '🤖', baseX + cs * 1.4, baseY + cs * 0.4);
    ctx.font = `${cs * 0.22}px sans-serif`; ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.ceil(this.ai.hp)}`, baseX + cs * 1.4, baseY + cs * 0.8);

    // AI 塔（與玩家塔同樣風格渲染）
    for (const tw of this.ai.towers) {
      const px = this.offsetX + tw.x * cs;
      const py = this.offsetY + tw.y * cs;
      const cx = px + cs / 2, cy = py + cs / 2;

      // 每座塔自己的元素色
      const twElem = tw.elem || this.aiBaseElem;
      const aiTwColor = twElem ? ELEM[twElem].color : '#888';

      // 背景色隨等級加深
      const bgColors = ['#1a1a3e', '#1a2a3e', '#1a3a2e', '#2a2a1e', '#3a1a2e'];
      ctx.fillStyle = bgColors[Math.min((tw.level || 1) - 1, bgColors.length - 1)];
      ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);
      ctx.strokeStyle = aiTwColor;
      ctx.lineWidth = Math.min(tw.level || 1, 3);
      ctx.strokeRect(px + 2, py + 2, cs - 4, cs - 4);

      // Icon — 元素塔只顯示元素圖示，同元素疊加數字
      let aiTwIcon;
      if (tw.level <= 2) {
        aiTwIcon = tw.basicType === 'cannon' ? '💣' : '🏹';
      } else if (tw.infuseElem && tw.elem) {
        if (tw.elem === tw.infuseElem) {
          const cnt = tw.level >= 5 ? 3 : 2;
          aiTwIcon = ELEM[tw.elem].icon + cnt;
        } else {
          aiTwIcon = ELEM[tw.elem].icon + ELEM[tw.infuseElem].icon;
        }
      } else if (tw.elem) {
        aiTwIcon = ELEM[tw.elem].icon;
      } else {
        aiTwIcon = this.aiBaseElem ? ELEM[this.aiBaseElem].icon : '🏹';
      }
      ctx.font = `${cs * 0.45}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = aiTwColor;
      ctx.fillText(aiTwIcon, cx, cy);

      // Level number
      ctx.font = `bold ${cs * 0.22}px sans-serif`; ctx.fillStyle = '#fff';
      ctx.fillText(`${tw.level || 1}`, px + cs * 0.15, py + cs * 0.85);

      // Range indicator (clipped to AI lane area)
      const aiTwStats = this.getAiTowerStats(tw.level, tw);
      const aiLaneTop = this.offsetY + (CONFIG.gridRows + 1) * cs;
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.offsetX, aiLaneTop, CONFIG.gridCols * cs, 10 * cs);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(cx, cy, aiTwStats.range * cs, 0, Math.PI * 2);
      ctx.strokeStyle = aiTwColor + '22'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }

    // Troops on AI lane
    for (const t of this.aiLaneTroops) {
      const pos = this.aiTroopPos(t);
      const tpx = Math.round(this.offsetX + pos.x * cs + cs / 2);
      const tpy = Math.round(this.offsetY + pos.y * cs + cs / 2);
      const sz = cs * 0.25;

      // 用 icon 繪製
      if (t.icon) {
        ctx.font = `${sz*2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.icon, tpx, tpy);
      } else {
        ctx.beginPath(); ctx.arc(tpx, tpy, sz, 0, Math.PI * 2);
        ctx.fillStyle = t.color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      }

      const bw = sz * 2.5, bh = 3;
      const bx = tpx - bw / 2, by = tpy + sz + 3;
      ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
      const hpPct = Math.max(0, t.hp / t.maxHp);
      ctx.fillStyle = hpPct > 0.5 ? '#4c4' : hpPct > 0.25 ? '#cc4' : '#c44';
      ctx.fillRect(bx, by, bw * hpPct, bh);
    }

    // AI lane projectiles
    for (const p of this.aiLaneProjectiles) {
      const prog = 1 - p.t / 0.12;
      const px2 = this.offsetX + (p.x + (p.tx - p.x) * prog) * cs + cs / 2;
      const py2 = this.offsetY + (p.y + (p.ty - p.y) * prog) * cs + cs / 2;
      ctx.beginPath();
      ctx.arc(px2, py2, 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color || (this.aiBaseElem ? ELEM[this.aiBaseElem].color : '#888'); ctx.fill();
    }
  }

  endGame(won, reason) {
    this.state = won ? 'won' : 'lost';
    const ov = document.getElementById('game-over-overlay');
    ov.style.display = 'flex';
    let title = '';
    const oppLabel = this.oppName;
    if (won && reason === 'last_standing') title = '🎉 最後存活者！勝利！';
    else if (won && reason === 'ai_killed') title = `🎉 擊敗${oppLabel}！`;
    else if (won) title = '🎉 勝利！';
    else title = '💀 失敗...';
    document.getElementById('go-title').textContent = title;

    const elemsStr = ELEM_KEYS.filter(e => this.elemPicks[e] > 0).map(e => `${ELEM[e].icon}×${this.elemPicks[e]}`).join(' ');
    const oppName = this.oppName;
    const aiInfo = `${oppName} HP: ${Math.ceil(this.ai.hp)}/${this.ai.maxHp}`;
    document.getElementById('go-detail').textContent = won
      ? `${aiInfo} | HP: ${this.hp}/${this.maxHp} | Income: ${this.income} | 元素: ${elemsStr} | ${Math.floor(this.time)}秒`
      : `Wave ${this.wave}/${CONFIG.totalWaves} | ${aiInfo} | HP: ${this.hp}/${this.maxHp} | 元素: ${elemsStr} | ${Math.floor(this.time)}秒`;
  }
}

// ============================================================
// START SCREEN — v6 直接開始（不選元素）
// ============================================================
function initStart() {
  let selectedDiff = 'x1';
  let selectedMode = 'pve';
  let pvpPeer = null;
  let pvpIsHost = false;
  // N 人大廳：Host 維護所有連線
  let lobbyConns = {};   // { peerId: conn } — Host 用
  let lobbyPlayers = []; // [{ id, name }] — 所有人用
  let myPeerId = null;
  let hostConn = null;   // 非 Host 到 Host 的連線

  // Mode selection
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      selectedMode = btn.dataset.mode;
      document.querySelectorAll('.mode-btn').forEach(b => {
        const sel = b.dataset.mode === selectedMode;
        b.style.borderColor = sel ? '#e94560' : '#555';
        b.style.background = sel ? '#2a1a3e' : '#1a1a3e';
      });
      document.getElementById('pve-options').style.display = selectedMode === 'pve' ? '' : 'none';
      document.getElementById('pvp-options').style.display = selectedMode === 'pvp' ? '' : 'none';
      document.getElementById('start-btn').style.display = selectedMode === 'pve' ? '' : 'none';
    };
  });

  // Difficulty selection
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.onclick = () => {
      selectedDiff = btn.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(b => {
        const sel = b.dataset.diff === selectedDiff;
        b.style.borderColor = sel ? '#e94560' : '#555';
        b.style.background = sel ? '#2a1a3e' : '#1a1a3e';
      });
    };
  });

  // PVE start
  document.getElementById('start-btn').onclick = () => {
    document.getElementById('start-screen').style.display = 'none';
    const g = new Game(selectedDiff, 'pve');
    window._game = g;
  };

  function getMyName() {
    return (document.getElementById('pvp-name-input').value.trim()) || 'Player';
  }

  function updateLobbyUI() {
    const listEl = document.getElementById('pvp-player-list');
    const lobby = document.getElementById('pvp-lobby');
    lobby.style.display = lobbyPlayers.length > 0 ? '' : 'none';
    const arrow = ' <span style="color:#e94560">→</span> ';
    // 顯示玩家列表（名稱 + ID）
    let html = '';
    lobbyPlayers.forEach((p, i) => {
      const isMe = p.id === myPeerId;
      const color = isMe ? '#4ecdc4' : '#ffd93d';
      const displayName = p.name || `P${i+1}`;
      const label = `<span style="color:${color};font-weight:${isMe?'bold':'normal'}">${displayName}${isMe?' (你)':''}</span>`;
      html += (i > 0 ? arrow : '') + label;
    });
    if (lobbyPlayers.length > 1) {
      const first = lobbyPlayers[0];
      html += arrow + `<span style="color:${first.id===myPeerId?'#4ecdc4':'#ffd93d'}">${first.name || 'P1'}</span>`;
    }
    listEl.innerHTML = `<div style="color:#aaa;font-size:10px;margin-bottom:4px;">開始後配對隨機</div>` + html;
    const startGameBtn = document.getElementById('pvp-start-game');
    startGameBtn.style.display = (pvpIsHost && lobbyPlayers.length >= 2) ? '' : 'none';
  }

  // Host: 廣播大廳訊息給所有已連線的玩家
  function hostBroadcast(msg, excludeId) {
    for (const [pid, conn] of Object.entries(lobbyConns)) {
      if (pid !== excludeId && conn.open) conn.send(msg);
    }
  }

  // Host: 處理大廳訊息
  function hostOnLobbyMsg(data, fromId) {
    if (!data || !data.type) return;
    if (data.type === 'lobbyJoin') {
      // 新玩家加入
      if (!lobbyPlayers.find(p => p.id === fromId)) {
        lobbyPlayers.push({ id: fromId, name: data.name || fromId.slice(-4) });
      }
      // 廣播最新列表給所有人
      hostBroadcast({ type: 'lobbyUpdate', players: lobbyPlayers });
      updateLobbyUI();
    }
  }

  // 非 Host: 處理大廳訊息
  function guestOnLobbyMsg(data) {
    if (!data || !data.type) return;
    if (data.type === 'lobbyUpdate') {
      lobbyPlayers = data.players;
      updateLobbyUI();
    }
    if (data.type === 'gameStart') {
      // Host 通知開始遊戲
      startPvpGame(data.players, data.chain);
    }
  }

  // 開始 PVP 遊戲（所有人呼叫）
  function startPvpGame(players, chain) {
    document.getElementById('start-screen').style.display = 'none';
    // chain = [id1, id2, ..., idN] 環形順序
    // 找到自己的位置
    const myIdx = chain.indexOf(myPeerId);
    const nextIdx = (myIdx + 1) % chain.length;
    const prevIdx = (myIdx - 1 + chain.length) % chain.length;
    const attackTargetId = chain[nextIdx]; // 我送兵的對象
    const defendFromId = chain[prevIdx];   // 送兵給我的人

    // 建立 pvpNet 物件供 Game 使用
    const pvpNet = {
      myId: myPeerId,
      isHost: pvpIsHost,
      players: players,
      chain: chain,
      attackTargetId,
      defendFromId,
      // 發送訊息給特定玩家（Host 中繼）
      sendTo(targetId, msg) {
        msg._from = myPeerId;
        msg._to = targetId;
        if (pvpIsHost) {
          // Host 直接送
          if (targetId === myPeerId) return; // 不需送給自己
          const conn = lobbyConns[targetId];
          if (conn && conn.open) conn.send(msg);
        } else {
          // 非 Host: 送給 Host，由 Host 轉發
          if (hostConn && hostConn.open) hostConn.send(msg);
        }
      },
      // 廣播給所有人
      broadcast(msg) {
        msg._from = myPeerId;
        msg._to = '*';
        if (pvpIsHost) {
          hostBroadcast(msg);
        } else {
          if (hostConn && hostConn.open) hostConn.send(msg);
        }
      },
    };

    const g = new Game('x1', 'pvp', pvpNet);
    window._game = g;
  }

  // === PVP: Create room (Host) ===
  document.getElementById('pvp-create').onclick = () => {
    const status = document.getElementById('pvp-status');
    status.textContent = '建立連線中...';
    status.style.color = '#ffd93d';
    pvpIsHost = true;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    pvpPeer = new Peer('td6-' + roomCode);
    pvpPeer.on('open', (id) => {
      myPeerId = id;
      lobbyPlayers = [{ id: myPeerId, name: getMyName() || 'Host' }];
      status.innerHTML = `房間碼：<b style="color:#4ecdc4;font-size:18px;letter-spacing:2px;">${roomCode}</b><br>等待玩家加入...（最多 5 人）`;
      updateLobbyUI();
    });
    pvpPeer.on('connection', (conn) => {
      conn.on('open', () => {
        lobbyConns[conn.peer] = conn;
        // 告知新玩家他的 ID 並請他回報
        conn.send({ type: 'lobbyWelcome', yourId: conn.peer });
      });
      conn.on('data', (data) => {
        if (window._game) {
          // 遊戲已開始：Host 路由訊息
          if (data._to === '*') {
            // 廣播（轉發給其他人 + 自己處理）
            hostBroadcast(data, data._from);
            window._game.onNetMsg(data);
          } else if (data._to === myPeerId) {
            // 發給 Host 自己
            window._game.onNetMsg(data);
          } else {
            // 轉發給目標玩家
            const target = lobbyConns[data._to];
            if (target && target.open) target.send(data);
          }
        } else {
          // 大廳階段
          hostOnLobbyMsg(data, conn.peer);
        }
      });
      conn.on('close', () => {
        delete lobbyConns[conn.peer];
        lobbyPlayers = lobbyPlayers.filter(p => p.id !== conn.peer);
        if (window._game) {
          window._game.onPlayerDisconnect(conn.peer);
        } else {
          hostBroadcast({ type: 'lobbyUpdate', players: lobbyPlayers });
          updateLobbyUI();
        }
      });
    });
    pvpPeer.on('error', (err) => {
      status.textContent = '連線錯誤: ' + err.message;
      status.style.color = '#e94560';
    });
  };

  // === PVP: Host 按開始 ===
  document.getElementById('pvp-start-game').onclick = () => {
    if (!pvpIsHost || lobbyPlayers.length < 2) return;
    // 隨機 shuffle 配對順序
    const shuffled = [...lobbyPlayers].sort(() => Math.random() - 0.5);
    const chain = shuffled.map(p => p.id);
    // 廣播 gameStart
    hostBroadcast({ type: 'gameStart', players: shuffled, chain });
    // Host 自己也開始
    startPvpGame(shuffled, chain);
  };

  // === PVP: Join room (Guest) ===
  document.getElementById('pvp-join').onclick = () => {
    const status = document.getElementById('pvp-status');
    const code = document.getElementById('pvp-room-input').value.trim().toUpperCase();
    if (!code) { status.textContent = '請輸入房間碼'; status.style.color = '#e94560'; return; }
    status.textContent = '連線中...';
    status.style.color = '#ffd93d';
    pvpIsHost = false;
    pvpPeer = new Peer();
    pvpPeer.on('open', (id) => {
      myPeerId = id;
      hostConn = pvpPeer.connect('td6-' + code);
      hostConn.on('open', () => {
        // 告知 Host 我加入了
        hostConn.send({ type: 'lobbyJoin', name: getMyName() |initGrid| id.slice(-4) });
        status.innerHTML = `<span style="color:#4ecdc4;">已連線！等待 Host 開始...</span>`;
      });
      hostConn.on('data', (data) => {
        if (window._game) {
          // 遊戲中：收到 Host 轉發的訊息
          window._game.onNetMsg(data);
        } else {
          // 大廳階段
          guestOnLobbyMsg(data);
        }
      });
      hostConn.on('close', () => {
        if (window._game) window._game.onPlayerDisconnect('host');
        else { status.textContent = 'Host 已斷線'; status.style.color = '#e94560'; }
      });
    });
    pvpPeer.on('error', (err) => {
      status.textContent = '連線錯誤: ' + err.message;
      status.style.color = '#e94560';
    });
  };
}
initStart();
