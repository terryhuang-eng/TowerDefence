# lv6-quantity-limit — Lv6 升級條件改為數量上限

## 背景與問題

### 原始設計（已廢棄）
Lv6 條件：3 picks 同元素 + `essencePerElem >= CONFIG.essenceLv6Threshold`

### 兩個問題
1. **`CONFIG.essenceLv6Threshold` 從未加入 config.js** → 值為 `undefined` → 精華判斷永遠 false → Lv6 在遊戲中完全無法解鎖
2. **設計決策改變**：玩家認為以「精華累積」作為 Lv6 門檻過於複雜，改為直覺的「全場最多 N 座」數量上限，N 在設定頁可調整，預設 1

### 保留的系統
- `essencePerElem` 累積仍保留（純屬塔攻擊計數），用於 essenceMilestones 里程碑（送兵 HP 加成）
- 精華里程碑獎勵（essenceMilestones / essenceMilestoneBonus）：與 Lv6 分離，繼續運作

---

## 新設計

### Lv6 升級條件
1. 塔為純屬路線（base == infuseElem，已是 Lv5）
2. 同元素 picks >= 3
3. **全場 Lv6 塔數量 < CONFIG.maxLv6Towers**（新增，預設 1）

### CONFIG 新增欄位
```js
maxLv6Towers: 1,  // 全場最多允許的 Lv6 塔數量（0 = 禁用 Lv6）
```

### 升級面板行為
| 狀態 | 顯示 |
|------|------|
| 條件全部滿足 | Lv6 按鈕可點擊 |
| Lv6 數量已達上限 | 按鈕半透明 + 「Lv6 上限已達（1/1）」 |
| picks 不足 | 按鈕半透明 + 「需第3次 X 元素 pick」 |
| picks 不足 + 上限 | 兩個 hint 同時顯示 |

---

## 影響範圍（game.js 涉及處）

| 位置 | 原邏輯 | 新邏輯 |
|------|--------|--------|
| line ~391 `maxTowerLevel` canLv6 | `picks>=3 && essence>=threshold && PURE` | `picks>=3 && PURE && count<max` |
| line ~971–990 Lv4 純屬 else 分支 UI | 顯示「精華 ess/threshold」hint | 顯示「Lv6 上限 count/max」hint |
| line ~1047–1062 Lv5→Lv6 panel | 顯示「精華 ess/threshold」hint | 顯示「Lv6 上限 count/max」hint |
| line ~2193 info panel header | `純屬塔 Lv6（同元素×3 + 精華N）` | `純屬塔 Lv6（同元素×3，全場限 N 座）` |
| 新增 `countLv6Towers()` method | — | 計算 `this.towers` 中 level===6 的數量 |

---

## 步驟清單

| # | 步驟 | 狀態 | 改動檔案 |
|---|------|------|---------|
| step1 | ⬜ | `js/config.js`：加 `maxLv6Towers: 1` | js/config.js |
| step2 | ⬜ | `js/game.js`：countLv6Towers + maxTowerLevel + UI × 3 處 | js/game.js |
| step3 | ⬜ | `skill-editor.html`：config 面板 + exportConfig | skill-editor.html |
