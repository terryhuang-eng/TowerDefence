# step3 — Composite Balance Ratio + PVP PThreat + 自動標色警示

## 目標

在 `balance-eval.html` 中新增：
1. **Composite Balance Table** — 每波的 TPI / WTS 比率（難度平衡指標）
2. **PVP PThreat Table** — 送兵對「不同等級塔」的威脅值
3. **自動標色警示** — 標出平衡問題點

---

## 影響範圍

| 檔案 | 操作 |
|------|------|
| `balance-eval.html` | 繼續擴充 step1-2 建立的骨架 |

---

## 實作重點

### Table E：Composite Balance Ratio

**邏輯：**

```js
// 每波「可解鎖的最佳 TDG」
function bestTDG(waveIdx) {
  // waveIdx = 0-based (W1 = 0)
  if (waveIdx < 3) return bestOf(BASIC_towers_TDG);          // W1-3
  if (waveIdx < 6) return bestOf(ELEM_BASE_TDG);              // W4-6 (Lv3)
  if (waveIdx < 9) return bestOf(INFUSION_TDG);               // W7-9 (Lv4)
  if (waveIdx < 12) return bestOf(TRIPLE_TDG);                // W10-12 (Lv5)
  return bestOf(PURE_TDG);                                    // W13+ (Lv6)
}

// Tower Power Index
function TPI(waveIdx) {
  return goldFlow[waveIdx].available * bestTDG(waveIdx);
}

// Balance Ratio
function BR(waveIdx) {
  const wts = waveWTS[waveIdx];
  if (wts === 0) return Infinity;
  return TPI(waveIdx) / wts;
}
```

**解讀：**

| Ratio | 意義 | 標色 |
|-------|------|------|
| < 0.8 | 過難（玩家金幣完全轉成塔也打不過） | 🔴 `.err` |
| 0.8–1.5 | 挑戰合理（緊繃但可行） | 🟡 `.warn` |
| 1.5–4.0 | 理想區間（有壓力，有餘裕） | 🟢 `.ok` |
| > 4.0 | 過於輕鬆 | ⬜ `.info`（灰色） |

**輸出表格欄位：**
```
| W# | 名稱 | WTS | Available_G | Best_TDG | TPI | Balance_Ratio | 標示 |
```

**額外指標：**
- `WTS_delta = WTS[n] / WTS[n-1]`（這波比上波難幾倍？）
- `WTS_delta > 3.0` → 難度急升（spike 警告）
- `WTS_delta < 0.5` → 難度急降（boring 警告）

---

### Table F：PVP Send PThreat

對每種兵種，在「對手使用各等級塔」的假設下計算威脅值：

```js
// 假設對手持續以單一最佳塔輸出
const OPPONENT_DPS = {
  lv2:  bestDPS(BASIC_towers),   // 約 57 DPS（箭塔 Lv2）
  lv3:  bestDPS(ELEM_BASE),      // 約 88 DPS
  lv4:  bestDPS(INFUSIONS),      // 約 150 DPS（含 score_adj）
  lv5:  bestDPS(TRIPLE),         // 約 220 DPS
};

INCOME_SENDS.forEach(s => {
  const ehpTotal = s.count * s.hp / Math.max(0.01, 1 - s.armor);
  Object.entries(OPPONENT_DPS).forEach(([lvLabel, dps]) => {
    const killTime = ehpTotal / dps;           // 秒
    const pathTime = 15;                        // 假設路徑 15 秒
    const pThreat = killTime / pathTime;
    // pThreat > 1 → 對手無法在路徑內清掉（威脅！）
    emit({ send: s.name, vs: lvLabel, killTime, pThreat });
  });
});
```

**輸出表格（矩陣形式）：**
```
兵種         | vs Lv2   | vs Lv3   | vs Lv4   | vs Lv5
斥候(10g)    | 0.21     | 0.14     | 0.08     | 0.05
戰士(35g)    | 1.05 🔴  | 0.68     | 0.40     | 0.27
騎士(120g)   | 1.68 🔴  | 1.09 🔴  | 0.64     | 0.43
法師(200g)   | 2.28 🔴  | 1.48 🔴  | 0.86     | 0.58
精銳(320g)   | 2.90 🔴  | 1.88 🔴  | 1.10 🔴  | 0.74
霸者(520g)   | 4.00 🔴  | 2.60 🔴  | 1.52 🔴  | 1.02 🔴
```

顏色規則：
- `pThreat > 1.0` → 🔴 `.err`（對手很難在路徑內清，實際造成基地傷害）
- `pThreat 0.5–1.0` → 🟡 `.warn`（對手要集中火力）
- `pThreat < 0.5` → `.ok`（威脅不大）

**設計含義：**
- 這張表可以直接告訴設計者：「玩家在 W5-6 送騎士（120g），若對手只有 Lv3 塔，幾乎肯定造成傷害」
- 也可以反過來確認：「霸者在 W13 以後（對手有 Lv5 塔）才算可以應對」

---

## 注意事項

- `path_time = 15s` 是假設值，可在頁面頂部加一個說明（或未來做成可調整的 input）
- `OPPONENT_DPS` 的 `bestDPS` 需要取 **DPS_adj**（已含 AOE factor），代表對手的平均輸出，不是單塔峰值
- Table F 的矩陣值是「純數值估算」，不考慮：
  - 多塔疊加（現實中會更快擊殺）
  - 元素相剋（會讓某些組合快 30%）
  - 技能（knight 的 charge 讓前半路程很快通過）
  - 因此 PThreat 數值會偏保守（比實際場景更危險的估算）

---

## 最終頁面佈局

```
[balance-eval.html]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Tower Defense — Balance Evaluator
────────────────────────────────────────
▸ Table A  波次威脅分數（WTS）
▸ Table B  每波可用金幣（Gold Flow）
▸ Table C  塔金幣效率（TDG）
▸ Table D  送兵 ROI
▸ Table E  平衡比率（Composite BR）⬅ 核心
▸ Table F  PVP 送兵威脅矩陣（PThreat）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

每個區塊可收折（`<details><summary>`），預設展開 Table E 和 F。
