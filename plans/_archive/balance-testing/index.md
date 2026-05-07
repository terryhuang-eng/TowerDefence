# balance-testing 計畫總覽

## 問題分析

### 規模
| 層級 | 數量 | 參數類型 |
|------|------|---------|
| Lv1-2 基礎塔 | 2 種 × Lv2 | damage / atkSpd / range / aoe |
| Lv3 ELEM_BASE | 12 種 | + 1 種技能 (burn/chill/shred/ramp/hpPct) |
| Lv4 INFUSIONS | 36 種 | + 2 種技能 × 各 2-4 個參數 |
| Lv5 TRIPLE_TOWERS | 20 種 | + 3 種技能 |
| Lv6 PURE_TOWERS | 6 種 | + 1-2 種強化技能 |
| **總計** | **~76 塔** | **幾十個獨立數值** |

### 現有工具的缺陷

**autotest estimateDPS（autotest.js L328-336）：**
```js
let d = tw.damage * tw.atkSpd;
if (tw.aoe > 0) d *= 2; // 粗估 AOE 命中 2 目標
```
- 完全無視 burn DOT、chill 減速延長、shred 碎甲加成、chain 連鎖、hpPct 等
- 結果：B/C 組排名幾乎只反映 damage × atkSpd，燎原塔等高技能低傷害的塔永遠墊底

**autotest 策略測試：**
- 測的是「元素選擇組合」，不是「個別塔強度」
- 同策略下每次元素 pick 順序不同，同一場遊戲可能同時有多種塔
- 結果是混合了經濟決策 + 塔選擇 + 波次運氣的複合指標

---

## 三種改進方向

### 方向 A：靜態 DPS 試算工具 `dps-calc.html`
**最快見效，適合調參時快速比對。**

建立獨立 HTML，讀取 `js/towers.js` + `js/skills.js`，對標準敵人（可調整 HP/護甲/速度）計算每塔「等效 DPS」：
- burn：DOT × 持續秒數 × atkSpd
- chill：減速延長敵人在射程內時間 → 更多命中 → 乘以 (1 / (1 - avg_slow))
- shred：等效傷害倍率提升（碎甲 × 敵人護甲）
- chain：命中目標數乘以 decay
- hpPct：每 N 秒額外 pct × 敵人HP 真傷
- ramp：平均加成 cap/2
- zone：AOE slow 依路徑密度估算

**優點：** 即時，不需跑 game sim，方便手動調參
**缺點：** 靜態估算，不含地圖幾何、波次密度、實際 timing

→ **見 step1.md**

---

### 方向 B：autotest D 組（Lv4 單塔隔離測試）
**確認計算結果是否在實際遊戲中成立。**

新增 D 組策略：強制讓 Bot 只升到某一種 Lv4 塔（固定 elemPicks + 固定 infusion 目標），關閉送兵。
36 個 INFUSIONS 各跑一次，比較：
- 最終存活波（主要指標）
- 玩家剩餘 HP（次要）
- estimatedDPS（對比現值確認改善效果）

**優點：** 真實 game sim，排除策略變數
**缺點：** 36 × 遊戲時間 = 較慢；Bot 升塔邏輯需對應修改

→ **見 step2.md**

---

### 方向 C：改進 estimateDPS 技能加權
**最低成本，讓現有 B/C 組排名更可信。**

在 `autotest.js` 的 `estimateDPS()` 加入技能貢獻：
- burn: `+ dot × damage × 3`（預期 3 秒燒）
- chill: `× (1 + avg_slow_factor)`（約 1.3×）
- shred: `× (1 + avg_shred_effect)`（約 1.2×）
- chain: `× targets × decay`
- hpPct: `+ pct × 500 / every`（標準敵人 500 HP）
- ramp: `× (1 + cap / 2)`
- aura_dmg: 不加（受益的是其他塔）

**優點：** 改一個函數，立刻讓所有測試結果排名更準
**缺點：** 仍是估算，aura/zone 等地圖相依效果無法精確

→ **見 step3.md**

---

## 建議執行順序

```
方向 C（step3）→ 立即跑全測看新排名
      ↓
方向 A（step1）→ 手動調整各塔參數
      ↓
方向 B（step2）→ 確認特定塔的實際強度
```

| 步驟 | 檔案 | 工作量 | 效益 |
|------|------|--------|------|
| step3 | autotest.js | 小（30 行） | 立刻改善排名可信度 |
| step1 | dps-calc.html（新檔） | 中（200-300 行） | 調參時的主要工具 |
| step2 | autotest.js | 中（60-80 行） | 驗證最終平衡結果 |
