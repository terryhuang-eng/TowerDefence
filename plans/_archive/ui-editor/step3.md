# Step 3：UI Editor Panel

## 目標
在 `index.html` 加入浮動編輯面板，以 `Alt+E` 開關，提供即時調整 UI 佈局數值的介面（sliders + number inputs），並整合 Step 2 的 Mobile Preview 開關。

---

## 影響範圍

| 檔案 | 位置 | 動作 |
|------|------|------|
| `index.html` | `</body>` 之前 | 新增 `#ui-editor` panel HTML |
| `index.html` | `<style>` 新增 | panel 樣式（浮動、深色、z-index 最高） |
| `index.html` | `<script>` 新增（inline，body 底部） | editor JS：開關、控制項綁定、resizeCanvas 觸發 |

**不影響範圍：**
- `js/game.js`（不改）
- 遊戲主流程
- 手機實機（panel 透過媒體查詢隱藏，或僅對 pointer: fine 顯示）

---

## UI 面板結構

```
┌─────────────────────────────────┐
│  🔧 UI Editor          [×]      │
├─────────────────────────────────┤
│  Top Bar Height    [40] ─────── │
│  Bot Bar Height    [40] ─────── │
│  Sidebar Width    [340] ─────── │
│  Mobile Btn H      [44] ─────── │
├─────────────────────────────────┤
│  📱 Mobile Preview  [OFF ↔ ON] │
│  Width: [375] [390] [414]       │
├─────────────────────────────────┤
│       [重置預設值]               │
└─────────────────────────────────┘
```

---

## 實作重點

### HTML（加在 `</body>` 前）

```html
<div id="ui-editor" style="display:none">
  <div id="ui-editor-header">🔧 UI Editor <button id="ui-editor-close">×</button></div>
  <div class="ue-row">
    <label>Top Bar</label>
    <input type="range" id="ue-top" min="28" max="64" step="2" value="40">
    <input type="number" id="ue-top-num" min="28" max="64" value="40">px
  </div>
  <div class="ue-row">
    <label>Bot Bar</label>
    <input type="range" id="ue-bot" min="28" max="64" step="2" value="40">
    <input type="number" id="ue-bot-num" min="28" max="64" value="40">px
  </div>
  <div class="ue-row">
    <label>Sidebar</label>
    <input type="range" id="ue-sidebar" min="200" max="480" step="10" value="340">
    <input type="number" id="ue-sidebar-num" min="200" max="480" value="340">px
  </div>
  <div class="ue-row">
    <label>Mobile Btn</label>
    <input type="range" id="ue-mbtn" min="32" max="72" step="2" value="44">
    <input type="number" id="ue-mbtn-num" min="32" max="72" value="44">px
  </div>
  <hr>
  <div class="ue-row">
    <label>📱 Mobile Preview</label>
    <label class="ue-toggle">
      <input type="checkbox" id="ue-mobile-preview">
      <span></span>
    </label>
  </div>
  <div class="ue-row" id="ue-width-row" style="display:none">
    <label>Width</label>
    <button class="ue-preset" data-w="375">375</button>
    <button class="ue-preset" data-w="390">390</button>
    <button class="ue-preset" data-w="414">414</button>
  </div>
  <hr>
  <button id="ue-reset">重置預設值</button>
</div>
```

### CSS（加在 `<style>` 末尾）

```css
#ui-editor {
  position: fixed; top: 60px; right: 10px;
  background: #1a1a2e; border: 1px solid #4a9eff;
  border-radius: 8px; padding: 10px 14px;
  color: #e0e0e0; font-size: 12px; font-family: monospace;
  z-index: 9999; min-width: 240px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  user-select: none;
}
#ui-editor-header { font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between; }
#ui-editor-close { background: none; border: none; color: #aaa; cursor: pointer; font-size: 16px; }
.ue-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.ue-row label { width: 80px; color: #aaa; }
.ue-row input[type=range] { flex: 1; }
.ue-row input[type=number] { width: 48px; background: #0f3460; border: 1px solid #4a9eff; color: #e0e0e0; padding: 2px 4px; border-radius: 3px; text-align: center; }
.ue-preset { background: #0f3460; border: 1px solid #4a9eff; color: #4a9eff; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
.ue-preset:hover, .ue-preset.active { background: #4a9eff; color: #000; }
#ue-reset { width: 100%; background: #2d2d44; border: 1px solid #666; color: #ccc; padding: 5px; border-radius: 4px; cursor: pointer; }
#ue-reset:hover { border-color: #4a9eff; color: #fff; }
/* toggle switch */
.ue-toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
.ue-toggle input { opacity: 0; width: 0; height: 0; }
.ue-toggle span { position: absolute; inset: 0; background: #333; border-radius: 20px; cursor: pointer; transition: 0.2s; }
.ue-toggle input:checked + span { background: #4a9eff; }
.ue-toggle span::before { content: ''; position: absolute; height: 14px; width: 14px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.2s; }
.ue-toggle input:checked + span::before { transform: translateX(16px); }
/* 手機隱藏 editor（實機不需要） */
@media (pointer: coarse) { #ui-editor { display: none !important; } }
```

### JS（inline script，加在 `</body>` 前）

```js
(function() {
  const DEFAULTS = { top: 40, bot: 40, sidebar: 340, mbtn: 44 };
  const root = document.documentElement;

  // 開關面板
  const panel = document.getElementById('ui-editor');
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'e') {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  });
  document.getElementById('ui-editor-close').onclick = () => panel.style.display = 'none';

  // 通用：slider ↔ number input 雙向同步 + 套用 CSS var
  function bindPair(sliderId, numId, cssVar, triggerResize) {
    const sl = document.getElementById(sliderId);
    const nm = document.getElementById(numId);
    function apply(v) {
      sl.value = v; nm.value = v;
      root.style.setProperty(cssVar, v + 'px');
      if (triggerResize && window.game) window.game.resizeCanvas();
    }
    sl.oninput = () => apply(sl.value);
    nm.oninput = () => apply(nm.value);
  }

  bindPair('ue-top',     'ue-top-num',     '--top-bar-h',  true);
  bindPair('ue-bot',     'ue-bot-num',     '--bot-bar-h',  true);
  bindPair('ue-sidebar', 'ue-sidebar-num', '--sidebar-w',  false);
  bindPair('ue-mbtn',    'ue-mbtn-num',    '--mobile-btn-h', false);

  // Mobile Preview toggle
  let previewWidth = 390;
  document.getElementById('ue-mobile-preview').onchange = function() {
    document.getElementById('ue-width-row').style.display = this.checked ? 'flex' : 'none';
    if (window.toggleMobilePreview) window.toggleMobilePreview(this.checked, previewWidth);
  };

  // Width presets
  document.querySelectorAll('.ue-preset').forEach(btn => {
    btn.onclick = function() {
      previewWidth = +this.dataset.w;
      document.querySelectorAll('.ue-preset').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (document.getElementById('ue-mobile-preview').checked && window.toggleMobilePreview) {
        window.toggleMobilePreview(true, previewWidth);
      }
    };
  });
  // 預設 390 active
  document.querySelector('.ue-preset[data-w="390"]').classList.add('active');

  // 重置
  document.getElementById('ue-reset').onclick = function() {
    root.style.setProperty('--top-bar-h',    DEFAULTS.top + 'px');
    root.style.setProperty('--bot-bar-h',    DEFAULTS.bot + 'px');
    root.style.setProperty('--sidebar-w',    DEFAULTS.sidebar + 'px');
    root.style.setProperty('--mobile-btn-h', DEFAULTS.mbtn + 'px');
    document.getElementById('ue-top').value     = DEFAULTS.top;
    document.getElementById('ue-top-num').value = DEFAULTS.top;
    document.getElementById('ue-bot').value     = DEFAULTS.bot;
    document.getElementById('ue-bot-num').value = DEFAULTS.bot;
    document.getElementById('ue-sidebar').value     = DEFAULTS.sidebar;
    document.getElementById('ue-sidebar-num').value = DEFAULTS.sidebar;
    document.getElementById('ue-mbtn').value     = DEFAULTS.mbtn;
    document.getElementById('ue-mbtn-num').value = DEFAULTS.mbtn;
    if (window.game) window.game.resizeCanvas();
    // 關閉 mobile preview
    document.getElementById('ue-mobile-preview').checked = false;
    document.getElementById('ue-width-row').style.display = 'none';
    if (window.toggleMobilePreview) window.toggleMobilePreview(false);
  };
})();
```

---

## 注意事項

- `window.game` 需要在 game.js 中有 `window.game = new Game()` 或類似賦值。Execute 前 Grep 確認。
- `resizeCanvas` 在 class 內的實際方法名 — Grep 確認（可能叫 `resizeCanvas` 或 `initGrid`）。
- `@media (pointer: coarse)` 隱藏 panel，確保手機實機不顯示（觸控螢幕的 pointer 為 coarse）。
- panel 初始 `display:none`，不影響首次載入效能。
- 此 step 完成後，在 PC 瀏覽器按 `Alt+E` 即可開啟面板。
