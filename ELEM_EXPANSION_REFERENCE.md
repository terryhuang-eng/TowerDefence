# 3→6 元素擴展：快速參考表

## 檔案改動清單（詳細版）

### js/config.js

```javascript
// 現狀（行 21-26）
elemAdv: {
  fire:  { wind: 1.3, water: 0.7 },
  water: { fire: 1.3, wind: 0.7 },
  wind:  { water: 1.3, fire: 0.7 },
}

// 改動方案（6×6 相剋矩陣）
elemAdv: {
  fire:  { wind: 1.3, earth: 0.7, light: 1.2, dark: 0.8, water: 0.7 },
  water: { fire: 1.3, dark: 0.7, earth: 1.2, light: 0.8, wind: 0.7 },
  wind:  { water: 1.3, light: 0.7, dark: 1.2, earth: 0.8, fire: 0.7 },
  earth: { wind: 1.3, light: 0.7, fire: 1.2, dark: 0.8, water: 0.7 },
  light: { dark: 1.3, earth: 0.7, water: 1.2, fire: 0.8, wind: 0.7 },
  dark:  { light: 1.3, water: 0.7, wind: 1.2, earth: 0.8, fire: 0.7 }
}
```

**行數**：21-26  
**改動量**：6 行 → 11 行（新增 5 個元素）

---

### js/towers.js

#### 部分 1：ELEM + ELEM_KEYS（行 4-9）

```javascript
// 現狀
const ELEM = {
  fire:  { name: '火', color: '#ff6b35', icon: '🔥' },
  water: { name: '水', color: '#4ecdc4', icon: '💧' },
  wind:  { name: '風', color: '#95e1d3', icon: '🌪️' },
};
const ELEM_KEYS = ['fire', 'water', 'wind'];

// 改動
const ELEM = {
  fire:  { name: '火', color: '#ff6b35', icon: '🔥' },
  water: { name: '水', color: '#4ecdc4', icon: '💧' },
  wind:  { name: '風', color: '#95e1d3', icon: '🌪️' },
  earth: { name: '土', color: '#a68642', icon: '⛰️' },
  light: { name: '聖', color: '#ffff00', icon: '✨' },
  dark:  { name: '暗', color: '#8b2fa7', icon: '⚫' },
};
const ELEM_KEYS = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
```

**行數**：4-9  
**改動量**：9 行 → 17 行  
**影響**：這是 **關鍵改動**，所有其他地方都依賴此定義

#### 部分 2：TOWERS（行 35-63）

新增 3 個元素塔定義，位置在 wind 之後：

```javascript
  earth: {
    name: '大地守衛', icon: '⛰️', elem: 'earth',
    levels: [
      { damage: 32, atkSpd: 0.9, range: 3, aoe: 0, cost: 50, skills: [], desc: '基礎土塔' },
      { damage: 46, atkSpd: 1.0, range: 3, aoe: 0, cost: 80, skills: [], desc: '傷害+護甲增強' },
      null,
      null,
    ],
  },
  light: {
    name: '聖光衛士', icon: '✨', elem: 'light',
    levels: [
      { damage: 25, atkSpd: 1.2, range: 3.2, aoe: 0, cost: 50, skills: [], desc: '基礎聖塔' },
      { damage: 38, atkSpd: 1.4, range: 3.2, aoe: 0, cost: 80, skills: [], desc: '超高攻速' },
      null,
      null,
    ],
  },
  dark: {
    name: '暗影掠奪', icon: '⚫', elem: 'dark',
    levels: [
      { damage: 30, atkSpd: 1.1, range: 2.8, aoe: 0, cost: 50, skills: [], desc: '基礎暗塔' },
      { damage: 44, atkSpd: 1.2, range: 2.8, aoe: 0, cost: 80, skills: [], desc: '吸血型傷害' },
      null,
      null,
    ],
  },
```

**行數**：35-63 → 新增 35 行  
**改動量**：中等（複製 3 次基本結構）

#### 部分 3：INFUSIONS（行 71-138）

現有結構（行 72-137）：
```
fire/water/wind 各有 3 個注入（fire/water/wind）
= 9 個分支，每個分支有 lv3/lv4（部分有 lv5）
```

新增結構：
```
新增 fire/water/wind 各 3 個注入（earth/light/dark）
新增 earth/light/dark 各 6 個注入（全部元素）
= 從 9 → 36 個分支
```

**新增內容樣板**：

```javascript
  earth: {
    fire: {
      name: '熔岩地心', icon: '⛰️🔥',
      lv3: { damage: 50, atkSpd: 0.95, range: 3, aoe: 0.8, cost: 150, 
             desc: '灼燒土盾（DOT 20%，護甲 +0.1）',
             skills: [makeSkill('burn', {dot:0.20}), ...] },
      lv4: { damage: 68, atkSpd: 1.0, range: 3, aoe: 1.0, cost: 250,
             desc: '熔岩地焰（DOT 25%，護甲 +0.15）',
             skills: [makeSkill('burn', {dot:0.25}), ...] }
    },
    water: { /* ... */ },
    wind: { /* ... */ },
    earth: { /* ... */ },
    light: { /* ... */ },
    dark: { /* ... */ }
  },
  light: { /* 6 分支 */ },
  dark: { /* 6 分支 */ }
```

**行數**：71-138 → 新增 ~300 行（27 個新分支 × 10-15 行/分支）  
**改動量**：★★★ 最大（主要工作量來自於此）

#### 部分 4：ELEM_BASE（行 144-163）

新增 6 種新塔（earth/light/dark 各 × 2 基底）：

```javascript
  earth: {
    arrow:  { name: '土弓手', icon: '🏹⛰️', damage: 38, atkSpd: 1.0, range: 3.2, aoe: 0, cost: 130, 
              desc: '堅韌防守', skills: [] },
    cannon: { name: '土砲台', icon: '💣⛰️', damage: 48, atkSpd: 0.7, range: 3.0, aoe: 1.2, cost: 130, 
              desc: '重型覆蓋', skills: [] }
  },
  light: {
    arrow:  { name: '聖弓手', icon: '🏹✨', damage: 32, atkSpd: 1.4, range: 3.5, aoe: 0, cost: 130, 
              desc: '治癒射手', skills: [makeSkill('lifedrain', {pct:0.10})] },
    cannon: { name: '聖砲台', icon: '💣✨', damage: 42, atkSpd: 0.9, range: 3.0, aoe: 1.0, cost: 130, 
              desc: '聖光淨化', skills: [makeSkill('lifedrain', {pct:0.10})] }
  },
  dark: {
    arrow:  { name: '暗弓手', icon: '🏹⚫', damage: 35, atkSpd: 1.3, range: 3.3, aoe: 0, cost: 130, 
              desc: '吸血箭', skills: [makeSkill('lifedrain', {pct:0.15})] },
    cannon: { name: '暗砲台', icon: '💣⚫', damage: 45, atkSpd: 0.8, range: 3.0, aoe: 1.1, cost: 130, 
              desc: '生命掠奪', skills: [makeSkill('lifedrain', {pct:0.15})] }
  }
```

**行數**：144-163 → 新增 18 行  
**改動量**：小（複製 3×2 = 6 個基本單位）

---

### js/waves.js

#### 改動位置

**行 6-34**：檢查 `elem` 欄位的怪物

現狀：
- 第 6 波：elem: 'fire'
- 第 7 波：elem: 'wind'
- 第 8 波：elem: 'water'
- 第 16 波：elem: 'fire'
- 第 18 波：elem: 'wind'
- 第 19 波：elem: 'water'

建議改動：
- 新增第 9, 10, 11, 12 波中帶有 earth/light/dark 屬性的怪物
- 或修改現有怪物的 elem 為新元素

**例**：
```javascript
// 第 9 波（新增土系怪）
{ name: '土盾戰士', count: 10, hp: 350, speed: 1.0, armor: 0.15, resist: {}, 
  skills: [], color: '#8a7', elem: 'earth', icon: '🛡️', killGold: 10 }

// 第 13 波（新增聖光怪）
{ name: '聖光哨兵', count: 12, hp: 280, speed: 1.0, armor: 0, resist: {},
  skills: [], color: '#ffd', elem: 'light', icon: '⚡', killGold: 8 }

// 第 18 波（修改為暗系怪）
{ name: '暗影騎兵', count: 8, hp: 600, speed: 1.0, armor: 0.2, resist: {},
  skills: [makeSkill('enrage')], color: '#6a2', elem: 'dark', icon: '👾', killGold: 14 }
```

**改動量**：小（修改 3-4 行或新增 3 個怪物定義）

---

### js/game.js

#### 改動 1：elemPicks 初始化（行 16）

**現狀**：
```javascript
this.elemPicks = { fire: 0, water: 0, wind: 0 };
```

**改動**（推薦方案）：
```javascript
// 方案 A：明確迴圈
this.elemPicks = {};
for (const e of ELEM_KEYS) {
  this.elemPicks[e] = 0;
}

// 方案 B：一行（推薦）
this.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
```

**行數**：16（1 行 → 1 行）  
**改動量**：★ 最小（但最關鍵）

#### 改動 2：AI 元素 picks 初始化（位置待查）

應在 GameState 初始化中，新增：
```javascript
// 搜尋 aiElemPicks 的定義位置（應在 ~1400-1500 行）
this.aiElemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
```

**改動量**：★ 最小

#### 改動 3：隨機抗性處理（位置待查）

搜尋 `resist: 'random'` 或 `resist: 'random_dual'` 的處理邏輯

應改為動態選擇元素：
```javascript
// 偽代碼
if (w.resist === 'random') {
  const elem = ELEM_KEYS[Math.floor(Math.random() * ELEM_KEYS.length)];
  resistDict = { [elem]: 0.4 };
} else if (w.resist === 'random_dual') {
  const [e1, e2] = ELEM_KEYS.sort(() => Math.random() - 0.5).slice(0, 2);
  resistDict = { [e1]: 0.3, [e2]: 0.3 };
}
```

**改動量**：小

#### 無需改動的部分 ✅

- 行 1206：`for (const [atk, advMap] of Object.entries(CONFIG.elemAdv))`
- 行 1997：相剋計算邏輯
- 行 2005：弱點計算邏輯
- 行 2118：`CONFIG.elemAdv[elem][enemy.elem]` 相剋查詢
- 行 1127：`for (const ek of ELEM_KEYS)` 元素選擇卡片迴圈
- 行 1472：`ELEM_KEYS[Math.floor(...)]` 隨機元素選擇

→ **全部已動態化，無需改動** ✅

---

### js/skills.js

#### 改動（可選）

**行 62**：antiElement 技能定義
```javascript
antiElement: { category: 'enemy', group: 'passive', name: '元素適應', 
               defaults: { reduce: 0.3 }, desc: '同元素連攻時該元素傷害 -reduce' }
```

**無需改動**。邏輯：`lastHitTower.elem === enemy.elem` 與元素數量無關。

**可選**：新增 3 個元素特性技能
```javascript
// 可選擴充（在 SKILL_DEFS 中新增）
antiEarth: { ... },    // 土元素適應
antiLight: { ... },    // 聖光適應
antiDark: { ... }      // 暗影適應
```

---

### index.html

**無需改動** ✅

- 行 127-141：reward-overlay 由 game.js 動態生成
- 行 317-322：元素持有面板由 game.js 動態生成
- 行 414：說明文字保留有效
- 行 220-224：.elem-tag 樣式通用

---

### skill-editor.html

**檢查項目**（可能需改動）：

搜尋 `<script>` 內是否有硬編碼元素選項：
```javascript
// 如有以下程式碼
for (const e of ['fire', 'water', 'wind']) { ... }

// 改為
for (const e of ELEM_KEYS) { ... }
```

**預計改動**：0-3 行

---

## 新增元素屬性速查表

| 元素 | 中文 | 圖示 | 顏色 | RGB | 類型 | 基礎特性 |
|------|------|------|------|-----|------|---------|
| fire | 火 | 🔥 | #ff6b35 | rgb(255,107,53) | 攻擊 | 灼燒、引爆 |
| water | 水 | 💧 | #4ecdc4 | rgb(78,205,196) | 控制 | 冰冷、冰凍 |
| wind | 風 | 🌪️ | #95e1d3 | rgb(149,225,211) | 敏捷 | 穿透、連射 |
| earth | 土 | ⛰️ | #a68642 | rgb(166,134,66) | 防守 | 護甲、減傷 |
| light | 聖 | ✨ | #ffff00 | rgb(255,255,0) | 治癒 | 回血、淨化 |
| dark | 暗 | ⚫ | #8b2fa7 | rgb(139,47,167) | 吸血 | 汲取、詛咒 |

---

## 相剋矩陣速查（建議方案）

|  → / ↓ | 火 | 水 | 風 | 土 | 聖 | 暗 |
|--------|----|----|----|----|----|----|
| **火** | 1.0 | 0.7 | 1.3 | 0.7 | 1.2 | 0.8 |
| **水** | 1.3 | 1.0 | 0.7 | 1.2 | 0.8 | 0.7 |
| **風** | 0.7 | 1.3 | 1.0 | 0.8 | 0.7 | 1.2 |
| **土** | 1.2 | 0.7 | 1.3 | 1.0 | 0.7 | 0.8 |
| **聖** | 0.8 | 1.2 | 0.7 | 1.3 | 1.0 | 0.7 |
| **暗** | 0.7 | 0.8 | 1.2 | 0.7 | 1.3 | 1.0 |

**讀法**：橫軸（攻擊方）× 縱軸（防守方）  
例：火系塔攻擊風系敵人 = 1.3x 克制加傷

---

## 資料數量對比

| 項目 | 3 元素 | 6 元素 | 增幅 |
|------|--------|--------|------|
| ELEM_KEYS | 3 | 6 | ×2 |
| TOWERS | 3 | 6 | ×2 |
| ELEM_BASE（基底×2） | 6 | 12 | ×2 |
| INFUSIONS（基底×注入） | 9 | 36 | ×4 |
| INFUSIONS 總行數（est.） | ~70 | ~350 | ×5 |
| elemAdv 查詢次數 | 無變化 | 無變化 | ✅ 優化 |

---

## 完整改動清單（快速復核）

```
[ ] 1. js/towers.js 行 4-9：ELEM + ELEM_KEYS → +8 行
[ ] 2. js/towers.js 行 35-63：TOWERS → +35 行
[ ] 3. js/towers.js 行 71-138：INFUSIONS → +300 行（主要工作）
[ ] 4. js/towers.js 行 144-163：ELEM_BASE → +18 行
[ ] 5. js/config.js 行 21-26：elemAdv → +5 行
[ ] 6. js/game.js 行 16：elemPicks 初始化 → 改寫 1 行
[ ] 7. js/game.js：aiElemPicks 初始化 → 新增 1 行
[ ] 8. js/game.js：隨機抗性邏輯 → 改寫 2-3 行
[ ] 9. js/waves.js：新增/修改怪物 elem → ±3-5 行
[✅] 10. index.html：無改動
[✅] 11. js/skills.js：無強制改動
[✅] 12. skill-editor.html：檢查，可能無改動
```

---

**預估改動總量**：~380 行（其中 ~330 行在 INFUSIONS）  
**最複雜部分**：INFUSIONS 分支設計（需要數值平衡）  
**最容易出錯**：elemPicks 初始化（如忘改會導致遊戲 crash）
