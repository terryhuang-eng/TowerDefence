# 計畫：cycle_* 攻速同步型場效應技能

## 確認設計決策

| 決策 | 內容 |
|------|------|
| 觸發條件 | 必須有有效目標才觸發（無目標 = 不觸發） |
| 上限設計 | 由企劃數值設定；工程層加 hardcap 防止永久暈眩 |
| 執行順序 | 獨立計畫（與 field_* 分開，先完成 range-skills 再執行本計畫） |

---

## 觸發機制（代碼層）

攻擊迴圈位置（約 game.js 2803）：

```
while (tw.atkTimer >= 1 && _shotsThisFrame < 20) {
  tw.atkTimer -= 1;

  if (targets.length === 0) { tw.atkTimer = 0; break; }  ← 無目標 break
  const target = targets[0];  ← 有目標

  ↓ 在此之後插入 cycle_* 觸發
```

cycle_* 效果作用對象：`getEnemiesNear(tw.x, tw.y, skill.radius)`
（與攻擊目標無關，作用整個圓形範圍內所有敵人）

---

## 技能清單

| 技能 ID | 名稱 | 效果 | 參數 | 平衡 hardcap |
|---------|------|------|------|-------------|
| `cycle_stun` | 攻速暈眩 | 每次攻擊，範圍內所有敵人暈眩 dur 秒 | radius, dur | dur ≤ 2.0s（防永久） |
| `cycle_chill` | 攻速冰冷 | 每次攻擊，範圍內所有敵人 +stacksPerCycle 層冰冷 | radius, stacksPerCycle | 受 GLOBAL_CAPS.chillMaxStacks 自限 |
| `cycle_shred` | 攻速碎甲 | 每次攻擊，範圍內所有敵人 +stacksPerCycle 層碎甲 | radius, stacksPerCycle | 受 GLOBAL_CAPS.shredMaxStacks 自限 |
| `cycle_vuln` | 攻速易傷 | 每次攻擊，範圍內所有敵人 +stacksPerCycle 層易傷 | radius, stacksPerCycle | 受 GLOBAL_CAPS.vulnMaxStacks 自限 |
| `cycle_burn` | 攻速灼燒 | 每次攻擊，範圍內所有敵人覆寫 burn 狀態 | radius, dot, dur | burn.dur 已有限制 |

---

## 與現有技能的差異對比

| 現有技能 | cycle_* 版本 | 差異 |
|---------|-------------|------|
| `chill`（on-hit，主目標） | `cycle_chill`（攻速節拍，全範圍） | 作用對象 1→N |
| `shred`（on-hit，主目標） | `cycle_shred`（攻速節拍，全範圍） | 作用對象 1→N |
| `vulnerability`（on-hit） | `cycle_vuln`（攻速節拍，全範圍） | 作用對象 1→N |
| `warp`（on-hit，主目標，有 cd） | `cycle_stun`（攻速節拍，全範圍） | 節拍由攻速控制而非獨立 cd |
| `burn`（on-hit，主目標） | `cycle_burn`（攻速節拍，全範圍） | 作用對象 1→N |

---

## 執行步驟

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1 | `js/skills.js` | 新增 5 個 cycle_* 到 SKILL_DEFS；更新 getSkillDesc |
| step2 | `js/game.js` | 在攻擊迴圈有目標後插入 cycle_* 處理；新增 ring 視覺 |
