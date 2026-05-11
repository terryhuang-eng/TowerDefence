# build-html-fix — build.html 無法開啟修正

## 問題診斷

HTML parser 在詞法分析 `<script>` 區塊時，遇到 `</script>` 即截斷，**不論在 template literal、字串或 `//` 註解內**。

| 位置 | 類型 | 狀態 |
|------|------|------|
| line 109 template literal | `</script>` | ✅ 已修正（→ `<\/script>`） |
| line 110 template literal | `</script>` | ✅ 已修正（→ `<\/script>`） |
| line 120 `//` 單行註解 | `</script>` | ✅ 已修正（→ `<\/script>`） |

Line 122/124 的 regex 已是 `<\/script>`（正確）。

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 修正 line 120 註解內的 `</script>` | ✅ | build.html |
