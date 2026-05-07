# THINK: 基本屬性欄位改動後分數面板不更新

**觸發**：改 score_adj、scoreTarget 後分數沒變
**日期**：2026-05-04

---

## 問題

`updateField` 處理所有基本屬性欄位（damage、score_adj、scoreTarget 等），
更新資料後只呼叫 `renderList()`，沒有觸發分數面板重繪。

```js
function updateField(key, value, type) {
  ...
  renderList();  // ← 只更新左側清單，分數面板沒重繪
}
```

**影響欄位**：score_adj、scoreTarget（這兩個改了應該重算分數）
**不影響欄位**：damage、atkSpd、range — 這些不進入分數公式（設計如此，見下方說明）

---

## 修法：`skill-editor.html`

`updateField` 末尾加一行：

```js
function updateField(key, value, type) {
  const unit = getSelectedUnit();
  if (!unit) return;
  if (type === 'number') unit[key] = parseFloat(value) || 0;
  else if (type === 'bool') unit[key] = value === 'true';
  else if (type === 'select') unit[key] = value === '' ? null : value;
  else unit[key] = value;
  renderList();
  if (currentTab === 'towers') renderPanel();  // ← 加這行
}
```

---

## 為什麼 damage 不影響分數（設計說明）

分數系統的邏輯：

```
scoreTarget（目標） = 等級標準分 × 塔級調整
skillTotal（技能分） = Σ 各技能的參數評估分
DPS 剩餘 = scoreTarget - skillTotal
```

**DPS 剩餘不是實際 DPS**，而是「這個塔的設計預算中，留給 DPS 的空間有多少」。

| 塔的哪個部分 | 進分數系統？ | 說明 |
|------------|-----------|------|
| 技能參數（cap、dot 等） | ✓ 進 skillTotal | 技能設計強弱的直接評估 |
| score_adj | ✓ 影響 scoreTarget | 整塔技能預算比例 |
| scoreTarget | ✓ 直接設定目標 | 手動覆蓋 |
| damage | ✗ 不進公式 | DPS 空間由設計師自行控制 |
| atkSpd | ✗ 不進公式 | 同上 |
| range | ✗ 不進公式 | 同上 |

換句話說：**分數系統只評估技能，DPS 靠設計師手動配合 DPS 剩餘來調整 damage/atkSpd**。

---

## 完成條件

改 score_adj → 目標分數即時重算
改 scoreTarget → 目標分數即時更新為手動覆蓋值
改 damage/atkSpd/range → 分數不變（正確行為）

---

## 執行

單一改動，`skill-editor.html` 的 `updateField` 加一行。
