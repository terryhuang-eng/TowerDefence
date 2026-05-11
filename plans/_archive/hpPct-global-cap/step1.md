# Step 1：skills.js — GLOBAL_CAPS 加 hpPctCap

## 目標
在 `js/skills.js` 的 `GLOBAL_CAPS` 物件末尾加入 `hpPctCap: 120`。

## 影響範圍
- 唯一修改：`js/skills.js` 1 行新增
- 不影響任何遊戲邏輯（step2 才接線）

## 具體修改

**定位**：Grep `hpPctCd:` → 找到 GLOBAL_CAPS 末尾

**修改前**：
```js
  procMinInterval: 0.3,  // proc 最小間隔 0.3 秒
  hpPctCd: 0.2,  // %HP 傷害每目標冷卻 0.5 秒
};
```

**修改後**：
```js
  procMinInterval: 0.3,  // proc 最小間隔 0.3 秒
  hpPctCd: 0.2,  // %HP 傷害每目標冷卻 0.5 秒
  hpPctCap: 120,  // %HP 傷害每次上限（防 Boss 秒殺）
};
```

## 定位流程
1. `Grep "hpPctCd:"` in skills.js → 找行號
2. `Read ±3 行` 確認為 GLOBAL_CAPS 末尾
3. `Edit` 在 hpPctCd 行後插入 `hpPctCap: 120,`
