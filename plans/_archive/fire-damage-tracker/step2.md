# Step 2 — index.html：sandbox panel 加火傷統計區塊

## 目標
在 sandbox 面板底部加入「火系傷害統計」區塊，顯示 direct/burn/ignite/detonate 累計值與佔比，並提供重置按鈕。

## 依賴
- `window.SANDBOX.fireDmg` 物件（由 step1 累加）
- 現有 sandbox panel（`#sandboxPanel`）

## 新增內容

### 1. 初始化 fireDmg
在 `window.SANDBOX` 建立時加入：
```js
fireDmg: { direct: 0, burn: 0, ignite: 0, detonate: 0 }
```
> 找到 `window.SANDBOX = {` 的初始化塊，加入 `fireDmg` 欄位。

### 2. 面板 HTML 區塊
在 `#sandboxPanel` 最後加一個 section：
```html
<div class="sb-section">
  <div class="sb-label">🔥 火系傷害統計</div>
  <div id="sbFireStats" style="font-size:11px;color:#ddd;line-height:1.6;"></div>
  <button class="sb-btn" onclick="resetFireDmg()">重置統計</button>
</div>
```

### 3. 更新函式
每幀（或每秒）更新 `#sbFireStats`。最簡單的做法：在 sandbox IIFE 裡加一個 `setInterval`，每 500ms 重繪一次：
```js
function updateFireStats() {
  const fd = window.SANDBOX?.fireDmg;
  if (!fd) return;
  const total = fd.direct + fd.burn + fd.ignite + fd.detonate || 1;
  const pct = v => (v/total*100).toFixed(1) + '%';
  document.getElementById('sbFireStats').innerHTML =
    `直接: ${Math.round(fd.direct)} (${pct(fd.direct)})<br>` +
    `灼燒: ${Math.round(fd.burn)} (${pct(fd.burn)})<br>` +
    `引燃: ${Math.round(fd.ignite)} (${pct(fd.ignite)})<br>` +
    `引爆: ${Math.round(fd.detonate)} (${pct(fd.detonate)})<br>` +
    `<span style="color:#fa0">合計: ${Math.round(total)}</span>`;
}
function resetFireDmg() {
  if (window.SANDBOX?.fireDmg) Object.keys(window.SANDBOX.fireDmg).forEach(k => window.SANDBOX.fireDmg[k]=0);
}
setInterval(updateFireStats, 500);
```

## 注意事項
- 這些函式定義在 sandbox IIFE 內部，但 `resetFireDmg` 用於 onclick，需掛到 window：`window.resetFireDmg = resetFireDmg;`
- 行號僅供參考，需 Grep 找到 `window.SANDBOX = {` 與 `#sandboxPanel` 實際位置再 Edit
