# sandbox-record-speed8 / step1 — index.html 修改

## 影響範圍

`index.html` 三處修改：
1. 速度按鈕列加 8x
2. 火系統計區塊後加記錄按鈕 + log 區塊
3. JS 加記錄邏輯

---

## 修改 A — 速度列加 8x（約 line 555-557）

```js
// 現況
'<button class="sb-speed-btn sb-btn active-speed" data-spd="1">1x</button>' +
'<button class="sb-speed-btn sb-btn" data-spd="2">2x</button>' +
'<button class="sb-speed-btn sb-btn" data-spd="4">4x</button>' +

// 改為
'<button class="sb-speed-btn sb-btn active-speed" data-spd="1">1x</button>' +
'<button class="sb-speed-btn sb-btn" data-spd="2">2x</button>' +
'<button class="sb-speed-btn sb-btn" data-spd="4">4x</button>' +
'<button class="sb-speed-btn sb-btn" data-spd="8">8x</button>' +
```

---

## 修改 B — 記錄按鈕 + log 區塊（緊接在火系統計 `</div>` 之後，`'</div>';` 之前）

```js
// 現況（line 564）
    '</div>' +
  '</div>';

// 改為（在最後 </div></div> 前插入）
      '<div class="sb-section">' +
        '<button id="sbRecord" class="sb-btn" style="width:100%">📋 記錄當前設定</button>' +
        '<div id="sbRecordLog" style="font-size:10px;color:#aaa;margin-top:4px;line-height:1.7;max-height:80px;overflow-y:auto;"></div>' +
      '</div>' +
    '</div>' +
  '</div>';
```

---

## 修改 C — JS 記錄邏輯（緊接在 `window.resetFireDmg` 區塊之後）

```js
// 記錄按鈕
document.getElementById('sbRecord').addEventListener('click', function() {
  var g = sbGame();
  var sb = window.SANDBOX;
  var wave = g ? ('W' + (g.wave + 1)) : 'W?';
  var spd = g ? (g.gameSpeed + 'x') : '?x';
  var elemStr = '';
  if (g && g.elemPicks) {
    var icons = {fire:'🔥',water:'💧',wind:'🌪️',earth:'⛰️',thunder:'⚡',none:'⬜'};
    Object.entries(g.elemPicks).forEach(function(kv) {
      if (kv[1] > 0) elemStr += icons[kv[0]] + '×' + kv[1] + ' ';
    });
  }
  var line = '[' + wave + '] HP' + sb.hpMult + 'x Cnt' + sb.countMult + 'x Spd:' + spd +
    (elemStr ? ' ' + elemStr.trim() : '') +
    (sb.infHP ? ' infHP' : '') +
    (sb.noAiSend ? ' noAI' : '');
  var log = document.getElementById('sbRecordLog');
  var entries = log.innerHTML ? log.innerHTML.split('<br>').filter(Boolean) : [];
  entries.unshift(line);
  if (entries.length > 5) entries = entries.slice(0, 5);
  log.innerHTML = entries.join('<br>');
});
```

---

## 定位指令

```
Grep 'sb-speed-btn.*4x' index.html → 確認速度列行號
Grep "'</div>';" index.html → 確認最後收尾行號（約 564）
Grep 'resetFireDmg' index.html → 確認記錄 JS 插入位置
```
