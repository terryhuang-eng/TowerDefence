# Step 1：修正 game.js burn DOT 計算

## 目標檔案
`js/game.js` 第 2640 行

## 問題
```js
if (e.burnTimer > 0) { const _bdt = e.burnDmg * dt; e.hp -= _bdt; ... e.burnTimer -= dt; }
```
`_bdt = burnDmg * dt` 用完整幀時間，當 `dt > burnTimer`（低幀率/卡頓）時過度扣血。

## 修正

### 第 2640 行：burn DOT
```js
// 改前
if (e.burnTimer > 0) { const _bdt = e.burnDmg * dt; e.hp -= _bdt; if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.burn += _bdt; e.burnTimer -= dt; }

// 改後：用 burnDt = min(dt, burnTimer) 限制實際計算秒數
if (e.burnTimer > 0) { const burnDt = Math.min(dt, e.burnTimer); const _bdt = e.burnDmg * burnDt; e.hp -= _bdt; if (window.SANDBOX?.fireDmg) window.SANDBOX.fireDmg.burn += _bdt; e.burnTimer -= dt; }
```

### 同步確認 frostbite（第 2643-2649 行）
讀取並確認 frostbite 是否有相同問題（`frostbiteDur -= dt` 前是否有 clamp）。
若有 → 同樣修正：`const fbDt = Math.min(dt, e.frostbiteDur);`

## 驗證
修改後用 Node.js 語法驗證：
```bash
node -e "const fs=require('fs'); new Function(fs.readFileSync('js/game.js','utf8')); console.log('OK')"
```
