# step3 — HUD 金幣更新 + 送兵剩餘配額顯示

## 目標

1. **3a**：`sendAction` 與 upgrade onclick 呼叫 `this.buildHUD()` 以更新 HUD 金幣
2. **3b**：送兵按鈕加上剩餘可召喚次數（`remaining/quota`）

## 目標檔案

`js/game.js`

## 影響範圍

- `buildHUD` 內的 `sendAction`（約第 1169-1178 行）
- `showTowerActionPopup` 的 `btn.onclick`（約第 1310-1317 行）
- `buildHUD` 的按鈕 innerHTML（約第 1162 行）

---

## 修改說明

### 3a — sendAction 呼叫 buildHUD

**位置**：`buildHUD` 內的 `sendAction` 函數末尾（第 1177 行）。

**現狀**：
```js
this.playerSendQueue.push({ ...s, sendId: `${s.id}_${Date.now()}` });
this.rebuildSidebar();
```

**修正**：
```js
this.playerSendQueue.push({ ...s, sendId: `${s.id}_${Date.now()}` });
this.rebuildSidebar();
this.buildHUD();
```

---

### 3a — upgrade onclick 呼叫 buildHUD

**位置**：`showTowerActionPopup` 的 `btn.onclick`（第 1314 行，已在 step2 修正的同一個 onclick）。

**現狀**（step2 修正後）：
```js
this.gold -= upg.cost;
upg.action();
this.rebuildSidebar();
if (this.selectedTower) this.showTowerActionPopup(this.selectedTower);
else this.hideTowerActionPopup();
```

**修正**：在 `rebuildSidebar()` 後加 `buildHUD()`：
```js
this.gold -= upg.cost;
upg.action();
this.rebuildSidebar();
this.buildHUD();
if (this.selectedTower) this.showTowerActionPopup(this.selectedTower);
else this.hideTowerActionPopup();
```

---

### 3b — 按鈕加剩餘配額

**位置**：`buildHUD` 內的 `btn.innerHTML`（第 1162 行）。

**現狀**：
```js
btn.innerHTML = `${s.icon}<br><span style="font-size:10px;">${s.cost}g</span>`;
```

**修正**：在 cost 下方加一行剩餘次數：
```js
btn.innerHTML = `${s.icon}<br><span style="font-size:10px;">${s.cost}g</span><br><span style="font-size:9px;color:#aaa;">${remaining}/${quota}</span>`;
```

`remaining` 與 `quota` 在按鈕建立時（第 1154-1156 行）已計算，直接引用即可。
