# Step 1：六屬純塔定位確認 + 技能重分配決策

## 設計前提

- 純屬塔 = 自立輸出，單塔可面對任何情境（不依賴隊友才能殺敵）
- 控制 / 輔助 / CC 技能 = 混合塔的附加值，純塔可有少量但不作為主軸
- 「三大光環」在 LV6 橫跨三個元素，形成互補 DPS 系統：
  - ⛰️ 土 LV6 = 傷害光環（×damage）
  - 🌪️ 風 LV6 = 射程光環（×range）
  - ⚡ 雷 LV6 = 射速光環（×atkSpd）

---

## 一、六元素新願景 vs 現況對比

### 🔥 火（單體 + 攻速慢 + DOT + 無視護甲）

| 等級 | 新願景 | 現況 | 差異 |
|------|-------|------|------|
| LV4（INFUSIONS） | 中單體 + burn + 小 ignite | burn+ignite（已合法）| 技能存在，參數需對齊 |
| LV5 | 大單體 + burn + 大 ignite | burn+ignite+detonate | detonate 提前（設計與願景不符）|
| LV6 | 大單體 + burn + ignite + detonate（無視護甲）| 同上 | 位置正確，但 ignite 應合併入 burn |

**結論：** ✅ 定位清晰，最小改動。主要工作是 burn+ignite 合併（igniteMult 參數）。

---

### 💧 水（範圍 + 攻速中 + 緩速疊加 + %HP）

| 等級 | 新願景 | 現況 | 差異 |
|------|-------|------|------|
| LV4 | 中範圍 + chill（疊加慢）| chill+zone_slow（部分）| 部分符合 |
| LV5 | 大範圍 + chill（疊加中）| chill+frostbite | frostbite 移除，替換 |
| LV6 | 大範圍 + chill（疊加中）+ hpPct | chill+freeze+frostbite | 完整重設計 |

**結論：** 需要明確改動：
- `frostbite` 從純水塔移除（功能與 hpPct 重疊，設計廢棄）
- `freeze`（定身）從純水 LV6 移出 → 歸混合塔（水×水的 CC 路線）
- `hpPct` 從雷系移入水系 LV6（「水的侵蝕」語意）
- 純水 LV4/LV5 保留 chill（緩速累積是水的 DPS 工具：敵人在射程內停留更久 = 更多 hits）

**chill 保留理由：** chill 對純水是 DPS 放大器（減速 = 更多命中次數），不是純粹控制。與「純塔可有少量控制，但不作為主軸」相符。

---

### 🌪️ 風（單體 + 攻速中 + ramp + 射程光環）

| 等級 | 新願景 | 現況 | 差異 |
|------|-------|------|------|
| LV4 | 中小單體 + ramp（疊加中）| ramp+aura_range | 有 aura 太早 |
| LV5 | 中小單體 + ramp（疊加中快）| ramp+aura_range（LV5） | 基本符合 |
| LV6 | 中單體 + ramp + 射程光環 | ramp+aura_dmg（❌ 傷害光環，不是射程）| 光環類型錯誤 |

**結論：** 兩個問題：
1. **LV6 光環搞反了**：現況 LV6 風是 `aura_dmg`，但願景是 `aura_range`（射程光環）
2. **LV4 風的 INFUSIONS 版** 不應有光環，純 ramp 累積即可（光環是 LV6 的獎勵）
3. **ramp 參數重整**：LV5 vs LV6 的 ramp 數值應有明顯梯度（LV6 cap 更高）

**攻速「中」的問題：**
現況純風 LV5 的 atkSpd=2.7（偏高），用戶說「攻速中」。建議 atkSpd 拉回 1.6~2.0，但讓 ramp 的 cap 更高 → 靠持續攻擊達成「越打越快」的爆發感。

---

### ⛰️ 土（大範圍 + 攻速慢 + 大射程 + pierce? + 傷害光環）

| 等級 | 新願景 | 現況 | 差異 |
|------|-------|------|------|
| LV4 | 大範圍 + pierce？ | shred+vulnerability（完全不同）| 完整重設計 |
| LV5 | 超大範圍 + pierce？ | 同上 | 完整重設計 |
| LV6 | 超大範圍 + pierce？ + 傷害光環 | shred only | 完整重設計 |

#### Pierce 適合性分析

**支持 pierce 的論點：**
- 視覺語意：巨石射穿排成一列的敵人，後排更痛（獎勵密集陣型）
- 策略深度：後排越多人，傷害越高，有位置博弈感
- 三者差異：AOE = 圓圈同時，chain = 跳躍遞減，pierce = 線型遞增（三種清群方式各有意義）

**反對 pierce 的論點：**
- 土的「大範圍」語意 = 面積覆蓋，pierce 是線型（方向性）
- 兩個技能同時要 AOE 又要 pierce 在邏輯上衝突（現行程式碼的 pierce 會覆蓋 AOE）
- 複雜度：pierce 的「後排增傷」在平時沒有視覺反饋，玩家難以感受

**建議：**
選一個，不兩者並行：
- **方案A（推薦）：土 = 純 AOE 砲台**，不要 pierce。大射程 + 大 AOE + 傷害光環已經是強力且清晰的定位。pierce 移至混合塔（如土×風 = 大地之刃）。
- **方案B：土 = pierce 穿透**，取消 AOE。每發射出一條線貫穿多個敵人，dmgUp 參數讓後排更痛。射程大 + 攻速慢 + 穿透 = 「重砲穿甲型」。

建議用方案A：土 = 重型砲台（高 dmg × AOE × 傷害光環），pierce 歸混合或棄用。理由：純土的「大範圍」感和「慢節奏重擊」在 AOE 下更直覺。

---

### ⚡ 雷（單體 + 攻速快 + 三連射 + 射速光環）

| 等級 | 新願景 | 現況 | 差異 |
|------|-------|------|------|
| LV4 | 中單體 + multishot | hpPct+execute+killGold | 完整重設計 |
| LV5 | 中單體 + multishot | hpPct+chain | 完整重設計 |
| LV6 | 中上單體 + multishot + 射速光環 | hpPct+chain | 完整重設計 |

**結論：** 完全重設計。
- hpPct 從雷移出 → 水系 LV6
- chain 移出純雷 → 混合塔（雷×水等）
- multishot 成為雷系的純輸出核心技能
- 射速光環（aura_atkSpd）在 LV6 讓全場高頻攻擊

**multishot vs chain 的語意差異確認：**
- multishot = 一次同時射出多發，多個目標各挨一發 → 「雷霆齊射」感
- chain = 一發跳躍，電弧連接 → 更偏電弧/閃電感
- 純雷主題用 multishot（三連射高頻快打）更直接

---

### ⬜ 無（單體 + 攻速中 + ??? + 擊殺獎金）

| 等級 | 新願景 | 現況 | 差異 |
|------|-------|------|------|
| LV4 | 中單體 + ??? | warp+knockback（控制主）| 控制型定位完全相反 |
| LV5 | 中單體 + ??? | warp+knockback | 同上 |
| LV6 | 中上單體 + ??? + killGold | unstable+multishot | 有元素對，但主題不清 |

#### 「無」的核心機制候選

| 機制 | 優點 | 缺點 |
|------|------|------|
| **permaBuff（永久強化）** | 成長感強，每擊殺永久 +atk | 前期弱，玩家需要等待回報 |
| **unstable（不穩定）** | 「無」= 混沌極值，視覺衝擊 | 高變異不穩定，難以依賴 → 違反「避免unkillable」 |
| **execute（斬殺）** | 低HP敵人大幅增傷 | 定位類似 finisher，需要配合其他塔 |
| **ramp（越打越快）** | 已歸風系，不適合無 | 重複 |

**建議：permaBuff 為核心**
- 語意：「無」元素 = 適應性/成長性，沒有先天優勢但能累積
- LV4/5：permaBuff（每擊殺永久 +atkPerKill 傷害）
- LV6：permaBuff + killGold（越殺越強 + 越殺越賺，複利效應）
- 配合策略：放在敵人密集的前方格，靠早期小怪累積，後期成為主力

**替代方案：permaBuff + unstable（兩者共存）**
- LV4：permaBuff only（穩定成長）
- LV5：permaBuff + 少量 unstable（引入不穩定感）
- LV6：permaBuff + killGold（移除 unstable，最終穩定強力）
- 結論：不推薦，混合語意

---

## 二、技能重分配總表

| 技能 | 原歸屬 | 新歸屬 | 處理 |
|------|-------|-------|------|
| burn | 🔥 LV4-6 | 🔥 LV4-6 | igniteMult 參數內化 |
| ignite | 🔥 獨立欄位 | 廢除 | 合入 burn.igniteMult |
| detonate | 🔥 LV5+ | 🔥 LV6 only | 從 LV5 移到 LV6 |
| hpPct | ⚡ 純雷 | 💧 純水 LV6 | 元素重歸屬 |
| chill | 💧 全級 | 💧 全級 | 保留（DPS 工具定位） |
| frostbite | 💧 LV5-6 | 廢除 | 與 hpPct 重複，移除 |
| freeze | 💧 LV6 | 混合塔（水×水）| 從純塔移出 |
| ramp | 🌪️ 純風 | 🌪️ 純風 | 保留，參數整理 |
| aura_range | 🌪️ LV5+6 | 🌪️ LV6 only | 移到 LV6 |
| aura_dmg | 🌪️ 現 LV6 | ⛰️ 土 LV6 | 移到土系 |
| aura_atkSpd | 混合塔 | ⚡ 雷 LV6 | 移到純雷 LV6 |
| pierce | 風×無 混合 | 混合塔 only | 不進純塔 |
| shred | ⛰️ 純土 | 混合塔 only | 從純塔移出 |
| vulnerability | ⛰️ 純土 | 混合塔 only | 從純塔移出 |
| multishot | 無系 混合 | ⚡ 純雷 | 移到純雷 |
| chain | ⚡ 純雷 LV6 | 混合塔 only | 從純塔移出 |
| execute | ⚡ 純雷 LV5 | 混合塔 only | 從純塔移出 |
| permaBuff | （未使用）| ⬜ 純無 | 新增核心 |
| killGold | ⬜ LV6 | ⬜ LV6 | 保留 |
| warp | ⬜ 純無 | 混合塔 only | 從純塔移出 |
| knockback | ⬜ 純無 | 混合塔 only | 從純塔移出 |
| unstable | ⬜ LV6 | 廢除或混合 | 評估後決定 |

---

## 三、純塔六元素最終定位草案

| 元素 | 攻速 | 傷害類型 | LV4 核心 | LV5 強化 | LV6 簽名 |
|------|------|---------|---------|---------|---------|
| 🔥 火 | 慢 | 單體+DOT | burn+ignite(低) | burn+ignite(高) | +detonate(無視護甲) |
| 💧 水 | 中 | 範圍+緩速 | AOE+chill(低疊) | AOE+chill(中疊) | +hpPct(侵蝕真傷) |
| ⛰️ 土 | 慢 | 大範圍重擊 | 大AOE(單技能) | 超大AOE | +aura_dmg(全場增傷) |
| 🌪️ 風 | 中 | 單體+加速 | ramp(中) | ramp(快) | +aura_range(全場增射程) |
| ⚡ 雷 | 快 | 單體+三連 | multishot | multishot | +aura_atkSpd(全場加速) |
| ⬜ 無 | 中 | 單體+成長 | permaBuff | permaBuff(進) | +killGold(複利) |

---

## 四、待確認問題

1. **土的 pierce 最終決定**：方案A（純AOE砲台）vs 方案B（穿透型）？建議方案A，請確認
2. **無的 unstable**：LV5 是否引入少量 unstable？或純 permaBuff？
3. **chain 去向**：完全移出純塔後，chain 只存在混合塔嗎？哪些混合塔？
4. **水的 LV4 INFUSIONS 版**：純水路線的 LV4 混合塔要如何與新純水定位區分？

---

## 五、下一步

確認以上決策後，step2.md 執行：
- `js/skills.js`：廢除 ignite/frostbite；burn 加 igniteMult 參數；新增/確認各技能定義
- `js/towers.js`：PURE_TOWERS 六塔完整重寫
- 確認 INFUSIONS（LV4 混合塔）的技能組不與純塔身份矛盾
