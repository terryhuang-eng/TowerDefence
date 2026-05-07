# THINK: skill-editor 兩個 UX 問題

**日期**：2026-05-04

---

## 問題一：已勾選技能無法取消（checkbox bug）

### 根因

`renderEditor()` 中有**兩次 `innerHTML` 寫入**：

```js
panel.innerHTML = html;                          // 第 1 次
if (currentTab === 'towers') {
    panel.innerHTML += buildScoreHtml(bd);       // 第 2 次 ← BUG
}
```

`panel.innerHTML +=` 做了三件事：
1. **讀取** panel.innerHTML（把目前 DOM 序列化回字串）
2. 在字串後面 **附加** score HTML
3. **重新設定** innerHTML（整個 DOM 砍掉重建）

問題在第 1 步：瀏覽器序列化 `<input type="checkbox" checked>` 時，
可能根據 checkbox 目前的 `.checked` **property**（不是 attribute）輸出，
而此時 DOM 剛被 `panel.innerHTML = html` 建立，
如果發生任何 microtask 或 browser 內部狀態改變，
就可能把「已取消勾選的 checkbox」又序列化回 `checked` 狀態，
導致第 3 步重建時 checkbox 變回勾選。

### 修法

把兩次 innerHTML 寫入合併成一次：

```js
// ❌ 現行（兩次設定）
panel.innerHTML = html;
if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) panel.innerHTML += buildScoreHtml(bd);
}

// ✅ 修正（一次設定）
if (currentTab === 'towers') {
    const bd = computeScoreBreakdown(unit);
    if (bd) html += buildScoreHtml(bd);
}
panel.innerHTML = html;
```

影響範圍：`renderEditor()` 函數，僅 3 行。

---

## 問題二：技能評分無法全局調整

### 現狀

`scoreWeight` 是**每塔實例**的屬性，存在 `unit.skills[n].scoreWeight`。
如果想調整「越攻越快」的全局分值，必須：
- 逐一進入每個有越攻越快的塔
- 分別調整 scoreWeight

這違反「一個地方調整，全部同步」的設計意圖。

### 根因

真正控制技能分值的應該是 `SKILL_DEFS[type].scoreBase`，
這是所有塔共用的型別定義，改一次就全部生效。
但目前 skill-editor.html 沒有提供修改 SKILL_DEFS 的介面。

### 解法：在 skill-editor 加入「技能分值」編輯面板

在 skill-editor.html 右側（或作為獨立的可收合區塊）新增一個
**「⚙️ 技能評分基準」面板**，顯示所有 tower 類技能的：

| 欄位 | 說明 |
|------|------|
| 技能名 | 顯示用 |
| scoreBase | 可編輯，改動立即影響全部塔的分數計算 |
| scorePrimary / scoreRef | 顯示用（說明分值如何隨參數縮放） |

修改 `SKILL_DEFS[type].scoreBase` 後，下次任何塔呼叫 `computeScoreBreakdown` 時會自動用新值。

#### 不需要 export 到 skills.js
目前分數系統是設計工具內部的即時反饋，
`scoreBase` 的調整結果需要手動寫回 `js/skills.js`（或未來做 export）。
**本步驟只做介面，不做 export**——使用者調好後可以手動抄寫，
或之後增加 export 功能。

---

## 步驟清單

| 步驟 | 檔案 | 說明 |
|------|------|------|
| step1.md | skill-editor.html | Fix: renderEditor 改為一次 innerHTML 設定 |
| step2.md | skill-editor.html | 新增「技能評分基準」面板（編輯 SKILL_DEFS.scoreBase）|

### 執行順序

1. `execute skill-editor-fixes/step1.md`（3 行修改，可獨立驗證）
2. `execute skill-editor-fixes/step2.md`（新增面板）
