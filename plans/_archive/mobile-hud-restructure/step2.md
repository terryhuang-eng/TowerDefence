# step2 — canvas tap 備援觸發開始波次

## 目標

`pre_wave` 狀態下，點擊 canvas 上的空白格（非塔、非路徑）也能觸發 `startWave()`。
即使 HUD 有任何問題，玩家仍有操作路徑。

## 影響範圍

- `js/game.js`：canvas click handler 的「取消選取」分支

---

## 修改位置

canvas click handler 末尾的「取消選取」段落：

```
舊：
      // 取消選取
      this.selectedTower = null;
      this.pendingPlace = null;
      this.hideTowerActionPopup();
      this.rebuildSidebar();

新：
      // 取消選取
      this.selectedTower = null;
      this.pendingPlace = null;
      this.hideTowerActionPopup();
      this.rebuildSidebar();
      // 手機：pre_wave 空白格點擊 = 開始波次（備援）
      if (window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches
          && this.state === 'pre_wave') {
        this.startWave();
      }
```

---

## 驗證

- 手機 pre_wave：點空白格 → 波次開始 ✓
- 手機 pre_wave：點塔格 → 選塔（不觸發 startWave）✓
- 手機 spawning/fighting：點空白格 → 不觸發 ✓
- 桌機：matchMedia guard，行為不變 ✓
