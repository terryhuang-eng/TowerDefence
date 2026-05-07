# Step 2：修正 CLAUDE.md 關鍵結構的 INFUSIONS 條目

**目標**：修正 `## 關鍵結構` 中 INFUSIONS 的錯誤描述

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/CLAUDE.md`

---

## 定位方法

Grep: `INFUSIONS：元素注入分支` → 找到行號
Read ±5 行確認 context

---

## 具體修改

### 替換內容

**舊（錯誤）**：
```
- `INFUSIONS`：元素注入分支（lv3/lv4/lv5），9 種路線（Lv4-5 使用）
```

**新（正確）**：
```
- `INFUSIONS`：元素注入分支（lv4），36 分支（6×6，Lv4 雙屬注入使用）
- `TRIPLE_TOWERS`：Lv5 三屬塔（20 種，三元素組合，from Lv4 混屬路線）
- `PURE_TOWERS`：Lv6 純屬終極塔（6 種，需 3 同元素 picks + 精華，from Lv4 同屬雙注路線）
```

---

## 影響範圍

只影響 CLAUDE.md 文件說明，不影響任何程式碼。
