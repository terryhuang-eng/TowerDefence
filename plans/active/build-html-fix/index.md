# build-html-fix — build.html 無法開啟修正

## 問題診斷

| 錯誤 | 根本原因 |
|------|---------|
| `SyntaxError: Unexpected end of input` (line 109) | template literal 含未跳脫的 `</script>`，HTML parser 截斷 script 區塊 |
| `SyntaxError: Invalid or unexpected token` (line 110) | 上同，script 截斷後 line 110 成為裸露 HTML |
| `autotest.js: Identifier 'AutoTest' already declared` | script 截斷 → build.html 中 autotest 移除邏輯未執行（次要連鎖效應，或舊 tab 殘留） |
| `Unsafe attempt to load URL file:///...` | 瀏覽器 file:// 同源警告（資訊性，File System API 仍可在 Chrome/Edge 運作） |

## 根本原因

`build.html` 的 `<script>` 區塊內，template literal 包含未跳脫的 `</script>`：

```javascript
// build.html line 108-110（問題所在）
html = html.replace(
  `<script src="${jsPath}"></script>`,   // ← </script> 截斷外層 <script> 標籤
  `<script>\n${text}\n</script>`         // ← 同上
);
```

**HTML 詞法規則**：parser 遇到 `</script>` 即截斷，無論在 JS 字串/template literal 內外。
**修正**：在 template literal 內改用 `<\/script>`（反斜線使 HTML parser 不識別為關閉標籤）。

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 修正 template literal 中的 `</script>` 跳脫 | ⬜ | build.html |

## 影響範圍

僅 `build.html` 一個檔案，修改兩處 template literal 即可。
