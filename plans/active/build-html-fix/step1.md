# step1 — 修正 template literal 中的 `</script>` 跳脫

## 目標

修正 `build.html` 第 108-110 行，兩處 template literal 內的 `</script>` 改為 `<\/script>`，
使 HTML parser 不截斷外層 `<script>` 區塊。

## 影響範圍

- **唯一修改**：`build.html` 第 108-110 行

## 具體修改

```
舊：
  html = html.replace(
    `<script src="${jsPath}"></script>`,
    `<script>\n${text}\n</script>`
  );

新：
  html = html.replace(
    `<script src="${jsPath}"><\/script>`,
    `<script>\n${text}\n<\/script>`
  );
```

**原理**：
- `<\/script>` 在 JS 字串中等同於 `</script>`（`\/` = `/`），執行結果不變
- 但 HTML parser 詞法分析時遇到 `<\/script>` 不會識別為關閉標籤，外層 script 區塊得以完整解析

## 驗證

修改後在瀏覽器開啟 `build.html`：
- 無 SyntaxError
- 「📁 選擇專案目錄」按鈕可點擊，出現系統資料夾選取對話框
- 選取後可按「🔨 建置 game.html」，log 面板顯示各 JS 檔案 inline 進度
