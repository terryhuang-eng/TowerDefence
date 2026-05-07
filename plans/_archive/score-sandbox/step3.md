# Step 3：index.html 沙盒面板 UI

## 目標
在 `index.html` 加入沙盒模式入口與浮動 debug 面板的 DOM 結構，不接功能邏輯。

## 影響範圍
**唯一修改檔案：** `index.html`

## 觸發方式
URL 帶 `?sandbox=1`（或 `&sandbox=1`）。
頁面 load 時偵測：`new URLSearchParams(location.search).get('sandbox') === '1'`。
若不是沙盒模式，面板完全不顯示（`display:none` 或不 inject）。

## 面板外觀設計

### 觸發入口
沙盒模式下，右上角顯示一個 `🧪 SANDBOX` 標籤（始終可見）。
點擊展開/收合面板。

### 面板內容（展開後）
```
┌─────────────────────────────────┐
│ 🧪 SANDBOX MODE                 │
├─────────────────────────────────┤
│ [波次跳躍]                       │
│  Wave: [select 1~20] [▶ Go]     │
│                                  │
│ [怪物倍率]                       │
│  HP:  [──●────] 1.0x            │
│  數量: [──●────] 1.0x           │
│                                  │
│ [金幣]                           │
│  [+1000g] [+9999g] [MAX]         │
│                                  │
│ [元素解鎖]                       │
│  [🔥] [💧] [🌪️] [⛰️] [⚡] [全解鎖] │
│                                  │
│ [無限血量] ○ OFF / ● ON          │
│                                  │
│ [遊戲速度] [1x] [2x] [4x]        │
└─────────────────────────────────┘
```

## 具體 HTML 結構

在 `</body>` 前插入以下 DOM（只在 `?sandbox=1` 時 inject）：

```html
<div id="sandboxPanel" style="
  position:fixed; top:10px; right:10px; z-index:9999;
  font-family:monospace; font-size:13px; user-select:none;
">
  <!-- 標籤按鈕 -->
  <div id="sandboxToggle" style="
    background:#1a1a1a; border:2px solid #ffd700; border-radius:6px 6px 0 0;
    padding:4px 12px; cursor:pointer; color:#ffd700; font-weight:bold;
    display:flex; align-items:center; gap:6px;
  ">🧪 SANDBOX <span id="sandboxArrow">▼</span></div>

  <!-- 面板本體 -->
  <div id="sandboxBody" style="
    background:#111; border:2px solid #ffd700; border-top:none;
    border-radius:0 0 6px 6px; padding:10px 12px; min-width:220px;
    display:none;
  ">
    <!-- 波次跳躍 -->
    <div class="sb-section">
      <div class="sb-label">波次跳躍</div>
      <div style="display:flex;gap:6px;align-items:center;">
        <select id="sbWaveSelect" class="sb-input" style="width:60px;">
          <!-- 1~20 options 由 JS 生成 -->
        </select>
        <button id="sbWaveGo" class="sb-btn">▶ Go</button>
      </div>
    </div>

    <!-- 怪物倍率 -->
    <div class="sb-section">
      <div class="sb-label">怪物倍率</div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="color:#888;width:30px">HP</span>
        <input id="sbHpMult" type="range" min="0.25" max="5" step="0.25" value="1" style="width:90px;">
        <span id="sbHpMultVal" style="color:#4ecdc4;width:35px">1.0x</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
        <span style="color:#888;width:30px">數量</span>
        <input id="sbCountMult" type="range" min="0.25" max="5" step="0.25" value="1" style="width:90px;">
        <span id="sbCountMultVal" style="color:#4ecdc4;width:35px">1.0x</span>
      </div>
    </div>

    <!-- 金幣 -->
    <div class="sb-section">
      <div class="sb-label">金幣</div>
      <div style="display:flex;gap:6px;">
        <button id="sbGold1000" class="sb-btn">+1000g</button>
        <button id="sbGold9999" class="sb-btn">+9999g</button>
      </div>
    </div>

    <!-- 元素解鎖 -->
    <div class="sb-section">
      <div class="sb-label">元素解鎖</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <button class="sb-elem-btn sb-btn" data-elem="fire">🔥</button>
        <button class="sb-elem-btn sb-btn" data-elem="water">💧</button>
        <button class="sb-elem-btn sb-btn" data-elem="wind">🌪️</button>
        <button class="sb-elem-btn sb-btn" data-elem="earth">⛰️</button>
        <button class="sb-elem-btn sb-btn" data-elem="thunder">⚡</button>
        <button id="sbUnlockAll" class="sb-btn" style="color:#ffd700">全解鎖</button>
      </div>
    </div>

    <!-- 無限血量 -->
    <div class="sb-section" style="display:flex;align-items:center;justify-content:space-between;">
      <div class="sb-label" style="margin-bottom:0">無限血量</div>
      <button id="sbInfHP" class="sb-btn" data-on="0" style="color:#888">○ OFF</button>
    </div>

    <!-- 遊戲速度 -->
    <div class="sb-section">
      <div class="sb-label">遊戲速度</div>
      <div style="display:flex;gap:4px;">
        <button class="sb-speed-btn sb-btn active-speed" data-spd="1">1x</button>
        <button class="sb-speed-btn sb-btn" data-spd="2">2x</button>
        <button class="sb-speed-btn sb-btn" data-spd="4">4x</button>
      </div>
    </div>
  </div>
</div>
```

## CSS（inline style 為主，避免污染主 CSS）
面板用 inline style，只加幾個共用 class：
```css
.sb-section { margin-bottom: 10px; }
.sb-label { color: #ffd700; font-size: 0.82em; margin-bottom: 4px; }
.sb-btn {
  background: #1a1a2e; border: 1px solid #444; color: #ccc;
  border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 0.82em;
}
.sb-btn:hover { border-color: #ffd700; color: #ffd700; }
.active-speed { border-color: #4ecdc4; color: #4ecdc4; }
```

## 完成標準
- `?sandbox=1` 打開時，右上角出現「🧪 SANDBOX ▼」按鈕
- 點擊展開面板，所有 UI 元素存在且樣式正確
- 沒有 `?sandbox=1` 時，完全沒有沙盒 DOM
- 所有按鈕/滑桿/select 存在，但點擊無反應（功能在 step4 接線）
