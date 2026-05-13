# step1 — 改用兩段式 inline + 加驗證

## 目標檔案
`build.html`

## 影響範圍
`document.getElementById('btn-build').onclick` 裡的「// 2. Inline 各 JS 檔」區塊（第 103–117 行）

## 具體修改

### 舊版（第 103–117 行）
```js
  // 2. Inline 各 JS 檔
  let totalInline = 0;
  for (const jsPath of JS_FILES) {
    try {
      const { text, size } = await readFile(dirHandle, jsPath);
      html = html.replace(
        new RegExp(`<script src="${jsPath.replace(/\./g, '\\.')}(?:\\?[^"]*)?"><\\/script>`),
        `<script>\n${text}\n<\/script>`
      );
      totalInline += size;
      addLog(`✅ ${jsPath} inline（${(size / 1024).toFixed(1)} KB）`, 'ok');
    } catch (e) {
      addLog(`⚠️  ${jsPath} 讀取失敗，略過`, 'warn');
    }
  }
```

### 新版（完整替換上述區塊）
```js
  // 2. Inline 各 JS 檔
  // Pass 1：先把 <script src="js/xxx?v=N"> 正規化為 <script src="js/xxx">
  html = html.replace(
    /<script src="(js\/[^"?]+)(?:\?[^"]*)?"><\/script>/g,
    '<script src="$1"></script>'
  );

  let totalInline = 0;
  for (const jsPath of JS_FILES) {
    // 讀取檔案
    let text, size;
    try {
      ({ text, size } = await readFile(dirHandle, jsPath));
    } catch (e) {
      addLog(`❌ ${jsPath} 讀取失敗，建置中止`, 'err');
      return;
    }

    // 精確字串比對（Pass 1 已移除版本號）
    const tag = `<script src="${jsPath}"></script>`;
    if (!html.includes(tag)) {
      addLog(`❌ ${jsPath} — 找不到對應的 <script src> 標籤，建置中止`, 'err');
      return;
    }
    html = html.replace(tag, `<script>\n${text}\n<\/script>`);
    if (html.includes(tag)) {
      addLog(`❌ ${jsPath} replace 後標籤仍存在，建置中止`, 'err');
      return;
    }

    totalInline += size;
    addLog(`✅ ${jsPath} inline（${(size / 1024).toFixed(1)} KB）`, 'ok');
  }

  // Pass 2 驗證：確認沒有殘留本地 JS script 標籤
  const leftover = html.match(/<script src="js\/[^"]*"/g);
  if (leftover) {
    addLog(`❌ 發現未 inline 的 script：${leftover.join(', ')}，建置中止`, 'err');
    return;
  }
```

## 定位流程
1. Grep `// 2. Inline 各 JS 檔` 確認行號
2. Read ±5 行確認範圍（預計 103–117）
3. Edit：以新版完整替換舊版
