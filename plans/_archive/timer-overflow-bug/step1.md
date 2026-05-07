# Step 1：無目標時清空 atkTimer

## 目標
修正 while loop 在無敵人時每幀只扣 1 導致 `atkTimer` 溢位的問題。

## 影響範圍
- **檔案**：`js/game.js`
- **行數**：約 2765（while loop 內 `if (targets.length === 0) break;`）

## 目前程式碼

```js
if (targets.length === 0) break;
```

## 修改後

```js
if (targets.length === 0) { tw.atkTimer = 0; break; }
```

## 說明
- 有敵人時：`tw.atkTimer -= 1` 已執行（在 break 之前），保留餘量用於多連射 → 正確
- 無敵人時：`tw.atkTimer -= 1` 也已執行，但此值應丟棄，直接歸零防止溢位

## 驗證
1. 建立風塔並把 ramp 疊到最大（打幾輪敵人）
2. 切到下一波 pre_wave，等待 5 秒（或 8× 速等待 1 秒）
3. 開始波次：敵人應正常依塔的 atkSpd 射擊，不應有瞬間清場的爆發
