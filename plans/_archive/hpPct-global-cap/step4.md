# Step 4：skill-editor.html — capLabels + capComments 加 hpPctCap

## 目標
讓 skill-editor 右側的 GLOBAL_CAPS 面板和匯出 skills.js 時，
`hpPctCap` 顯示易讀標籤與正確行內註解，而非 raw key 名。

## 背景
skill-editor.html 的 GLOBAL_CAPS 面板已用 `capLabels[key] || key` fallback，
所以 step1 加入 `hpPctCap` 後面板自動顯示 "hpPctCap"（不會出錯），
本步驟只是補上更易讀的標籤與匯出註解。

## 具體修改（2 處）

### A. capLabels（右側面板顯示標籤）

**定位**：Grep `hpPctCd:.*hpPctCd` in skill-editor.html → 找到 capLabels 物件

**修改前**：
```js
  hpPctCd:         'hpPctCd (s)',
};
```

**修改後**：
```js
  hpPctCd:         'hpPctCd (s)',
  hpPctCap:        'hpPctCap（每次上限）',
};
```

### B. capComments（匯出 skills.js 時的行內註解）

**定位**：Grep `hpPctCd:.*冷卻` in skill-editor.html → 找到 capComments 物件

**修改前**：
```js
  hpPctCd:         '// %HP 傷害每目標冷卻 0.5 秒',
};
```

**修改後**：
```js
  hpPctCd:         '// %HP 傷害每目標冷卻 0.5 秒',
  hpPctCap:        '// %HP 傷害每次上限（防 Boss 秒殺）',
};
```

## 定位流程
1. `Grep "hpPctCd.*hpPctCd"` → 找 capLabels 的 hpPctCd 行
2. `Read ±2 行` 確認為 `};` 結尾
3. `Edit` 在 `};` 前插入 hpPctCap 標籤
4. `Grep "冷卻"` in skill-editor.html → 找 capComments 的 hpPctCd 行
5. `Read ±2 行` 確認為 `};` 結尾
6. `Edit` 插入 hpPctCap 行
