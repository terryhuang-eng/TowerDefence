# THINK: AOE 應納入 DPS 分數計算

**觸發**：AOE 與 DPS 有關聯，不應忽略
**日期**：2026-05-04

---

## 問題

目前 DPS 公式：
```
effectiveDPS = damage × atkSpd
```

忽略了 AOE。但 cannon（AOE=1.0）每次攻擊打半徑 1.0 範圍內所有敵人，
實際效能遠高於單體 arrow（AOE=0）。

**目前的計算結果（錯誤）**：
- arrow lv3：45 × 1.4 = 63 → DPS分 80 ✓
- cannon lv3：52 × 0.8 = 41.6 → DPS分 52.8 ← 嚴重低估

---

## 正確公式：加入 AOE 乘數

```
effectiveDPS = damage × atkSpd × (1 + aoe × AOE_DENSITY)
```

其中 `AOE_DENSITY` = 每單位 AOE 半徑命中的「額外目標數量」。

### AOE_DENSITY 校準

條件：arrow 和 cannon 在 lv3 應有相同的有效戰力（相同 scoreTarget=80）：

```
arrow:  45 × 1.4 × (1 + 0 × k) = 63
cannon: 52 × 0.8 × (1 + 1.0 × k) = 41.6 × (1 + k) = 63
→ k = 63/41.6 - 1 = 0.514 ≈ 0.5
```

**AOE_DENSITY = 0.5**（每 1.0 AOE 半徑 ≈ 額外命中 0.5 個目標，等效 1.5× 傷害）

### 修正後各 AOE 值的乘數

| AOE 值 | 乘數 (1 + AOE×0.5) | 說明 |
|--------|-------------------|-----|
| 0 | 1.0× | 純單體 |
| 1.0 | 1.5× | 標準砲塔 |
| 1.2 | 1.6× | 較大 AOE |
| 1.5 | 1.75× | 大 AOE |
| 2.0 | 2.0× | 超大 AOE |

---

## 修正後的計算結果

**lv3（DPS_REF=63，scoreTarget=80）**：

| 塔 | damage×atkSpd | AOE | effectiveDPS | DPS分 |
|----|--------------|-----|-------------|------|
| arrow（all elem） | 63 | 0 | 63.0 | 80 ✓ |
| cannon（all elem） | 41.6 | 1.0 | 62.4 | 79 ✓ |

兩者幾乎一樣 → 設計合理，arrow 和 cannon 是同等預算的不同形態。

**lv4 疾風塔（修正後參數，DPS_REF=120，scoreTarget=160）**：
- damage=32, atkSpd=2.5, AOE=0
- effectiveDPS = 32 × 2.5 × 1.0 = 80
- DPS分 = 80 × (160/120) = 106.7（與之前相同，AOE=0 不影響）

---

## 需要重新確認 DPS_REF

加入 AOE 後，DPS_REF 的校準基準應該是：

```
DPS_REF[lv] = 「這個等級標準塔（arrow 或 cannon）的 effectiveDPS」
```

- lv3：arrow=63, cannon=62.4 → DPS_REF=63（用 arrow 作基準）
- lv4：lv4 的 DPS_REF 也需要確認是否用 arrow 基底還是混合

原則：**DPS_REF 統一用 AOE=0 的 arrow 基底塔來校準**，
cannon 因 AOE 加成自然得到更高的分數，反映其實際戰力。

---

## 實作修改：`skill-editor.html`

在 `computeScoreBreakdown` 中更新 DPS 計算：

```js
const AOE_DENSITY = 0.5;
const dpsActual = (unit.damage || 0) * (unit.atkSpd || 0);
const aoeMultiplier = 1 + (unit.aoe || 0) * AOE_DENSITY;
const effectiveDPS = dpsActual * aoeMultiplier;
const dpsScoreActual = Math.round(effectiveDPS * (target / (DPS_REF[lv] || 1)) * 10) / 10;
```

---

## 執行

此修改應與 think-dps-score.md 的 DPS 評分功能一起實作。
先確認 AOE_DENSITY=0.5 合理後執行。
