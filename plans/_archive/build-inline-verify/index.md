# build-inline-verify — 修正 game.js 未 inline 問題

## 根本原因

現有的 regex fix（`build-version-query-fix/step1`）使用 `new RegExp(template_literal)` 建立 pattern：

```js
new RegExp(`<script src="${jsPath.replace(/\./g, '\\.')}(?:\\?[^"]*)?"><\\/script>`)
```

**問題 1**：template literal → string → RegExp constructor 的三層逃脫鏈極易出錯，在不同 JS runtime（Node.js vs 瀏覽器）行為可能不一致。

**問題 2**：即使 regex 未成功比對，`html.replace()` 回傳原始字串**不拋出任何錯誤**，但程式碼隨後仍執行：
```js
totalInline += size;
addLog(`✅ ${jsPath} inline（...）`, 'ok');  // ← 無論有無真正替換都顯示成功！
```

使用者看到 ✅ 但 game.js 根本沒有被 inline。

## 修正方案：兩段式方法

### Pass 1（建置前，一次性）
用簡單 regex 先將所有 `<script src="js/...?v=N">` 正規化為 `<script src="js/...">`：

```js
html = html.replace(
  /<script src="(js\/[^"?]+)(?:\?[^"]*)?"><\/script>/g,
  '<script src="$1"></script>'
);
```

### Pass 2（逐檔案）
改用精確字串比對（不用 RegExp），完全不受版本號影響：

```js
const tag = `<script src="${jsPath}"></script>`;
if (!html.includes(tag)) {
  addLog(`❌ ${jsPath} 的 <script src> 標籤在 index.html 中找不到`, 'err');
  return;           // ← abort
}
html = html.replace(tag, `<script>\n${text}\n<\/script>`);
if (html.includes(tag)) {
  addLog(`❌ ${jsPath} replace 失敗（標籤仍存在）`, 'err');
  return;
}
```

### Pass 3（建置後掃描）
結尾新增驗證：掃描輸出是否還有殘留的本地 JS script tag：

```js
const leftover = html.match(/<script src="js\/[^"]*"/g);
if (leftover) {
  addLog(`❌ 發現未 inline 的 script 標籤：${leftover.join(', ')}`, 'err');
  return;
}
```

## 驗證結果（Node.js 模擬）
```
After normalization: all exact tags found ✅
js/config.js: inlined ✅
js/skills.js: inlined ✅
js/sends.js: inlined ✅
js/towers.js: inlined ✅
js/waves.js: inlined ✅
js/game.js: inlined ✅
Remaining local JS script tags: NONE ✅
Final size: 287995 bytes (~281 KB)
```

## 步驟清單

| # | 步驟 | 狀態 | 說明 | 檔案 |
|---|------|------|------|------|
| step1 | 改用兩段式 inline + 加驗證 | ✅ | Pass1 normalize → Pass2 精確比對 + abort on fail | build.html |
