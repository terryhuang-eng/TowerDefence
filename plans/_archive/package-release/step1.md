# step1 — index.html：autotest.js 改為 sandbox 條件動態載入

## 目標

只在 `?sandbox=1` 時載入 autotest.js，確保一般開啟（和 release 打包）不帶入測試程式碼。

## 影響檔案

`index.html`

## 修改位置

line ~485，scripts 載入區塊末尾。

### 現有
```html
<script src="js/game.js"></script>
<script src="autotest.js"></script>
```

### 修改後
```html
<script src="js/game.js"></script>
<script>
if (new URLSearchParams(location.search).get('sandbox') === '1') {
  document.write('<script src="autotest.js"><\/script>');
}
</script>
```

## 技術說明

- `document.write` 在頁面解析期間執行時是**同步**的：瀏覽器會等 autotest.js 下載並執行完後，才繼續解析後續 HTML
- 這與原本 `<script src>` 的行為相同，確保 autotest.js 中定義的函數（A/B/C/D 按鈕 onclick）在 sandbox panel 渲染前就已就緒
- 不用 sandbox 時（一般玩家），autotest.js 完全不被請求，console 無 404

## 執行步驟

1. Grep `autotest.js` → 確認 line 485
2. Read line 483–487 確認 context
3. Edit 替換
