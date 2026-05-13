# step1 — 修正 HUD 顯示條件（matchMedia 替換 innerWidth）

## 目標

把 `window.innerWidth > 768` 換成 `window.matchMedia('(max-width: 768px)').matches`，確保手機橫向模式下 HUD 也能正確顯示並設定 onclick。

## 影響範圍

- **唯一修改**：`js/game.js`，兩處
  - `initGrid()` 末尾的 HUD 初始化（line ~559）
  - `buildMobileHud()` 的守衛 check（line ~1105）

---

## 修改 A — initGrid() 末尾

```
舊：
    if (window.innerWidth <= 768) {
      const hud = document.getElementById('mobile-hud');
      if (hud) hud.style.display = 'flex';
    }

新：
    if (window.matchMedia('(max-width: 768px)').matches) {
      const hud = document.getElementById('mobile-hud');
      if (hud) hud.style.display = 'flex';
    }
```

---

## 修改 B — buildMobileHud() 守衛

```
舊：
    if (!hud || window.innerWidth > 768) return;

新：
    if (!hud || !window.matchMedia('(max-width: 768px)').matches) return;
```

---

## 驗證

- 手機直向（375px）：HUD 顯示，Ready 按鈕可點 ✓
- 手機橫向（932px）：HUD 顯示，Ready 按鈕可點 ✓（之前失效）
- 桌機（1280px）：HUD 不顯示 ✓
