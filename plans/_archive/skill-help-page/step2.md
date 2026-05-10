# Step 2: JS — 實作 `showSkillRef()` 函數

## 目標
在 `index.html` 最末 `</body>` 前加入 `<script>` 區塊，實作全域函數 `showSkillRef()`。
須在 `skills.js` 載入後執行，讀取 `SKILL_DEFS` 與 `GLOBAL_CAPS` 產生說明內容。

## 改動位置
`index.html` 最後 `</body>` 標籤之前

## Tab 結構
- Tab 1：🗡️ 塔技能（依 group：damage / control / debuff / buff / special）
- Tab 2：👾 敵人被動
- Tab 3：📊 全域上限 & 技能互動

## ⚠️ 標記原則
凡技能定義中的參數與實際程式碼邏輯**不符或未連接**者，在說明卡片加上：
> `⚠️ 參數未正確實裝，以下描述依目前程式碼行為為準`

---

## 各技能準確說明（依程式碼）

### 塔技能 — 傷害

**burn（灼燒）**
命中後在目標施加灼燒：每秒造成 `dot × 塔damage × 塔atkSpd` 點傷害，持續 `dur` 秒。
每次命中重置計時器（最新命中的塔覆蓋 DOT 數值）。
若目標已有灼燒且攻擊塔有 **ignite**，在覆蓋前觸發引燃。
每次命中（任意有 burn 的塔）令目標的 `burnStacks +1`。

**ignite（引燃）**
當目標 `burnTimer > 0` 時，命中造成 `flat × baseDmg` 額外傷害。
需與 burn 在**同一塔**上；灼燒可由任意塔賦予。

**detonate（引爆）**
目標的 `burnStacks`（全域計數，所有 burn 塔共用）達到 3 時，由擁有 **detonate** 的塔命中即觸發：
造成 `ratio × baseDmg` 真傷（無視護甲、易傷），若有 `aoe` 參數則 AOE。觸發後 `burnStacks` 歸零。
> **重要**：burn stacks 是記在**目標身上**的全域計數。任何有 burn 的塔都能累積（A 塔疊 2 層，B 塔疊第 3 層並引爆）。只有擁有 detonate 的塔能觸發爆炸。節奏：1→2→**3爆歸零**→1→2→**3爆**……
> 灼燒熄滅（burnTimer 歸零）時 burnStacks 同步清零 — 必須持續有 burn 塔輸出才能維持引爆節奏。

**chain（連鎖）**
攻擊主目標後，從**射程內**其他敵人（已按路徑進度排序）取前 `targets` 個，
第 i 跳傷害 = 主目標傷害 × `decay^i`（i 從 1 起）。正常觸發各技能效果。

**execute（斬殺）**
目標當前 HP < `threshold × maxHP` 時，傷害乘以 `mult`（在護甲計算前套用）。

**hpPct（%HP傷害）**
每第 `every` 次攻擊（atkCount 從 0 起，`% every === 0`），附加 `floor(maxHP × pct)` 真傷。
同一目標有 `cd` 秒冷卻（冷卻中跳過）。

**frostbite（凍傷）**
命中後施加凍傷：每秒造成目標 `dmgPct × maxHP` 水系傷害（受元素三角影響），持續 `dur` 秒。
多次命中取最大值（不疊加、不延長）。

**lifedrain（生命汲取）**
每次造成傷害後，回復基地 HP = `max(1, floor(finalDmg × pct))`，上限 maxHP。

---

### 塔技能 — 控制

**chill（冰冷）**
每次攻擊疊 `stacksPerHit` 層（上限 `GLOBAL_CAPS.chillMaxStacks` 層）。
速度乘以 `1 - min(層數 × GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct)`。
每次命中重置衰減計時器；無命中時每秒衰減 `GLOBAL_CAPS.chillDecayRate` 層。

**freeze（冰凍）**
冰冷層數達到 `threshold` 時觸發定身，持續 `dur × (1 - ccReduce)` 秒，冰冷歸零。受 tenacity 影響。

**warp（扭曲）**
每次攻擊令目標定身 `dur × (1 - ccReduce)` 秒，此塔有 `cd` 秒獨立冷卻。受 tenacity 影響。

**knockback（擊退）**
每次攻擊將目標路徑索引倒退 `dist` 格，此塔有 `cd` 秒獨立冷卻。

---

### 塔技能 — 弱化

**shred（碎甲）**
每次攻擊疊 `stacksPerHit` 層（上限 `GLOBAL_CAPS.shredMaxStacks` 層）。
有效護甲 = `max(0, 原護甲 - 層數 × GLOBAL_CAPS.shredPerStack)`。
每秒衰減 `GLOBAL_CAPS.shredDecayRate` 層。

**vulnerability（易傷）**
每次攻擊疊 `stacksPerHit` 層（上限 `GLOBAL_CAPS.vulnMaxStacks` 層）。
目標受傷乘以 `1 + 層數 × GLOBAL_CAPS.vulnPerStack`。
每秒衰減 `GLOBAL_CAPS.vulnDecayRate` 層。

---

### 塔技能 — 增益

**ramp（越攻越快）**
連續攻擊**同一**目標每次 +`perHit` 攻速加成（累積），上限 +`cap`。切換目標時歸零。

**aura_dmg（傷害光環）**
每幀計算：半徑 `radius` 格內所有友軍塔，傷害 +`flat`（定值）且再乘以 `(1 + pct)`。
多光環來源疊加。

**aura_atkSpd（攻速光環）**
每幀：半徑 `radius` 格內友軍攻速加成 +`bonus`（多來源疊加，受 `GLOBAL_CAPS.atkSpdBonus` 上限）。

**aura_range（射程光環）**
每幀：半徑 `radius` 格內友軍射程 +`bonus`（多來源相加）。

---

### 塔技能 — 特殊

**multishot（三連射）**
每第 `every` 次攻擊改射 `shots` 發（可分打不同目標）。
擊殺後 `killDur` 秒內攻速加成 +`killBonus`（_killRushTimer）。

**pierce（穿透）**
改為穿透：對射程內所有目標依序各打一次，第 i 個目標（0-indexed）傷害 = `baseDmg × (1 + i × dmgUp)`。

**zone_slow（減速領域）**
命中後在目標位置留圓圈（半徑 `radius`，持續 3 秒）。
圓圈存在期間每幀執行：圈內每個敵人的 `chillStacks = max(chillStacks, chillStacks目標值)`。
效果是「在圈內的敵人冰冷層數不低於設定值」，不累加。

**zone_shred（碎甲領域）**
同 zone_slow，改為維持 `shredStacks` 下限。

**killGold（擊殺獎金）**
此塔擊殺目標時，額外獲得金幣 = `floor(敵人killGold × bonus)`。

**unstable（不穩定）**
每次傷害乘以 `1 + rand(-1,1) × variance`（均勻隨機，範圍 ±variance%）。

**permaBuff（永久強化）**
每次擊殺後此塔永久 +`atkPerKill` 攻擊力（額外加值，可持續累積）。

---

### 敵人被動

**regen（再生）**
每秒回復 `pct × maxHP` HP。

**armorStack（護甲成長）**
每次被攻擊護甲 +`perHit`，上限 +`cap`（在基礎護甲之上）。

**enrage（狂暴）**
當前 HP < `hpThreshold × maxHP` 時，速度乘以 `spdMult`。

**shield（護盾）**
⚠️ 參數 `amt` / `regen` 目前未實裝，以下描述依程式碼行為為準：
當 HP 首次降至 0 時，HP 恢復為 1 而非死亡（僅觸發一次）。

**charge（衝鋒）**
生成後首 `dur` 秒內速度乘以 `spdMult`，之後恢復正常。

**dodge（閃避）**
每次被攻擊有 `chance` 機率完全免疫本次傷害。

**tenacity（韌性）**
所有 CC 持續時間（freeze、warp 的 dur）乘以 `(1 - ccReduce)`。

**blink（閃現）**
HP < `hpTrigger × maxHP` 時，每 `cd` 秒向前閃現 `dist` 格（pathIdx += dist）。

**splitOnDeath（分裂）**
死亡時生成 `count` 個分身（HP = `floor(maxHP × hpRatio)`，繼承護甲/抗性，無技能）。

**antiElement（元素適應）**
⚠️ 參數 `reduce` 目前未實裝，以下描述依程式碼行為為準：
追蹤各元素對此敵人造成的累積傷害；最高累積元素的總傷害每超過一定門檻，
對該元素抗性 +0.5%（上限 50%）。抗性緩慢累積，早期幾乎無效。

**stealth（隱身）**
進入隱身後（`revealed=false`）塔無法鎖定此敵人，顯示 30% 透明度。
隱身持續 `dur` 秒，之後重新可見，冷卻 `cd` 秒再次隱身。
> ⚠️ 距塔 ≤2 格自動揭露機制**待移除**，目前程式碼仍存在但計畫取消。

**summon（召喚）**
每 `cd` 秒召喚 `count` 個小怪（HP = `floor(maxHP × hpRatio)`，速度繼承，無技能）。

**phaseShift（相位偏移）**
> ⚠️ 設計過於複雜，標記為**未完成待討論**，說明頁僅簡述：
每損失 1/`phases` HP 時切換相位，各相位具有不同元素抗性與受傷減免，
具體行為待設計定案後更新。

**fortify（堅固）**
每次受到傷害的上限為 `dmgCap`（在所有加成後套用）。

**resilient（不屈）**
每次被攻擊後受傷減少 `stack`%，上限 `cap`%（疊加累積）。

---

## 程式碼定位
- 新增位置：`index.html` 最後 `</body>` 之前
- 函數名：`showSkillRef()`（全域函數，不依賴 game 實例）
- 依賴：`skills.js`（SKILL_DEFS、GLOBAL_CAPS）在第 471 行已載入
- Tab 切換邏輯參考現有 `showInfoOverlay()` 的實作模式
