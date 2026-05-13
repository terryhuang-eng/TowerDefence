# step1 — 修正兩處 `</script>` 逸脫

## 目標檔案
`build.html`

## 影響範圍
第 107 行、第 122 行，各改一個字串。

## 具體修改

### 修改 1：第 107 行（Pass 1 replacement string）

```js
// 舊
    '<script src="$1"></script>'

// 新
    '<script src="$1"><\\/script>'
```

### 修改 2：第 122 行（tag 變數）

```js
// 舊
    const tag = `<script src="${jsPath}"></script>`;

// 新
    const tag = `<script src="${jsPath}"><\\/script>`;
```

> 注意：在 build.html 原始碼中寫 `<\\/script>`，實際檔案位元組序列是 `<\/script>`，HTML parser 看到 `<\` 不觸發關閉，JS 執行時 `\/` = `/` 所以字串值仍是 `</script>`。

## 定位流程
1. Grep `\$1.*\/script` 確認 107 行
2. Grep `const tag.*\/script` 確認 122 行
3. Edit 各一次
