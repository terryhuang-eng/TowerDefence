# build-script-escape — 修正 build.html 開啟即崩潰

## 根本原因

`build.html` 是一個 HTML 文件，其中的 `<script>` 元素由 HTML parser 解析。

**HTML parser 規則**：在 `<script>` 元素內容中，只要遇到 `</script`（大小寫不分），立即結束該元素。**字串、regex literal 或 template literal 無法阻止這一行為。**

我在 build.html 新增的程式碼有兩處未逸脫的 `</script>`：

| 行號 | 問題程式碼 | 觸發位置 |
|------|-----------|---------|
| 107 | `'<script src="$1"></script>'` | **最先觸發**：HTML parser 在此關閉 `<script>` |
| 122 | `` `<script src="${jsPath}"></script>` `` | 已被 107 行截斷，不再執行 |

第 107 行之後的所有程式碼（`'); let totalInline = 0; for...`）變成頁面文字，這就是使用者看到的錯誤訊息。

## 修正方式

在 **HTML source code** 裡，寫 `<\/script>` 而非 `</script>`：
- HTML parser 看到 `<\` → `\` 不是 `/`，不觸發結束規則 ✓
- JavaScript 執行時 `\/` = `/`，字串值仍為 `</script>` ✓

```js
// 舊（HTML parser 關閉 <script>）
'<script src="$1"></script>'

// 新（HTML parser 安全，JS 執行時值相同）
'<script src="$1"><\\/script>'
```

注意：在 `build.html` 的原始碼中寫 `<\\/script>`（兩個反斜線），實際字元序列是 `<\/script>`，符合要求。

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 修正兩處 `</script>` 逸脫 | ✅ | 107 行和 122 行加 `\/` | build.html |
