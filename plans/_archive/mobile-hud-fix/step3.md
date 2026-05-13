# step3 — 底部 HUD 移除升塔模式，按鈕尺寸加大

## 目標

升塔操作已由 popup 接管，底部 HUD 只保留送兵 + Ready 兩種模式，並加大按鈕 touch target。

## 影響範圍

- `js/game.js`：`buildMobileHud()` 移除升塔分支（`if (this.selectedTower)` 整塊）
- `index.html`：加大 HUD 相關按鈕 CSS（touch target ≥ 44px）

---

## buildMobileHud() 移除升塔分支

移除整個 `if (this.selectedTower) { ... }` 區塊（含 upgradeDiv.style.display 切換），以及不再需要的 upgradeDiv 參考。

保留的邏輯：
1. state 守衛（`showStates`、spawning/fighting 分支）
2. 送兵模式（金幣 + 送兵按鈕）
3. Ready 按鈕

簡化後結構：

```js
buildMobileHud() {
  const hud = document.getElementById('mobile-hud');
  if (!hud || !window.matchMedia('(max-width: 768px)').matches) return;

  const showStates = ['pre_wave', 'spawning', 'fighting'];
  if (!showStates.includes(this.state)) { hud.style.display = 'none'; return; }
  hud.style.display = 'flex';

  const sendsDiv = document.getElementById('mobile-hud-sends');
  const readyBtn = document.getElementById('mobile-hud-ready');

  // wave 中
  if (this.state === 'spawning' || this.state === 'fighting') {
    sendsDiv.style.display = 'none';
    readyBtn.textContent = '⚔️ 戰鬥中...';
    readyBtn.className = 'mobile-hud-ready-btn';
    readyBtn.style.cssText = 'background:#444;color:#aaa;flex:1;cursor:default;';
    readyBtn.onclick = null;
    return;
  }

  // 送兵模式
  sendsDiv.style.display = 'flex';
  sendsDiv.innerHTML = '';
  // ... (gold + send buttons，同現有邏輯)

  // Ready 按鈕
  // ... (同現有邏輯)
}
```

同時可移除 `#mobile-hud-upgrade` div（HTML + JS 都不再需要）。

---

## CSS 按鈕尺寸加大

在 `@media (max-width: 768px)` 內更新：

```css
/* 送兵按鈕：加大 touch target */
.mobile-hud-send-btn {
  padding: 8px 10px;      /* 原 5px 8px */
  min-width: 48px;        /* 原 42px */
  min-height: 44px;       /* 新增 */
  font-size: 13px;        /* 原 11px */
}

/* Ready 按鈕：加大 */
.mobile-hud-ready-btn {
  padding: 12px 18px;     /* 原 8px 14px */
  font-size: 14px;        /* 原 12px */
  min-height: 44px;       /* 新增 */
}
```

---

## `#mobile-hud-upgrade` 清除

HTML 移除：
```html
<!-- 移除：<div id="mobile-hud-upgrade" style="display:none;"></div> -->
```

---

## 驗證

- 手機：底部 HUD 只顯示送兵按鈕 + Ready，無升塔模式
- 點塔：popup 顯示（step2 功能），HUD 仍顯示送兵模式（可同時送兵和升塔）
- 按鈕高度可目測確認 ≥ 44px（符合觸控規範）
- 桌機：不受影響
