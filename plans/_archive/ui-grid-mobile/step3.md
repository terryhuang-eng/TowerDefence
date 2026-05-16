# Step 3：Mobile Sidebar Panel Touch Styles

## 目標
讓側欄面板（`#sidebar` 內的 `.panel` 區塊）在手機上符合手機操作習慣：觸控目標 ≥ 44px、文字易讀、戰報不截斷。

---

## 影響範圍

| 檔案 | 位置 | 動作 |
|------|------|------|
| `index.html` | `@media (max-width: 768px)` 區塊 | 新增 sidebar panel 手機樣式 |
| `index.html` | `body.mobile-preview` 區塊 | 同步新增相同規則（class selector） |

**不影響範圍：**
- 桌機 sidebar（僅在手機 media query / mobile-preview 內生效）
- canvas、遊戲邏輯
- 底部 HUD（有自己的樣式）

---

## 需要改善的具體問題

| 元素 | 目前問題 | 目標 |
|------|---------|------|
| `#sidebar .panel` | padding 8px，字體 12px，在手機抽屜裡擁擠 | padding 10px 12px，字體略大 |
| `#sidebar .panel h3` | 字體 12px，手機難辨識 | 字體 13px |
| `.income-btn`（送兵按鈕） | padding 6px 12px，min-height 無設定 → 約 32px，太小 | min-height 44px |
| `.upgrade-opt`（升級選項） | padding 5px 8px，約 30px | min-height 44px，padding 8px 12px |
| `#battle-log` | max-height 100px，手機上資訊太少 | max-height 180px |
| `.tower-popup-btn`（已在 media query 中定義 min-height: 44px） | ✅ 已正常 | 不需改 |

---

## 實作重點

### 在 `@media (max-width: 768px)` 區塊末尾（`}` 之前）新增：

```css
  /* sidebar panel 手機觸控優化 */
  #sidebar .panel { padding: 10px 12px; }
  #sidebar .panel h3 { font-size: 13px; margin-bottom: 6px; }
  #battle-log { max-height: 180px; }
  .income-btn {
    min-height: 44px; padding: 8px 14px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .upgrade-opt {
    min-height: 44px; padding: 8px 12px;
    display: inline-flex; align-items: center;
  }
```

### 在 `body.mobile-preview` 區塊末尾（最後一條規則後）同步新增：

```css
body.mobile-preview #sidebar .panel { padding: 10px 12px; }
body.mobile-preview #sidebar .panel h3 { font-size: 13px; margin-bottom: 6px; }
body.mobile-preview #battle-log { max-height: 180px; }
body.mobile-preview .income-btn {
  min-height: 44px; padding: 8px 14px;
  display: inline-flex; align-items: center; justify-content: center;
}
body.mobile-preview .upgrade-opt {
  min-height: 44px; padding: 8px 12px;
  display: inline-flex; align-items: center;
}
```

---

## 定位方式

1. `Grep "max-width: 768px"` → 找到手機 media query 的 `}` 結尾（line ~431 之前）
2. 在 `}` 前插入 CSS
3. `Grep "Mobile Preview Mode"` → 找到 `body.mobile-preview` 區塊末尾
4. 在 `/* 極小螢幕` 前插入對應 CSS

---

## 注意事項

- `display: inline-flex` 讓 `.income-btn` 和 `.upgrade-opt` 在保持 inline 佈局的同時，能垂直置中文字並設 min-height。
- `#battle-log` max-height 提高到 180px，但仍保留 `overflow-y: auto` 捲動（已在 desktop 樣式中設定）。
- 若 `.upgrade-opt` 因 `display: inline-flex` 改變原本排列方式，改回 `display: inline-flex` 或 `flex`（原本是 `inline-flex`，確認後決定是否保留 inline）。
- Execute 前先 Read `@media (max-width: 768px)` 區塊確認目前最後一條規則，再插入。
