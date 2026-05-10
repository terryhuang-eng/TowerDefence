# skill-test 計畫：技能效果正確性測試

## 問題分析

目前有 ~50 個技能（塔技能 + 敵人 passive），涵蓋：
- 傷害修飾（unstable, execute, shred, vuln, hpPct, fortify, resilient）
- DOT/火鏈（burn → ignite/detonate 三步狀態機）
- 冰系（chill 疊層 → freeze 觸發門檻，衰減系統）
- 控場（warp CD，knockback CD，tenacity 抗性減乘）
- 強化（ramp 連攻積累/切換扣層不歸零，aura 範圍增益）
- 目標選取（pierce 直線多體遞增，chain 跳躍遞減，multishot 每N次觸發）
- 場效應（zone_*, field_*, cycle_* 三種不同觸發時機）
- 經濟（wealthScale, interest, killGold, permaBuff）
- 敵人 passive（regen, armorStack, enrage, shield, blink, splitOnDeath...）

### 現有測試基礎設施
| 工具 | 用途 | 缺口 |
|------|------|------|
| `autotest.js` | 全局平衡測試（A/B/C/D 組，比較通關率） | 不驗證個別技能邏輯 |
| `SANDBOX` | 調整 hpMult/countMult/infHP/noAiSend，追蹤 fireDmg | 只追蹤 fire 傷害分項，無斷言 |
| `dps-calc.html` | DPS 試算 | 靜態公式計算，非執行時驗證 |

**核心缺口**：沒有任何測試斷言「技能效果是否如預期運作」。

---

## 技術架構決策

### 問題
`Game.prototype.doDmg` 是 `class Game` 的方法，依賴 `this.hp/maxHp/gold/towers/enemies/addBattleLog/zones/effects`。
- 直接實例化 `new Game()` → 需要 `document.getElementById('game-canvas')`，DOM 耦合度高。
- 無法直接 Node.js 執行。

### 選擇方案：`skill-test.html` + `MockGame`

建立獨立測試頁面 `skill-test.html`，方式：
1. 載入所有 JS 依賴（skills.js, config.js, towers.js）**但不載入 game.js**
2. 在 skill-test.html 內定義 `MockGame`，只包含 `doDmg` 需要的最小狀態
3. 把 `doDmg` 的邏輯直接抄進 `MockGame`（測試副本）

**原因**：
- `doDmg` 是核心，絕大多數技能在此觸發
- 不啟動 canvas/遊戲迴圈，測試完全可控
- 測試副本 vs 原始碼的偏差風險：透過每次修改 doDmg 時同步更新 MockGame 來管理
- 替代方案（`Game.prototype.doDmg.call(mockCtx, ...)`）更脆弱：game.js 內部呼叫方式有耦合

### MockGame 最小狀態
```js
class MockGame {
  constructor() {
    this.hp = 40; this.maxHp = 40; this.gold = 200;
    this.towers = [];   // aura 範圍查詢用
    this.enemies = [];  // chain/pierce 目標選取用
    this.zones = [];    // zone_slow/shred 放置用
    this.effects = [];  // 視覺效果（測試忽略）
    this.addBattleLog = () => {};
  }
  // 複製自 game.js 的 doDmg，tick 邏輯
}
```

---

## 測試分組與優先順序

| # | 步驟檔 | 技能範圍 | 風險層級 | 狀態 |
|---|--------|---------|---------|------|
| 1 | step1.md | 測試框架（MockGame + 工具函數） | 基礎 | ✅ 完成 |
| 2 | step2.md | 直接傷害修飾（unstable, execute, shred, vuln, hpPct, fortify, resilient, dodge） | 高 | ✅ 完成 |
| 3 | step3.md | 火鏈狀態機（burn, ignite, detonate） | 極高 | ✅ 完成 |
| 4 | step4.md | 冰系（chill 疊層/衰減, freeze 觸發, warp, knockback, tenacity） | 高 | ✅ 完成 |
| 5 | step5.md | 強化類（ramp 積累/切換, aura 三種） | 中 | ✅ 完成 |
| 6 | step6.md | 目標選取（pierce, chain, multishot） | 高 | ✅ 完成 |
| 7 | step7.md | 場效應（zone_*, field_*, cycle_*） | 中 | ✅ 完成 |
| 8 | step8.md | 經濟技能 + 敵人 passive | 中 | ✅ 完成 |

---

## 執行結果

全部 8 個步驟完成（2026-05-10）。測試通過，另發現並修復 1 個 bug：

### 發現的 Bug
- **`wealthScale` const bug**（`js/game.js` line 2878）：`effDmg` 宣告為 `const`，但 wealthScale 邏輯以 `+=` 修改，在 class 嚴格模式下會拋 TypeError。已修正為 `let effDmg`。

### 計畫描述與實際邏輯的差異
- **pierce**：step6.md 計畫寫「傷害遞增」，實際是遞減（`Math.max(0.3, 1 - i * dmgUp)`，最小比值 0.3）
- **aura 光環塔自身**：step5.md 計畫說自己也受光環影響，實際 game.js 排除自身（`if (tw === src) continue`）

## 輸出

`skill-test.html` 在頁面顯示：
- 每個測試 pass/fail + 期望值 vs 實際值
- 分組 summary（X passed / Y failed）
