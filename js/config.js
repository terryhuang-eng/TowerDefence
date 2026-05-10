// ============================================================
// CONFIG — 所有可調數值集中於此
// ============================================================
const CONFIG = {
  startGold: 230,
  startHP: 40,
  baseIncome: 50,
  towerCost: 50,       // Lv1 塔放置費用（統一）

  // 擊殺獎勵
  // killGold 改為每隻怪獨立定義在 WAVES 中（killGold 欄位）
  killGoldAiSend: 3,   // AI 送兵擊殺金（固定，不成長）

  // 難度設定（波次倍率 + AI 數值整合）
  difficulty: {
    x1: { label: '×1 普通', hpMult: 1.0, countMult: 1.0, aiHp: 100, aiBaseIncome: 50, aiStartGold: 300, aiTowerCost: 50, aiMaxTowers: 8 },
    x2: { label: '×2 困難', hpMult: 1.5, countMult: 1.3, aiHp: 150, aiBaseIncome: 60, aiStartGold: 400, aiTowerCost: 50, aiMaxTowers: 10 },
    x3: { label: '×3 地獄', hpMult: 2.5, countMult: 1.6, aiHp: 200, aiBaseIncome: 70, aiStartGold: 550, aiTowerCost: 50, aiMaxTowers: 12 },
  },

  // 元素相剋（五角環：火→水→土→風→雷→火，無不參與）
  elemAdv: {
    fire:    { water: 1.3, thunder: 0.7 },
    water:   { earth: 1.3, fire: 0.7 },
    earth:   { wind: 1.3, water: 0.7 },
    wind:    { thunder: 1.3, earth: 0.7 },
    thunder: { fire: 1.3, wind: 0.7 },
  },

  gridCols: 20,
  gridRows: 10,
  totalWaves: 20,

  // 精華系統（Phase 3）
  essenceLv6Threshold: 100,           // 單元素精華門檻（解鎖 Lv6 升級）
  essenceMilestones: [200, 350, 500], // 總精華里程碑（送兵 HP 加成）
  essenceMilestoneBonus: 0.15,        // 每段里程碑送兵 HP 加成

  // 啟用元素（由 skill-editor 匯出，預設全開）
  // 若未定義則遊戲自動 fallback 至 ELEM_KEYS（全部元素）
  activeElems: null,   // null = 全開（等同 ELEM_KEYS）
};
