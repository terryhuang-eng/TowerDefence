// ============================================================
// INCOME SENDS — LTW 式送兵系統（6 階）
// 每種兵有獨立配額，每波重置。quota 每 2 波一階（共 10 階）
// v7: skills[] 技能配置
// ============================================================
const INCOME_SENDS = [
  //                                                                                                                                       W1-2 W3-4 W5-6 W7-8 W9-10 W11-12 W13-14 W15-16 W17-18 W19-20
  { id: 'scout', name: '斥候', icon: '🏃', cost: 10, income: 3, count: 3, hp: 90, speed: 1, armor: 0, dmgToBase: 1, color: '#4c8', desc: '便宜量多', skills: [], quota: [5,6,8,9,11,12,14,15,16,18] },
  { id: 'warrior', name: '戰士', icon: '⚔️', cost: 35, income: 5, count: 2, hp: 350, speed: 1, armor: 0.1, dmgToBase: 2, color: '#8a8', desc: '扛傷型', skills: [], quota: [0,2,3,4,4,5,6,7,8,9] },
  { id: 'knight', name: '騎士', icon: '🛡️', cost: 120, income: 14, count: 2, hp: 700, speed: 1, armor: 0.2, dmgToBase: 3, color: '#aaa', desc: '重甲衝鋒', skills: [makeSkill('charge',{spdMult:2,dur:1.5})], quota: [0,1,2,3,4,5,5,6,7,8] },
  { id: 'mage', name: '法師', icon: '🔮', cost: 200, income: 20, count: 1, hp: 1200, speed: 1, armor: 0, dmgToBase: 5, color: '#c6c', desc: '護盾', skills: [makeSkill('shield',{amt:80,regen:0})], quota: [0,0,0,1,1,2,2,3,4,5] },
  { id: 'elite', name: '精銳', icon: '💀', cost: 320, income: 28, count: 1, hp: 1900, speed: 1, armor: 0.15, dmgToBase: 8, color: '#c84', desc: '狂暴', skills: [makeSkill('enrage',{hpThreshold:0.5,spdMult:1.5})], quota: [0,0,0,0,1,1,1,2,3,4] },
  { id: 'champion', name: '霸者', icon: '👑', cost: 520, income: 40, count: 1, hp: 2800, speed: 1, armor: 0.2, dmgToBase: 12, color: '#e94560', desc: '韌性', skills: [makeSkill('tenacity',{ccReduce:0.5})], quota: [0,0,0,0,0,0,1,1,2,3] },
];

// 取得某兵種在某波次的配額（每 2 波一階，共 10 階）
function getSendQuota(sendId, wave) {
  var s = INCOME_SENDS.find(function(s) { return s.id === sendId; });
  if (!s) return 0;
  var tier = Math.min(9, Math.floor((wave - 1) / 2));
  return s.quota[tier];
}

// ============================================================
// AI SENDS — AI 花金幣送兵攻擊玩家
// ============================================================
const AI_SENDS = [
  { id: 'scout', name: '斥候', icon: '🏃', cost: 10, income: 3, count: 3,
    enemy: { hp: 90, speed: 1, armor: 0, resist: {}, skills: [], color: '#4c8', dmgToBase: 1 }},
  { id: 'warrior', name: '戰士', icon: '⚔️', cost: 35, income: 5, count: 2,
    enemy: { hp: 350, speed: 1, armor: 0.1, resist: {}, skills: [], color: '#8a8', dmgToBase: 2 }},
  { id: 'knight', name: '騎士', icon: '🛡️', cost: 120, income: 14, count: 2,
    enemy: { hp: 700, speed: 1, armor: 0.2, resist: {}, skills: [makeSkill('charge',{spdMult:2,dur:1.5})], color: '#aaa', dmgToBase: 3 }},
  { id: 'mage', name: '法師', icon: '🔮', cost: 200, income: 20, count: 1,
    enemy: { hp: 1200, speed: 1, armor: 0, resist: {}, skills: [makeSkill('shield',{amt:80,regen:0})], color: '#c6c', dmgToBase: 5 }},
  { id: 'elite', name: '精銳', icon: '💀', cost: 320, income: 28, count: 1,
    enemy: { hp: 1900, speed: 1, armor: 0.15, resist: {}, skills: [makeSkill('enrage',{hpThreshold:0.5,spdMult:1.5})], color: '#c84', dmgToBase: 8 }},
  { id: 'champion', name: '霸者', icon: '👑', cost: 520, income: 40, count: 1,
    enemy: { hp: 2800, speed: 1, armor: 0.2, resist: {}, skills: [makeSkill('tenacity',{ccReduce:0.5})], color: '#e94560', dmgToBase: 12 }},
];
