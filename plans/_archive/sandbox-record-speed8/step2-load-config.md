# sandbox-record-speed8 / step2 — 記錄儲存 localStorage + 一鍵讀取

## 設計

**儲存**：按下「📋 記錄當前設定」時，同步把設定寫入 `localStorage['sbConfig']`。
**讀取**：按下「⬆ 讀取設定」時，從 localStorage 讀出並套用到 SANDBOX + 所有 UI 元件。

重整後 localStorage 仍存在，點讀取即可還原，不需自動套用（避免不小心覆蓋新設定）。

### 儲存格式（JSON）

```js
{
  hpMult:    1.0,
  countMult: 1.0,
  infHP:     false,
  noAiSend:  false,
  gameSpeed: 2,
  elemPicks: { fire:2, water:1, wind:0, earth:0, thunder:0, none:0 }
}
```

### 讀取時套用的 UI 元件

| 設定 | SANDBOX 欄位 | UI 更新 |
|------|-------------|---------|
| hpMult | `SANDBOX.hpMult` | `#sbHpMult` value + `#sbHpMultVal` text |
| countMult | `SANDBOX.countMult` | `#sbCountMult` value + `#sbCountMultVal` text |
| infHP | `SANDBOX.infHP` | `#sbInfHP` text/color |
| noAiSend | `SANDBOX.noAiSend` | `#sbNoAiSend` text/color |
| gameSpeed | `g.gameSpeed` | `.sb-speed-btn` active class |
| elemPicks | `g.elemPicks` | `g.rebuildSidebar()` |

---

## 影響範圍

`index.html` 兩處修改：

1. **HTML**：`#sbRecord` section 內加「⬆ 讀取設定」按鈕
2. **JS**：
   - `#sbRecord` click handler 末尾加 localStorage 寫入
   - 新增 `#sbLoad` click handler

---

## 修改 A — HTML：加讀取按鈕（在記錄按鈕同 section）

```js
// 現況
'<button id="sbRecord" class="sb-btn" style="width:100%">📋 記錄當前設定</button>' +

// 改為
'<button id="sbRecord" class="sb-btn" style="width:100%">📋 記錄當前設定</button>' +
'<button id="sbLoad" class="sb-btn" style="width:100%;margin-top:4px;color:#4ecdc4">⬆ 讀取設定</button>' +
```

---

## 修改 B — JS：記錄按鈕加 localStorage 寫入

在 `#sbRecord` click handler 的 `log.innerHTML = ...` 之後加：

```js
// 儲存設定到 localStorage
var cfg = {
  hpMult:    sb.hpMult,
  countMult: sb.countMult,
  infHP:     sb.infHP,
  noAiSend:  sb.noAiSend,
  gameSpeed: g ? (g.gameSpeed || 1) : 1,
  elemPicks: g ? Object.assign({}, g.elemPicks) : {}
};
localStorage.setItem('sbConfig', JSON.stringify(cfg));
```

---

## 修改 C — JS：新增讀取按鈕 handler

```js
document.getElementById('sbLoad').addEventListener('click', function() {
  var raw = localStorage.getItem('sbConfig');
  if (!raw) { alert('尚無記錄'); return; }
  var cfg = JSON.parse(raw);
  var g = sbGame();
  var sb = window.SANDBOX;

  // hpMult
  sb.hpMult = cfg.hpMult;
  document.getElementById('sbHpMult').value = cfg.hpMult;
  document.getElementById('sbHpMultVal').textContent = cfg.hpMult + 'x';

  // countMult
  sb.countMult = cfg.countMult;
  document.getElementById('sbCountMult').value = cfg.countMult;
  document.getElementById('sbCountMultVal').textContent = cfg.countMult + 'x';

  // infHP
  sb.infHP = cfg.infHP;
  var infBtn = document.getElementById('sbInfHP');
  infBtn.dataset.on = cfg.infHP ? '1' : '0';
  infBtn.textContent = cfg.infHP ? '● ON' : '○ OFF';
  infBtn.style.color = cfg.infHP ? '#4ecdc4' : '#888';

  // noAiSend
  sb.noAiSend = cfg.noAiSend;
  var aiBtn = document.getElementById('sbNoAiSend');
  var aiOn = !cfg.noAiSend;
  aiBtn.dataset.on = aiOn ? '1' : '0';
  aiBtn.textContent = aiOn ? '● ON' : '○ OFF';
  aiBtn.style.color = aiOn ? '#4ecdc4' : '#888';

  // gameSpeed
  if (g && cfg.gameSpeed) {
    g.gameSpeed = cfg.gameSpeed;
    document.querySelectorAll('.sb-speed-btn').forEach(function(b) {
      b.classList.toggle('active-speed', parseFloat(b.dataset.spd) === cfg.gameSpeed);
    });
  }

  // elemPicks
  if (g && cfg.elemPicks) {
    Object.assign(g.elemPicks, cfg.elemPicks);
    g.rebuildSidebar && g.rebuildSidebar();
    g.render && g.render();
  }
});
```

---

## 定位指令

```
Grep 'sbRecord.*class.*sb-btn' index.html   → 確認 HTML 記錄按鈕行號
Grep 'localStorage.setItem\|sbConfig'        → 確認是否已存在（應無）
Grep 'entries.join' index.html              → 找 JS 記錄 handler 末尾位置
```
