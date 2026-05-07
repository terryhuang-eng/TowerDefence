# Step 2：towers.js — hpPct makeSkill 加 cap 參數

## 目標
在所有 INFUSIONS 中的 hpPct skill 加入 `cap: 120`，
使 step1 的 cap 邏輯能讀到參數值。

## 影響範圍
- 檔案：`js/towers.js`
- 對象：INFUSIONS 的**雷底 6 座**（共 ~8 個 hpPct makeSkill 呼叫）
- 範圍：只改 makeSkill('hpPct', {...}) 的參數，不動其他欄位

---

## 定位方式

```
Grep 找：makeSkill\('hpPct'
→ 找出所有 hpPct 呼叫的行號
→ 每個 Read ±3 行確認後再 Edit
```

## 需要修改的塔（雷底 6 座）

| 塔 | 位置 | 原始參數 | 修改後 |
|----|------|---------|--------|
| 雷×火 電漿 | INFUSIONS.thunder.fire.lv4 | `{pct:0.03,every:3,cd:1}` | `{pct:0.03,every:3,cd:1,cap:120}` |
| 雷×水 感電 | INFUSIONS.thunder.water.lv4 | `{pct:0.02,every:3,cd:1}` | `{pct:0.02,every:3,cd:1,cap:120}` |
| 雷×土 震盪 | INFUSIONS.thunder.earth.lv4 | `{pct:0.02,every:3,cd:1}` | `{pct:0.02,every:3,cd:1,cap:120}` |
| 雷×風 雷暴 | INFUSIONS.thunder.wind.lv4 | `{pct:0.02,every:4,cd:1}` | `{pct:0.02,every:4,cd:1,cap:120}` |
| 雷×雷 雷霆 | INFUSIONS.thunder.thunder.lv4 | `{pct:0.04,every:3,cd:0.8}` | `{pct:0.04,every:3,cd:0.8,cap:120}` |
| 雷×無 賞金 | INFUSIONS.thunder.none.lv4 | `{pct:0.02,every:4,cd:1}` | `{pct:0.02,every:4,cd:1,cap:120}` |

## 同時檢查 TRIPLE_TOWERS (Lv5)

```
Grep 找：makeSkill\('hpPct' 在 TRIPLE_TOWERS 範圍
→ 如有 hpPct 也加上 cap:120
```

已知 TRIPLE_TOWERS 包含 hpPct 的塔（來自 towers.js 讀取結果）：
- `fire_thunder_water` 間歇塔：`{pct:0.02,every:3,cd:1}` → 加 `cap:120`

## 修改模式（每個 Edit 一次，共 7 個）

```
old: makeSkill('hpPct', {pct:0.03,every:3,cd:1})
new: makeSkill('hpPct', {pct:0.03,every:3,cd:1,cap:120})
```

每個 Edit 用完整的 old_string（含前後文字）確保唯一匹配。

## 注意
- step1 完成後才執行（cap 參數需要 game.js 先能讀取）
- 完成後提醒執行 `/clear`
