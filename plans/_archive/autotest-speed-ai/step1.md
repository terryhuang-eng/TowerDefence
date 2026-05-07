# Step 1：turbo loop 加速

## 目標
讓 autotest 跑得更快，減少等待時間。

## 影響範圍
- 檔案：`autotest.js`
- 函數：`runTest()` 內的 turbo loop

## 現況（autotest.js L648~668）
```js
const ticksPerFrame = speed;  // speed=50
const simDt = 0.05;
game.loop = function turboLoop(now) {
  ...
  for (let i = 0; i < ticksPerFrame; i++) {
    ...
    this.update(simDt);
    this.time += simDt;
  }
  this.render();       // ← 每幀都畫，很貴
  this.updateHUD();    // ← 每幀都更新 DOM，很貴
  requestAnimationFrame(this.loop.bind(this));
};
```

傳入的 `speed: 50`（在 runGroup/runAll L819/L857）

## 修改內容

### 1. 增加 ticksPerFrame：50 → 200
在 `runGroup` 和 `runAll` 中，把 `speed: 50` 改為 `speed: 200`

### 2. turbo loop 跳過 render（每 8 幀才 render 一次）
```js
let _turboFrameCount = 0;
game.loop = function turboLoop(now) {
  if (!this._turboActive) return;
  this.lastTime = now;
  if (this.state !== 'won' && this.state !== 'lost') {
    for (let i = 0; i < ticksPerFrame; i++) {
      if (this.state === 'won' || this.state === 'lost') break;
      if (this.state === 'reward' || this.state === 'pre_wave') break;
      this.update(simDt);
      this.time += simDt;
    }
  }
  _turboFrameCount++;
  if (_turboFrameCount % 8 === 0) {  // 每 8 幀才 render
    this.render();
    this.updateHUD();
  }
  requestAnimationFrame(this.loop.bind(this));
};
```

### 3. setInterval 50ms → 16ms
```js
checkInterval = setInterval(() => { ... }, 16);  // 原本 50
```

### 4. 超時時間 60s → 30s（速度提升後不再需要那麼長）
```js
setTimeout(() => { ... }, 30000);  // 原本 60000
```

## 預期效果
- ticksPerFrame × 4 → 4× 模擬速度
- 跳過 render 7/8 → ~2× 幀時間節省
- 整體：**6~8× 加速**

## 注意事項
- `simDt = 0.05` 不變（影響物理模擬精確度）
- `_turboFrameCount` 是 loop 外部的 closure 變數，不掛在 game 上
