# step2 — 全域防止 double-tap zoom

## 目標

在遊戲內完全阻止雙擊放大縮小，無論點擊哪個元素（canvas、HUD 按鈕、空白區域）。

## 根本原因

iOS Safari 的 double-tap zoom 在 **window/document 層級**偵測手勢，不是元素層級。
即使個別元素有 `e.preventDefault()`，若第一下 tap 造成 DOM 重建（送兵按鈕呼叫 rebuildSidebar），第二下 tap 落在新 DOM 節點上，瀏覽器仍可能在 window 層判定 double-tap。

## 解決方案

### A — CSS（最根本，最簡單）

`touch-action: manipulation` 加在 `html, body`：

```css
/* 舊的 body：*/
body { background: #1a1a2e; color: #eee; ... overflow: hidden; }

/* 新的：在 * { ... } 區塊後、body 之前加一行，或直接加入 body： */
html { touch-action: manipulation; }
body { touch-action: manipulation; background: #1a1a2e; ... }
```

`touch-action: manipulation` 效果：
- ✅ 阻止 double-tap zoom
- ✅ 允許 pan（如果頁面需要滾動）
- ❌ 不阻止 pinch zoom（但 pinch 已被 touchmove listener 攔截）
- 支援度：iOS 9.3+，Android 4.4+，全平台安全

### B — JS（雙重保險，阻止 pinch + double-tap 的殘餘漏洞）

在 `initGrid()` 的 mobile block 中，現有的 touchmove listener 後面追加 touchend double-tap 偵測：

```js
// 現有：
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// 新增（放在現有 touchmove listener 後）：
let _lastTapTime = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - _lastTapTime < 350) {
    e.preventDefault(); // 第二下 tap → 阻止 double-tap zoom
  }
  _lastTapTime = now;
}, { passive: false });
```

說明：
- 350ms 閾值：iOS 的 double-tap 判定窗口約 300ms，留 50ms buffer
- `{ passive: false }` 是必要的，否則無法呼叫 `preventDefault()`
- 只攔截 touchend，不影響 touchstart（避免干擾按鈕的觸發）

---

## 影響範圍

| 檔案 | 修改位置 |
|------|---------|
| `index.html` | `<style>` 區塊，`body { ... }` 加 `touch-action: manipulation` |
| `js/game.js` | `initGrid()` 的 mobile block，現有 touchmove listener 後追加 touchend |

---

## 驗證

- 快速連點送兵按鈕 → 不放大
- 雙擊 canvas → 不放大
- 雙擊空白區域 → 不放大
- 桌機不受影響（touchend 不觸發）
