# Step 1 — game.js LV4→LV5 升級按鈕 icon 修正

## 目標
LV4 純屬塔升級到 LV5 的按鈕，顯示雙元素 icon（🌪️🌪️）而非三元素（🌪️🌪️🌪️）。

## 影響範圍
- **檔案**：`js/game.js`
- **位置**：LV4 升級面板中，`if (pure.lv5 && picks >= 2)` 的 btn.innerHTML

## 定位方式
Grep `pure\.name\} Lv5` 找到 LV5 升級按鈕的那行 innerHTML。

## 具體修改

找到 LV5 升級按鈕的 innerHTML，將：
```javascript
<span style="font-size:14px">${pure.icon}</span>
<span style="color:${ELEM[t.elem].color}">${pure.name} Lv5</span>
```

改為：
```javascript
<span style="font-size:14px">${ELEM[t.elem].icon + ELEM[t.elem].icon}</span>
<span style="color:${ELEM[t.elem].color}">${pure.name} Lv5</span>
```

## 確認不動的地方
- LV6 預覽按鈕（picks<2 的 else 分支）：`pure.icon` 保持三元素 ✅
- LV5→LV6 升級按鈕（step 2D 加的）：`pure.icon` 保持三元素 ✅
- info panel 顯示：`ELEM[t.elem].icon + '×2'` 已正確 ✅
- canvas 渲染：`ELEM[tw.elem].icon + '×2'` 已正確 ✅
