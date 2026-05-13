# step1 — build.html 改 regex 比對

## 影響範圍

- `build.html`：JS inline 替換邏輯（第 108 行附近）

---

## 修改

```
舊：
      html = html.replace(
        `<script src="${jsPath}"><\/script>`,
        `<script>\n${text}\n<\/script>`
      );

新：
      html = html.replace(
        new RegExp(`<script src="${jsPath.replace(/\./g, '\\.')}"(?:\\?[^"]*)?><\\/script>`),
        `<script>\n${text}\n<\/script>`
      );
```

注意：`jsPath.replace(/\./g, '\\.')` 是把路徑中的 `.` 跳脫為 `\.`，避免正則裡 `.` 被當萬用字元。

---

## 驗證

build 後的 game.html 大小應回到 ~300KB，build log 應顯示各 JS 檔皆 inline 成功。
