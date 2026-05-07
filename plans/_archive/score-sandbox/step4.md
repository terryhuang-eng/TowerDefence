# Step 4：index.html 沙盒功能接線

## 目標
為 Step 3 建立的沙盒面板接上實際功能邏輯。

## 影響範圍
**唯一修改檔案：** `index.html`

## 前提
- Step 3 已完成（面板 DOM 存在）
- 執行前需 Grep 確認以下關鍵字位置：
  - `currentWave` 或 `wave`（目前波次變數）
  - `startWave` 或 `waveStart` 或 `beginWave`（啟動波次函式）
  - `playerHP` 或 `baseHP`（玩家血量）
  - `gold` 或 `money`（金幣）
  - `elemPicks` 或 `unlockedElems`（元素解鎖陣列）
  - `tickMs` 或 `CONFIG.tickMs`（遊戲速度）
  - `enemies`（敵人生成邏輯）

## 沙盒狀態物件
在 JS 初始化區塊加入：
```js
const SANDBOX = {
  active: new URLSearchParams(location.search).get('sandbox') === '1',
  hpMult: 1.0,
  countMult: 1.0,
  infHP: false,
};
```

## 各功能接線

### 1. 展開/收合面板
```js
document.getElementById('sandboxToggle').addEventListener('click', function() {
  const body = document.getElementById('sandboxBody');
  const arrow = document.getElementById('sandboxArrow');
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  arrow.textContent = open ? '▼' : '▲';
});
```

### 2. 波次跳躍
**執行前必須 Grep 確認**：startPreWave / beginWave / waveManager 等函式名稱。

```js
document.getElementById('sbWaveGo').addEventListener('click', function() {
  const w = parseInt(document.getElementById('sbWaveSelect').value);
  // 直接設定 currentWave（或對應變數）
  // 呼叫 pre_wave 入口函式
  // 注意：可能需要先 clearEnemies() 清空現有敵人
  // 需根據 Grep 結果確認實際呼叫方式
});
```

### 3. 怪物 HP 倍率
在敵人生成邏輯（spawnEnemy 或等效函式）中，生成 hp 時乘以 `SANDBOX.hpMult`：
```js
const hp = waveData.hp * SANDBOX.hpMult;  // 找到 hp 賦值那行
```
slider 的 `input` event 更新 `SANDBOX.hpMult`。

### 4. 怪物數量倍率
在生成數量計算處乘以 `SANDBOX.countMult`（四捨五入，最小 1）：
```js
const count = Math.max(1, Math.round(waveData.count * SANDBOX.countMult));
```
slider 的 `input` event 更新 `SANDBOX.countMult`。

### 5. 金幣按鈕
```js
document.getElementById('sbGold1000').addEventListener('click', () => { gold += 1000; updateUI(); });
document.getElementById('sbGold9999').addEventListener('click', () => { gold += 9999; updateUI(); });
// gold / money 變數名依 Grep 結果決定
```

### 6. 元素解鎖
**執行前 Grep** `elemPicks` / `unlockedElems` 確認元素陣列名稱與解鎖邏輯。

每個 `.sb-elem-btn` 點擊後呼叫與正常 elem pick 流程相同的解鎖函式（不直接操作陣列，避免跳過 UI 更新）：
```js
document.querySelectorAll('.sb-elem-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const elem = this.dataset.elem;
    // 呼叫 unlockElem(elem) 或等效
  });
});
document.getElementById('sbUnlockAll').addEventListener('click', () => {
  ['fire','water','wind','earth','thunder'].forEach(e => unlockElem(e));
});
```

### 7. 無限血量
```js
document.getElementById('sbInfHP').addEventListener('click', function() {
  SANDBOX.infHP = !SANDBOX.infHP;
  this.dataset.on = SANDBOX.infHP ? '1' : '0';
  this.textContent = SANDBOX.infHP ? '● ON' : '○ OFF';
  this.style.color = SANDBOX.infHP ? '#4ecdc4' : '#888';
});
```
在基地受傷邏輯（`playerHP -= X` 或 `baseHP -= X`）前加守衛：
```js
if (!SANDBOX.infHP) { playerHP -= damage; }
```

### 8. 遊戲速度
**Grep 確認** `tickMs` / `CONFIG.tickMs` / setTimeout 延遲的位置。

```js
document.querySelectorAll('.sb-speed-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sb-speed-btn').forEach(b => b.classList.remove('active-speed'));
    this.classList.add('active-speed');
    const spd = parseFloat(this.dataset.spd);
    // CONFIG.tickMs = BASE_TICK_MS / spd;  （如果使用 tickMs 控制）
    // 或 gameSpeed = spd; （如果有全域速度倍率）
    // 需根據 Grep 結果決定
  });
});
```
注意：如果遊戲 loop 用的是固定 `requestAnimationFrame` 而非 setTimeout，速度修改方式不同，需先確認。

## 實作流程（重要）
1. 先 Grep 所有關鍵變數/函式名
2. Read ±10 行確認 context
3. 從最簡單的（金幣）開始接，逐一測試
4. 波次跳躍最後接（最複雜）

## 完成標準
- 「+9999g」按鈕點擊後金幣增加
- HP 滑桿拖動後新生成的敵人 HP 變化（需開新波次才生效）
- 「全解鎖」按鈕後可建置所有元素塔
- 無限血量 ON 後敵人到達終點不扣血
- 波次跳躍可直接進入指定波的 pre_wave 階段
