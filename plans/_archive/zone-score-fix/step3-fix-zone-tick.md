# zone-score-fix / step3 — 修正 zone tick 換算 bug

## 問題

step2 將 zone 的 `slowAmt` 從「百分比值」改為「層數」，
但 `game.js:2907` 的 zone tick 程式碼沒有同步更新，仍做 `/chillPerStack` 換算：

```js
// 現況（錯誤）
e.chillStacks = Math.max(e.chillStacks || 0, Math.round(z.slowAmt / GLOBAL_CAPS.chillPerStack));
// slowAmt = 30（層數）→ 30 / 0.005 = 6000 層 → 最大減速，永久殘留
```

## 修改

### game.js:2907

```js
// 改為（直接使用層數）
e.chillStacks = Math.max(e.chillStacks || 0, z.slowAmt);
```

`z.slowAmt` 現在已經是層數（來自 `zone_slow.chillStacks`），不需再換算。

## 影響範圍

- 唯一修改：`js/game.js:2907`

## 定位指令

```
Grep 'z\.slowAmt.*chillPerStack' js/game.js → 確認行號 → Read ±2 行 → Edit
```
