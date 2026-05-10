# 純屬塔技能重設計 — 完整執行計畫

## 設計哲學（已確認）
- **純屬塔** = 獨立輸出，單塔可在任何情境擊殺敵人，不依賴隊友
- **混合塔** = 控制 / 輔助 / 特殊，直接傷害較低
- **LV6 光環三角**：土=傷害光環 / 風=射程光環 / 雷=射速光環（DPS = dmg × spd × range）

---

## 六元素純塔最終定位

| 元素 | 攻速 | 核心機制 | LV5 | LV6 簽名 |
|------|------|---------|-----|---------|
| 🔥 火 | 慢 | 單體 DOT + 無視護甲 | burn + ignite | + detonate |
| 💧 水 | 中 | AOE + 緩速（自增效）| AOE + chill | + hpPct |
| ⛰️ 土 | 慢 | 穿透後排遞增 + 大射程 | pierce | + aura_dmg |
| 🌪️ 風 | 中 | 動量 ramp（切換衰減）| ramp | + aura_range |
| ⚡ 雷 | 快 | 三連射齊發 | multishot | + aura_atkSpd |
| ⬜ 無 | 中 | 經濟複利（財富積累+利息）| killGold + wealthScale | + interest |

---

## 技能異動總表

| 技能 | 變動 | 原因 |
|------|------|------|
| wealthScale（新） | 加入 SKILL_DEFS | 無屬性核心 |
| interest（新） | 加入 SKILL_DEFS | 無屬性核心 |
| ramp | 加入 `switchLoss` 參數 | 切換目標衰減而非歸零 |
| frostbite | 標記 deprecated，從純塔移除 | 功能與 hpPct 重疊 |
| ignite | 純火塔保留，但 LV6 才出現 | LV5 只有 burn |
| detonate | 從 LV5 移出，只在 LV6 | 作為終極簽名技能 |
| hpPct | 從純雷移到純水 LV6 | 「水的侵蝕」語意更合 |
| chain | 從純雷移出 → 混合塔 | 純雷改用 multishot |
| execute | 從純雷移出 → 混合塔 | 純雷改用 multishot |
| shred | 從純土移出 → 混合塔 | 純土改用 pierce |
| vulnerability | 從純土移出 → 混合塔 | 純土改用 pierce |
| aura_atkSpd | 移至純雷 LV6 | 雷的全場射速光環 |
| aura_range | 確認在純風 LV6（目前 LV6 誤設為 aura_dmg）| 修正錯誤 |
| aura_dmg | 確認在純土 LV6 | 從純風 LV6 移出 |
| multishot | 從混合塔移至純雷 | 雷系核心傷害 |

---

## 執行順序

### Phase 1 — 無屬性技能（可立即執行）

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step2.md | js/skills.js | 新增 wealthScale + interest 定義 + desc |
| step3.md | js/game.js | wealthScale 傷害邏輯 + interest 波末結算 |
| step4.md | js/towers.js | PURE_TOWERS.none + INFUSIONS.none.none |

### Phase 2 — 機制調整

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step5.md | js/skills.js | ramp 加 switchLoss 參數；frostbite 標記 deprecated |
| step6.md | js/game.js | ramp 切換衰減邏輯（第 2826 行）；移除 frostbite 傷害邏輯 |

### Phase 3 — 五元素純塔重寫

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step7.md | js/towers.js | PURE_TOWERS 五元素（火/水/土/風/雷）完整重寫 |

### Phase 4 — 說明同步

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step8.md | index.html | showSkillRef() 新增 wealthScale/interest 說明；更新 ramp 說明；移除 frostbite |

---

## 各 Phase 完成後的驗證清單

### Phase 1 驗證
- [ ] 場上純無 LV5 塔：持有 200g 時傷害 = baseDmg + 8（200/25）
- [ ] 場上純無 LV6 塔：打完一波 battle log 出現「💰 利息 +Xg」
- [ ] 利息計算基準是 income 入帳後的 gold，不是 pre_wave 期間的 gold

### Phase 2 驗證
- [ ] ramp 切換目標後 `_rampBonus` 降低 switchLoss 層，不歸零
- [ ] 快速清群（波次密集）ramp 幾乎不損失
- [ ] frostbite 相關塔型在 skill-editor 不再出現此技能

### Phase 3 驗證
- [ ] 純火 LV5：burn+ignite，無 detonate
- [ ] 純火 LV6：burn+ignite+detonate
- [ ] 純水 LV6：chill+hpPct，無 frostbite/freeze
- [ ] 純土 LV5/6：pierce（後排遞增），LV6 加 aura_dmg
- [ ] 純風 LV6：ramp + aura_range（非 aura_dmg）
- [ ] 純雷 LV5/6：multishot，LV6 加 aura_atkSpd

### Phase 4 驗證
- [ ] 說明頁 📖 技能說明 → Tab1 出現 wealthScale 和 interest
- [ ] ramp 說明提及切換衰減行為
- [ ] frostbite 不再出現在說明頁（或標記廢棄）
