# THINK: skill-editor 傷害元素顯示問題分析

**觸發**：think 目前skill_editor塔頁面看到的傷害元素都是預設/基底元素
**日期**：2026-05-04

---

## 問題確認

用戶觀察：skill-editor 塔頁面，所有塔的「傷害元素」欄位都顯示「（預設/基底元素）」。

**這個觀察完全正確**，原因如下。

---

## 根因分析

### A. skill-editor 的資料來源

`getTowerByFlatIdx()` 返回的是**靜態數據物件（level data object）**，而非遊戲中的 tower instance：

| 塔等級 | 返回的物件 | dmgType 欄位狀態 |
|--------|-----------|----------------|
| Lv1-2 BASIC | `BASIC_TOWERS[key].levels[lv]` | **不存在**，fall back 到 `f.default = null` |
| Lv3 ELEM_BASE | `ELEM_BASE[elem][base]` | **明確設為 `null`** |
| Lv4 INFUSIONS | `INFUSIONS[base][inj].lv4` | **不存在**，fall back 到 `f.default = null` |
| Lv5 TRIPLE | `TRIPLE_TOWERS[key].lv5` | **不存在**，fall back 到 `f.default = null` |
| Lv6 PURE | `PURE_TOWERS[elem].lv6` | **不存在**，fall back 到 `f.default = null` |

全部都顯示「（預設/基底元素）」的原因：`dmgType` field 設定了 `forceShow: true, default: null`，null → 空值 option → 顯示「（預設/基底元素）」。

### B. 遊戲中的實際傷害元素計算

`game.js:2695`：
```javascript
const twDmgElem = tw.dmgType || tw.elem;
```

塔 instance 升級時（所有等級）：
```javascript
Object.assign(t, { damage, atkSpd, range, aoe, skills })
```
**`dmgType` 從未被複製到 tower instance。**

所以：
- `tw.dmgType` 永遠是 `undefined`
- `twDmgElem = undefined || tw.elem = tw.elem`
- 遊戲實際上只用 `tw.elem` 作為傷害元素

### C. 遊戲行為是否正確

| 等級 | tw.elem | twDmgElem | 傷害元素計算 | 是否符合預期 |
|------|---------|-----------|-------------|------------|
| Lv1-2 | `null` | `null` | 無元素（無克制計算） | ✅ 正確 |
| Lv3 ELEM_BASE 火 | `'fire'` | `'fire'` | 火元素傷害 | ✅ 正確 |
| Lv4 火+水注入 | `'fire'` | `'fire'` | 火（基底）元素傷害 | ✅ 正確 |
| Lv5 三屬塔 | `'fire'` (基底) | `'fire'` | 火（基底）元素傷害 | ✅ 正確 |
| Lv6 純屬塔 | `'fire'` | `'fire'` | 火元素傷害 | ✅ 正確 |

**遊戲邏輯本身無誤**，但 `dmgType` 欄位作為「覆蓋傷害元素」的功能實際上**無法運作**。

---

## 問題清單

### ❌ 問題 1：Lv3 ELEM_BASE 的 dmgType 應該填入對應元素，而非 null

**位置**：`js/towers.js` ELEM_BASE 所有 12 個條目
**現狀**：`dmgType: null`（包含 fire.arrow、fire.cannon…所有元素）
**應為**：`dmgType: 'fire'`（依各自元素）

**為什麼重要**：
- skill-editor 顯示的是 data object，讀取 `dmgType` 欄位
- 若 `dmgType: null`，editor 顯示「預設/基底元素」，看不出「到底是哪個元素」
- 遊戲中靠 `tw.elem` 生效，但 editor 資料填 null 是不一致的

### ❌ 問題 2：INFUSIONS/TRIPLE_TOWERS/PURE_TOWERS 的 lv4/lv5/lv6 data 沒有 dmgType 欄位

**位置**：`js/towers.js` INFUSIONS（36個）、TRIPLE_TOWERS（20個）、PURE_TOWERS（6個）
**現狀**：lv4/lv5/lv6 物件根本沒有 `dmgType` 鍵，editor 用 `f.default = null` 填充
**應為**：加入 `dmgType: null`（意義：依基底元素 `tw.elem`）或明確元素值

**為什麼重要**：
- Editor 顯示「預設/基底元素」是對的（這些塔確實用基底元素），但 editor 拿到的是 undefined（靠 default 填充），而非明確的 null

### ❌ 問題 3：dmgType 即使在 editor 設定了值也無法生效

**位置**：`js/game.js` 所有升級路徑的 `Object.assign(t, { damage, atkSpd, range, aoe, skills })`
**現狀**：Object.assign 不含 `dmgType` → tower instance 上 `tw.dmgType` 永遠 undefined
**應為**：若 data 有 `dmgType`（非 null），應複製到 instance

**為什麼重要**：
- 「特殊塔有特別的傷害類型」的設計意圖（如一個水底塔注入火，但傷害是水屬）需要 `dmgType` 覆蓋功能
- 目前這功能完全靜默失效

### ❌ 問題 4：INFUSIONS/TRIPLE/PURE 的 export 不含 dmgType

**位置**：`skill-editor.html` export 函數
**現狀**：export INFUSIONS/TRIPLE_TOWERS/PURE_TOWERS 時，lv4/lv5/lv6 的模板硬寫不含 `dmgType`
**應為**：條件輸出 `dmgType`（若有設定非 null 值）

---

## 步驟清單

| 步驟 | 檔案 | 內容 | 優先度 |
|-----|------|------|-------|
| step1 | `js/towers.js` | 修正 ELEM_BASE 12 個條目的 `dmgType: null` → 各自元素值（如 `'fire'`）| **必改** |
| step2 | `js/towers.js` | INFUSIONS lv4 加入 `dmgType: null`；TRIPLE lv5 加入 `dmgType: null`；PURE lv6 加入 `dmgType: null` | 建議 |
| step3 | `js/game.js` | 所有升級路徑 Object.assign 加入 dmgType 傳遞邏輯（有明確值則覆蓋） | **必改**（若要讓覆蓋功能生效）|
| step4 | `skill-editor.html` | export 函數對 INFUSIONS/TRIPLE/PURE 加入 dmgType 條件輸出 | 配套 step3 |

---

## 執行順序

1. `execute fix-dmgtype-display/step1.md` — 修正 ELEM_BASE dmgType 資料（最小可見修正）
2. `execute fix-dmgtype-display/step2.md` — 補齊 INFUSIONS/TRIPLE/PURE 的 dmgType 欄位
3. `execute fix-dmgtype-display/step3.md` — game.js 升級路徑支援 dmgType 傳遞
4. `execute fix-dmgtype-display/step4.md` — skill-editor export 補上 dmgType

**注意**：step1 單獨完成後，skill-editor 顯示 Lv3 塔就能正確顯示元素了。step3+4 是讓 dmgType 覆蓋功能真正生效。
