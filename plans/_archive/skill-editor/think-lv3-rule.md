# THINK: LV3 無技能規則確立

**觸發**：LV3 純 DPS，技能從 LV4 開始
**日期**：2026-05-04

---

## 設計規則（準備寫入）

```
LV3 元素塔：
- 無任何技能（skills: []）
- 元素身份只透過 dmgType 體現（元素三角傷害加成）
- 元素間差異來自 damage / atkSpd 數值調整（可選）
- 定位：比 LV1/LV2 更強的純 DPS 塔

LV4 雙屬塔（注入）開始有技能。
```

---

## 需要修改的地方

### 1. `js/towers.js` — ELEM_BASE

所有非 none 元素的 skills 清空，desc 改為純 DPS 描述：

| 塔 | 現在 | 修改後 |
|----|------|------|
| 焰弓手/焰砲台 | burn+ignite+detonate | skills: [] |
| 冰弓手/潮砲台 | chill | skills: [] |
| 岩射手/岩砲台 | shred | skills: [] |
| 風弓手/風砲台 | ramp | skills: [] |
| 雷弓手/雷砲台 | hpPct | skills: [] |
| 虛空弓/虛空砲 | 已經是 [] | 不動 |

### 2. `CLAUDE.md`（專案規則）— 寫入 LV3 設計規則

在「升級路徑」章節補充：
```
LV3 規則：無技能，純 DPS。元素差異僅透過 dmgType 和數值體現。
技能從 LV4（雙屬注入）開始。
```

---

## 分數影響

移除技能後，lv3 所有塔：
```
skillTotal = 0
DPS分      = damage × atkSpd × (scoreTarget / DPS_REF[lv3])
總分        = DPS分
```

目前 damage/atkSpd 全部一樣（arrow=45×1.4=63，cannon=52×0.8=41.6）：

| 類型 | DPS | DPS分（STD=80, DPS_REF=63）| 評估 |
|------|-----|------------------------|-----|
| arrow | 63 | 80.0 | = 目標 ✓ |
| cannon | 41.6 | 52.8 | < 目標（AOE 沒計入分數）|

cannon 分數低是因為 AOE 不在 DPS 公式裡。**這是可接受的**：cannon 的 AOE 本身就是一種「隱性技能」，不需要反映在分數系統內。

---

## 待確認的設計決策

### Q: LV3 各元素的 damage/atkSpd 應該相同還是有差異？

**選項 A**：全部相同（目前狀態），元素差異只靠 dmgType（火傷×1.3 優勢等）
- 優點：設計簡單、均衡一致
- 缺點：感覺不出元素風格差異

**選項 B**：各元素有不同數值，反映元素特性
```
fire：damage 高（55）、攻速慢（1.2）→ 爆發感
water：damage 中（45）、攻速中（1.4）→ 穩定
earth：damage 高（50）、攻速慢（1.1）→ 厚重
wind：damage 低（35）、攻速快（2.0）→ 快速
thunder：damage 中（45）、攻速中（1.4）→ 均衡
none：damage 中（45）、攻速中（1.4）→ 均衡
```
（各元素 DPS 仍然接近 63，維持分數平衡）

- 優點：元素風格感更強，為 LV4 技能路線鋪墊
- 缺點：需要獨立調整每個塔的數值

---

## 執行步驟

1. **確認 Q（各元素數值相同還是差異化）**
   → 使用者決定後再執行

2. `execute skill-editor/think-lv3-rule.md → step A`
   修改 towers.js：ELEM_BASE 所有 skills 清空 + desc 更新

3. `execute skill-editor/think-lv3-rule.md → step B`
   修改 CLAUDE.md：寫入 LV3 設計規則

---

## 規則草稿（供 CLAUDE.md 寫入）

```markdown
## LV3 元素塔設計規則
- 無技能（skills 永遠為空）
- 元素身份透過 dmgType 決定（影響元素三角加成）
- 元素差異可透過 damage/atkSpd 數值反映（可選）
- 技能從 LV4 雙屬注入開始，代表玩家主動選擇的方向
```
