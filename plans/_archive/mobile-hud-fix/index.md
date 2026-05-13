# mobile-hud-fix — 手機 HUD 按鈕無效 + 操作位置改善

## 目前實作狀態確認

mobile-ux-redesign 四個步驟已完成，底部 HUD 骨架存在：
- `#mobile-hud`（HTML 已加，CSS 已加在 `@media max-width:768px`）
- `buildMobileHud()` 方法存在，含送兵/升塔/Ready 三種模式

**但用戶回報：點「開始波次」無效、升塔賣塔按鈕位置不夠快速**

---

## 問題一：「開始波次」點擊無效

### 根本原因：JS 寬度檢查在橫向模式會失效

`buildMobileHud()` 的守衛：
```js
if (!hud || window.innerWidth > 768) return;
```

- 直向手機（375-430px）：正常 ✅
- **橫向手機（667-932px）：`window.innerWidth > 768` = true → 直接 return**
  - iPhone 14 Pro Max 橫向：932px
  - 大部分現代手機橫向都 > 768px

結果：HUD 不顯示、onclick 不設置 → 點擊無效。

同樣問題也出現在 `initGrid()` 的 HUD 初始化 check。

### 次要問題：CSS 被 inline style 覆蓋

HTML：`<div id="mobile-hud" style="display:none;">`
CSS media query 裡的 `display: flex` **被 inline style 覆蓋**，所以 HUD 初始永遠是 `none`，完全靠 JS 控制顯示。
這本身不是 bug，但讓控制權分散在兩處（CSS 設 flex 無效，JS 設 flex 才有效）。

### 修正方案

把 `window.innerWidth > 768` 換成 CSS media query 物件：

```js
// 可靠的手機偵測（跟 CSS @media 行為一致）
const isMobile = window.matchMedia('(max-width: 768px)').matches;
if (!hud || !isMobile) return;
```

同步修正 `initGrid()` 裡的相同 check。

---

## 問題二：升塔/賣塔按鈕位置不夠快速

### 現況

點塔 → 底部 HUD 切換升塔模式 → 按升塔/賣塔

問題：
1. **視線移動距離大**：塔在畫面中間，操作在畫面底部，要把注意力拉到很遠的地方
2. **不知道 HUD 切換了**：使用者點完塔可能沒意識到底部有新按鈕出現
3. **按鈕太小**：當前 `padding: 6px 10px; font-size: 11px`，touch target 約 30×32px（建議 ≥ 44×44px）

### 修正方案：塔選取後顯示 canvas overlay popup

點塔後，在**塔的位置附近**顯示一個小型 HTML overlay（`position: absolute`），放升塔/賣塔/取消按鈕。不再依賴底部 HUD 的升塔模式。

底部 HUD 保留送兵模式 + Ready（不再有升塔模式）。

```
┌────────────────────────────┐
│  [info-bar]                │
│                            │
│       🏹 Lv3               │
│    ┌─────────────────┐     │
│    │💧注入 250g │賣208g│✕│  ← 塔附近 popup
│    └─────────────────┘     │
│                            │
│                            │
├────────────────────────────┤
│  💰230  🏃 ⚔️  [▶ W4]      │  ← 底部 HUD（只有送兵+Ready）
└────────────────────────────┘
```

**Popup 設計規則**：
- `position: absolute` 在 `#canvas-wrap` 內
- 位置 = 塔的 canvas 座標 → 轉換為 CSS 座標
- Y 方向：塔下方（若空間不足則上方）
- 按鈕高度 ≥ 44px（最小 touch target）
- 點 popup 外任意處 → 關閉
- z-index: 30（高於 HUD 的 12）

---

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 修正 HUD 顯示條件（`matchMedia` 替換 `innerWidth`）| ✅ | 修正手機橫向不顯示的 bug | js/game.js |
| step2 | 塔選取 popup（canvas 附近 overlay）| ✅ | 新增 `#tower-action-popup` HTML/CSS + `showTowerActionPopup()` / `hideTowerActionPopup()` | index.html + js/game.js |
| step3 | 底部 HUD 移除升塔模式，改由 popup 處理 | ✅ | `buildMobileHud()` 升塔分支移除，按鈕尺寸加大 | js/game.js |

> step1 最小、最快，先修 bug。step2-3 是 UX 改善，需要一起執行。
