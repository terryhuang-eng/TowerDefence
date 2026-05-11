# step1 — 移除 index.html 中的 autotest.js 引用

## 目標

清除遊戲主檔中的開發用腳本引用，避免玩家端出現 404 錯誤。

## 影響檔案

`index.html`

## 修改位置

line ~485，script 載入區塊末尾。

### 現有
```html
<script src="js/game.js"></script>
<script src="autotest.js"></script>
```

### 修改後
```html
<script src="js/game.js"></script>
```

## 執行步驟

1. Grep `autotest.js` in index.html → 確認行號
2. Read ±2 行確認 context
3. Edit 刪除該行
