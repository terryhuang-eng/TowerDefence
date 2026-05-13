# step1 — 螢幕 debug overlay

## 目標

在手機畫面右下角顯示最近 12 行 log，攔截 console.log / console.error / window.onerror，並在關鍵位置加入診斷 log。

## 影響範圍

- `index.html`：加 `#mobile-debug` HTML + CSS
- `js/game.js`：加 `_dbg()` helper + 關鍵位置 log

---

## HTML（加在 `</body>` 前）

```html
<div id="mobile-debug" style="display:none;position:fixed;bottom:0;right:0;width:280px;max-height:180px;overflow-y:auto;background:rgba(0,0,0,0.85);color:#0f0;font-size:10px;font-family:monospace;padding:4px;z-index:9999;pointer-events:none;"></div>
<button id="mobile-debug-toggle" style="display:none;position:fixed;top:4px;right:4px;z-index:9999;background:#333;color:#fff;border:none;padding:4px 8px;font-size:10px;">DBG</button>
```

---

## JS（加在 `Game` class 頂層，setupEvents() 附近）

### `_dbg(msg)` helper

```js
_dbg(msg) {
  const el = document.getElementById('mobile-debug');
  if (!el) return;
  const line = document.createElement('div');
  line.textContent = `${new Date().toISOString().slice(11,19)} ${msg}`;
  el.appendChild(line);
  while (el.children.length > 12) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}
```

### 初始化：`initGrid()` 末尾（mobile check 之後）加

```js
// debug overlay（手機開啟）
if (window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches) {
  const dbg = document.getElementById('mobile-debug');
  const tog = document.getElementById('mobile-debug-toggle');
  if (dbg) dbg.style.display = 'block';
  if (tog) {
    tog.style.display = 'block';
    tog.onclick = () => { dbg.style.display = dbg.style.display === 'none' ? 'block' : 'none'; };
  }
  window.onerror = (msg, src, line) => {
    this._dbg(`ERR: ${msg} (${src}:${line})`);
    return false;
  };
}
```

### `buildMobileHud()` 入口加

```js
this._dbg(`buildMobileHud state=${this.state} mq=${window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches}`);
```

### Ready 按鈕 onclick 改成

```js
readyBtn.onclick = () => {
  this._dbg(`readyBtn tap state=${this.state}`);
  this.startWave();
};
```

### `startWave()` 入口加

```js
this._dbg(`startWave wave=${this.wave} state=${this.state}`);
```

### Ready 按鈕 touchstart（診斷是否有 tap 到）—— 加在設置 onclick 之後

```js
readyBtn.ontouchstart = (e) => {
  this._dbg(`readyBtn touchstart`);
};
```

---

## 驗證（按順序看 log）

預期正常流程：
```
HH:MM:SS buildMobileHud state=pre_wave mq=true
HH:MM:SS readyBtn touchstart
HH:MM:SS readyBtn tap state=pre_wave
HH:MM:SS startWave wave=1 state=pre_wave
```

若出現：
- `mq=false` → media query 仍不匹配，需查裝置尺寸
- touchstart 有但 tap 沒有 → click event 被攔截（縮放問題）
- `readyBtn tap` 有但 `startWave` 沒有 → startWave 內有 throw
- `ERR: ...` → JS 錯誤導致崩潰
