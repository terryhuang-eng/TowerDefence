# Step 1：修正 ELEM_BASE 的 dmgType null → 對應元素值

**目標**：讓 skill-editor 顯示 Lv3 元素塔時，「傷害元素」欄位正確顯示對應元素而非「預設/基底元素」

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/js/towers.js`

---

## 定位方法

Grep: `dmgType: null` → 找到所有 12 個條目
Read ±3 行確認各元素 context

---

## 具體修改

ELEM_BASE 每個 `dmgType: null` 改為對應元素：

| 元素 | 修改前 | 修改後 |
|------|--------|--------|
| fire | `dmgType: null` | `dmgType: 'fire'` |
| water | `dmgType: null` | `dmgType: 'water'` |
| earth | `dmgType: null` | `dmgType: 'earth'` |
| wind | `dmgType: null` | `dmgType: 'wind'` |
| thunder | `dmgType: null` | `dmgType: 'thunder'` |
| none | `dmgType: null` | `dmgType: null` ← **保留 null**（虛空塔無屬性傷害，設計正確） |

共修改 10 個（fire×2, water×2, earth×2, wind×2, thunder×2），none×2 保留 null。

---

## 注意

- `none` 的兩個塔（虛空弓/虛空砲）本來就是無屬性傷害，`dmgType: null` 是正確的，不用改。
- 這個修改只影響資料定義，不影響 game.js 的實際傷害計算（遊戲中靠 `tw.elem` 生效，此修改讓 editor 顯示一致）。

---

## 影響範圍

只影響 `js/towers.js` 的 ELEM_BASE 靜態資料，不影響遊戲邏輯。
