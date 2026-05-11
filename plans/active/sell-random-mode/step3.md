# step3 — buildRulesTab 加入賣塔返還規則 + 隨機模式說明

## 目標

在遊戲內「📖 說明」→「📜 規則」tab 補充：
1. 賣塔返還率規則（Lv1-3=100%，Lv4-6=80%）
2. 隨機模式說明

## 影響範圍

- **唯一修改**：`js/game.js`，`buildRulesTab()` 函數（line ~2042）

---

## 定位

Grep `💰 經濟系統`，找到 `buildRulesTab()` 中的經濟段落（line ~2049）。

在「💰 經濟系統」區塊末尾（`送兵 = 主要 income 成長手段` 之後）補充賣塔說明：

```
舊：
          <b style="color:#4ecdc4;">送兵 = 主要 income 成長手段</b>，不送兵後期會缺錢

新：
          <b style="color:#4ecdc4;">送兵 = 主要 income 成長手段</b>，不送兵後期會缺錢<br>
          賣塔返還：Lv1/2/3 = <b style="color:#4ecdc4;">100%</b>，Lv4/5/6 = <b style="color:#ffd93d;">80%</b>
```

然後在「🏗️ 升級路徑」區塊末尾之後新增：

```html
<h3 style="color:#aaa;margin:12px 0 4px;">🎲 隨機模式</h3>
<div style="font-size:11px;">
  W3 元素選擇時可選「隨機模式」，之後每次元素皆自動隨機決定。<br>
  <b style="color:#4ecdc4;">隨機模式下所有塔賣出 100% 全額返還。</b>
</div>
```

---

## 驗證

- 「📖 說明」→「📜 規則」顯示賣塔返還率說明
- 隨機模式區塊出現在升級路徑之後
