# 塔防專案：3→6 元素擴展改動清單

**時間**：2026-04-25  
**目標**：從 3 元素（火/水/風）擴展到 6 元素系統  
**狀態**：規劃階段（尚未實施）

---

## 目錄
1. [js/config.js 改動](#jsconfigjs-改動)
2. [js/towers.js 改動](#jstowersjs-改動)
3. [js/waves.js 改動](#jswavesjs-改動)
4. [js/sends.js 改動](#jssends.js-改動)
5. [js/skills.js 改動](#jsskillsjs-改動)
6. [js/game.js 改動](#jsgamejs-改動)
7. [index.html 改動](#indexhtml-改動)
8. [skill-editor.html 改動](#skill-editorhtml-改動)

---

## js/config.js 改動

### 現狀
- **行 1-8**：文件標頭
- **行 4-31**：CONFIG 物件
  - **行 21-26**：`elemAdv` 相剋表（3×3 三角）
    ```javascript
    elemAdv: {
      fire:  { wind: 1.3, water: 0.7 },
      water: { fire: 1.3, wind: 0.7 },
      wind:  { water: 1.3, fire: 0.7 },
    }
    ```

### 擴展需求

#### 1. 元素常數定義
**位置**：config.js 頂部（新增或移至 towers.js）

新增 6 個元素的常數（建議保留在 towers.js 中）：
```javascript
const ELEM_KEYS = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
```

**替代方案**：保持在 towers.js 的 ELEM 常數旁邊。

#### 2. elemAdv 相剋表擴展
**行 21-26**：需從 3×3 matrix 擴展到 6×6

現有三角形（火→風→水→火的循環）：
- fire 克 wind（1.3×）
- water 克 fire（1.3×）
- wind 克 water（1.3×）

**方案 A：擴展為兩個三角（建議）**
```javascript
elemAdv: {
  fire:  { wind: 1.3, earth: 0.7, light: 1.2, dark: 0.8, water: 0.7 },
  water: { fire: 1.3, dark: 0.7, earth: 1.2, light: 0.8, wind: 0.7 },
  wind:  { water: 1.3, light: 0.7, dark: 1.2, earth: 0.8, fire: 0.7 },
  earth: { wind: 1.3, light: 0.7, fire: 1.2, dark: 0.8, water: 0.7 },
  light: { dark: 1.3, earth: 0.7, water: 1.2, fire: 0.8, wind: 0.7 },
  dark:  { light: 1.3, water: 0.7, wind: 1.2, earth: 0.8, fire: 0.7 }
}
```

**hardcoded 假設檢查**：
- 無硬編碼假設（config.js 不迭代元素）
- 所有元素值都透過 CONFIG.elemAdv 查表

**影響範圍**：
- game.js: 1206 行、1997 行、2005 行、2118 行 — 所有相剋計算都透過 CONFIG.elemAdv 查表，無需改動

---

## js/towers.js 改動

### 現狀
- **行 1-9**：ELEM 常數定義 + ELEM_KEYS
  ```javascript
  const ELEM = {
    fire:  { name: '火', color: '#ff6b35', icon: '🔥' },
    water: { name: '水', color: '#4ecdc4', icon: '💧' },
    wind:  { name: '風', color: '#95e1d3', icon: '🌪️' },
  };
  const ELEM_KEYS = ['fire', 'water', 'wind'];
  ```
- **行 14-30**：BASIC_TOWERS（箭塔/砲塔，無元素）— 無需改動
- **行 35-63**：TOWERS（3 種元素塔）
- **行 71-138**：INFUSIONS（元素注入分支，3×3=9 種）
- **行 144-163**：ELEM_BASE（Lv3 元素塔，3元素×2基底=6種）

### 擴展需求

#### 1. ELEM 常數擴展
**行 4-8**：新增 3 個元素定義

```javascript
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

**影響**：所有後續檔案都依賴 ELEM_KEYS 迭代，改動此處會自動串聯所有地方。

#### 2. TOWERS 擴展
**行 35-63**：現有 3 個元素塔定義（各 4 個等級）

新增 3 個元素塔（earth、light、dark）：
```javascript
const TOWERS = {
  fire: { ... },       // 保留
  water: { ... },      // 保留
  wind: { ... },       // 保留
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
};
```

#### 3. INFUSIONS 擴展
**行 71-138**：現有 9 分支（3 基底 × 3 注入）

擴展到 36 分支（6 基底 × 6 注入）：
```javascript
const INFUSIONS = {
  fire: {
    fire: { ... },     // 保留
    water: { ... },    // 保留
    wind: { ... },     // 保留
    earth: { name: '烈岩', ... },
    light: { name: '烈火聖光', ... },
    dark: { name: '烈獄', ... },
  },
  water: { ... /* 新增 earth/light/dark 分支 */ },
  wind: { ... /* 新增 earth/light/dark 分支 */ },
  earth: {
    fire: { name: '熔岩地心', ... },
    water: { name: '泥潭', ... },
    wind: { name: '風蝕峭壁', ... },
    earth: { name: '磐石', ... },
    light: { name: '聖石堡', ... },
    dark: { name: '地獄深淵', ... },
  },
  light: { /* 6 分支 */ },
  dark: { /* 6 分支 */ },
};
```

**估計工作量**：
- 新增 27 個注入分支（每個分支含 lv3/lv4/lv5 三層）
- 需要設計 27 個分支的名稱、數值、技能配置

#### 4. ELEM_BASE 擴展
**行 144-163**：現有 6 種（3 元素 × 2 基底：箭/砲）

擴展到 12 種（6 元素 × 2 基底）：
```javascript
const ELEM_BASE = {
  fire: { ... },      // 保留
  water: { ... },     // 保留
  wind: { ... },      // 保留
  earth: {
    arrow:  { name: '土弓手', icon: '🏹⛰️', damage: 38, atkSpd: 1.0, range: 3.2, aoe: 0, cost: 130, desc: '堅韌防守' },
    cannon: { name: '土砲台', icon: '💣⛰️', damage: 48, atkSpd: 0.7, range: 3.0, aoe: 1.2, cost: 130, desc: '重型覆蓋' },
  },
  light: {
    arrow:  { name: '聖弓手', icon: '🏹✨', damage: 32, atkSpd: 1.4, range: 3.5, aoe: 0, cost: 130, desc: '治癒射手' },
    cannon: { name: '聖砲台', icon: '💣✨', damage: 42, atkSpd: 0.9, range: 3.0, aoe: 1.0, cost: 130, desc: '聖光淨化' },
  },
  dark: {
    arrow:  { name: '暗弓手', icon: '🏹⚫', damage: 35, atkSpd: 1.3, range: 3.3, aoe: 0, cost: 130, desc: '吸血箭' },
    cannon: { name: '暗砲台', icon: '💣⚫', damage: 45, atkSpd: 0.8, range: 3.0, aoe: 1.1, cost: 130, desc: '生命掠奪' },
  },
};
```

**影響**：game.js 中所有透過 ELEM_KEYS 迭代塔的地方都會自動包含新元素。

**hardcoded 檢查**：
- INFUSIONS 的 if 條件（lv5 需要 3 pick 同元素）適用於所有元素，無硬編碼
- TOWERS 裡 Lv3/Lv4 為 null 的設計是通用的

---

## js/waves.js 改動

### 現狀
- **行 5-35**：WAVES 陣列（20 波怪物定義）
  - 第 6 波（元素斥候）：elem: 'fire'
  - 第 7 波：elem: 'wind'
  - 第 8 波：elem: 'water'
  - 第 16 波：elem: 'fire'
  - 第 20 波：無 elem
- **行 37-38**：ELEM_WAVES 定義
  ```javascript
  const ELEM_WAVES = [3, 6, 9, 12];
  ```

### 擴展需求

#### 1. WAVES 陣列中的 elem 欄位
**行 6-34**：檢查所有使用 `elem` 欄位的怪物

現狀怪物元素分配：
- 第 6 波：fire（元素斥候）
- 第 7 波：wind（風抗快攻群）
- 第 8 波：water（水抗再生兵）
- 第 16 波：fire（重裝先鋒）
- 第 18 波：wind（狂暴風潮）
- 第 19 波：water（深海雙抗）

**擴展策略**：
- 保留現有 3 個元素的怪物分配
- 新增後續波次（或從波數不足的章節開始）引入新元素
- **建議**：修改 W9-20 的怪物，融入 earth/light/dark

**具體改動**：
```javascript
// 第 9 波（2元素期 W9-12）：引入新元素
{ name: '土盾戰士', count: 10, hp: 350, speed: 1.0, armor: 0.15, resist: {}, 
  skills: [], color: '#8a7', elem: 'earth', icon: '🛡️', killGold: 10 },

// 第 13 波（3元素期 W13-16）：引入 light/dark
{ name: '聖光哨兵', count: 12, hp: 280, speed: 1.0, armor: 0, resist: {},
  skills: [], color: '#ffd', elem: 'light', icon: '⚡', killGold: 8 },

// 第 18 波（全開期 W17-20）：引入 dark
{ name: '暗影騎兵', count: 8, hp: 600, speed: 1.0, armor: 0.2, resist: {},
  skills: [makeSkill('enrage')], color: '#6a2', elem: 'dark', icon: '👾', killGold: 14 },
```

#### 2. resist 欄位中的元素引用
**行 25、27、28、34**：resist 物件中的硬編碼元素鍵

現狀：
```javascript
resist: {fire:0.25, water:0.25, wind:0.25}  // 行 25, 26, 28, 34
resist: {water:0.4}                          // 行 14
resist: {wind:0.4}                           // 行 15
resist: {fire:0.3, water:0.3, wind:0.3}     // 行 26
```

**改動**：無需改動。resist 鍵會透過 game.js 中的邏輯動態查詢 CONFIG.elemAdv 和 ELEM_KEYS，能自動支援新元素。

### 硬編碼假設檢查
- ✅ `resist: 'random_dual'` 和 `resist: 'random'` — 在 game.js 中動態處理，見下

---

## js/sends.js 改動

### 現狀
- **行 6-14**：INCOME_SENDS 陣列（6 種送兵）
- **行 27-40**：AI_SENDS 陣列（同樣 6 種）
- **行 17-22**：getSendQuota 函數（查詢配額）

### 擴展需求

**無元素相關改動**。
- INCOME_SENDS 和 AI_SENDS 中無 elem 欄位
- 送兵品質由 Lv（共 6 階）和 HP/裝甲/技能決定
- 與元素系統正交

**可選擴展**：未來可考慮讓高階送兵（如霸者）具有元素屬性，但目前不必改動。

---

## js/skills.js 改動

### 現狀
- **行 6-13**：GLOBAL_CAPS（全域技能上限）
- **行 18-66**：SKILL_DEFS（所有技能的 master 登錄表，51 個技能）
- **行 62**：antiElement 技能
  ```javascript
  antiElement: { category: 'enemy', group: 'passive', name: '元素適應', defaults: { reduce: 0.3 }, desc: '同元素連攻時該元素傷害 -reduce' }
  ```

### 擴展需求

#### 1. antiElement 技能（無需改動）
**行 62**：技能邏輯與元素無關，新增元素會自動支援

- 機制：檢查 `lastHitTower.elem === enemy.elem`，與元素數量無關

#### 2. 可選：添加元素相關技能
如果要在新元素中添加特殊技能（如 earth 的「根系吸收」、light 的「淨化」），在 SKILL_DEFS 中新增定義。

**無硬編碼假設**。

---

## js/game.js 改動

### 現狀
此檔案最為複雜，涉及多個系統。以下列出所有與元素相關的位置。

#### 主要掃描結果

**類初始化（行 15-16）**：
```javascript
this.elemPicks = { fire: 0, water: 0, wind: 0 };  // 行 16
```
→ 需改為動態初始化

**元素相關方法**：
- 行 352-395：升級邏輯（getMaxLv、canUpgradeTo）— 使用 ELEM_KEYS，無硬編碼
- 行 420：getAvailableElems() — 使用 ELEM_KEYS，無硬編碼
- 行 425：getTotalPicks() — 動態計算，無硬編碼
- 行 443、448、518、540、584：顏色/圖示查詢 — 透過 ELEM[t] 動態取，無硬編碼

**相剋計算（行 1202-1221、1997-2009、2118-2119）**：
- 行 1206：`for (const [atk, advMap] of Object.entries(CONFIG.elemAdv))`
- 行 2118：`if (elem && enemy.elem && CONFIG.elemAdv[elem])`
- → 全部透過 CONFIG.elemAdv 查表，**無硬編碼**

**元素選擇 UI（行 1108-1170）**：
- 行 1127：`for (const ek of ELEM_KEYS)`
- → 迴圈自動包含新元素

**隨機元素選擇（行 1472、1618、1621）**：
- 行 1472：`ELEM_KEYS[Math.floor(Math.random() * ELEM_KEYS.length)]`
- → 無硬編碼，支援任意元素數量

### 擴展需求

#### 1. elemPicks 初始化
**行 16**：改為動態初始化

```javascript
// 舊版
this.elemPicks = { fire: 0, water: 0, wind: 0 };

// 新版（方案 A：物件寫法）
this.elemPicks = {};
for (const e of ELEM_KEYS) {
  this.elemPicks[e] = 0;
}

// 新版（方案 B：簡潔寫法）
this.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
```

**同位置改動**：
- 行 47：`this.aiBaseElem = null` — 無需改（保持 null）
- 行（搜尋 aiElemPicks）：同樣改動

#### 2. AI 元素管理
**搜尋 aiElemPicks（應在行 ~1400-1500）**：
```javascript
// 假設存在 this.aiElemPicks 初始化
this.aiElemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
```

#### 3. 隨機抗性生成（random / random_dual）
**位置待確認**：搜尋 `resist: 'random'` 的處理邏輯

應在 game.js 中的敵人生成邏輯裡，動態從 ELEM_KEYS 中選擇隨機元素：
```javascript
// 偽代碼
if (waveData.resist === 'random') {
  const elem = ELEM_KEYS[Math.floor(Math.random() * ELEM_KEYS.length)];
  resistDict[elem] = 0.4;
} else if (waveData.resist === 'random_dual') {
  const [e1, e2] = [...ELEM_KEYS].sort(() => Math.random() - 0.5).slice(0, 2);
  resistDict[e1] = 0.3;
  resistDict[e2] = 0.3;
}
```

### hardcoded 檢查結果
✅ **全無硬編碼 3 元素假設**
- 所有元素迴圈都用 ELEM_KEYS
- 所有相剋查表都用 CONFIG.elemAdv
- 所有動態取值都用 ELEM[key]

**唯一改動點**：elemPicks 初始化（行 16）需改為動態。

---

## index.html 改動

### 現狀
- **行 111-124**：start screen 的 UI（character pick，實為元素選擇）
- **行 127-141**：reward-overlay UI（元素選擇卡片）
  ```html
  <div id="reward-overlay">
    <h2>🔮 選擇元素</h2>
    <div class="reward-cards" id="reward-cards"></div>
  </div>
  ```
- **行 317-322**：sidebar 面板（元素持有顯示）
- **行 403-404**：reward overlay（動態生成）
- **行 414**：說明文字提及 W3/W6/W9/W12

### 擴展需求

#### 1. 元素選擇卡片 UI（行 127-141）
**無需改動**。卡片由 game.js 動態生成（行 1127-1168）。

#### 2. 元素持有面板（行 321-322）
**無需改動**。由 game.js 的 rebuildSidebar() 動態生成。

#### 3. 說明文字（行 414）
**建議保留**：「W3/W6/W9/W12 通關後選擇元素（共4次）」仍然有效。

#### 4. CSS 樣式（行 220-224）
**行 220-224**：元素標籤樣式
```css
.elem-tag {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 10px; margin: 2px; border: 1px solid;
}
```

**無需改動**。顏色由 game.js 中 `ELEM[e].color` 動態設定。

### hardcoded 檢查
✅ **無硬編碼元素假設**。所有文字和樣式都由 JS 動態生成。

---

## skill-editor.html 改動

### 現狀
- **行 65-69**：載入 config.js、skills.js、sends.js、towers.js、waves.js
- **行 74-83**：editData 物件（深拷貝所有資料）
- **行 91-96**：TABS 定義（波次、送兵、塔、設定）

### 擴展需求

#### 1. 資料結構自動擴展
**行 74-83**：editData 基於已載入的常數

改動 towers.js 後，editData 會自動包含新的 ELEM_BASE 和 INFUSIONS 分支。**無需改 skill-editor.html**。

#### 2. 元素選擇器（resist editor）
**行 44-48**：resist editor UI
```html
.resist-editor select { background:#1a1a3e; color:#eee; border:1px solid #444; border-radius:4px; padding:3px; font-size:11px; }
```

此為通用樣式，無元素限制。**無需改動**。

#### 3. 元素下拉選單（假設存在）
**搜尋** skill-editor.js 邏輯（檔案中 `<script>` 段落）

若有硬編碼的元素選項，應改為迴圈 ELEM_KEYS：
```javascript
// 舊版（假設）
for (const e of ['fire', 'water', 'wind']) {
  option.value = e;
  // ...
}

// 新版
for (const e of ELEM_KEYS) {
  option.value = e;
  // ...
}
```

### hardcoded 檢查
需檢查 skill-editor.html 的 `<script>` 部分是否有硬編碼元素迴圈。

---

## 總結：改動優先級

### 必須改動
1. **towers.js 行 4-9**：ELEM 和 ELEM_KEYS（**關鍵級**）
2. **towers.js 行 21-26**：config.js elemAdv 表
3. **towers.js 行 35-63**：TOWERS 新增 earth/light/dark
4. **towers.js 行 71-138**：INFUSIONS 新增 27 個分支
5. **towers.js 行 144-163**：ELEM_BASE 新增 6 種（3×2）
6. **game.js 行 16**：elemPicks 動態初始化

### 建議改動
7. **waves.js**：新增怪物或修改現有怪物的 elem 欄位
8. **js/game.js**：aiElemPicks 初始化（搜尋位置）
9. **js/game.js**：隨機抗性邏輯（random/random_dual）

### 可選改動
10. **skills.js**：新增元素特性技能
11. **skill-editor.html**：確認無硬編碼元素選項

---

## 檔案行數對照表

| 檔案 | 部分 | 行號 | 改動類型 |
|------|------|------|---------|
| js/config.js | elemAdv 相剋表 | 21-26 | 擴展 3→6 |
| js/towers.js | ELEM 定義 | 4-8 | 新增 3 元素 |
| js/towers.js | ELEM_KEYS | 9 | 新增 3 個鍵 |
| js/towers.js | TOWERS | 35-63 | 新增 3 種塔 |
| js/towers.js | INFUSIONS | 71-138 | 新增 27 分支 |
| js/towers.js | ELEM_BASE | 144-163 | 新增 6 種（3×2） |
| js/waves.js | WAVES 中 elem | 6-34 | 更新怪物分配 |
| js/waves.js | resist 欄位 | 多處 | 保留不變 |
| js/game.js | elemPicks 初始化 | 16 | 動態改寫 |
| js/game.js | 相剋計算 | 1206/1997/2005/2118 | 無改 ✅ |
| js/game.js | showElementScreen() | 1127 | 無改 ✅ |
| index.html | reward-overlay | 127-141 | 無改 ✅ |
| index.html | 說明文字 | 414 | 可保留 |
| skill-editor.html | 元素選項 | TBD | 檢查硬編碼 |

---

## 設計決策補充

### 1. 為何擴展 3→6 而不是其他數字？
- 原始 3 元素形成完整相剋三角（火→風→水→火）
- 6 元素可形成**兩個相剋三角**（如 火→風→水→火 和 聖→暗→土→聖）或**單向鏈**（如 1→2→3→4→5→6→1）
- 2 倍擴展便於資料結構（INFUSIONS 從 9→36 分支）

### 2. 新增 3 個元素的屬性建議
- **土（earth）**：防守型（高護甲成長、減傷）
- **聖（light）**：治癒型（回血、淨化）
- **暗（dark）**：吸血型（傷害回血）

### 3. INFUSIONS 分支爆炸問題
- 3×3 = 9 分支（現狀可管理）
- 6×6 = 36 分支（需大量設計工作）
- **替代方案**：限制注入元素為某些組合（如只允許 6×3 = 18 分支）

### 4. Lv5 純元素塔的資料量
- 現狀：3 種純路線（火/水/風各一個 Lv5）
- 擴展：6 種純路線（新增土/聖/暗各一個 Lv5）
- 此處改動量較小

---

## 驗證檢查清單

實施改動時，按以下順序驗證：

- [ ] ELEM_KEYS 長度為 6，ELEM 有 6 個鍵
- [ ] INFUSIONS 結構為 6×6（每個元素 6 個注入）
- [ ] ELEM_BASE 有 12 個分支（6×2）
- [ ] game.js elemPicks 初始化後包含所有 6 個元素
- [ ] 元素選擇 UI 顯示 6 張卡片
- [ ] 配額表（INCOME_SENDS）無需改動 ✅
- [ ] 相剋計算正常工作（elemAdv 查詢）
- [ ] AI 隨機選擇元素時能從 6 個中選
- [ ] 沒有列表長度或 array index 超界

---

**文件建立時間**：2026-04-25  
**最後更新**：2026-04-25  
**狀態**：規劃完成，待實施
