# Step 2：skill-editor 加入 scoreTarget 欄位

**目標**：在 `skill-editor.html` 的 `getFieldsForTab()` 塔頁面加入 `scoreTarget` 欄位

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/skill-editor.html`

---

## 背景

`getFieldsForTab()` 在 `currentTab === 'towers'` 時返回欄位陣列，現有欄位：
`damage / atkSpd / range / aoe / cost / dmgType / desc`

新增：`scoreTarget`（目標總分，設計師設定）

---

## 定位方法

Grep: `key:'desc', label:'描述', type:'text'` 在 towers 分支 → 找行號（約 483 行）
Read ±3 行確認是 towers 分支的 desc（不是 waves/sends 的 desc）

---

## 具體修改

### getFieldsForTab towers 分支（約第 483 行）

舊：
```javascript
    { key:'desc', label:'描述', type:'text' },
  ];
  return [];
}
```

新（在 desc 之前插入 scoreTarget）：
```javascript
    { key:'scoreTarget', label:'目標分數', type:'number', forceShow: true, default: 0 },
    { key:'desc', label:'描述', type:'text' },
  ];
  return [];
}
```

---

## 補充：updateField 處理

現有的 `updateField(key, value, type)` 已能處理 type:'number'，`scoreTarget` 欄位直接走 `parseFloat(value) || 0`，不需要額外修改。

---

## 影響範圍

只加一個欄位，不影響現有欄位和渲染邏輯。新塔資料若無 `scoreTarget`，forceShow 保證顯示，值為 0。
