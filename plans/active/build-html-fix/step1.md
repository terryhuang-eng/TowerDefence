# step1 — 修正 line 120 註解內的 `</script>`

## 目標

修正唯一剩餘的未跳脫 `</script>`（build.html line 120 的 `//` 單行註解）。

## 影響範圍

- **唯一修改**：`build.html` 第 120 行

## 具體修改

```
舊：
  //    (a) 舊：<script src="autotest.js"></script>

新：
  //    (a) 舊：<script src="autotest.js"><\/script>
```

## 驗證

修改後開啟 `build.html`：
- 無 SyntaxError
- 「📁 選擇專案目錄」按鈕可點擊
- 選取目錄後可建置 game.html
