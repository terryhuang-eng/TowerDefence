# step2 — Tower DPS/Gold Table + Send ROI Table

## 目標

在 `balance-eval.html` 中新增：
1. **Tower DPS/Gold Table** — 各等級塔的金幣效率
2. **Send ROI Table** — 送兵 ROI、break-even 波次、HP/gold

---

## 影響範圍

| 檔案 | 操作 |
|------|------|
| `balance-eval.html` | 繼續擴充 step1 建立的骨架 |

---

## 實作重點

### Table C：Tower DPS/Gold

**累積成本定義**（升到該等級需要投入的總金幣）：

```js
const TOWER_COSTS = {
  lv1: 50,
  lv2: 50 + 80,          // 130
  lv3: 50 + 80 + 130,    // 260
  lv4: 260 + 250,        // 510
  lv5: 510 + 400,        // 910
  lv6: 910 + 600,        // 1510
};
```

**DPS 計算邏輯：**

```js
function calcTDG(tower) {
  // tower: { name, damage, atkSpd, aoe, cost(cumulative) }
  const dpsRaw = tower.damage * tower.atkSpd;
  const aoeFactor = (tower.aoe > 0) ? 2.5 : 1.0;
  const dpsAdj = dpsRaw * aoeFactor;
  const tdg = dpsAdj / tower.cumCost;
  return { dpsRaw, dpsAdj, tdg };
}
```

**塔資料蒐集：**

```js
// Lv1-2：BASIC_TOWERS
BASIC_KEYS.forEach(key => {
  const bt = BASIC_TOWERS[key];
  bt.levels.forEach((lv, i) => {
    emit({ name: bt.name + ' Lv'+(i+1), ...lv, cumCost: i===0 ? 50 : 130 });
  });
});

// Lv3：ELEM_BASE（各元素，取 arrow/cannon 兩種）
Object.entries(ELEM_BASE).forEach(([elem, bases]) => {
  Object.entries(bases).forEach(([base, t]) => {
    emit({ name: t.name, ...t, cumCost: 260 });
  });
});

// Lv4：INFUSIONS（只取純屬對角，fire/fire, water/water 等 6 個代表）
['fire','water','earth','wind','thunder','none'].forEach(e => {
  const t = INFUSIONS[e]?.[e]?.lv4;
  if (t) emit({ name: INFUSIONS[e][e].name + ' Lv4', ...t, cumCost: 510 });
});

// 非純屬 INFUSIONS 也列出（36 種），但可折疊 / 分組
// Step2 先只列純屬代表 + 最高/最低 TDG 的幾個

// Lv5/Lv6：類似方式，只列代表塔
```

**輸出表格欄位：**
```
| 塔名 | Lv | DPS(raw) | AOE? | DPS(adj) | 累積金 | TDG | 解鎖條件 |
```

顏色規則：
- TDG 最高的幾個 → `.ok`（綠）
- TDG < 0.05 → `.err`（可能性價比不足）

---

### Table D：Send ROI

```js
INCOME_SENDS.forEach(s => {
  const ehpTotal = s.count * s.hp / Math.max(0.01, 1 - s.armor);
  const payback = s.cost / s.income;          // 幾波回本
  const breakEven = CONFIG.totalWaves - payback; // 幾波前送才有正 ROI
  const ehpPerGold = ehpTotal / s.cost;

  emit({
    name: s.name,
    cost: s.cost,
    income: s.income,
    count: s.count,
    hp: s.hp,
    armor: s.armor,
    ehpTotal: Math.round(ehpTotal),
    payback: payback.toFixed(1),
    breakEven: breakEven.toFixed(1),
    ehpPerGold: ehpPerGold.toFixed(1),
    dmgToBase: s.dmgToBase,
  });
});
```

**輸出表格欄位：**
```
| 兵種 | 費用 | +收入 | Count | HP | 護甲 | EHP總計 | 回本波數 | 最晚送出波次 | EHP/g | dmgToBase |
```

顏色規則：
- `breakEven >= totalWaves` → `.ok`（幾乎永遠划算）
- `breakEven < 5` → `.err`（只有早期才划算，晚送虧損）
- `ehpPerGold >= 20` → `.ok`（對手很難清）
- `ehpPerGold < 5` → `.warn`（塔很容易清）

---

## 注意事項

- INFUSIONS Lv4 的 `score_adj` 欄位是設計者手動補正（如 `1.15`），代表「預期實際效益比 raw DPS 高 15%」。計算 TDG 時，可用 `dpsAdj × score_adj` 做更準確估算
- `aoe_factor = 2.5` 是假設中等敵人密度；可在頁面加一個文字說明「假設 AOE 平均覆蓋 2.5 個目標」
- Lv5/Lv6 塔暫時只列最高和最低 TDG 各一個，後續可按需展開
