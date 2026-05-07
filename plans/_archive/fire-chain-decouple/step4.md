# step4 — Score 加入 atkSpdSensitive 正規化

## 目標
對所有「實際效果與 atkSpd 線性成比例」的技能，在 score 計算時乘以 `(tower.atkSpd / atkSpd_ref[lv])`，讓分數正確反映不同攻速塔的實際技能貢獻差異。

## 影響範圍
- `js/skills.js`：chill / shred / vulnerability / ignite / detonate 加入 `atkSpdSensitive: true`
- `skill-editor.html`：加入 `ATKSPD_REF` 常數；`computeScoreBreakdown()` 加入正規化邏輯

---

## 為何只改這幾個技能

| 技能 | atkSpd 敏感度 | 加入旗標？ | 原因 |
|------|-------------|-----------|------|
| chill | 線性（stacks/s = atkSpd × N） | ✅ | 風+水(2.2) vs 水+水(1.1) 效率差 2x |
| shred | 線性（同上） | ✅ | 風+土(2.0, ×2) vs 土+土(0.9) 效率差 4.4x |
| vulnerability | 線性（同上） | ✅ | 同理 |
| ignite | 線性（fires/s = atkSpd） | ✅ | 已有 conditionalFactor（step1），再乘 atkSpd 修正 |
| detonate | 線性（fires/s = atkSpd/3） | ✅ | 同上 |
| hpPct | 線性（每 N 攻觸發） | ❌ | `every` 參數已部分描述頻率；另行處理 |
| zone_slow | 無（維持冰冷下限） | ❌ | 非累積，不受攻速影響 |
| zone_shred | 無（維持碎甲下限） | ❌ | 同上 |
| ramp | 複合 | ❌ | scoreBase=2，影響極小 |
| burn | — | ❌（已被 step3 折入 DPS） | 不需要 |

---

## 修改 1：js/skills.js

**定位**：`Grep "chill.*scoreBase"` 找各技能行號

對 chill / shred / vulnerability / ignite / detonate 各加入 `atkSpdSensitive: true`：

```js
chill        : { ..., scoreBase: 2,  scorePrimary: 'stacksPerHit', scoreRef: 1, atkSpdSensitive: true },
shred        : { ..., scoreBase: 25, scorePrimary: 'stacksPerHit', scoreRef: 1, atkSpdSensitive: true },
vulnerability: { ..., scoreBase: 25, scorePrimary: 'stacksPerHit', scoreRef: 1, atkSpdSensitive: true },
ignite       : { ..., scoreBase: 15, scorePrimary: 'flat',         scoreRef: 0.2, ..., atkSpdSensitive: true },
detonate     : { ..., scoreBase: 20, scorePrimary: 'ratio',        scoreRef: 0.8, ..., atkSpdSensitive: true },
```

---

## 修改 2：skill-editor.html

### A. 加入 ATKSPD_REF 常數（與 LEVEL_SCORE_STD 同處，約 909 行）

**定位**：`Grep "const LEVEL_SCORE_STD"` → 確認行號 → Read ±3 行

```js
// 加在 DPS_REF 行下方：
const ATKSPD_REF = { lv3: 1.2, lv4: 1.2, lv5: 1.2, lv6: 1.5 };
```

**參考值說明**：
- `lv4: 1.2`：火系 proc 塔的典型攻速（火+火弓手 1.2 為基準點），atkSpd=1.2 的塔分數不受影響
- `lv5: 1.2`：Lv5 proc 塔中位數
- `lv6: 1.5`：純火 Lv6 的 atkSpd=1.8，以 1.5 為基準略微抬高分數起點
- lv1/lv2/lv3 無 proc 技能，不需要定義（訪問時 fallback 到 1.0）

### B. computeScoreBreakdown 中加入正規化（約 940–953 行，每個技能計算完 score 後）

**定位**：`Grep "const weight = .s.scoreWeight"` → 找到 score × weight 的位置

在 `score = Math.round(score * weight * 10) / 10;` **之前**，加入：

```js
// atkSpdSensitive 正規化：依塔的實際攻速修正 score
if (def.atkSpdSensitive && unit.atkSpd) {
  const atkRef = ATKSPD_REF[lv] ?? 1.0;
  score *= (unit.atkSpd / atkRef);
}
```

並且在 return 的 row 物件中加入 `atkSpdMult` 供 UI 顯示：

```js
return {
  name: def.name,
  score,
  weight,
  conditionalFactor: ...,   // 已存在（step2）
  atkSpdMult: def.atkSpdSensitive ? Math.round((unit.atkSpd||1) / (ATKSPD_REF[lv]??1.0) * 100) / 100 : undefined
};
```

### C. 分析面板顯示攻速乘數（renderScorePanel，約 620–630 行）

**定位**：`Grep 'condLabel'`（step2 已加過）→ 在同一行附加 atkSpd 標記

```js
const atkSpdLabel = r.atkSpdMult !== undefined && r.atkSpdMult !== 1
  ? ` <span style="color:#8cf;font-size:10px">⚡×${r.atkSpdMult}（攻速）</span>`
  : '';
h += `<div class="score-row">　${r.name} ×${r.weight} → <b>${r.score}</b> pts${condLabel}${atkSpdLabel}</div>`;
```

---

## 預期效果

**Lv4 風+土（沙暴塔，atkSpd=2.0, shred stacksPerHit=2）**

| 項目 | step4 前 | step4 後 |
|------|---------|---------|
| shred score（base） | 25 × (2/1) = 50 pts | 50 × (2.0/1.2) = **83.3 pts** |
| 顯示 | 碎甲 ×1.0 → 50 pts | 碎甲 ×1.0 → 83.3 pts ⚡×1.67（攻速） |

**Lv4 土+土（岩砲台系，atkSpd=0.9, shred stacksPerHit=2）**

| 項目 | step4 前 | step4 後 |
|------|---------|---------|
| shred score | 50 pts | 50 × (0.9/1.2) = **37.5 pts** |
| 顯示 | 碎甲 ×1.0 → 50 pts | 碎甲 ×1.0 → 37.5 pts ⚡×0.75（攻速） |

**Lv4 火+火弓手（atkSpd=1.2, ignite flat=0.25）— 已有 conditionalFactor=0.75（step1）**

- ignite score = 15 × (0.25/0.2) × 0.75 × (1.2/1.2) = **14.1 pts**（step4 無影響，因為 atkSpd = ref）

---

## 注意事項

1. **不改遊戲邏輯**：所有修改僅在 skill-editor 的評分計算，zero 遊戲影響
2. **conditionalFactor 與 atkSpdSensitive 獨立相乘**：ignite/detonate 同時受兩者修正，邏輯上不重複（條件觸發率 × 攻速正規化是獨立維度）
3. **ATKSPD_REF 可調**：放在常數區，設計師可在 skill-editor 調整後看到實時分數變化
4. **分數整體會偏移**：風系高攻速塔的 chill/shred 分數大幅提升（×1.5~×2），土系低攻速塔降低。執行後需要審查這些塔的 `score_adj`。
