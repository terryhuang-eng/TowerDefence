# Plan: dmg-type — 塔傷害元素類型獨立欄位

## 問題分析

### 現況
`doDmg()` 在 game.js 的所有傷害呼叫均使用 `tw.elem`：
```js
this.doDmg(e, effDmg, tw.elem, tw)  // L2701, L2704, L2724, L2683
```

`tw.elem` = 塔的**基底元素**（升 Lv3 時玩家選擇），用於：
1. 元素克制 `CONFIG.elemAdv[elem][enemy.elem]`（L2270-2272）
2. 抗性計算 `enemy.resist[elem]`（L2281-2282）

### 根本問題
傷害元素 = 塔元素，**硬綁定**，無法設定「打出非基底元素的傷害」。
towers.js 的 `ELEM_BASE` 等定義中也沒有 `dmgType` 欄位。
skill-editor 的 towers tab 欄位定義（`getFieldsForTab()`）沒有 `elem`/`dmgType` 可調整。

### 使用情境（需求）
- 某些 Lv3 砲塔可能設計上打出「非基底元素」傷害
  - 例：火砲台 AOE 傷害實際是「火+燃燒」，但想讓某塔打 water 傷害
- 某些 Lv4 注入塔可能打出注入元素傷害而非基底元素
- 未來自訂塔設計的彈性

---

## 解決方案

新增可選的 `dmgType` 欄位（string | null）：
- 不設定（`null` / `undefined`）→ fallback 用 `tw.elem`（維持現有行為）
- 有設定 → 傷害計算使用 `dmgType` 元素

```
doDmg(e, dmg, tw.dmgType || tw.elem, tw)
```

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1 | `js/towers.js` | ELEM_BASE（及其他需要的塔）加入 `dmgType` 欄位（預設 null / 可指定元素） |
| step2 | `skill-editor.html` | towers tab 編輯面板加入 `dmgType` select 欄位（null + 6元素）+ 匯出時輸出 |
| step3 | `js/game.js` | 所有 `doDmg(..., tw.elem, ...)` 改為 `doDmg(..., tw.dmgType || tw.elem, ...)` |

## 執行順序
step1 → step2 → step3（各步驟獨立，但 step2 依賴 step1 的欄位定義，step3 依賴 step1 的資料存在）
