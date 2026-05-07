# Step 1：修正 CLAUDE.md 升級路徑（5階→6階）

**目標**：修正 `## 升級路徑（5 階）` 區塊，正確描述現行 6 階系統

---

## 目標檔案

`C:/Users/terryhuang/Claude/projects/tower-defense-prototype/CLAUDE.md`

---

## 定位方法

Grep: `升級路徑` → 找到區塊起始行
Read ±15 行確認範圍

---

## 具體修改

### 替換內容

**舊（錯誤）**：
```markdown
## 升級路徑（5 階）
```
箭塔 Lv1 (50g) → 箭塔 Lv2 (+80g=130g)
                      ↓ 需要 1 元素 pick
                 元素塔 Lv3 (+130g=260g)（ELEM_BASE，箭/砲基底不同）
                      ↓ 需要第 2 元素 pick（注入）
                 元素塔 Lv4 (+250g=510g)（INFUSIONS.lv4，9 分支）
                      ↓ 需要 3 個相同元素
                 純元素塔 Lv5 (+400g=910g)（INFUSIONS.lv5，3 純路線）
```

**新（正確）**：
```markdown
## 升級路徑（6 階）
```
箭塔 Lv1 (50g) → 箭塔 Lv2 (+80g=130g)
                      ↓ 需要 1 元素 pick
                 元素塔 Lv3 (+130g=260g)（ELEM_BASE，箭/砲基底不同）
                      ↓ 需要第 2 元素 pick（注入）
                 雙屬塔 Lv4 (+250g, INFUSIONS，36 分支）
                    ╠═ 路線A：選第 3 個元素（異屬）→ 三屬塔 Lv5
                    ╚═ 路線B：同屬雙注（base==infuse）→ 直升 Lv6

                 三屬塔 Lv5 (+400g=910g, TRIPLE_TOWERS，20 種）
                      ↓ 不需要三同屬；第 3 元素只需 1+ pick

                 純屬終極塔 Lv6 (+600g, PURE_TOWERS，6 種）
                      ↓ 僅限同屬雙注路線，需要 3 同元素 picks + 精華閾值
```

---

## 影響範圍

只影響 CLAUDE.md 文件說明，不影響任何程式碼。
