# Step 1 — js/game.js：AI 派兵守衛

## 目標
當 `window.SANDBOX?.noAiSend === true` 時跳過 `aiDecideSends()`。

## 定位
`game.js:1569`：
```js
if (this.mode === 'pve') {
  aiSends = this.aiDecideSends();
}
```

## 修改
```js
if (this.mode === 'pve' && !window.SANDBOX?.noAiSend) {
  aiSends = this.aiDecideSends();
}
```

一行改動，加 `&& !window.SANDBOX?.noAiSend` 即可。
