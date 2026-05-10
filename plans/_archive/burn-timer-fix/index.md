# burn-timer-fix 計畫

## 問題一：skill-test 測試範圍與可信度

### 結論：可取代大部分手動效果驗證，但不能取代瀏覽器測試

skill-test.html 測的是 **MockGame 的邏輯副本**，不是 game.js 本身。
這帶來一個根本限制：

| 情境 | 結果 |
|------|------|
| game.js 有 bug，MockGame 複製了同一個 bug | 測試 **通過**，但遊戲仍有問題 ← 現在這個 bug！ |
| game.js 改動，MockGame 未同步更新 | 測試通過，但驗證的是舊邏輯 |
| 邏輯正確 | 測試通過，有效 |

### 實際上 skill-test 能取代什麼
✅ 可取代：
- 公式計算正確性（damage 數值、stack 上限、CD 邏輯）
- 邊界條件（floor/ceil、cap、min/max）
- 技能互動順序（shred 先算再 vuln、ignite 在 burn 前）

❌ 仍需瀏覽器測試：
- 視覺效果（projectile、zone 圓圈、emoji 顯示）
- 全波次流程（怪物路徑、spawn timing、Boss 觸發）
- UI 互動（升級面板、sandbox 面板、PVP）
- 任何 game.js 大幅改動後的迴歸測試

### 結論
你不需要再手動驗證每個技能的「數值計算對不對」——skill-test 負責這塊。
但每次改完 game.js，仍需用 `skill-test.html` 跑一次確認 MockGame 與 game.js 同步。

---

## 問題二：burn timer bug（測試失敗 + 遊戲 bug）

### 根因

`tickEnemy` 在 burn 計算時，無論 `burnTimer` 剩多少，都以完整 `dt` 計算傷害：

```js
// game.js 2640 / MockGame tickEnemy
if (e.burnTimer > 0) {
  e.hp -= e.burnDmg * dt;   // ← 用完整 dt，不管 timer 剩多少
  e.burnTimer -= dt;
}
```

測試案例：`burnDmg=10, burnTimer=1.0, dt=2.0`
- **預期**：只燒 1.0 秒 → 扣 10 血，hp = 90
- **實際**：燒完整 2.0 秒 → 扣 20 血，hp = 80 → `assert(hp >= 89)` 失敗

### 影響範圍
- **game.js 2640** — 遊戲實際 bug（低幀率 / 卡頓時 dt 大，burn 過度傷害）
- **skill-test.html MockGame.tickEnemy** — 測試副本同樣有 bug
- **同一結構的 frostbite**（2644-2649）— 需確認是否同樣問題

### 修正方式

```js
const burnDt = Math.min(dt, Math.max(0, enemy.burnTimer));
enemy.hp -= enemy.burnDmg * burnDt;
enemy.burnTimer -= dt;
```

用 `burnDt = min(dt, max(0, burnTimer))` 限制實際計算的秒數，timer 本身仍用完整 `dt` 倒數（自然歸零到負值，下一幀 `> 0` 不觸發）。

### 測試斷言也需修正
```js
// 現在：
assert(enemy.hp >= 89, `...`);

// 改為：
assertRange(enemy.hp, 89.9, 90.1, 'burn stops at timer=0, hp=90');
```

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1 | step1.md | 修正 `js/game.js` burn DOT 計算（+確認 frostbite）|
| step2 | step2.md | 修正 `skill-test.html` MockGame.tickEnemy + 測試斷言 |

## 執行順序
step1 → step2（step2 依賴 step1 的正確邏輯同步）
