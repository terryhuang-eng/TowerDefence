# THINK: Tower 評分系統設計

**觸發**：think 繼續塔防，塔需要分數系統（DPS分 + 技能分）
**日期**：2026-05-04

---

## 需求摘要

| 需求 | 說明 |
|------|------|
| 每塔每等級有一個 `scoreTarget` | 設計師設定的目標總分 |
| 技能有基準分 (`scoreBase`) | 在 reference 參數下的分數值 |
| 技能分按參數比例縮放 | e.g. 緩速 30% ≈ 緩速 50% × (30/50) |
| 技能實例有 `scoreWeight` | 個別調整乘數（default 1.0），無法靠縮放到定位時用 |
| DPS 分 = 推算值 | `scoreTarget - Σ(技能分)` |
| skill-editor 顯示分數面板 | 即時顯示 DPS 分 / 各技能分 / 總分 |

---

## 分數計算公式

```
computedSkillScore(skill_instance) =
  SKILL_DEFS[type].scoreBase
  × (current_primary_param / scoreRef)    ← 無 scorePrimary 則無縮放
  × skill_instance.scoreWeight            ← default 1.0

skillTotal = Σ computedSkillScore(s)  for s in tower.skills (enabled only)

dpsScore = tower.scoreTarget - skillTotal   ← 設計師用來判斷 DPS 是否合理
```

---

## 影響到的檔案

| 檔案 | 修改內容 |
|------|---------|
| `js/skills.js` | SKILL_DEFS 每條加 `scoreBase`, `scorePrimary`, `scoreRef` |
| `skill-editor.html` | 新增 scoreTarget 欄位、技能 scoreWeight 輸入、分數顯示面板、export 更新 |

---

## 步驟清單

| 步驟 | 檔案 | 內容 | 優先度 |
|-----|------|------|--------|
| step1 | `js/skills.js` | SKILL_DEFS 每個技能加 scoreBase/scorePrimary/scoreRef | **必改** |
| step2 | `skill-editor.html` | getFieldsForTab 加 scoreTarget 欄位（forceShow, default:0） | **必改** |
| step3 | `skill-editor.html` | 技能 row 加 scoreWeight 輸入、toggleSkill 初始化 scoreWeight:1.0 | **必改** |
| step4 | `skill-editor.html` | 加 computeScoreBreakdown() + 分數顯示面板 | **必改** |
| step5 | `skill-editor.html` | export 更新：塔等級含 scoreTarget，fmtSkills 含 scoreWeight | 配套 |

---

## 執行順序

1. `execute score-system/step1.md`
2. `execute score-system/step2.md`
3. `execute score-system/step3.md`
4. `execute score-system/step4.md`
5. `execute score-system/step5.md`

**注意**：step1 完成後 skills.js 即有基準分數定義。step2+3 完成後 editor 可輸入設定。step4 是視覺回饋面板。step5 讓分數資料進入 towers.js export。
