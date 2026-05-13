# step2 — 修正手機升級不扣金幣

## 目標

`showTowerActionPopup` 升級按鈕 onclick 加入 `this.gold -= upg.cost`。

## 目標檔案

`js/game.js`

## 影響範圍

`showTowerActionPopup` 函數的 `btn.onclick`，約第 1310-1317 行。

---

## 修改說明

**位置**：`showTowerActionPopup` 內，for 迴圈建立的 `btn.onclick`。

**現狀**：
```js
btn.onclick = (e) => {
  e.stopPropagation();
  if (this.gold < upg.cost) return;
  upg.action();
  this.rebuildSidebar();
  if (this.selectedTower) this.showTowerActionPopup(this.selectedTower);
  else this.hideTowerActionPopup();
};
```

**修正**：在 `upg.action()` 前加入金幣扣除：
```js
btn.onclick = (e) => {
  e.stopPropagation();
  if (this.gold < upg.cost) return;
  this.gold -= upg.cost;
  upg.action();
  this.rebuildSidebar();
  if (this.selectedTower) this.showTowerActionPopup(this.selectedTower);
  else this.hideTowerActionPopup();
};
```

**為什麼**：`_getMobileUpgradeOptions` 的 `action()` 只負責更新塔的屬性（level、damage、skills 等），金幣扣除的職責在呼叫端（`showTowerActionPopup`）。桌面版 `rebuildSidebar` 的每個 btn.onclick 都有內聯 `this.gold -= nextData.cost`，手機版重構成分離 action 時忘記加入這一行。
