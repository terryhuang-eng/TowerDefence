# step1 — help modal 新增 DPS_SCORE_REF 專節

## 影響範圍

`skill-editor.html`：help modal `<h3>score_adj</h3>` 之前插入新段落

## 定位方式

```
Grep `<h3>score_adj</h3>` → 找插入點
```

## 修改內容

在 `<h3>score_adj</h3>` 之前插入：

```html
<h3>DPS_REF &amp; DPS_SCORE_REF</h3>
<p>兩個參數量綱不同，不是「相不相等」，而是看<b>比值</b>：</p>
<p><code>score per DPS unit = DPS_SCORE_REF[lv] / DPS_REF[lv]</code></p>
<table>
  <tr><th>param</th><th>description</th></tr>
  <tr><td><code>DPS_REF</code></td><td>「基準 DPS 值」的校準點（DPS 單位）。塔的數值大改後更新此值，讓它反映典型 DPS</td></tr>
  <tr><td><code>DPS_SCORE_REF</code></td><td>達到 DPS_REF 時拿幾分（分數單位）。控制 DPS 在分數預算中的佔比</td></tr>
</table>
<p>目前 <code>DPS_SCORE_REF == LEVEL_SCORE_STD</code>，意思是：達到參考 DPS 的塔光靠 DPS 就拿滿 100% 目標分，技能分是目標分以外的加分項。若想讓塔「需要技能才能達標」，可將 DPS_SCORE_REF 設為 LEVEL_SCORE_STD × 0.6，讓 DPS 只貢獻 60% 預算。</p>
<div class="tip">典型調整：只改塔的傷害數值 → 更新 DPS_REF；想調整 DPS vs 技能的分數比重 → 更新 DPS_SCORE_REF。</div>
```
