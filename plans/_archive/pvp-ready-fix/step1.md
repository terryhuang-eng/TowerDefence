# step1 — 準備計數顯示：公式修正 + 即時刷新

## 目標

1. 修正計數公式：顯示「包含自己」的總計（`readyPlayers.size + 1` / `alivePlayers.size`）
2. 收到其他人 ready 訊息時即時刷新 HUD（`showWavePreview()`）

## 影響範圍

| 檔案 | 位置 | 說明 |
|------|------|------|
| `js/game.js` | `onNetMsg 'ready'` case（~line 138-142） | 加 `showWavePreview()` 刷新 |
| `js/game.js` | `showWavePreview()` ready 計數變數（~line 1838-1840, 1857） | 修正公式 |

**不影響範圍：**
- `checkAllReady()` 邏輯不動（Host 判斷邏輯正確）
- `pvpAllReady()` 不動
- `doReady()` 不動（已有 `showWavePreview()`）
- 非 PVP 模式不受影響

## 實作重點

### 修改 1：`onNetMsg 'ready'` 加刷新（~line 138-142）

```js
// 原本
case 'ready':
  if (fromId) this.readyPlayers.add(fromId);
  this.addBattleLog('ai', `⚔️ ${senderLabel}已準備（${this.readyPlayers.size}/${this.alivePlayers.size - 1}）`);
  if (this.myReady) this.checkAllReady();
  break;

// 修改後
case 'ready':
  if (fromId) this.readyPlayers.add(fromId);
  this.addBattleLog('ai', `⚔️ ${senderLabel}已準備（${this.readyPlayers.size + (this.myReady ? 1 : 0)}/${this.alivePlayers.size}）`);
  if (this.myReady) this.checkAllReady();
  if (this.state === 'pre_wave') this.showWavePreview();
  break;
```

**重點：**
- `battleLog` 公式同步改為 `(readyPlayers.size + myReady ? 1 : 0) / alivePlayers.size`
- `this.state === 'pre_wave'` guard：避免在 wave 進行中呼叫

### 修改 2：`showWavePreview()` 計數變數（~line 1838-1840, 1857）

```js
// 原本（~line 1838-1840）
const readyCount = this.readyPlayers.size;
const totalOthers = this.alivePlayers.size - 1;
const readyText = this.myReady ? `⏳ 等待中...（${readyCount}/${totalOthers}）` : `✓ 準備 Wave ${nextIdx+1}`;

// 修改後
const readyCount = this.readyPlayers.size + (this.myReady ? 1 : 0);
const totalPlayers = this.alivePlayers.size;
const readyText = this.myReady ? `⏳ 等待中...（${readyCount}/${totalPlayers}）` : `✓ 準備 Wave ${nextIdx+1}`;
```

同步修改 `topReadyBtn.textContent`（~line 1857）：
```js
// 原本
topReadyBtn.textContent = this.myReady ? `⏳ ${readyCount}/${totalOthers}` : `✓ 準備 W${nextIdx+1}`;

// 修改後
topReadyBtn.textContent = this.myReady ? `⏳ ${readyCount}/${totalPlayers}` : `✓ 準備 W${nextIdx+1}`;
```

## 注意事項

- `readyPlayers.size + (this.myReady ? 1 : 0)` 是正確的「含自己」公式：
  - 自己沒按前：`readyPlayers.size + 0`（其他人的數量）
  - 自己按了後：`readyPlayers.size + 1`（其他人 + 自己）
- `alivePlayers.size` 包含全部玩家（含自己），所以最終可達 `N/N`（如 `3/3`）
- `totalOthers` 變數改名為 `totalPlayers`，需要同時更新所有引用它的地方
