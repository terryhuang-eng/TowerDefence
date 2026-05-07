# Step 1: HTML — 加入按鈕 + overlay 外殼

## 目標
在 `index.html` 做兩處 HTML 新增，不動任何 JS 邏輯。

## 改動 1：在 start-screen 加入「技能說明」按鈕

**位置**：`index.html` 第 448 行，`<button class="start-btn" id="start-btn">開始戰鬥</button>` 之後

```html
<button onclick="showSkillRef()" style="margin-top:6px;padding:6px 18px;border:1px solid #b77aff;border-radius:4px;background:transparent;color:#b77aff;cursor:pointer;font-size:13px;">📖 技能說明</button>
```

## 改動 2：加入 `#skill-ref-overlay`

**位置**：`index.html` 第 411 行，現有 `#info-overlay` 的結束 `</div>` 之後，`#start-screen` 之前

```html
<div class="overlay" id="skill-ref-overlay" style="display:none;align-items:flex-start;justify-content:center;overflow-y:auto;">
  <div style="background:#1a1a2e;border:1px solid #555;border-radius:8px;padding:16px;margin:20px auto;max-width:860px;width:95%;max-height:90vh;overflow-y:auto;">
    <div style="text-align:right;position:sticky;top:0;z-index:1;background:#1a1a2e;padding-bottom:4px;">
      <button onclick="document.getElementById('skill-ref-overlay').style.display='none'" style="background:#e94560;border:none;color:#fff;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:14px;">✕ 關閉</button>
    </div>
    <div id="skill-ref-content" style="text-align:left;font-size:12px;line-height:1.7;"></div>
  </div>
</div>
```

## 確認方式
開啟 index.html 後，start-screen 底部出現「📖 技能說明」紫色按鈕；點擊後彈出空白 overlay（因 JS 尚未在 step2 實作）。
