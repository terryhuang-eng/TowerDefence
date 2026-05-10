# Step 1：加入評分參數寫回機制

## 目標

讓 `LEVEL_SCORE_STD` 與 `RANGE_FACTOR_K`（以及 `ATKSPD_REF`）在 UI 調整後，可以一鍵寫回 `skill-editor.html` 本身，重新整理後不遺失。

## 受影響的常數（均在 skill-editor.html line 947-950）

```
const LEVEL_SCORE_STD = { lv1: 20, lv2: 45, lv3: 80, lv4: 160, lv5: 280, lv6: 440 };
const ATKSPD_REF     = { lv3: 1.2, lv4: 1.2, lv5: 1.2, lv6: 1.5 };
const AOE_DENSITY    = 0.5;
let RANGE_FACTOR_K   = 0.2; // 每單位射程差的...
```

`ATKSPD_REF` 目前沒有 UI（只能直接改 source），一併納入寫回即可確保完整性。

## 修改點（共 3 處，均在 skill-editor.html）

---

### 修改點 A：加 `seFileHandle` 變數（約 line 116 附近，`fileHandles` 宣告後）

**定位**：`Grep "let jsDirHandle"` → 找到行號 → Read ±2 行確認

在 `let jsDirHandle = null;` **之後**加一行：

```js
let seFileHandle = null; // skill-editor.html 自身的 FileHandle（用於寫回評分參數）
```

---

### 修改點 B：加 `openSEHandle()` 與 `saveSEScoreParams()` 函數（約 line 190 附近，`updateRangeFactorK` 之後）

**定位**：`Grep "function updateRangeFactorK"` → 找到行號 → Read ±3 行確認

在 `updateRangeFactorK` 函數結尾 `}` **之後**插入：

```js
async function openSEHandle() {
  if (!window.showOpenFilePicker) { showStatus('⚠️ 瀏覽器不支援 File System Access API'); return; }
  try {
    const [fh] = await window.showOpenFilePicker({
      types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }],
      multiple: false
    });
    seFileHandle = fh;
    showStatus(`✅ 已選取 ${fh.name}，可使用 💾 寫回評分參數`);
  } catch (e) {
    if (e.name !== 'AbortError') showStatus('⚠️ 選取失敗：' + e.message);
  }
}

async function saveSEScoreParams() {
  if (!seFileHandle) { showStatus('⚠️ 請先按 📂 選取 skill-editor.html'); return; }
  try {
    const file = await seFileHandle.getFile();
    let content = await file.text();

    // Patch LEVEL_SCORE_STD
    const lvStd = LEVEL_SCORE_STD;
    content = content.replace(
      /^const LEVEL_SCORE_STD\s*=\s*\{[^}]+\};/m,
      `const LEVEL_SCORE_STD = { lv1: ${lvStd.lv1}, lv2: ${lvStd.lv2}, lv3: ${lvStd.lv3}, lv4: ${lvStd.lv4}, lv5: ${lvStd.lv5}, lv6: ${lvStd.lv6} };`
    );

    // Patch RANGE_FACTOR_K（保留行尾註解）
    content = content.replace(
      /^let RANGE_FACTOR_K\s*=\s*[\d.]+;/m,
      `let RANGE_FACTOR_K   = ${RANGE_FACTOR_K};`
    );

    const writable = await seFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    showStatus('✅ 評分參數已寫回 skill-editor.html');
  } catch (e) {
    showStatus('⚠️ 寫入失敗：' + e.message);
  }
}
```

---

### 修改點 C：在 config panel 的 RANGE_FACTOR_K 區塊後加「📂 / 💾」按鈕

**定位**：`Grep "range4=1.00"` → 找到行號 → Read ±3 行確認

目前 RANGE_FACTOR_K 區塊最後一行是：
```js
  html += `</div>`;
  body.innerHTML = html;
```

在 `body.innerHTML = html;` 之前（即最後一個 `html += '</div>'` 之後），插入：

```js
  // 評分參數寫回工具列
  const seLabel = seFileHandle ? `📄 ${seFileHandle.name}` : '未選取';
  html += `<div style="margin-top:8px;border-top:1px solid #555;padding:6px 8px;display:flex;align-items:center;gap:6px">`;
  html += `<span style="font-size:11px;color:#888">評分參數：${seLabel}</span>`;
  html += `<button onclick="openSEHandle()" style="font-size:11px;padding:1px 6px" title="選取 skill-editor.html">📂</button>`;
  html += `<button onclick="saveSEScoreParams()" style="font-size:11px;padding:1px 6px" title="將目前 LEVEL_SCORE_STD / RANGE_FACTOR_K 寫回 html">💾 儲存</button>`;
  html += `</div>`;
```

---

## 預期效果

1. 使用者在 ⚙️ config 面板看到 **「評分參數：未選取 📂 💾 儲存」** 工具列
2. 點 📂 → 瀏覽器開啟選檔對話框 → 選取 `skill-editor.html`
3. 調整 `LEVEL_SCORE_STD` 或 `RANGE_FACTOR_K` → 點 💾 儲存
4. 重新整理頁面後，數值為剛才儲存的值 ✅

## 驗證方式

1. 開啟 skill-editor.html → 切換到 ⚙️ 面板 → 確認底部出現「評分參數」工具列
2. 點 📂 選取 skill-editor.html 本身
3. 修改 lv4 LEVEL_SCORE_STD：160 → 180 → 點 💾
4. 重新整理 → 確認 lv4 顯示 180

## 注意事項

- ATKSPD_REF 目前無 UI，此步驟不加（值不會被用戶改動，不需寫回）
- `seFileHandle` 重新整理後清空（瀏覽器安全限制），每次打開頁面需重新選取一次
- `showStatus()` 呼叫時若 export-status span 不在 DOM（非 towers/sends/waves/config tab），訊息可能不顯示 → `saveSEScoreParams` 應在 config tab 使用
