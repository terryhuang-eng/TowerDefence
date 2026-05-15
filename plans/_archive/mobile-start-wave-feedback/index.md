# mobile-start-wave-feedback — startWave 無視覺回饋 + canvas 尺寸過時

## 診斷結論

**按鈕「有感覺但沒反應」的真正原因不是 onclick 沒觸發，而是 HUD 沒有更新。**

### 問題一：startWave() 後 HUD 不更新

`startWave()` 將 `this.state` 從 `pre_wave` 改成 `spawning`，但沒有呼叫 `buildMobileHud()` 或 `rebuildSidebar()`。

結果：HUD 仍顯示「▶ W1」，使用者以為沒反應，但波次實際上已開始。

```
正確流程應為：
  click → startWave() → state='spawning' → buildMobileHud() → 顯示「⚔️ 戰鬥中...」
實際流程：
  click → startWave() → state='spawning' → ❌ HUD 不更新 → 仍顯示「▶ W1」
```

canvas tap 備援也有同樣問題：`rebuildSidebar()` 在 `startWave()` 之前呼叫，`startWave()` 後 HUD 沒有再更新。

### 問題二：canvas 尺寸在 HUD 出現後過時

`resizeCanvas()` 只在 `window.resize` 觸發。HUD（52px）出現後 canvas-wrap 縮短，但 canvas 仍維持舊尺寸，繪製區域錯位。

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | canvas overflow:hidden + resizeCanvas on HUD show | ✅ | 立即更新 HUD + 修正 canvas 尺寸 | js/game.js |
