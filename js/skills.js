// ============================================================
// SKILL SYSTEM — 模組化技能定義
// ============================================================

// 全域上限
const GLOBAL_CAPS = {
  slowPct: 0.8,  // 減速上限 75%
  chillPerStack: 0.005,
  chillMaxStacks: 130,
  chillDecayRate: 6,
  atkSpdBonus: 2,  // 攻速加成上限 +100%
  shredPerStack: 0.005,  // 每層 -2% 護甲穿透
  shredMaxStacks: 130,  // 上限 37 層 = 74%
  shredDecayRate: 6,  // 每秒 -1.5 層
  vulnPerStack: 0.02,  // 每層 +2% 易傷
  vulnMaxStacks: 37,  // 上限 37 層
  vulnDecayRate: 1.5,  // 每秒 -1.5 層
  procMinInterval: 0.3,  // proc 最小間隔 0.3 秒
  hpPctCd: 0.2,  // %HP 傷害每目標冷卻 0.5 秒
};

// ============================================================
// SKILL_DEFS — 所有技能的 master 登錄表
// ============================================================
const SKILL_DEFS = {

  // ── 塔：傷害類 ──
  burn        : { category: 'tower', group: 'damage', name: '灼燒', defaults: {dot:0.3,dur:3}, desc: '每秒 dot×DPS 傷害，持續 dur 秒。吃護甲。覆蓋時觸發 ignite', scoreBase: 23, scorePrimary: 'dot', scoreRef: 0.3 },
  ignite      : { category: 'tower', group: 'damage', name: '引燃', defaults: {flat:0.2}, desc: '灼燒覆蓋時造成 flat×ATK 傷害', scoreBase: 12, scorePrimary: 'flat', scoreRef: 0.2 },
  detonate    : { category: 'tower', group: 'damage', name: '引爆', defaults: {ratio:0.8}, desc: '消耗灼燒，ratio×ATK 真傷（無視護甲）', scoreBase: 20, scorePrimary: 'ratio', scoreRef: 0.8 },
  chain       : { category: 'tower', group: 'damage', name: '連鎖', defaults: {targets:2,decay:0.7}, desc: '跳到鄰近 targets 個敵人，每跳 ×decay', scoreBase: 20, scorePrimary: 'targets', scoreRef: 2 },
  execute     : { category: 'tower', group: 'damage', name: '斬殺', defaults: {threshold:0.15,mult:2}, desc: 'HP < threshold 時傷害 ×mult', scoreBase: 20, scorePrimary: null, scoreRef: null },
  hpPct       : { category: 'tower', group: 'damage', name: '%HP傷害', defaults: {pct:0.03,every:3,cd:0.5}, desc: '每 every 次附加 pct% 最大HP傷害', scoreBase: 40, scorePrimary: 'pct', scoreRef: 0.03 },
  frostbite   : { category: 'tower', group: 'damage', name: '凍傷', defaults: {dmgPct:0.02,dur:3}, desc: '⚠️ [廢棄] 功能與 hpPct 高度重疊，不再分配給純屬塔。命中施加凍傷，每秒 dmgPct×maxHP 水系傷害，持續 dur 秒。', scoreBase: 30, scorePrimary: 'dmgPct', scoreRef: 0.02 },
  lifedrain   : { category: 'tower', group: 'damage', name: '生命汲取', defaults: {pct:0.15}, desc: '傷害 pct% 回復基地 HP', scoreBase: 10, scorePrimary: 'pct', scoreRef: 0.15 },

  // ── 塔：控制類 ──
  chill       : { category: 'tower', group: 'control', name: '冰冷', defaults: {stacksPerHit:1}, desc: '每次攻擊疊 stacksPerHit 層，全域每層 -2% 速度（上限 75%）', scoreBase: 2, scorePrimary: 'stacksPerHit', scoreRef: 1 },
  freeze      : { category: 'tower', group: 'control', name: '冰凍', defaults: {dur:1,threshold:30}, desc: '冰冷達 threshold 層時定身 dur 秒', scoreBase: 40, scorePrimary: 'dur', scoreRef: 1 },
  warp        : { category: 'tower', group: 'control', name: '扭曲', defaults: {dur:1,cd:8}, desc: '定身 dur 秒，cd 秒冷卻', scoreBase: 35, scorePrimary: 'dur', scoreRef: 1 },
  knockback   : { category: 'tower', group: 'control', name: '擊退', defaults: {dist:0.5,cd:5}, desc: '擊退 dist 格', scoreBase: 15, scorePrimary: null, scoreRef: null },

  // ── 塔：弱化類 ──
  shred       : { category: 'tower', group: 'debuff', name: '碎甲', defaults: {stacksPerHit:2}, desc: '每次攻擊疊 stacksPerHit 層，全域每層 -shredPerStack% 護甲（上限 shredMaxStacks 層，衰減 shredDecayRate 層/秒）', scoreBase: 10, scorePrimary: 'stacksPerHit', scoreRef: 1 },
  vulnerability: { category: 'tower', group: 'debuff', name: '易傷', defaults: {stacksPerHit:2}, desc: '每次攻擊疊 stacksPerHit 層，全域每層 +vulnPerStack% 易傷（上限 vulnMaxStacks 層）', scoreBase: 25, scorePrimary: 'stacksPerHit', scoreRef: 1 },

  // ── 塔：增益類 ──
  ramp        : { category: 'tower', group: 'buff', name: '越攻越快', defaults: {perHit:0.03,cap:0.5,switchLoss:3}, desc: '連攻同目標攻速 +perHit，上限 +cap；切換目標時扣 switchLoss 層（非歸零）', scoreBase: 12, scorePrimary: 'cap', scoreRef: 0.5 },
  aura_dmg    : { category: 'tower', group: 'buff', name: '傷害光環', defaults: {radius:2,flat:0,pct:0.15}, desc: '範圍內友軍傷害 +flat 或 ×(1+pct)', scoreBase: 40, scorePrimary: 'pct', scoreRef: 0.15 },
  aura_atkSpd : { category: 'tower', group: 'buff', name: '攻速光環', defaults: {radius:2,bonus:0.2}, desc: '範圍內友軍攻速 +bonus（僅Lv6純風）', scoreBase: 35, scorePrimary: 'bonus', scoreRef: 0.2 },
  aura_range  : { category: 'tower', group: 'buff', name: '射程光環', defaults: {radius:2,bonus:0.5}, desc: '範圍內友軍射程 +bonus', scoreBase: 15, scorePrimary: 'bonus', scoreRef: 0.5 },

  // ── 塔：特殊類 ──
  multishot   : { category: 'tower', group: 'special', name: '三連射', defaults: {every:3,shots:3,killBonus:0.5,killDur:3}, desc: '每 every 次射 shots 發+擊殺加速', scoreBase: 40, scorePrimary: null, scoreRef: null },
  pierce      : { category: 'tower', group: 'special', name: '穿透', defaults: {dmgDown:0.15,count:3}, desc: '直線穿透最多 count 體，每穿 −dmgDown 傷害', scoreBase: 15, scorePrimary: 'dmgDown', scoreRef: 0.15 },
  zone_slow   : { category: 'tower', group: 'special', name: '減速領域', defaults: {radius:1.5,chillStacks:40}, desc: '命中後在目標位置留下圓圈（半徑 radius 格，持續 3 秒），圓圈內敵人冰冷層數維持在 chillStacks', scoreBase: 15, scorePrimary: 'chillStacks', scoreRef: 40, scoreFactors: [{"param":"radius","ref":1.5}] },
  zone_shred  : { category: 'tower', group: 'special', name: '碎甲領域', defaults: {radius:1.5,shredStacks:10}, desc: '命中後在目標位置留下圓圈（半徑 radius 格，持續 3 秒），圓圈內敵人碎甲層數維持在 shredStacks', scoreBase: 5, scorePrimary: 'shredStacks', scoreRef: 10, scoreFactors: [{"param":"radius","ref":1.5}] },
  killGold    : { category: 'tower', group: 'special', name: '擊殺獎金', defaults: {bonus:0.15}, desc: '自身塔擊殺 +bonus 金幣', scoreBase: 20, scorePrimary: 'bonus', scoreRef: 0.15 },
  unstable    : { category: 'tower', group: 'special', name: '不穩定', defaults: {variance:0.3}, desc: '傷害隨機 ±variance', scoreBase: -5, scorePrimary: null, scoreRef: null },
  permaBuff   : { category: 'tower', group: 'special', name: '永久強化', defaults: {atkPerKill:0.5}, desc: '每擊殺 +atkPerKill 攻擊力', scoreBase: 30, scorePrimary: null, scoreRef: null },
  wealthScale : { category: 'tower', group: 'special', name: '財富積累', defaults: {divisor:20,cap:50}, desc: '持有每 divisor g = +1 傷害，上限 +cap（即時讀取，花錢則下降）', scoreBase: 0, scorePrimary: null, scoreRef: null },
  interest    : { category: 'tower', group: 'special', name: '利息', defaults: {rate:0.05,cap:40}, desc: '每波結算時依持有金幣給予 rate×100% 金幣，上限 cap g（直接加金，非永久收入）', scoreBase: 0, scorePrimary: null, scoreRef: null },

  // ── 敵人/送兵技能 ──
  regen       : { category: 'enemy', group: 'passive', name: '再生', defaults: {pct:0.02}, desc: '每秒回復 pct% 最大HP', scoreBase: 0, scorePrimary: null, scoreRef: null },
  armorStack  : { category: 'enemy', group: 'passive', name: '護甲成長', defaults: {perHit:0.1,cap:0.5}, desc: '每次被攻擊護甲 +perHit，上限 +cap', scoreBase: 0, scorePrimary: null, scoreRef: null },
  enrage      : { category: 'enemy', group: 'passive', name: '狂暴', defaults: {hpThreshold:0.3,spdMult:2}, desc: 'HP < threshold 速度 ×spdMult', scoreBase: 0, scorePrimary: null, scoreRef: null },
  shield      : { category: 'enemy', group: 'passive', name: '護盾', defaults: {amt:100,regen:0}, desc: '額外 amt 護盾，regen/s 回復', scoreBase: 0, scorePrimary: null, scoreRef: null },
  charge      : { category: 'enemy', group: 'passive', name: '衝鋒', defaults: {spdMult:2,dur:1.5}, desc: '進場 dur 秒速度 ×spdMult', scoreBase: 0, scorePrimary: null, scoreRef: null },
  dodge       : { category: 'enemy', group: 'passive', name: '閃避', defaults: {chance:0.15}, desc: 'chance 機率閃避攻擊', scoreBase: 0, scorePrimary: null, scoreRef: null },
  tenacity    : { category: 'enemy', group: 'passive', name: '韌性', defaults: {ccReduce:0.5}, desc: 'CC 效果 ×(1 - ccReduce)', scoreBase: 0, scorePrimary: null, scoreRef: null },
  blink       : { category: 'enemy', group: 'passive', name: '閃現', defaults: {dist:2,cd:8,hpTrigger:0.3}, desc: 'HP < hpTrigger 向前閃現 dist 格', scoreBase: 0, scorePrimary: null, scoreRef: null },
  splitOnDeath: { category: 'enemy', group: 'passive', name: '分裂', defaults: {count:2,hpRatio:0.3}, desc: '死亡分裂 count 個，HP ×hpRatio', scoreBase: 0, scorePrimary: null, scoreRef: null },
  antiElement : { category: 'enemy', group: 'passive', name: '元素適應', defaults: {reduce:0.3}, desc: '同元素連攻時該元素傷害 -reduce', scoreBase: 0, scorePrimary: null, scoreRef: null },
  stealth     : { category: 'enemy', group: 'passive', name: '隱身', defaults: {dur:2,cd:10}, desc: '每 cd 秒隱身 dur 秒', scoreBase: 0, scorePrimary: null, scoreRef: null },
  summon      : { category: 'enemy', group: 'passive', name: '召喚', defaults: {cd:8,count:3,hpRatio:0.2}, desc: '每 cd 秒召喚 count 個小怪（HP ×hpRatio）', scoreBase: 0, scorePrimary: null, scoreRef: null },
  phaseShift  : { category: 'enemy', group: 'passive', name: '相位偏移', defaults: {phases:4,dmgReduce:0.5}, desc: '每失去 1/phases HP 切換元素抗性，受傷 ×dmgReduce', scoreBase: 0, scorePrimary: null, scoreRef: null },
  fortify     : { category: 'enemy', group: 'passive', name: '堅固', defaults: {dmgCap:50}, desc: '單次傷害上限 dmgCap', scoreBase: 0, scorePrimary: null, scoreRef: null },
  resilient   : { category: 'enemy', group: 'passive', name: '不屈', defaults: {stack:0.02,cap:0.4}, desc: '每被攻擊受傷 -stack%，上限 -cap%', scoreBase: 0, scorePrimary: null, scoreRef: null },
};

// （以下為工具函數，不由 skill-editor 產生）
// ============================================================
// 工具函數
// ============================================================

// 建立技能實例（params 覆蓋預設值）
function makeSkill(type, params, enabled) {
  if (params === undefined) params = {};
  if (enabled === undefined) enabled = true;
  return { type, enabled, params: { ...SKILL_DEFS[type].defaults, ...params } };
}

// 取得單位身上已啟用的指定技能（回傳 merged params 或 null）
function getSkill(unit, type) {
  const s = unit.skills && unit.skills.find(function(s) { return s.type === type && s.enabled; });
  if (!s) return null;
  return { ...SKILL_DEFS[type].defaults, ...s.params };
}

// 檢查單位是否有指定技能且已啟用
function hasSkill(unit, type) {
  return !!(unit.skills && unit.skills.some(function(s) { return s.type === type && s.enabled; }));
}

// ============================================================
// 技能描述生成（取代舊 getSpecialDesc / getSpecialBrief / PASSIVE_NAMES）
// ============================================================

// 完整描述（多行）
function getSkillDesc(skills) {
  if (!skills || skills.length === 0) return '';
  return skills.map(function(s) {
    var def = SKILL_DEFS[s.type];
    if (!def) return s.type;
    var p = { ...def.defaults, ...s.params };
    switch (s.type) {
      case 'burn':     return '🔥 灼燒：每秒 ' + Math.round(p.dot * 100) + '% ATK，持續 ' + p.dur + 's';
      case 'ignite':   return '🔥 引燃：覆蓋灼燒 +' + Math.round(p.flat * 100) + '% ATK';
      case 'detonate': return '💥 引爆：' + Math.round(p.ratio * 100) + '% ATK 真傷' + (p.aoe ? '（AOE ' + p.aoe + '）' : '');
      case 'chain':    return '⛓️ 連鎖：跳 ' + p.targets + ' 個敵人，每跳 ×' + p.decay;
      case 'execute':  return '🗡️ 斬殺：HP < ' + Math.round(p.threshold * 100) + '% → 傷害 ×' + p.mult;
      case 'hpPct':    return '💀 %HP：每 ' + p.every + ' 次附加 ' + Math.round(p.pct * 100) + '% 最大HP傷害';
      case 'lifedrain': return '💚 生命汲取：傷害 ' + Math.round(p.pct * 100) + '% 回復基地 HP';
      case 'chill':    return '❄️ 冰冷：每攻擊 +' + (p.stacksPerHit||1) + ' 層（衰減 ' + GLOBAL_CAPS.chillDecayRate + ' 層/秒，全域每層 -2%）';
      case 'freeze':   return '❄️ 冰凍：' + p.threshold + ' 層時定身 ' + p.dur + 's';
      case 'warp':     return '🌀 扭曲：定身 ' + p.dur + 's（' + p.cd + 's CD）';
      case 'knockback': return '💨 擊退：' + p.dist + ' 格（' + p.cd + 's CD）';
      case 'shred':    return `🔩 碎甲：每攻 +${p.stacksPerHit} 層（全域每層 -${GLOBAL_CAPS.shredPerStack * 100}%，衰減 ${GLOBAL_CAPS.shredDecayRate}/s）`;
      case 'vulnerability': return `💔 易傷：每攻 +${p.stacksPerHit} 層（全域每層 +${GLOBAL_CAPS.vulnPerStack * 100}%，衰減 ${GLOBAL_CAPS.vulnDecayRate}/s）`;
      case 'ramp':     return `⚡ 越攻越快：連攻同一目標每次 +${p.perHit} 攻速（上限 +${p.cap}）；切換目標扣 ${p.switchLoss} 層，不歸零`;
      case 'frostbite': return `⚠️ [廢棄] 凍傷：每秒 ${(p.dmgPct*100).toFixed(1)}% maxHP 水系傷害，持續 ${p.dur}s。不再用於純屬塔。`;
      case 'aura_dmg': return '🔴 傷害光環：' + (p.flat ? '+' + p.flat + ' 定值' : '') + (p.flat && p.pct ? ' + ' : '') + (p.pct ? '+' + Math.round(p.pct * 100) + '%' : '') + '（半徑 ' + p.radius + '）';
      case 'aura_atkSpd': return '🟡 攻速光環：+' + Math.round(p.bonus * 100) + '%（半徑 ' + p.radius + '）';
      case 'aura_range': return '🟢 射程光環：+' + p.bonus + '（半徑 ' + p.radius + '）';
      case 'multishot': return '🌪️ 三連射：每 ' + p.every + ' 次射 ' + p.shots + ' 發 + 擊殺加速 ' + Math.round(p.killBonus * 100) + '%/' + p.killDur + 's';
      case 'multiArrow': return `🏹 多重箭：同時射 ${p.shots} 支，副目標各 ${Math.round(p.ratio * 100)}% 傷害`;
      case 'pierce':   return '🌪️ 穿透：最多 ' + (p.count ?? 3) + ' 體，每穿 −' + Math.round(p.dmgDown * 100) + '%';
      case 'zone_slow':  return '🔵 減速領域：半徑 ' + p.radius + '，冰冷 ' + p.chillStacks + ' 層';
      case 'zone_shred': return '🟤 碎甲領域：半徑 ' + p.radius + '，碎甲 ' + p.shredStacks + ' 層';
      case 'field_slow':  return '🌀 範圍減速場：半徑 ' + p.radius + ' 格，維持 ' + p.chillStacks + ' 層冰冷';
      case 'field_shred': return '🟤 範圍碎甲場：半徑 ' + p.radius + ' 格，維持 ' + p.shredStacks + ' 層碎甲';
      case 'field_vuln':  return '🟣 範圍易傷場：半徑 ' + p.radius + ' 格，維持 ' + p.vulnStacks + ' 層易傷';
      case 'field_stun':  return '⚡ 範圍暈眩：半徑 ' + p.radius + ' 格，每 ' + p.cd + 's 暈眩 ' + p.dur + 's';
      case 'field_burn':  return '🔥 範圍灼燒：半徑 ' + p.radius + ' 格，每 ' + p.interval + 's 施加灼燒 ' + Math.round(p.dot*100) + '% ATK × ' + p.dur + 's';
      case 'field_dmg':   return '💥 範圍傷害：半徑 ' + p.radius + ' 格，每 ' + p.cd + 's 造成 ' + Math.round(p.flat*100) + '% ATK';
      case 'cycle_stun':  return '⚡ 攻速暈眩：半徑 ' + p.radius + ' 格，每次攻擊暈眩 ' + p.dur + 's';
      case 'cycle_chill': return '❄️ 攻速冰冷：半徑 ' + p.radius + ' 格，每次攻擊 +' + p.stacksPerCycle + ' 層冰冷';
      case 'cycle_shred': return '🔩 攻速碎甲：半徑 ' + p.radius + ' 格，每次攻擊 +' + p.stacksPerCycle + ' 層碎甲';
      case 'cycle_vuln':  return '💔 攻速易傷：半徑 ' + p.radius + ' 格，每次攻擊 +' + p.stacksPerCycle + ' 層易傷';
      case 'cycle_burn':  return '🔥 攻速灼燒：半徑 ' + p.radius + ' 格，每次攻擊施加灼燒 ' + Math.round(p.dot*100) + '% ATK × ' + p.dur + 's';
      case 'killGold': return '💰 擊殺獎金：+' + Math.round(p.bonus * 100) + '%';
      case 'unstable': return '🎲 不穩定：傷害 ±' + Math.round(p.variance * 100) + '%';
      case 'permaBuff': return '⭐ 永久強化：每擊殺 +' + p.atkPerKill + ' ATK';
      case 'wealthScale': return `💰 財富積累：持有每 ${p.divisor}g = +1 傷害（上限 +${p.cap}），花錢後傷害即時下降`;
      case 'interest':    return `📈 利息：每波結算時獲得持有金幣 × ${(p.rate*100).toFixed(0)}%（上限 ${p.cap}g，直接加金）`;
      case 'regen':    return '♻️ 再生：每秒 ' + Math.round(p.pct * 100) + '% HP';
      case 'armorStack': return '🛡️ 護甲成長：+' + p.perHit + '/次（最多 +' + p.cap + '）';
      case 'enrage':   return '😡 狂暴：HP < ' + Math.round(p.hpThreshold * 100) + '% → 速度 ×' + p.spdMult;
      case 'shield':   return '🛡️ 護盾：' + p.amt + ' 點' + (p.regen ? '（+' + p.regen + '/s）' : '');
      case 'charge':   return '💨 衝鋒：' + p.dur + 's 內速度 ×' + p.spdMult;
      case 'tenacity': return '💪 韌性：CC -' + Math.round(p.ccReduce * 100) + '%';
      case 'dodge':    return '👤 閃避：' + Math.round(p.chance * 100) + '%';
      case 'blink':    return '⚡ 閃現：HP < ' + Math.round(p.hpTrigger * 100) + '% → 前進 ' + p.dist + ' 格';
      case 'splitOnDeath': return '💀 分裂：死亡 → ' + p.count + ' 個（HP ×' + p.hpRatio + '）';
      case 'antiElement': return '🔄 元素適應：同元素連攻傷害 -' + Math.round(p.reduce * 100) + '%';
      case 'stealth':  return '👻 隱身：每 ' + p.cd + 's 隱身 ' + p.dur + 's';
      case 'fortify':  return '🏰 堅固：單次傷害上限 ' + p.dmgCap;
      case 'resilient': return '🔰 不屈：每被攻擊 -' + Math.round(p.stack * 100) + '%（上限 -' + Math.round(p.cap * 100) + '%）';
      default:         return def.name;
    }
  }).join('\n');
}

// 簡短版（一行）
function getSkillBrief(skills) {
  if (!skills || skills.length === 0) return '';
  return skills.filter(function(s) { return s.type !== 'tenacity'; }).map(function(s) {
    var def = SKILL_DEFS[s.type];
    if (!def) return s.type;
    var p = { ...def.defaults, ...s.params };
    switch (s.type) {
      case 'burn':     return '灼燒' + Math.round(p.dot * 100) + '%';
      case 'ignite':   return '引燃' + Math.round(p.flat * 100) + '%';
      case 'detonate': return '引爆' + Math.round(p.ratio * 100) + '%' + (p.aoe ? ' AOE' + p.aoe : '');
      case 'chain':    return '連鎖×' + p.targets;
      case 'execute':  return '斬殺<' + Math.round(p.threshold * 100) + '%';
      case 'hpPct':    return '%HP' + Math.round(p.pct * 100) + '%';
      case 'lifedrain': return '汲取' + Math.round(p.pct * 100) + '%';
      case 'chill':    return '冰冷 +' + (p.stacksPerHit||1) + '層';
      case 'freeze':   return '冰凍' + p.dur + 's';
      case 'warp':     return '扭曲' + p.dur + 's';
      case 'knockback': return '擊退' + p.dist + '格';
      case 'shred':        return `碎甲+${p.stacksPerHit}層`;
      case 'vulnerability': return `易傷+${p.stacksPerHit}層`;
      case 'ramp':     return '連攻加速+' + Math.round(p.perHit * 100) + '%';
      case 'aura_dmg': return '傷害光環';
      case 'aura_atkSpd': return '攻速光環+' + Math.round(p.bonus * 100) + '%';
      case 'aura_range': return '射程光環+' + p.bonus;
      case 'multishot': return p.every + '連射+擊殺加速';
      case 'multiArrow': return `多重箭×${p.shots}`;
      case 'pierce':   return '穿透×' + (p.count ?? 3) + '，−' + Math.round(p.dmgDown * 100) + '%/體';
      case 'zone_slow':  return '減速領域r' + p.radius;
      case 'zone_shred': return '碎甲領域r' + p.radius;
      case 'field_slow':  return '減速場 r' + p.radius;
      case 'field_shred': return '碎甲場 r' + p.radius;
      case 'field_vuln':  return '易傷場 r' + p.radius;
      case 'field_stun':  return '暈眩脈衝 ' + p.dur + 's/cd' + p.cd;
      case 'field_burn':  return '灼燒場 r' + p.radius;
      case 'field_dmg':   return '傷害脈衝 r' + p.radius;
      case 'cycle_stun':  return '攻速暈眩 ' + p.dur + 's';
      case 'cycle_chill': return '攻速冰冷 ×' + p.stacksPerCycle;
      case 'cycle_shred': return '攻速碎甲 ×' + p.stacksPerCycle;
      case 'cycle_vuln':  return '攻速易傷 ×' + p.stacksPerCycle;
      case 'cycle_burn':  return '攻速灼燒 r' + p.radius;
      case 'killGold': return '獎金+' + Math.round(p.bonus * 100) + '%';
      case 'unstable': return '不穩定±' + Math.round(p.variance * 100) + '%';
      case 'permaBuff': return '永強+' + p.atkPerKill;
      case 'wealthScale': return `💰 財富積累`;
      case 'interest':    return `📈 利息`;
      case 'regen':    return '再生' + Math.round(p.pct * 100) + '%';
      case 'armorStack': return '護甲+' + p.perHit;
      case 'enrage':   return '狂暴×' + p.spdMult;
      case 'shield':   return '護盾' + p.amt;
      case 'charge':   return '衝鋒×' + p.spdMult;
      case 'dodge':    return '閃避' + Math.round(p.chance * 100) + '%';
      case 'blink':    return '閃現' + p.dist + '格';
      case 'splitOnDeath': return '分裂×' + p.count;
      case 'antiElement': return '元素適應';
      case 'stealth':  return '隱身' + p.dur + 's';
      case 'fortify':  return '堅固≤' + p.dmgCap;
      case 'resilient': return '不屈-' + Math.round(p.stack * 100) + '%';
      default:         return def.name;
    }
  }).join(' ');
}
