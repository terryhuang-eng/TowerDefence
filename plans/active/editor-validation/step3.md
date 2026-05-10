# Step 3：dataVersion 版本字串 + PVP 大廳版本比對

## 目標檔案
1. `skill-editor.html`（版本產生 + 匯出嵌入）
2. `js/game.js`（PVP 大廳版本比對）

## 影響範圍
- skill-editor：`exportConfig()` 結尾加入 `dataVersion` 行
- skill-editor：新增 `getExportVersion()` helper（供所有 export 函數共用）
- game.js：`lobbyJoin` msg 帶版本、`lobbyPlayers` 存版本、`updateLobbyUI` 顯示版本狀態
- game.js：`gameStart` 廣播帶版本、Guest 收到後最終確認

---

## 修改說明

### A. skill-editor.html — `getExportVersion()` helper

**定位**：在 `exportConfig()` 函數（約 L1540）**之前**插入：

```javascript
/**
 * 產生匯出版本字串：「YYYYMMDD-HHMMSS」格式的 UTC 時間戳
 * 同一次 export session 共用（避免同一批匯出版本不一致）
 */
let _exportVersionCache = null;
function getExportVersion() {
  if (!_exportVersionCache) {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    _exportVersionCache =
      `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}-` +
      `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  }
  return _exportVersionCache;
}

// 每次使用者點「匯出」或「存檔」時，清除快取讓版本更新
function clearExportVersionCache() {
  _exportVersionCache = null;
}
```

> **為何快取**：若使用者連續匯出多個檔案（towers.js → waves.js → config.js），希望同一批次版本相同。但下次新的匯出操作應重新計時。

### B. skill-editor.html — `exportConfig()` 嵌入 dataVersion

**定位**：`exportConfig()` 函數，在 `lines.push('  totalWaves: ...');` 之後，`lines.push('};');` 之前（約 L1601-1604）

插入：
```javascript
lines.push('');
lines.push(`  // 版本識別（由 skill-editor 自動產生，用於 PVP 版本確認）`);
lines.push(`  dataVersion: '${getExportVersion()}',`);
```

### C. skill-editor.html — 其他 export 函數也呼叫 clearExportVersionCache

**定位**：`doExport()` 函數（或每個 export 函數的入口）

找到 `doExport` 的定義（或 export 按鈕的 onclick），在**每次觸發匯出前**呼叫一次：
```javascript
clearExportVersionCache();
```

> 這確保每次點「存檔」按鈕都會重新計時，不同批次版本不同。

**也可選擇**：在 `export-bar` 按鈕的 onclick 統一加一行：
```javascript
clearExportVersionCache();
```

### D. 版本字串在其他 export 的可選嵌入

其他匯出函數（exportTowers、exportWaves、exportSends）**不需要**嵌入版本，因為：
- 版本以 `CONFIG.dataVersion` 為主要來源（game.js 只讀 config.js）
- 若要完整性，可在各 export 函數頂部加一行 JS 注釋：
  ```javascript
  lines.push(`// dataVersion: ${getExportVersion()}`);
  ```
  但不影響 runtime 行為，純粹方便人工比對。

---

### E. game.js — lobbyJoin 帶 dataVersion

**定位**：Guest 發出 `lobbyJoin` 的位置（約 L3884）

修改前：
```javascript
hostConn.send({ type: 'lobbyJoin', name: getMyName() || id.slice(-4) });
```
修改後：
```javascript
hostConn.send({
  type: 'lobbyJoin',
  name: getMyName() || id.slice(-4),
  dataVersion: (typeof CONFIG !== 'undefined' && CONFIG.dataVersion) ? CONFIG.dataVersion : ''
});
```

> `typeof CONFIG !== 'undefined'` 保護：若未開啟 skill-editor 或 config.js 沒有 dataVersion，不報錯。

### F. game.js — lobbyPlayers 儲存 dataVersion

**定位**：`hostOnLobbyMsg` 函數（約 L3728-3736）

修改前：
```javascript
lobbyPlayers.push({ id: fromId, name: data.name || fromId.slice(-4) });
```
修改後：
```javascript
lobbyPlayers.push({
  id: fromId,
  name: data.name || fromId.slice(-4),
  dataVersion: data.dataVersion || ''
});
```

> Host 自己的 dataVersion 在初始化 `lobbyPlayers` 時加入（Host 是第一個 push 的）：
> 找到 `lobbyPlayers = [{ id: myPeerId, name: getMyName() || 'Host' }]`（約 L3811），改為：
> ```javascript
> lobbyPlayers = [{ id: myPeerId, name: getMyName() || 'Host', dataVersion: (typeof CONFIG !== 'undefined' && CONFIG.dataVersion) ? CONFIG.dataVersion : '' }];
> ```

### G. game.js — updateLobbyUI 顯示版本比對

**定位**：`updateLobbyUI()` 函數（約 L3695-3716）

在 `lobbyPlayers.forEach` 的 label 組合中，加入版本標記：

```javascript
const hostVersion = lobbyPlayers[0]?.dataVersion || '';
lobbyPlayers.forEach((p, i) => {
  const isMe = p.id === myPeerId;
  const color = isMe ? '#4ecdc4' : '#ffd93d';
  const displayName = p.name || `P${i+1}`;

  // 版本比對（Host 自己顯示版本號，其他人比對）
  let versionTag = '';
  if (i === 0) {
    // Host：顯示自身版本號
    versionTag = p.dataVersion
      ? ` <span style="color:#555;font-size:10px">[${p.dataVersion}]</span>`
      : ` <span style="color:#555;font-size:10px">[無版本]</span>`;
  } else {
    // Guest：比對 Host 版本
    const match = p.dataVersion && p.dataVersion === hostVersion;
    const noVer = !p.dataVersion && !hostVersion;
    if (match || noVer) {
      versionTag = ' <span style="color:#4c4;font-size:10px">✅</span>';
    } else {
      versionTag = ` <span style="color:#e94560;font-size:10px">⚠️版本不符(${p.dataVersion || '未知'})</span>`;
    }
  }

  const label = `<span style="color:${color};font-weight:${isMe?'bold':'normal'}">${displayName}${isMe?' (你)':''}${versionTag}</span>`;
  html += (i > 0 ? arrow : '') + label;
});
```

### H. game.js — gameStart 廣播帶版本（最終確認）

**定位**：Host 按開始按鈕（約 L3865）

修改前：
```javascript
hostBroadcast({ type: 'gameStart', players: shuffled, chain });
```
修改後：
```javascript
hostBroadcast({ type: 'gameStart', players: shuffled, chain, dataVersion: (typeof CONFIG !== 'undefined' && CONFIG.dataVersion) ? CONFIG.dataVersion : '' });
```

### I. game.js — Guest 收到 gameStart 後最終版本檢查

**定位**：`guestOnLobbyMsg` 函數，`if (data.type === 'gameStart')` 分支（約 L3746-3749）

```javascript
if (data.type === 'gameStart') {
  // 版本最終確認
  const myVer = (typeof CONFIG !== 'undefined' && CONFIG.dataVersion) ? CONFIG.dataVersion : '';
  const hostVer = data.dataVersion || '';
  if (myVer !== hostVer && (myVer || hostVer)) {
    // 遊戲開始後在 battle log 顯示警告
    // 先記錄，startPvpGame 後 game 物件才存在
    window._pendingVersionWarning = `⚠️ 版本不一致！Host: ${hostVer || '無'} 你: ${myVer || '無'}。遊戲資料可能不同步。`;
  }
  startPvpGame(data.players, data.chain);
}
```

在 `startPvpGame()` 函數末尾（new Game 之後），加入：
```javascript
if (window._pendingVersionWarning) {
  // 延遲一幀確保 game 物件初始化完成
  setTimeout(() => {
    if (window._game) window._game.addBattleLog('ai', window._pendingVersionWarning);
    window._pendingVersionWarning = null;
  }, 100);
}
```

---

## 版本策略說明

### 哪些檔案需要同步

| 檔案 | 影響 | 版本控制方式 |
|------|------|-------------|
| `js/config.js` | 經濟、難度、elemAdv、activeElems | ✅ `CONFIG.dataVersion` 主要來源 |
| `js/towers.js` | 塔數值、技能 | JS 注釋（非 runtime） |
| `js/waves.js` | 波次、送兵配額 | JS 注釋（非 runtime） |
| `js/sends.js` | 送兵數值 | JS 注釋（非 runtime） |
| `js/skills.js` | 技能定義 | 通常不由 editor 修改，暫不版本化 |

> MVP 策略：只以 `CONFIG.dataVersion` 作為唯一版本識別符，其他檔案的注釋為可選視覺輔助。

### 無版本的情況

- 開發者手動改 config.js 而未透過 skill-editor → `dataVersion` 不更新 → 版本比對可能誤判
- 兩者都沒有 dataVersion（空字串）→ 判定「無版本，視為一致」（不顯示警告）

---

## 驗證

- skill-editor 匯出 config.js → 開啟檔案看到 `dataVersion: '20260510-143022'`（當下時間）
- 連按匯出兩次 → 第二次時間更新（clearExportVersionCache 生效）
- 兩個 PVP 視窗都用新版 config.js → 大廳顯示 ✅
- 一個視窗用舊版（無 dataVersion）→ 大廳顯示 ⚠️版本不符(無版本)
- 一個視窗用不同日期版本 → 大廳紅字，Host 可要求玩家更新檔案
- 版本不一致但開始遊戲 → Guest 的 battle log 出現版本警告（無阻擋）
