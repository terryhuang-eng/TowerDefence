# Step 1：修復 sandbox 面板的 none 元素支援

## 目標

讓 sandbox 面板可以解鎖「無屬性（none）」元素 pick，使 LV3→LV4 能出現含 none 的注入選項。

## 影響範圍

- 檔案：`index.html`
- 修改點 1（line ~539）：sb-elem-btn 按鈕列，加入 `⬜` 按鈕
- 修改點 2（line ~627）：`sbUnlockAll` handler 陣列，加入 `'none'`

## 具體修改

### 修改 1：加入 ⬜ 按鈕（HTML）

**位置定位：** Grep `data-elem="thunder"` → 找到該行 → 在其後插入 none 按鈕

**old：**
```html
          '<button class="sb-elem-btn sb-btn" data-elem="thunder">⚡</button>' +
          '<button id="sbUnlockAll" class="sb-btn" style="color:#ffd700">全解鎖</button>' +
```

**new：**
```html
          '<button class="sb-elem-btn sb-btn" data-elem="thunder">⚡</button>' +
          '<button class="sb-elem-btn sb-btn" data-elem="none">⬜</button>' +
          '<button id="sbUnlockAll" class="sb-btn" style="color:#ffd700">全解鎖</button>' +
```

### 修改 2：全解鎖加入 none

**位置定位：** Grep `sbUnlockAll` → 找到 click handler → 陣列補 `'none'`

**old：**
```javascript
    ['fire','water','wind','earth','thunder'].forEach(function(e) {
      g.elemPicks[e] = 4;
    });
```

**new：**
```javascript
    ['fire','water','wind','earth','thunder','none'].forEach(function(e) {
      g.elemPicks[e] = 4;
    });
```

## 驗證方式

1. 瀏覽器開啟 `?sandbox=1`
2. 建一個 LV1 塔 → 升到 LV3 火塔
3. 點 sandbox ⬜ 按鈕（+1 none pick）
4. 點選塔 → 應出現「混沌焰 🔥⬜」升級選項
5. 點「全解鎖」→ 確認所有元素（含 none）都設為 4 picks
