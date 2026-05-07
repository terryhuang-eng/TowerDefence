# Step 3: 修正 Bot upgradeTowers 注入優先邏輯

## 目標
讓混屬策略（如 mix_fire_water）能實際走跨元素 INFUSION，而非被同元素優先邏輯覆蓋。

## 影響範圍
- **檔案**：`autotest.js`
- **位置**：Bot.upgradeTowers() 內，Lv3→Lv4 注入區塊（約 276–295 行）
- **不影響**：A 組策略、純屬策略、C 組三屬策略

## 問題根因

現行邏輯（約 281–285 行）：
```js
let injElem = null;
if ((g.elemPicks[t.elem] || 0) >= 2) {
  injElem = t.elem;   // ← 同元素優先，讓混屬策略走錯路線
} else {
  injElem = ELEM_KEYS.find(e => e !== t.elem && (g.elemPicks[e] || 0) >= 1) || null;
}
```

以 `mix_fire_water` 為例：
- W9 後 elemPicks = {fire:2, water:1}
- 塔為火底（t.elem='fire'）→ fire ≥ 2 → injElem = 'fire' → 暴焰塔（fire+fire）
- 但策略意圖是 fire+water → 蒸汽塔

## 修正方案

優先使用策略定義的第 2 個 pick（`s.elemPicks[1]`）作為注入目標，再 fallback 到同元素：

```js
let injElem = null;
// 優先：策略指定的注入元素（elemPicks[1]）
const stratInfuse = s.elemPicks[1] || null;
if (stratInfuse && stratInfuse !== t.elem &&
    (g.elemPicks[stratInfuse] || 0) >= 1 &&
    INFUSIONS[t.elem]?.[stratInfuse]) {
  injElem = stratInfuse;
}
// Fallback：同元素注入（純屬策略路線）
if (!injElem && (g.elemPicks[t.elem] || 0) >= 2) {
  injElem = t.elem;
}
// Fallback：任意其他有效元素
if (!injElem) {
  injElem = ELEM_KEYS.find(e => e !== t.elem && (g.elemPicks[e] || 0) >= 1) || null;
}
```

## 策略行為對照表

| 策略 | elemPicks[1] | 修正後 Lv4 路線 |
|------|-------------|----------------|
| pure_fire | fire（同元素）| 暴焰塔（不變）|
| mix_fire_water | water | 蒸汽塔（修正）|
| mix_fire_earth | earth | 熔蝕塔（修正）|
| triple_fire_water_earth | water | 蒸汽塔（修正）|

## 注意事項
- 純屬策略（elemPicks = [fire, fire, fire, fire]）：s.elemPicks[1] = 'fire' = t.elem，走第二條件同元素，行為不變
- C 組三屬策略：elemPicks[1] 為第二元素，與 base 不同，會走跨元素注入，符合預期
