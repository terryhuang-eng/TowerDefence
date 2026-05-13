# step1 — 修正 line 3937 損壞的 name 運算式

## 目標

移除 `|initGrid| id.slice(-4)` 損壞片段，恢復 Guest 送出 `lobbyJoin` 訊息。

## 影響範圍

- **唯一修改**：`js/game.js` line 3937，一行

---

## 修改

```
舊：
    hostConn.send({ type: 'lobbyJoin', name: getMyName() |initGrid| id.slice(-4) });

新：
    hostConn.send({ type: 'lobbyJoin', name: getMyName() });
```

`getMyName()` 已有 `|| 'Player'` fallback，不需要額外 id 後綴。

---

## 驗證

- Guest 端輸入房間碼加入 → 無 ReferenceError
- Host 端大廳顯示 Guest 名稱 → 可正常開始遊戲
