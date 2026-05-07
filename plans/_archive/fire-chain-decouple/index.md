# fire-chain-decouple — 分析計畫

## 問題診斷

### 耦合的三層結構

```
ATK (damage stat)
  └─ burnDmg = baseDmg × burnSk.dot        ← 直接耦合
       └─ igniteDmg = baseDmg × igniteSk.flat    ← 依賴 burn 存在
            └─ detonateDmg = baseDmg × detSk.ratio × (stacks >= 3)  ← 依賴 burnStacks
```

**耦合 #1：ATK-技能耦合（game.js 2429, 2422, 2434）**
- burn / ignite / detonate 傷害全部 `= baseDmg × param`
- 調整塔的 damage 值 → 三個技能同比例縮放，無法獨立平衡
- 例：想讓火塔 base attack 更強但不增強 burn chain → 做不到

**耦合 #2：技能間前置依賴（game.js 2421 / 2432）**
- `ignite` 只在 `burnTimer > 0` 時觸發（條件性）
- `detonate` 只在 `burnStacks >= 3` 時觸發（條件性 × 條件性）
- 但評分系統把三者視為**獨立加法**：25 + 15 + 20 = 60 pts

**耦合 #3：Score 系統不感知依賴（skill-editor.html 932-954）**
- `computeScoreBreakdown` 對每個技能獨立計算後直接相加
- `ignite` 在沒有 `burn` 時 in-game 效果為 0，但仍計 15 pts
- `detonate` 實際觸發頻率取決於攻速、burn 持續時間、能否疊到 3 層，但 score 只看 `ratio`

### 耦合的後果

| 問題 | 具體表現 |
|------|---------|
| DPS 數值難獨立調 | 想降低火系的 burn DOT 壓力，只能降 dot 係數，但同時也影響了 ignite/detonate 的比例感 |
| 分數虛高 | 帶 burn+ignite+detonate 的塔評分比實際貢獻高（ignite/detonate 有相當的條件觸發率損耗）|
| 設計師難以推算 | 加一個 ignite 值 +0.1，實際 DPS 提升多少？依賴 burn uptime，無法從分數直接推算 |
| 平衡風險 | Lv5/Lv6 火塔若 ATK 高 + burn chain 全開，三層技能同時爆發，難以事前預估 DPS 天花板 |

---

## 可行方案分析

### 方案 A：Score 加入依賴修正係數（最輕量）
在 `SKILL_DEFS` 加入 `requires` 欄位，score 計算時：
- `ignite` score × `burn_uptime_factor`（假設 0.7~0.85）
- `detonate` score × `stack3_hit_rate`（假設 0.5~0.6）

**優：** 不改遊戲邏輯，只修 score 評估。
**缺：** `burn_uptime_factor` 是假設值，缺乏理論基礎；根本問題（分數與 DPS 的計算模型脫節）仍存在。

---

### 方案 B：ATK 與技能係數分離（根本解）
讓 burn / ignite / detonate 的傷害不依附 `baseDmg`，改用獨立的 `power` 參數（絕對值）：

```js
// 現在：
enemy.burnDmg = baseDmg * burnSk.dot;       // baseDmg = 115 → burnDmg = 51.75/s
// 改後：
enemy.burnDmg = burnSk.burnPower;            // burnPower = 52（直接寫死）
```

技能定義改為：
```js
burn: { defaults: { burnPower: 30, dur: 3 } }
ignite: { defaults: { ignitePower: 20 } }
detonate: { defaults: { detonatePower: 80 } }
```

**優：** ATK 和技能可完全獨立平衡；score 計算也更直接（power / 參考值）。
**缺：** 打破「高 ATK 塔有更強 burn」的設計直覺；towers.js 所有 burn 塔的參數需全部重新定義（約 30+ 條目）；與其他技能（shred、chill 等也用 baseDmg scaling）不一致。

---

### 方案 C：火系技能打包為 Bundle（設計層重定位）
把 burn / ignite / detonate 視為一個不可分割的「火焰鏈」技能包：

```js
fireBurst: {
  category: 'tower', group: 'damage',
  defaults: { dot: 0.3, dur: 3, igniteMult: 0.2, detonateRatio: 0.8 },
  scoreBase: 50,   // 整包評分
  scorePrimary: 'dot',
  scoreRef: 0.3
}
```

**優：** 從根本消除「3 個依賴技能加法 = 虛假評分」問題；設計直覺更清晰（火塔帶 fireBurst = 確定有 burn chain）。
**缺：** 現有 Lv4-Lv6 塔有很多「只帶 burn」的設計（burn 作為獨立 DOT 技能），打包後失去靈活性；重構工程量大。

---

### 方案 D：Score 計算加入 Sandbox 實測校正（長期）
在 skill-editor 中加入「跑 N 秒模擬」按鈕，用 SANDBOX fireDmg 數據回填技能分：
- `burn_actual_score = fireDmg.burn / totalDmg × DPS_SCORE_REF`
- `ignite_actual_score = fireDmg.ignite / totalDmg × DPS_SCORE_REF`
- `detonate_actual_score = fireDmg.detonate / totalDmg × DPS_SCORE_REF`

**優：** Score 完全基於實際遊戲數據，消除所有假設。
**缺：** 需要一個標準化測試環境（什麼敵人、多少波次、什麼護甲）；engineering 複雜度高；適合長期，不適合短期 fix。

---

## 建議方向

**短期（本次執行）：方案 A**
- 在 SKILL_DEFS 加入 `requires` + `conditionalFactor` 欄位
- skill-editor 的 score 計算時，若技能有 `requires` 且目標塔確實有前置技能，套用 `conditionalFactor`
- `ignite conditionalFactor: 0.75`（假設 burn uptime 75%）
- `detonate conditionalFactor: 0.5`（疊 3 層觸發率）
- 在分析面板顯示「⚠️ 條件性技能（需 burn）」標記

**中期（後續規劃）：方案 B（僅限火系）**
- 只對 burn/ignite/detonate 三個技能實施 power 分離
- 其他技能（shred、chill 等）維持 baseDmg scaling 不動
- 同時更新 towers.js 中所有火塔的技能參數

---

## 分析文件

- `step0-dps-coefficient-analysis.md`：burn 改用 DPS 係數的分析（推薦執行）
- `step0b-atkspdfix-analysis.md`：固定攻速 vs 冷卻制的分析（結論：兩者代價過高，改用 score 正規化）

## 執行步驟清單（依優先序）

**現在可執行（不改遊戲機制，只改 score 系統）：**
- [ ] **step1.md**：ignite/detonate 加入 `conditionalFactor`（SKILL_DEFS + computeScoreBreakdown）
- [ ] **step2.md**：skill-editor 分析面板顯示條件標記（UI 呈現）
- [ ] **step3.md**：burn 係數從 `baseDmg` → `DPS`（game.js 1 行 + skill-editor effectiveDPS 折入 burn）
- [ ] **step4.md**：score 加入 `atkSpdSensitive` 正規化（chill/shred/vulnerability/ignite/detonate 按 atkSpd 修正分數）

**後續（改遊戲機制，需另開計畫）：**
- [ ] ignite 加 cd 硬蓋（防止快攻塔無限刷，源自 step0b 方案 B1 建議）

## 執行順序

step1 → step2（純 score 評估，0 遊戲邏輯風險）
→ step3（game.js 1 行改動，建議接著做）
→ step4（score 正規化，最後做）
