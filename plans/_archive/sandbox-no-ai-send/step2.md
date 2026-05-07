# Step 2 — index.html：sandbox 初始化 + 切換按鈕

## 修改點 A：window.SANDBOX 初始化加 noAiSend
找到：
```js
window.SANDBOX = { active: true, hpMult: 1.0, countMult: 1.0, infHP: false, fireDmg: { ... } };
```
加入 `noAiSend: false`。

## 修改點 B：panel HTML 加按鈕
在「無限血量」那個 sb-section 之後、「遊戲速度」之前插入新 section：
```html
'<div class="sb-section" style="display:flex;align-items:center;justify-content:space-between;">' +
  '<div class="sb-label" style="margin-bottom:0">AI 派兵</div>' +
  '<button id="sbNoAiSend" class="sb-btn" data-on="1" style="color:#4ecdc4">● ON</button>' +
'</div>' +
```
（預設 ON = AI 派兵開啟；點擊後切換）

## 修改點 C：按鈕接線（IIFE 事件綁定區段）
在速度按鈕事件之前加：
```js
document.getElementById('sbNoAiSend').addEventListener('click', function() {
  var on = this.dataset.on === '1';
  on = !on;
  this.dataset.on = on ? '1' : '0';
  this.textContent = on ? '● ON' : '○ OFF';
  this.style.color = on ? '#4ecdc4' : '#888';
  window.SANDBOX.noAiSend = !on;
});
```
`noAiSend` = 按鈕 OFF 時為 true（禁止派兵），ON 時為 false（允許派兵）。
