# Step 2：Mobile Preview Mode

## 目標
在 PC 上一鍵切換手機版面（強制套用 mobile CSS + JS mobile 偵測返回 true），讓手機 UX 設計可以不離開 PC 直接預覽與測試。

---

## 影響範圍

| 檔案 | 位置 | 動作 |
|------|------|------|
| `index.html` | CSS 新增 `body.mobile-preview` 規則 | 複製 `@media (max-width: 768px)` 的所有規則，改為 class selector |
| `index.html` | CSS 新增 `.mobile-preview-frame` | canvas-wrap 限制寬度、置中、加外框 |
| `js/game.js` | 新增 `isMobileLayout()` helper（約 line 1）| 替代 3 處重複的 `window.matchMedia(...)` |
| `js/game.js` | line 559 `initGrid()` | matchMedia → `isMobileLayout()` |
| `js/game.js` | line 1129 `buildMobileHud()` | matchMedia → `isMobileLayout()` |
| `js/game.js` | line 1304 `showTowerActionPopup()` | matchMedia → `isMobileLayout()` |
| `js/game.js` | 新增 `toggleMobilePreview(width)` | 外部呼叫入口（Step 3 的 editor 用） |

**不影響範圍：**
- 遊戲邏輯、PVP、波次
- 手機實機行為（`isMobileLayout()` 在手機上的 matchMedia 仍然 `true`）

---

## 實作重點

### 1. `isMobileLayout()` helper — 加在 game.js 頂端（module level，非 class 內）

```js
// UI Editor: mobile preview flag
window._mobilePreview = false;

function isMobileLayout() {
  return window._mobilePreview ||
    window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches;
}
```

### 2. 替換 3 處 matchMedia

```js
// line 559 (initGrid)
if (isMobileLayout()) {

// line 1129 (buildMobileHud)
const _mq = isMobileLayout();

// line 1304 (showTowerActionPopup)
if (!isMobileLayout()) return;
```

### 3. `toggleMobilePreview(width)` — 加在 game.js 頂端區域

```js
window.toggleMobilePreview = function(enabled, width = 390) {
  window._mobilePreview = enabled;
  const wrap = document.getElementById('canvas-wrap');
  const body = document.body;
  if (enabled) {
    body.classList.add('mobile-preview');
    wrap.style.maxWidth = width + 'px';
    wrap.style.margin = '0 auto';
  } else {
    body.classList.remove('mobile-preview');
    wrap.style.maxWidth = '';
    wrap.style.margin = '';
  }
  // 觸發 canvas resize + HUD rebuild
  if (window.game) {
    window.game.resizeCanvas();
    if (window.game.state === 'pre_wave') window.game.showWavePreview();
  }
};
```

### 4. CSS `body.mobile-preview` 規則（加在 `@media (max-width: 768px)` 之後）

複製並轉換 mobile media query 中的所有規則：

```css
/* Mobile Preview Mode (PC 模擬手機版面) */
body.mobile-preview #sidebar {
  position: fixed; right: -100%; top: 0; height: 100%;
  width: min(85vw, 340px); transition: right 0.25s;
  z-index: 50;
}
body.mobile-preview #sidebar.open { right: 0; }
body.mobile-preview #sidebar-toggle { display: inline-block; }
body.mobile-preview #sidebar-backdrop { display: none; }
body.mobile-preview #sidebar-backdrop.show { display: block; }
body.mobile-preview #canvas-wrap { flex: 1; width: 100%; min-height: 0; overflow: hidden; }
body.mobile-preview #info-bar { flex-wrap: wrap; padding: 4px 8px; font-size: 11px; gap: 4px; }
body.mobile-preview #ai-bar { padding: 4px 8px; font-size: 11px; flex-wrap: wrap; gap: 4px; }
body.mobile-preview #ai-bar .ai-hp-bar { width: 100px; height: 12px; }
body.mobile-preview #ai-bar .ai-hp-text { font-size: 9px; line-height: 12px; }
body.mobile-preview #mobile-hud { display: flex; }
/* 其他 @media mobile 規則逐一複製 */
```

> 注意：execute 時需讀取 index.html 的完整 `@media (max-width: 768px)` 區塊，逐條轉換為 `body.mobile-preview` selector。

---

## 注意事項

- `toggleMobilePreview()` 掛在 `window` 上，讓 Step 3 的 editor HTML inline script 可以呼叫。
- `resizeCanvas()` 在 game.js 中名稱確認（Grep `resizeCanvas` 確認方法名）。
- `body.mobile-preview #mobile-hud { display: flex }` — 需確認 mobile-hud 預設是 `display: none`（只在 media query 中變 flex）。
- 此 step 完成後，可手動在 console 執行 `toggleMobilePreview(true)` 測試效果。
