# step2 — HUD 送兵模式：金幣 + 兵種按鈕 + Ready

## 目標

在 Game class 加入 `buildMobileHud()` 方法，在 `rebuildSidebar()` 後同步更新手機 HUD（送兵模式）。初始化時顯示 HUD，Ready 按鈕連接現有 `doReady()` 邏輯。

## 影響範圍

- **唯一修改**：`js/game.js`
  - 新增 `buildMobileHud()` 方法（在 `rebuildSidebar()` 附近）
  - 在 `rebuildSidebar()` 末尾加 `this.buildMobileHud()` 呼叫
  - `initGrid()` 末尾：若手機則顯示 HUD

---

## 新增方法：`buildMobileHud()`

插入位置：`rebuildSidebar()` 方法結束後（`}` 之後）

```js
buildMobileHud() {
  const hud = document.getElementById('mobile-hud');
  if (!hud || window.getComputedStyle(hud).display === 'none' && hud.style.display !== 'flex') {
    // 非手機或 HUD 不存在
    if (hud && window.innerWidth <= 768) hud.style.display = 'flex';
    else return;
  }

  // ── 送兵按鈕區 ──
  const sendsDiv = document.getElementById('mobile-hud-sends');
  sendsDiv.innerHTML = '';

  // 金幣標示
  const goldSpan = document.createElement('span');
  goldSpan.style.cssText = 'color:#ffd93d;font-size:12px;font-weight:bold;flex-shrink:0;';
  goldSpan.textContent = `💰${this.gold}`;
  sendsDiv.appendChild(goldSpan);

  // 送兵按鈕（只顯示 quota > 0 的兵種）
  const quota = this.getSendQuota ? this.getSendQuota() : {};
  for (const s of INCOME_SENDS) {
    const maxQ = quota[s.id] ?? 0;
    if (maxQ <= 0) continue;
    const queued = this.playerSendQueue.filter(q => q.id === s.id).length;
    const remaining = maxQ - queued;
    if (remaining <= 0 && queued === 0) continue;

    const btn = document.createElement('button');
    btn.className = 'mobile-hud-send-btn' + (this.gold < s.cost ? ' cannot-afford' : '');
    btn.innerHTML = `${s.icon}<br><span style="font-size:10px">${s.cost}g</span>`;
    if (queued > 0) {
      const badge = document.createElement('span');
      badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#e94560;color:#fff;border-radius:50%;width:14px;height:14px;font-size:9px;display:flex;align-items:center;justify-content:center;';
      badge.textContent = queued;
      btn.style.position = 'relative';
      btn.appendChild(badge);
    }
    btn.onclick = () => {
      if (this.gold < s.cost) return;
      if (remaining <= 0) return;
      this.gold -= s.cost;
      this.income += s.income;
      this.playerSendQueue.push({ ...s, sendId: Date.now() + Math.random() });
      this.rebuildSidebar();
    };
    sendsDiv.appendChild(btn);
  }

  // ── Ready 按鈕 ──
  const readyBtn = document.getElementById('mobile-hud-ready');
  const isPreWave = this.state === 'pre_wave';
  const isWave = this.state === 'spawning' || this.state === 'wave';
  readyBtn.style.display = isPreWave || isWave ? '' : 'none';

  if (isPreWave) {
    readyBtn.textContent = this.myReady ? '✅ 已準備' : '開始波次';
    readyBtn.className = 'mobile-hud-ready-btn' + (this.myReady ? '' : ' pulsing');
    readyBtn.onclick = () => {
      if (!this.myReady) this.doReady?.();
    };
  } else if (isWave) {
    const alive = this.enemies.filter(e => !e.dead).length;
    readyBtn.textContent = `👾 ${alive}`;
    readyBtn.className = 'mobile-hud-ready-btn';
    readyBtn.style.background = '#555';
    readyBtn.onclick = null;
  }
}
```

---

## rebuildSidebar() 末尾呼叫

在 `rebuildSidebar()` 的最後一行（closing `}` 前）加：

```js
    this.buildMobileHud();
```

---

## initGrid() 末尾：初始顯示 HUD

在 `initGrid()` 末尾加（`this.setupEvents()` 之後）：

```js
    if (window.innerWidth <= 768) {
      const hud = document.getElementById('mobile-hud');
      if (hud) hud.style.display = 'flex';
    }
```

---

## 驗證

- 手機模擬器：HUD 底部顯示金幣數字 + 可負擔的送兵按鈕 + 「開始波次」按鈕
- 點送兵按鈕：金幣扣除，按鈕出現角標，再點可取消（需 step3 確認）
- 點「開始波次」：波次啟動（PVE），或標記為已 Ready（PVP）
- 桌機：HUD 不顯示，sidebar 操作正常
