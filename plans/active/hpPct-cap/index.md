# 計畫：hpPct-cap — 水系 hpPct 缺少 cap 修正

## 問題分析

### 差異根源

`game.js` 的 hpPct 觸發邏輯（line 2504）：
```js
const hpDmg = hpPctSk.cap ? Math.min(rawHpDmg, hpPctSk.cap) : rawHpDmg;
```
- 有 `cap` → `min(rawHpDmg, cap)`，封頂保護
- **無 `cap`（或 cap:0）→ 無封頂，rawHpDmg = maxHp × pct 直接生效**

### 受影響的塔（遺漏 cap）

| 塔 | 等級 | hpPct params | 問題 |
|----|------|-------------|------|
| 水×水（深寒）Lv4 | Lv4 | `{pct:0.04, every:2, cd:0}` | **無 cap** |
| 純水 Lv5（強化）| Lv5 | `{pct:0.04, every:2, cd:0}` | **無 cap** |
| 純水 Lv6（終極）| Lv6 | `{pct:0.04, every:2, cd:0, cap:120}` | ✅ 有 cap |

### 數值衝擊（無 cap 時 vs Boss）

| 目標 | maxHp | 無 cap 每 proc | cap:120 每 proc |
|------|-------|--------------|----------------|
| 鋼鐵巨獸 W16 | 4000 | **160 傷** | 120 傷 |
| 終焉之王 W20 | 7000 | **280 傷** | 120 傷 |

- 水×水 Lv4 atkSpd:1.4，every:2 → 約每 1.4 秒 proc 一次
- 無 cap：W20 Boss 每次 280 傷，DPS ≈ 200 — 遠超 Lv4 設計預算（約 140 分）
- Lv5 同樣問題，且 Lv5 ≥ Lv6（無 cap > cap:120），等級倒掛

### 其他 hpPct 塔（有 cap，作為比較基準）

全部 thunder 系 Lv4（pct:0.02~0.03）、所有 Lv5 triple 塔（pct:0.02~0.03）均有 `cap:120`。
水水 Lv4 & 純水 Lv5 是**唯二**漏掉 cap 的塔，明顯為遺漏，非設計意圖。

## 修正方案

補上 `cap:120`，與同等級 / 同 pct 塔一致。

| 塔 | 修改前 | 修改後 |
|----|--------|--------|
| 水×水 Lv4 | `{pct:0.04,every:2,cd:0}` | `{pct:0.04,every:2,cd:0,cap:120}` |
| 純水 Lv5 | `{pct:0.04,every:2,cd:0}` | `{pct:0.04,every:2,cd:0,cap:120}` |

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | js/towers.js | 水×水 Lv4 + 純水 Lv5 hpPct 補 cap:120 |

> 單步驟計畫，step1 即最後一步。
