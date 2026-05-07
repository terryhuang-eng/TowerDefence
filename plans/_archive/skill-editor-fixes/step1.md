# step1：修正 renderEditor 的 checkbox 取消 bug

**目標檔案**：`skill-editor.html`
**影響範圍**：`renderEditor()` 函數內，最後 6 行

---

## 問題

`renderEditor` 結尾：
```js
panel.innerHTML = html;                          // 第 1 次設定

if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) panel.innerHTML += buildScoreHtml(bd);   // 第 2 次：讀取 → 附加 → 重設
}
```

`panel.innerHTML +=` 在讀取（序列化）步驟時，可能把剛建立的 checkbox 狀態
回寫為舊狀態，導致取消勾選後 DOM 又恢復為 `checked`。

---

## 修改方式

將兩次 innerHTML 設定改為一次：

```js
// ❌ 舊
panel.innerHTML = html;
if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) panel.innerHTML += buildScoreHtml(bd);
}

// ✅ 新（先組好完整 html，最後一次設定）
if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) html += buildScoreHtml(bd);
}
panel.innerHTML = html;
```

---

## 定位流程

1. Grep `panel.innerHTML = html` in skill-editor.html → 找到行號
2. Read ±5 行確認 context（應在 renderEditor 最後）
3. Edit：替換這 6 行

---

## 驗證

修改後在瀏覽器：
1. 開啟 skill-editor.html，切到塔頁面
2. 選一個有技能的塔（如任意 INFUSIONS 塔）
3. 取消勾選一個技能 → checkbox 應保持未勾選
4. 確認分數面板即時更新（skillTotal 減少）
