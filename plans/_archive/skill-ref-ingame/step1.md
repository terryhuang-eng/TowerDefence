# step1 — 移除開始畫面按鈕 + top bar 新增「🔮 技能」

## 目標

兩個動作合為一步（同一檔案）：
1. 刪除開始畫面的「📖 技能說明」按鈕（line 457）
2. 在遊戲 top bar `#info-btn` 旁插入「🔮 技能」按鈕

## 影響範圍

- **唯一修改**：`index.html`，兩處

---

## 修改 A — 刪除開始畫面按鈕

定位（line 457）：
```html
<button onclick="showSkillRef()" style="margin-top:6px;padding:6px 18px;border:1px solid #b77aff;border-radius:4px;background:transparent;color:#b77aff;cursor:pointer;font-size:13px;">📖 技能說明</button>
```

整行刪除。

---

## 修改 B — top bar 插入「🔮 技能」

定位（line ~369）：
```html
<div><button id="info-btn" style="...">📖 說明</button></div>
```

在該 `<div>` **之後**插入：
```html
<div><button onclick="showSkillRef()" style="padding:2px 8px;border:1px solid #b77aff;border-radius:4px;background:#1a1a3e;color:#b77aff;cursor:pointer;font-size:12px;">🔮 技能</button></div>
```

---

## 驗證

- 開始畫面無「📖 技能說明」按鈕
- 遊戲 top bar 出現「🔮 技能」按鈕
- 點擊後開啟技能說明 overlay，✕ 關閉正常
