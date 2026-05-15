# Step 1：CSS Custom Properties

## 目標
將佈局關鍵數值從寫死的 px/數字抽出，改為 CSS custom property，讓 Step 3 的 editor 可以用一行 JS 修改並自動生效。

---

## 影響範圍

| 檔案 | 位置 | 動作 |
|------|------|------|
| `index.html` | `:root` 新增（約 line 1 CSS 最上方） | 新增 4 個 CSS 變數 |
| `index.html` | `#info-bar`（line 68–72） | `height` 改用 `var(--top-bar-h)` |
| `index.html` | `#ai-bar`（line 183–187） | `height` / `min-height` 改用 `var(--bot-bar-h)` |
| `index.html` | `#sidebar`（line 14） | `width` 改用 `var(--sidebar-w)` |
| `index.html` | `@media (max-width: 1024px)` 的 `#sidebar` | `width` 改用 `var(--sidebar-w-tablet)` |
| `index.html` | `.mobile-hud-send-btn`（line 326） | `min-height` 改用 `var(--mobile-btn-h)` |

**不影響範圍：**
- `js/game.js` 的 `topPad`/`botPad` — Step 1 不動 JS，留給 Step 2/3 在 resize 時讀 `offsetHeight`

---

## 實作重點

### 在 CSS 最上方（`<style>` tag 開頭）新增 `:root`：

```css
:root {
  --top-bar-h: 40px;
  --bot-bar-h: 40px;
  --sidebar-w: 340px;
  --sidebar-w-tablet: 280px;
  --mobile-btn-h: 44px;
}
```

### 修改對應 CSS 規則：

```css
/* #info-bar */
#info-bar {
  height: var(--top-bar-h);   /* 原本 height: 40px */
  /* 其他屬性不變 */
}

/* #ai-bar */
#ai-bar {
  height: var(--bot-bar-h);   /* 原本 height: 40px */
  /* 其他屬性不變 */
}

/* #sidebar */
#sidebar { width: var(--sidebar-w); ... }

/* @media (max-width: 1024px) */
#sidebar { width: var(--sidebar-w-tablet); }

/* .mobile-hud-send-btn */
.mobile-hud-send-btn { min-height: var(--mobile-btn-h); }
```

---

## 注意事項

- `#info-bar` 和 `#ai-bar` 的 `height` 目前可能用 padding + min-height 控制，而不是明確的 `height` 屬性。Execute 前先讀取確認實際 CSS 屬性名稱。
- tablet 的 sidebar width `280px` 在 `@media (max-width: 1024px)` 內，改為 `var(--sidebar-w-tablet)` 後編輯器可以分別調整桌機和平板寬度。
- 不要加 `!important`，保持 cascade 正常。
- 此步驟結束後，遊戲功能應完全不變（只是把數字換成變數）。
