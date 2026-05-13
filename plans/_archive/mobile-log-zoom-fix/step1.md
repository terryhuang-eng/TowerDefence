# step1 — 強化 debug logging

## 目標

讓 debug overlay 能清楚追蹤「按鈕 → startWave → 狀態切換」的完整鏈，找出哪一步斷掉。

## 影響範圍

- `js/game.js`：`_dbg()`、`initGrid()` 的 debug 初始化、`buildMobileHud()`、`startWave()`

---

## 修改 A — `_dbg()` 加毫秒 + 擴增行數

```
舊：
  _dbg(msg) {
    const el = document.getElementById('mobile-debug');
    if (!el || el.style.display === 'none') return;
    const line = document.createElement('div');
    line.textContent = `${new Date().toISOString().slice(11,19)} ${msg}`;
    el.appendChild(line);
    while (el.children.length > 12) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  }

新：
  _dbg(msg) {
    const el = document.getElementById('mobile-debug');
    if (!el || el.style.display === 'none') return;
    const line = document.createElement('div');
    line.textContent = `${new Date().toISOString().slice(11,22)} ${msg}`;
    el.appendChild(line);
    while (el.children.length > 20) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  }
```

說明：
- `.slice(11,22)` → `HH:MM:SS.mmm`，可分辨同一秒內的多個事件
- 行數從 12 擴增到 20，不容易被擠掉

---

## 修改 B — debug overlay 提早顯示，不依賴 initGrid() 完成

`initGrid()` 中 debug 初始化的位置在整個函式很後面，但 `buildMobileHud()` 在更早就被呼叫（rebuildSidebar → buildMobileHud），導致 HUD 初始化 log 全部丟失。

**修改**：在 `initGrid()` **一開始**就把 debug overlay 顯示出來，不等到後面。

```
找到 initGrid() 函式開頭（大約在 if (window.matchMedia...).matches 那個 block 內），
把 dbg/tog 的 display 設定移到這個 block 的最頂端：

舊順序：
  if (mq.matches) {
    hud.style.display = 'flex';
    touchmove listener...
    dbg.style.display = 'block';   ← 在後面
    tog ...
    window.onerror ...
    setVh ...
    this._dbg(`initGrid done ...`);
  }

新順序：
  if (mq.matches) {
    // 先把 debug overlay 顯示，這樣後面所有 _dbg 才能記錄
    const dbg = document.getElementById('mobile-debug');
    const tog = document.getElementById('mobile-debug-toggle');
    if (dbg) dbg.style.display = 'block';
    if (tog) {
      tog.style.display = 'block';
      tog.onclick = () => { dbg.style.display = dbg.style.display === 'none' ? 'block' : 'none'; };
    }
    window.onerror = (msg, src, line) => { this._dbg(`ERR:${msg}(${src}:${line})`); return false; };

    if (hud) hud.style.display = 'flex';
    document.addEventListener('touchmove', ...);
    const setVh = ...;
    setVh();
    window.addEventListener('resize', setVh);
    this._dbg(`initGrid done w=${window.innerWidth} h=${window.innerHeight}`);
  }
```

---

## 修改 C — readyBtn handler 加更詳細 log

```
舊：
  readyBtn._touchHandler = (e) => {
    e.preventDefault();
    this._dbg(`readyBtn touchstart state=${this.state}`);
    this.startWave();
  };

新：
  readyBtn._touchHandler = (e) => {
    e.preventDefault();
    this._dbg(`BTN state=${this.state} wave=${this.wave}`);
    this.startWave();
    this._dbg(`BTN done state=${this.state}`);
  };
```

說明：
- `BTN` 標記讓視覺上容易找到按鈕事件
- `after` log 確認 startWave() 有跑完（而非中途拋錯）
- 若只看到 `BTN state=...` 但看不到 `BTN done ...`，表示 startWave() 內有例外

---

## 修改 D — startWave() 加狀態轉換 log

```
現有：
  startWave() {
    this._dbg(`startWave wave=${this.wave} state=${this.state}`);
    this.wave++;
    if (this.wave > CONFIG.totalWaves) { this.endGame(true, 'survived'); return; }
    ...
    this.state = 'spawning';

新增一行（在 this.state = 'spawning' 之後）：
    this.state = 'spawning';
    this._dbg(`→spawning spawnQ=${this.spawnQueue.length}`);
```

說明：這行確認狀態已切換 + spawnQueue 有東西，若看不到這行表示 state 切換前就出錯了。

---

## 預期讀取到的 log 範例（成功路徑）

```
10:23:45.001 buildHUD state=pre_wave mq=true hud=true
10:23:45.002 initGrid done w=390 h=844
10:23:48.512 BTN state=pre_wave wave=0
10:23:48.513 startWave wave=0 state=pre_wave
10:23:48.514 →spawning spawnQ=8
10:23:48.515 BTN done state=spawning
```

如果這個序列不完整（例如看不到 `BTN state=...`），說明 touchstart 沒有觸發；
如果看到 `BTN state=...` 但沒有 `startWave wave=...`，表示 startWave() 呼叫前就出錯。
