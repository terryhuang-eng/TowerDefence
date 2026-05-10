# Step 3：js/towers.js — makeSkill pierce 全面更新

## 目標檔案
`js/towers.js`

## 影響範圍
- 6 處 `makeSkill('pierce', {dmgUp:...})` → 加入 `dmgDown`（原 dmgUp 值）+ `count`
- L403 desc 文字修正

---

## 修改說明

### 6 處 makeSkill 逐一替換

| 行號 | 塔型 | 修改前 | 修改後 |
|------|------|--------|--------|
| L205 | 磐石 earth×earth Lv4 | `{dmgUp:0.05}` | `{dmgDown:0.05, count:5}` |
| L243 | 相位 wind×none Lv4 | `{dmgUp:0.15}` | `{dmgDown:0.15, count:3}` |
| L287 | 相位 none×wind Lv4 | `{dmgUp:0.15}` | `{dmgDown:0.15, count:3}` |
| L370 | 燎原 fire_none_wind TRIPLE Lv5 | `{dmgUp:0.1}` | `{dmgDown:0.1, count:4}` |
| L404 | 磐石塔 PURE earth Lv5 | `{dmgUp:0.2}` | `{dmgDown:0.2, count:4}` |
| L406 | 磐石塔 PURE earth Lv6 | `{dmgUp:0.25}` | `{dmgDown:0.25, count:5}` |

> count 建議值依塔型設計：低遞減塔取更多目標；Lv5/6 上限也較高；值均可在 skill-editor 調整。

### L403 desc 文字

修改前：
```javascript
desc: '純土強化：穿透貫穿（後排+dmgUp傷害），大射程重型砲擊',
```
修改後：
```javascript
desc: '純土強化：穿透貫穿（後排−dmgDown傷害），大射程重型砲擊',
```

---

## 驗證
- skill-editor 開啟各 pierce 塔 → 分別顯示對應 dmgDown 和 count 值
- 純土 lv5 desc 文字正確
