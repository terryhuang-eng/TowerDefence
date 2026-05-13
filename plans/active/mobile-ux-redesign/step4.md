# step4 — HUD 狀態同步：wave 中隱藏送兵、顯示進度

## 目標

讓 HUD 隨遊戲 state 變化正確切換顯示內容：
- `pre_wave`：送兵模式 + Ready 按鈕（脈動）
- `spawning` / `wave`：隱藏送兵區，顯示剩餘怪數，Ready 按鈕變成狀態顯示
- `game_over` / `elem_pick`：HUD 隱藏

## 影響範圍

- **唯一修改**：`js/game.js`
  - `buildMobileHud()` 加入 state 判斷
  - `startWave()`、`onWaveEnd()` 末尾呼叫 `buildMobileHud()`
  - `showElementScreen()` 呼叫後隱藏 HUD

---

## buildMobileHud() state 判斷（在方法最頂端加）

```js
buildMobileHud() {
  const hud = document.getElementById('mobile-hud');
  if (!hud || window.innerWidth > 768) return;

  // state 判斷：哪些 state 下顯示 HUD
  const showStates = ['pre_wave', 'spawning', 'wave'];
  if (!showStates.includes(this.state)) {
    hud.style.display = 'none';
    return;
  }
  hud.style.display = 'flex';

  // wave 中：隱藏送兵，只顯示波次狀態
  if (this.state === 'spawning' || this.state === 'wave') {
    document.getElementById('mobile-hud-sends').style.display = 'none';
    document.getElementById('mobile-hud-upgrade').style.display = 'none';

    const readyBtn = document.getElementById('mobile-hud-ready');
    const alive = this.enemies.filter(e => !e.dead).length;
    readyBtn.textContent = alive > 0 ? `👾 ${alive} 剩餘` : '⚔️ 清場中...';
    readyBtn.className = 'mobile-hud-ready-btn';
    readyBtn.style.cssText = 'background:#444;color:#aaa;flex:1;cursor:default;';
    readyBtn.onclick = null;
    return;
  }

  // pre_wave：還原 sends 顯示
  document.getElementById('mobile-hud-sends').style.display = 'flex';
  // ...（接原有送兵 / 升塔模式邏輯）
}
```

---

## startWave() 末尾呼叫

在 `startWave()` 末尾加：

```js
  this.buildMobileHud();
```

---

## onWaveEnd() 末尾呼叫

在波次結束（state 回到 `pre_wave`）的位置加：

```js
  this.buildMobileHud();
```

---

## showElementScreen() 期間隱藏 HUD

在 `showElementScreen()` 開頭加：

```js
  const hud = document.getElementById('mobile-hud');
  if (hud) hud.style.display = 'none';
```

元素選擇完成回到 `pre_wave` 後，`rebuildSidebar()` → `buildMobileHud()` 會自動恢復顯示。

---

## 驗證

- pre_wave：HUD 顯示送兵按鈕 + 金幣 + Ready（脈動）
- 點 Ready / 波次開始：HUD 切換為「👾 N 剩餘」狀態，送兵按鈕隱藏
- 波次結束：HUD 恢復送兵模式
- 元素選擇畫面出現：HUD 隱藏（不遮擋元素卡片）
- 遊戲結束：HUD 隱藏
