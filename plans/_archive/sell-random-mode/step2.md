# step2 — 隨機模式狀態 + showElementScreen UI + 後續自動 pick

## 目標

三個子修改（全在 game.js）：
1. init 加入 `this.randomMode = false`
2. `showElementScreen()` 第一次 pick 新增「🎲 隨機」卡
3. `showElementScreen()` 後續 pick 若 randomMode 則自動選元素

## 影響範圍

- **唯一修改**：`js/game.js`，三處

---

## 修改 A — init（line ~27，this.elemPicks 附近）

```
舊：
    this.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));

新：
    this.elemPicks = Object.fromEntries(ELEM_KEYS.map(e => [e, 0]));
    this.randomMode = false;
```

---

## 修改 B — showElementScreen() 開頭，加隨機模式自動 pick（line ~1312）

在 `showElementScreen()` 函數的最開頭（`const overlay = ...` 之前）插入：

```js
// 隨機模式：後續 pick 自動選元素，不顯示 UI
if (this.randomMode) {
  const keys = getActiveKeys();
  const ek = keys[Math.floor(Math.random() * keys.length)];
  this.elemPicks[ek]++;
  if (this.mode === 'pvp') this.netSend({ type: 'pickElement', elem: ek });
  const incomeBonus = 15;
  this.income += incomeBonus;
  if (this.mode === 'pve') this.ai.income += incomeBonus;
  this.announce(`🎲 隨機選到 ${ELEM[ek].icon} ${ELEM[ek].name}！收入 +${incomeBonus}`);
  this.state = 'pre_wave';
  this.myReady = false;
  this.readyPlayers.clear();
  this.showPreWave();
  this.rebuildSidebar();
  return;
}
```

---

## 修改 C — showElementScreen()，cardsDiv 迴圈結束後插入「🎲 隨機」卡（totalPicks === 0 時才顯示）

定位：`cardsDiv.appendChild(card);` + `}` 迴圈結束後（line ~1372），插入：

```js
// 第一次 pick 才出現隨機選項
if (this.getTotalPicks() === 0) {
  const randCard = document.createElement('div');
  randCard.className = 'reward-card';
  randCard.innerHTML = `
    <div class="reward-icon">🎲</div>
    <div class="reward-name" style="color:#aaa;">隨機模式</div>
    <div class="reward-desc">選擇後每次元素將隨機決定<br><span style="color:#4ecdc4;">賣塔全額 100% 返還</span></div>
  `;
  randCard.onclick = () => {
    this.randomMode = true;
    const keys = getActiveKeys();
    const ek = keys[Math.floor(Math.random() * keys.length)];
    this.elemPicks[ek]++;
    if (this.mode === 'pvp') this.netSend({ type: 'pickElement', elem: ek });
    const incomeBonus = 15;
    this.income += incomeBonus;
    if (this.mode === 'pve') this.ai.income += incomeBonus;
    this.announce(`🎲 隨機模式啟動！選到 ${ELEM[ek].icon} ${ELEM[ek].name}，收入 +${incomeBonus}，賣塔全額返還`);
    overlay.style.display = 'none';
    this.state = 'pre_wave';
    this.myReady = false;
    this.readyPlayers.clear();
    this.showPreWave();
    this.rebuildSidebar();
  };
  cardsDiv.appendChild(randCard);
}
```

---

## 驗證

- W3 選元素畫面出現「🎲 隨機模式」卡（最後一張）
- 隨機卡有說明文字「選擇後每次元素將隨機決定 / 賣塔全額 100% 返還」
- 點擊後自動選一元素，announce 顯示隨機模式啟動
- W6/W9/W12 不顯示選元素 UI，直接自動選並 announce
- 隨機模式下 Lv4+ 塔賣出返還 100%（step1 的 `this.randomMode` 生效）
