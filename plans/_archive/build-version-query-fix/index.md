# build-version-query-fix — build.html 相容版本號查詢字串

## 根本原因

`build.html` 的 inline 替換使用精確字串比對：
```js
html.replace(`<script src="${jsPath}"><\/script>`, ...)
```

`jsPath = 'js/game.js'`，但 `index.html` 現在是 `<script src="js/game.js?v=4">`，
比對失敗 → game.js 未 inline → 輸出縮水到 119KB（少了 ~180KB 的 game.js）。

## 解決方案

將字串比對改為 RegExp，允許 `?v=N` 或任意查詢字串存在或不存在：

```js
// 舊
html = html.replace(
  `<script src="${jsPath}"><\/script>`,
  `<script>\n${text}\n<\/script>`
);

// 新
html = html.replace(
  new RegExp(`<script src="${jsPath.replace('.', '\\.')}(?:\\?[^"]*)?"><\\/script>`),
  `<script>\n${text}\n<\/script>`
);
```

效果：
- `<script src="js/game.js">` ✅ 比對成功
- `<script src="js/game.js?v=4">` ✅ 比對成功
- `<script src="js/game.js?v=99">` ✅ 比對成功

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | build.html 改 regex 比對 | ✅ | 容許版本號查詢字串 | build.html |
