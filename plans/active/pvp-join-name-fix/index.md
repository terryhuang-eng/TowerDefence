# pvp-join-name-fix — PVP 連線端 initGrid 未定義崩潰

## 根本原因

`js/game.js` line 3937（Guest 加入房間的 `hostConn.on('open')` 回呼）：

```js
hostConn.send({ type: 'lobbyJoin', name: getMyName() |initGrid| id.slice(-4) });
```

`|initGrid|` 是損壞的語法——JavaScript 把它解讀為兩次 bitwise OR，而 `initGrid` 是 `Game` 類別的方法，不是全域變數，因此拋出：

```
Uncaught ReferenceError: initGrid is not defined
```

**對比 Host 端同類程式碼（line 3864）**：
```js
lobbyPlayers = [{ id: myPeerId, name: getMyName() || 'Host' }];
```

正確用的是 `||`（邏輯 OR 預設值）。

**症狀**：
- 連線端（Guest）在 `hostConn.on('open')` 中崩潰 → 訊息發不出去
- 建立房間端（Host）收不到 `lobbyJoin` 訊息 → 大廳無反應
- 兩端都卡住

## 修正邏輯

`getMyName()` 本身已內建 fallback（回傳 `'Player'`），直接去掉損壞的 `|initGrid| id.slice(-4)` 即可：

```js
hostConn.send({ type: 'lobbyJoin', name: getMyName() });
```

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 修正 line 3937 損壞的 name 運算式 | ⬜ | js/game.js |
