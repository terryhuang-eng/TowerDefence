# step1 — top bar 加入「🔮 技能」按鈕

## 目標

在遊戲內 `#info-bar` 加入一個「🔮 技能」按鈕，觸發現有的 `showSkillRef()`。

## 影響範圍

- **唯一修改**：`index.html`，`#info-bar` 區塊（line ~369）

## 定位

```
Grep: id="info-btn"
```

目標行（line ~369）：
```html
<div><button id="info-btn" style="...">📖 說明</button></div>
```

## 具體修改

在 `id="info-btn"` 的 `<div>` **之後**插入：

```html
<div><button onclick="showSkillRef()" style="padding:2px 8px;border:1px solid #b77aff;border-radius:4px;background:#1a1a3e;color:#b77aff;cursor:pointer;font-size:12px;">🔮 技能</button></div>
```

樣式與 `info-btn` 一致，只換 border/color 為紫色（`#b77aff`）與開始畫面按鈕對齊。

## 驗證

- 遊戲開始後 top bar 出現「🔮 技能」按鈕
- 點擊後開啟技能說明 overlay（三 tab：塔技能 / 敵人被動 / 全域上限）
- ✕ 關閉正常運作
- 開始畫面的「📖 技能說明」按鈕維持不變
