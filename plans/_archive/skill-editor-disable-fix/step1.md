# Step 1: 修正 fmtSkills 過濾 enabled === false

## 目標
讓 `fmtSkills()` 在序列化時跳過 `enabled === false` 的技能，使「取消勾選 → 寫入」後 F5 不再復原。

## 影響範圍
- 檔案：`skill-editor.html`
- 函數：`fmtSkills()`（line 950）
- 副作用：所有用到 `fmtSkills` 的匯出函數（exportTowers、exportWaves、exportSends）都自動修正

## 具體修改

### 定位
Grep `function fmtSkills` → line 950，Read ±5 行確認 context

### 修改內容
**現狀**（line 952）：
```js
const parts = skills.map(s => {
```

**改為**：
```js
const parts = skills.filter(s => s.enabled !== false).map(s => {
```

## 驗證
- 取消勾選某技能 → 寫入 towers.js → F5 → 該技能應為未勾選
- 勾選技能 → 寫入 → F5 → 仍為勾選（正向 case 不影響）
