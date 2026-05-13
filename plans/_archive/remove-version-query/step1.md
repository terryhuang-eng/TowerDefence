# step1 — 移除 ?v=4 版本號

## 目標檔案
`index.html`

## 影響範圍
第 632 行，僅修改一個標籤屬性值。

## 具體修改

```html
<!-- 舊 -->
<script src="js/game.js?v=4"></script>

<!-- 新 -->
<script src="js/game.js"></script>
```

## 定位流程
1. Grep `game\.js\?v=` 確認行號
2. Read 該行確認 context
3. Edit：`?v=4` 刪除

## 完成後確認
- 重新用 build.html 產檔
- 瀏覽器需先重新整理 build.html（Ctrl+R）
- 產出的 game.html 應為 ~281KB（含所有 JS inline）
