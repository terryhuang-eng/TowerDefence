# step1 — 移除 buildHUD ready/FAB 區塊 + canvas 備援

## 目標檔案
`js/game.js`

## 修改 1：buildHUD showStates（1132 行附近）

```js
// 舊
const showStates = ['pre_wave', 'spawning', 'fighting'];
if (!showStates.includes(this.state)) {

// 新
if (this.state !== 'pre_wave') {
```

## 修改 2：移除 fighting/spawning 狀態的 readyBtn 區塊（1144-1152）

整個刪除：
```js
    // ── wave 中：靜態狀態指示 ──
    if (this.state === 'spawning' || this.state === 'fighting') {
      sendsDiv.style.display = 'none';
      readyBtn.textContent = '⚔️ 戰鬥中...';
      readyBtn.className = 'mobile-hud-ready-btn';
      readyBtn.style.cssText = 'background:#444;color:#aaa;flex:1;cursor:default;';
      readyBtn.onclick = null;
      return;
    }
```

## 修改 3：移除 readyBtn 相關變數宣告（1142 行）

```js
// 舊
    const sendsDiv = document.getElementById('mobile-hud-sends');
    const readyBtn = document.getElementById('mobile-hud-ready');

// 新
    const sendsDiv = document.getElementById('mobile-hud-sends');
```
（只刪 readyBtn 那行）

## 修改 4：移除「Ready 按鈕」整個區塊（1199-1228）

整個刪除（從 `// ── Ready 按鈕` 到 `}` 閉括號）：
```js
    // ── Ready 按鈕（升塔/送兵模式皆顯示）──
    readyBtn.style.cssText = '';
    if (this.mode === 'pvp') {
      ...（整塊 PVP ready logic）
    } else {
      ...（整塊 PVE startWave logic）
    }
```

## 修改 5：移除「FAB 同步」整個區塊（1230-1250）

整個刪除（從 `// FAB 同步` 到 `}` 閉括號）：
```js
    // FAB 同步
    const fab = document.getElementById('wave-fab');
    const fabLabel = document.getElementById('wave-fab-label');
    if (fab && fabLabel) {
      ...（整塊 FAB logic）
    }
```

## 修改 6：移除 canvas tap 備援（2336-2340）

整個刪除：
```js
    // 手機：pre_wave 點空白格 = 開始波次（備援）
    if (window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches
        && this.state === 'pre_wave') {
      this.startWave();
    }
```

## 定位流程
1. Grep `showStates.*pre_wave` 找修改1 行號
2. Grep `wave 中：靜態狀態指示` 找修改2 行號
3. Grep `mobile-hud-ready` 找 readyBtn 宣告行號
4. Grep `Ready 按鈕（升塔` 找修改4 開始行號
5. Grep `FAB 同步` 找修改5 開始行號
6. Grep `pre_wave 點空白格` 找修改6 行號
7. 各自 Read ±5 行確認範圍後 Edit
