// ============================================================
// WAVE DEFINITIONS
// skills[]：技能配置，Boss isBoss 保留（視覺用），韌性為 tenacity 技能
// ============================================================
const WAVES = [
  // ═══ 第一章：基礎塔期 (W1-4) ═══ 無元素、無技能，教學期。W3 後選元素。
  { name: '普通小兵', count: 8, hp: 55, speed: 1, armor: 0, resist: {}, skills: [], color: '#888', icon: '👾', killGold: 4 },
  { name: '量多斥候', count: 14, hp: 35, speed: 1, armor: 0, resist: {}, skills: [], color: '#6c6', icon: '🐀', killGold: 3 },
  { name: '輕甲兵', count: 8, hp: 80, speed: 1, armor: 0.15, resist: {}, skills: [], color: '#999', icon: '🛡️', killGold: 5 },
  { name: '鐵甲衛士', count: 2, hp: 400, speed: 0.8, armor: 0.25, resist: {}, skills: [makeSkill('regen',{pct:0.02}), makeSkill('tenacity',{ccReduce:0.25})], color: '#aa8', icon: '🐻', isBoss: true, killGold: 30, dmgToBase: 5 },

  // ═══ 第二章：1 元素期 (W5-8) ═══ W6 後選第 2 元素
  { name: '元素斥候', count: 12, hp: 100, speed: 1, armor: 0, resist: {}, skills: [], color: '#9c9', elem: 'fire', icon: '🐺', killGold: 6 },
  { name: '水抗再生兵', count: 8, hp: 220, speed: 1, armor: 0, resist: {water:0.4}, skills: [makeSkill('regen',{pct:0.02})], color: '#4cc', elem: 'wind', icon: '🧟', killGold: 8 },
  { name: '風抗快攻群', count: 14, hp: 140, speed: 1, armor: 0, resist: {wind:0.4}, skills: [], color: '#9e9', elem: 'water', icon: '🐗', killGold: 5 },
  { name: '熔岩巨像', count: 2, hp: 1000, speed: 0.7, armor: 0.3, resist: {}, skills: [makeSkill('regen',{pct:0.025}), makeSkill('tenacity',{ccReduce:0.35})], color: '#c64', elem: 'fire', icon: '🐲', isBoss: true, killGold: 60, dmgToBase: 8 },

  // ═══ 第三章：2 元素期 (W9-12) ═══ W9 後選第 3 元素，W12 後選第 4 元素
  { name: '雙抗精銳', count: 10, hp: 300, speed: 1, armor: 0.1, resist: 'random_dual', skills: [], color: '#c6c', icon: '🦇', killGold: 8 },
  { name: '狂暴群', count: 16, hp: 250, speed: 1, armor: 0, resist: {}, skills: [makeSkill('enrage',{hpThreshold:0.3,spdMult:2})], color: '#c44', elem: 'wind', icon: '😡', killGold: 6 },
  { name: '重甲雙抗', count: 8, hp: 500, speed: 1, armor: 0.3, resist: 'random_dual', skills: [makeSkill('armorStack',{perHit:0.1,cap:0.5})], color: '#88a', elem: 'water', icon: '🐢', killGold: 10 },
  { name: '深淵領主', count: 1, hp: 2500, speed: 0.6, armor: 0.2, resist: 'random_dual', skills: [makeSkill('regen',{pct:0.02}), makeSkill('armorStack',{perHit:0.1,cap:0.5}), makeSkill('tenacity',{ccReduce:0.5})], color: '#a4c', icon: '👿', isBoss: true, killGold: 100, dmgToBase: 15 },

  // ═══ 第四章：3 元素期 (W13-16) ═══ 全面被動，高壓
  { name: '全抗衛兵', count: 10, hp: 450, speed: 1, armor: 0.15, resist: {fire:0.25,water:0.25,earth:0.25,wind:0.25,thunder:0.25}, skills: [], color: '#aaa', icon: '🗿', killGold: 10 },
  { name: '再生全抗', count: 10, hp: 550, speed: 1, armor: 0.1, resist: {fire:0.3,water:0.3,earth:0.3,wind:0.3,thunder:0.3}, skills: [makeSkill('regen',{pct:0.02})], color: '#8c8', icon: '🌿', killGold: 12 },
  { name: '重裝先鋒', count: 8, hp: 700, speed: 1, armor: 0.25, resist: 'random_dual', skills: [makeSkill('armorStack',{perHit:0.1,cap:0.5}), makeSkill('enrage',{hpThreshold:0.3,spdMult:2})], color: '#a88', elem: 'fire', icon: '🏰', killGold: 14 },
  { name: '鋼鐵巨獸', count: 1, hp: 4000, speed: 0.5, armor: 0.25, resist: {fire:0.2,water:0.2,earth:0.2,wind:0.2,thunder:0.2}, skills: [makeSkill('regen',{pct:0.02}), makeSkill('armorStack',{perHit:0.1,cap:0.5}), makeSkill('enrage',{hpThreshold:0.3,spdMult:2}), makeSkill('tenacity',{ccReduce:0.5})], color: '#888', icon: '🦾', isBoss: true, killGold: 150, dmgToBase: 20 },

  // ═══ 第五章：全開期 (W17-20) ═══ 極限壓力
  { name: '狂暴風潮', count: 18, hp: 500, speed: 1, armor: 0, resist: 'random', skills: [makeSkill('enrage',{hpThreshold:0.3,spdMult:2})], color: '#c44', elem: 'wind', icon: '🌪️', killGold: 12 },
  { name: '深海雙抗', count: 10, hp: 850, speed: 1, armor: 0.3, resist: 'random_dual', skills: [makeSkill('regen',{pct:0.02})], color: '#48a', elem: 'water', icon: '🐙', killGold: 16 },
  { name: '全抗再生', count: 12, hp: 800, speed: 1, armor: 0.15, resist: {fire:0.35,water:0.35,earth:0.35,wind:0.35,thunder:0.35}, skills: [makeSkill('regen',{pct:0.02}), makeSkill('armorStack',{perHit:0.1,cap:0.5})], color: '#8c8', icon: '🌳', killGold: 14 },
  { name: '終焉之王', count: 1, hp: 7000, speed: 0.4, armor: 0.3, resist: {fire:0.25,water:0.25,earth:0.25,wind:0.25,thunder:0.25}, skills: [makeSkill('regen',{pct:0.02}), makeSkill('armorStack',{perHit:0.1,cap:0.5}), makeSkill('enrage',{hpThreshold:0.3,spdMult:2}), makeSkill('tenacity',{ccReduce:0.5})], color: '#c8c', icon: '💀', isBoss: true, killGold: 200, dmgToBase: 30 },
];

// W3, W6, W9, W12 過關後選元素（共 4 次）
const ELEM_WAVES = [3, 6, 9, 12];
