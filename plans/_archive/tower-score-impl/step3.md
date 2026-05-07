# Step 3：towers.js — INFUSIONS lv4 全部加 score_adj

## 目標
在每座 Lv4 塔的定義中加入 `score_adj` 欄位，記錄設計調整意圖。

## 影響範圍
- 檔案：`js/towers.js`
- 對象：INFUSIONS 所有 6×6 = 36 座塔的 `lv4: { ... }` 物件
- 範圍：每個 lv4 定義加一個 `score_adj: X.XX` 欄位

---

## 欄位位置

加在 `cost` 之後，`desc` 之前（保持可讀性）：

```js
// 修改前
lv4: { damage: 112, atkSpd: 1.3, range: 3.5, aoe: 0, cost: 250, desc: '...',
  skills: [...] }

// 修改後
lv4: { damage: 112, atkSpd: 1.3, range: 3.5, aoe: 0, cost: 250, score_adj: 0.67, desc: '...',
  skills: [...] }
```

---

## 全部 36 座 score_adj 值

### 火底（fire）
| key | 塔名 | score_adj | 說明 |
|-----|------|-----------|------|
| fire.fire | 暴焰 | **0.67** | 最高 DPS + 三重火效果 |
| fire.water | 蒸汽 | **0.71** | AOE 放大效果分 |
| fire.earth | 熔蝕 | 1.00 | 正常 |
| fire.wind | 焰息 | **0.70** | 高 DPS + aura |
| fire.thunder | 電漿 | 1.00 | 正常 |
| fire.none | 混沌焰 | 1.00 | 偏低但特性設計 |

### 水底（water）
| key | 塔名 | score_adj | 說明 |
|-----|------|-----------|------|
| water.fire | （水火） | **0.73** | AOE + burn + zone |
| water.water | 深寒 | **0.79** | AOE + chill + freeze |
| water.earth | 泥沼 | 1.00 | 正常 |
| water.wind | 暴雨 | **0.65** | 最高分，AOE+chill+aura |
| water.thunder | 感電 | 1.00 | 正常 |
| water.none | 虛空泉 | 1.00 | 正常 |

### 土底（earth）
| key | 塔名 | score_adj | 說明 |
|-----|------|-----------|------|
| earth.fire | 熔蝕 | 1.00 | 正常 |
| earth.water | 泥沼 | 1.00 | 正常 |
| earth.earth | 磐石 | 1.00 | AOE shred+vuln 平衡 |
| earth.wind | 沙暴 | **0.81** | AOE + 高 DPS |
| earth.thunder | 震盪 | 1.00 | 正常 |
| earth.none | 重力 | 1.00 | 正常，剛好命中目標 |

### 風底（wind）
| key | 塔名 | score_adj | 說明 |
|-----|------|-----------|------|
| wind.fire | 焰息 | 1.00 | 正常 |
| wind.water | 暴雨 | 1.00 | 正常 |
| wind.earth | 沙暴 | 1.00 | 偏低但可接受 |
| wind.wind | 疾風 | 1.00 | 正常（aura_range 強但 DPS 中等）|
| wind.thunder | 雷暴 | 1.00 | 正常 |
| wind.none | 相位 | 1.00 | 偏低但 pierce 是 niche |

### 雷底（thunder）
| key | 塔名 | score_adj | 說明 |
|-----|------|-----------|------|
| thunder.fire | 電漿 | 1.00 | hpPct 調整後正常 |
| thunder.water | 感電 | 1.00 | 正常 |
| thunder.earth | 震盪 | 1.00 | 正常 |
| thunder.wind | 雷暴 | 1.00 | 正常 |
| thunder.thunder | 雷霆 | 1.00 | killGold 降分後正常 |
| thunder.none | 賞金 | **1.40** | 定位：經濟輔助，戰鬥分低為設計意圖 |

### 無底（none）
| key | 塔名 | score_adj | 說明 |
|-----|------|-----------|------|
| none.fire | 混沌焰 | **1.10** | unstable 純設計特性 |
| none.water | 虛空泉 | 1.00 | 正常 |
| none.earth | 重力 | 1.00 | 正常 |
| none.wind | 相位 | 1.00 | 偏低但設計風格 |
| none.thunder | 賞金 | **1.50** | 定位：經濟輔助 |
| none.none | 虛空 | **1.10** | warp+knockback 屬 niche |

---

## 需要調整 DPS 參數的塔（adj < 0.82）

這些塔除了設 score_adj，**也應降低 damage 或 atkSpd**，使原始分更接近目標：

| 塔 | 現有 adj | 建議 DPS 調整 | 調整後預估 adj |
|----|---------|------------|--------------|
| 水×風 暴雨 | 0.65 | spd 1.4→1.1（-79 DPS_score） | ≈0.80 |
| 火×火 暴焰 | 0.67 | dmg 112→90（-80 DPS_score） | ≈0.79 |
| 火×風 焰息 | 0.70 | spd 1.8→1.4（-74 DPS_score） | ≈0.81 |
| 火×水 蒸汽 | 0.71 | dmg 78→62（-73 DPS_score） | ≈0.82 |
| 水×火 | 0.73 | dmg 60→50（-61 DPS_score） | ≈0.82 |

> **執行時先套用 DPS 調整，再計算新的 score_adj 填入**

---

## 定位方式

```
Grep 找：lv4: \{ damage:.*cost: 250
→ 取得所有 lv4 行號清單
→ 每個 Read ±2 行確認，Edit 在 cost 後加 score_adj
→ 共 36 個 Edit，依元素底分批執行（火底 6 個 → 水底 6 個 → ...）
```

## 注意
- 先做 DPS 參數調整的 5 座（score_adj 低的），計算新 adj 再填入
- 完成後提醒執行 `/clear`
