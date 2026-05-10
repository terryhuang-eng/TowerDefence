# Step 1：修正 openSEHandle 面板刷新

## 目標

`openSEHandle()` 選取成功後，改呼叫 `renderScoreDefsPanel()` 取代 `renderPanel()`。

## 修改點

**定位**：`Grep "seFileHandle = fh"` → 找到行號 → Read ±5 行確認

目前（skill-editor.html，`openSEHandle` 函數內）：
```js
    seFileHandle = fh;
    showStatus(`✅ 已選取 ${fh.name}，可使用 💾 寫回評分參數`);
    renderPanel();
```

改為：
```js
    seFileHandle = fh;
    showStatus(`✅ 已選取 ${fh.name}，可使用 💾 寫回評分參數`);
    renderScoreDefsPanel();
```

## 驗證

1. 切到 ⚙️ score-defs tab → 確認底部有「評分參數：未選取 📂 💾」
2. 點 📂 → 選取 skill-editor.html
3. 面板立即更新為「評分參數：📄 skill-editor.html」✅
