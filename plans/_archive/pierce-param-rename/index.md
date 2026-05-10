# 計畫：pierce 技能參數重整（rename + count 新增）

## 問題診斷

### 1. 命名與行為相反

**game.js 實際邏輯**（L2913, L2937）：
```javascript
const pDown = pierceSk.dmgUp;               // 名叫 dmgUp
const ratio = Math.max(0.3, 1 - i * pDown); // 但實際是「遞減」
```
→ `dmgUp` 越大，後排傷害越低，名稱與行為完全相反。

### 2. 穿透目標數無上限

`lineTargets.forEach(...)` 對路徑上所有目標攻擊，無法依塔型設定上限。
→ 需要 `count` 參數控制最大穿透數量。

---

## 修正內容

| 項目 | 現況 | 修正後 |
|------|------|--------|
| 參數名 | `dmgUp` | `dmgDown` |
| 說明文字 | 「每穿 +X%」 | 「每穿 −X%」 |
| 最大穿透數 | 無限制 | `count`（per-tower 可設） |

---

## 現有 pierce 塔清單

| 行號 | 塔型 | dmgUp→dmgDown | 建議 count | 說明 |
|------|------|--------------|-----------|------|
| L205 | 磐石（earth×earth Lv4）| 0.05 | 5 | 低遞減設計，可打多目標 |
| L243 | 相位（wind×none Lv4） | 0.15 | 3 | 中等穿透 |
| L287 | 相位（none×wind Lv4） | 0.15 | 3 | 中等穿透 |
| L370 | 燎原塔（fire_none_wind TRIPLE Lv5）| 0.10 | 4 | Lv5 較強 |
| L404 | 磐石塔（PURE earth Lv5）| 0.20 | 4 | 純屬強化 |
| L406 | 磐石塔（PURE earth Lv6）| 0.25 | 5 | 終極，高遞減但打最多 |

> count = 含主目標在內的最大穿透數（slice(0, count)）

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | js/skills.js | `dmgDown` 替換 `dmgUp` + 新增 `count` defaults + desc/Brief 更新 |
| step2.md | js/game.js | `pierceSk.dmgUp→dmgDown` + `lineTargets.slice(0, count)` |
| step3.md | js/towers.js | 6 處 makeSkill `dmgUp→dmgDown` + 加入 `count` 值 + L403 desc 修正 |

## 驗證清單
- [ ] skill-editor 開啟 pierce 塔 → 顯示 `dmgDown` 和 `count` 兩個參數欄位，說明顯示「每穿 −X%，最多 N 體」
- [ ] 遊戲中 pierce 塔攻擊：路徑上超過 count 的目標不受傷
- [ ] 路徑上目標少於 count：正常攻擊全部，無 bug
- [ ] count = 1 時：只打主目標，等同非穿透塔
