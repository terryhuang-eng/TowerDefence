# step0b — 分析：固定攻速 vs 冷卻制

## 問題根源的精確定義

目前所有 per-hit 觸發的技能，其**實際貢獻 = 參數 × atkSpd**，但 score 計算忽略 atkSpd，導致：

```
高攻速塔的 proc 技能：score 低估（實際比分數強）
低攻速塔的 proc 技能：score 高估（實際比分數弱）
```

### atkSpd 敏感性分類

| 技能 | 敏感度 | 機制 | 典型影響 |
|------|--------|------|---------|
| chill | **線性** | stacks += N × atkSpd/s | 風+水(2.2spd)=2.2層/s；火+水(1.1spd)=1.1層/s |
| shred | **線性** | 同上 | 風+土(2.0spd, ×2)=4層/s；土+土(0.9spd)=0.9層/s |
| vulnerability | **線性** | 同上 | |
| ignite | **線性** | fires/hit while burning | atkSpd=2.2 → 2.2次觸發/s |
| detonate | **線性** | fires/3 hits | atkSpd=2.2 → 0.73次引爆/s |
| hpPct | **線性** | fires/N hits | |
| ramp | **複合** | 攻速→傷害→攻速（加速循環） | 風+風(2.5spd) ramp 最強 |
| burn | **低**（修 step0 後） | DOT 固定；只影響刷新頻率 | |
| warp/knockback | **無** | 已有 cd 參數 ✓ | |
| aura | **無** | 被動光環 | |

**最嚴重的問題**：風元素塔的 atkSpd=2.0~2.5，同時帶有 chill/shred（線性敏感），導致：
- 風+水（暴雨塔）：atkSpd=2.2，chill stacksPerHit=1 → 2.2層/s，是一般水塔的 2x
- 風+土（沙暴塔）：atkSpd=2.0，shred stacksPerHit=2 → 4層/s，是一般土塔的 4.4x
- 這些塔的 shred/chill score 和普通元素塔**完全一樣**，但實際效果強 2-4 倍

---

## 方案 A：proc 塔固定攻速＋外部 aura 加速

### 核心思路
- 所有帶 proc 技能的塔設定固定 atkSpd（按元素/等級有標準值）
- atkSpd 提升只能來自 `aura_atkSpd` 光環塔
- Score 計算：`score(skill) = scoreBase × (param/ref)` 因 atkSpd 固定而準確

### 問題一：風系塔的設計身份被摧毀

風元素的核心設計是「高攻速 = 快速 debuff 疊加」：
- 風+水（atkSpd=2.2）的存在意義就是比水+水更快疊 chill
- 風+土（atkSpd=2.0）的存在意義就是比土+土更快疊 shred

若把這些固定為標準攻速（1.0~1.2），它們和普通元素塔的分工完全喪失，**風系的元素身份消失**。

### 問題二：aura_atkSpd 繞過約束

若塔本身攻速固定，但 aura_atkSpd 塔可以加 +15%~+35%，proc 率仍然隨攻速提升。
固定攻速只是把「塔本身」的 atkSpd 固定，不能阻止外部 buff——除非還要規定 proc 塔不接受 aura 加成（更複雜）。

### 問題三：只是 score 層面的症狀壓制

固定攻速後 score 是準了，但沒有解決「proc 技能的實際價值天生與攻速掛鉤」這個設計事實。設計師仍然知道：放了 aura_atkSpd 在 proc 塔旁邊，proc 率提升，score 沒反映。

### 小結
方案 A 的代價：破壞風系設計身份 + 繞不過外部 buff 問題。
適合的場景：全新設計的遊戲，可以從頭規劃「proc 塔不升攻速」為設計公理。對現有系統代價太高。

---

## 方案 B：觸發效果改冷卻制

### B1：Burst proc → CD 制

`ignite`, `detonate`, `hpPct` 加入 `cd` 參數，最多每 cd 秒觸發一次：

```js
// ignite：每 0.8 秒最多觸發一次
if (igniteSk && enemy.burnTimer > 0 && (enemy._igniteCd||0) <= 0) {
  enemy.hp -= igniteDmg;
  enemy._igniteCd = igniteSk.cd;
}
```

Score 計算：`igniteScore = scoreBase × (flat/flat_ref) × (cd_ref / cd)`
→ 完全不需要知道 atkSpd。

**對 ignite 效果**：
- atkSpd=1.2 的塔，ignite 本來 1.2 次/s，CD=0.8 → 上限 1.25 次/s → 幾乎不受影響
- atkSpd=2.2 的風塔，ignite 本來 2.2 次/s，CD=0.8 → 上限 1.25 次/s → **被硬蓋**
- 設計效果：快攻塔不能用 ignite 無限刷傷害，火系專用性更強

### B2：Stack 技能 → Rate（每秒疊層）制

`chill`, `shred`, `vulnerability` 從「每次攻擊疊 N 層」→「每秒疊 N 層（在攻擊中）」：

```js
// 舊：stacksPerHit（每次 attack 觸發）
// 新：stacksPerSec（在 update loop 中，如果塔正在攻擊且目標在射程內，每秒加層）
```

**直接後果**：
- 風+水（暴雨塔）的 chill 優勢完全消失：不管 atkSpd 多快，每秒疊層數相同
- 高 atkSpd 對 stack 技能毫無意義

**設計後果**：風系的疊加優勢被抹除，但風系塔仍靠高 DPS 差異化（damage × atkSpd 高）。
問題：這讓風+水和水+水的 chill 效率相同，風元素對 debuff 疊加的貢獻完全消失。

### B3：混合（建議）：burst proc → CD 制；stack → rate 制（但允許攻速加成）

stack 技能改為 `baseRate`（每秒基礎疊層），但攻速加成時以 **softcap** 方式提升：

```
effectiveRate = baseRate × sqrt(atkSpd / atkSpd_ref)
```

- 攻速 ×2 → 疊層率 ×1.41（非線性，高速報酬遞減）
- 保留風塔「比普通塔疊得快」的身份，但不是 2x，大約是 1.4x

Score = `scoreBase × (baseRate/baseRate_ref)`，atkSpd 加成在 score 外另行計算（或忽略，作為「高攻速溢價」）。

---

## 兩個方案的根本取捨

| 向度 | 方案 A（固定攻速） | 方案 B（冷卻制） |
|------|-----------------|----------------|
| 解決 score 問題 | ✅（攻速固定後 score 準） | ✅（CD 讓效果量化） |
| 解決平衡問題 | ⚠️ 治標（aura 仍可加） | ✅（有 CD 就有上限） |
| 保留風系設計身份 | ❌ 破壞 | ⚠️ B2 破壞；B3 部分保留 |
| 改動遊戲機制 | ⚠️ 只改塔數值 | ✅ 改 trigger 邏輯 |
| 工程量 | 小（改 towers.js 數值） | 中（改 game.js trigger + skills.js） |
| 改動後需要重新調參數 | ⚠️ 是（所有風塔重設計） | ⚠️ 是（所有 proc cd 值需調） |

---

## 更輕量的第三路：Score 計算加入 atkSpd 正規化（不改機制）

如果問題核心是「score 不準」而非「遊戲機制失衡」，最小代價的方案：

在 `computeScoreBreakdown` 中，對帶 `atkSpdSensitive: true` 的技能，score 乘以 `(tower.atkSpd / atkSpd_ref[lv])`：

```js
// SKILL_DEFS 加入 atkSpdSensitive 旗標
chill:     { ..., atkSpdSensitive: true },
shred:     { ..., atkSpdSensitive: true },
ignite:    { ..., atkSpdSensitive: true },
detonate:  { ..., atkSpdSensitive: true },

// computeScoreBreakdown
if (def.atkSpdSensitive) {
  const atkRef = ATKSPS_REF[lv] ?? 1.2;  // Lv4 參考攻速 1.2
  score *= (tower.atkSpd || 1.0) / atkRef;
}
```

效果：
- 風+土（atkSpd=2.0）shred score ×(2.0/1.2) = ×1.67 → score 反映實際強度
- 火+土（atkSpd=1.0）shred score ×(1.0/1.2) = ×0.83 → score 正確反映較慢疊層

**不改任何遊戲邏輯，只修 skill-editor 的評分計算。**

工程量：極小（只改 skill-editor.html，約 10 行）。
缺點：遊戲機制本身的「atkSpd 越高 proc 越強」未改，只是讓設計師看到準確分數。

---

## 建議路徑

| 優先序 | 做什麼 | 檔案 | 工程量 |
|--------|--------|------|--------|
| **1（現在）** | Score 正規化：atkSpdSensitive flag + 計算修正 | skill-editor.html | 極小 |
| **2（現在）** | burn 改 DPS 係數（step0） | game.js | 極小 |
| **3（現在）** | ignite/detonate 加 conditionalFactor（step1） | skills.js + skill-editor.html | 小 |
| **4（後續）** | ignite 加 cd 硬蓋（B1），防止快攻塔無限刷 | game.js | 小 |
| **5（後續）** | 評估風系設計：風塔 debuff 疊加優勢是否需要軟化 | 設計決策 | — |

**方案 A（固定攻速）和方案 B2（rate 制）都代價過高，且損壞現有設計身份。不建議。**
