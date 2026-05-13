# step3 — HUD 升塔模式：選塔切換 + 升塔/賣塔按鈕

## 目標

點擊塔時，HUD 從送兵模式切換到升塔模式，顯示升塔選項與賣塔按鈕，不需要打開 sidebar。點空白處取消選取並回到送兵模式。

## 影響範圍

- **唯一修改**：`js/game.js`
  - `buildMobileHud()` 新增升塔模式邏輯
  - canvas click handler 選塔後呼叫 `buildMobileHud()`

---

## buildMobileHud() 升塔模式補充

在現有 `buildMobileHud()` 開頭加入升塔模式判斷：

```js
buildMobileHud() {
  const hud = document.getElementById('mobile-hud');
  if (!hud || window.innerWidth > 768) return;
  hud.style.display = 'flex';

  const upgradeDiv = document.getElementById('mobile-hud-upgrade');
  const sendsDiv = document.getElementById('mobile-hud-sends');

  // ── 升塔模式（有選中的塔）──
  if (this.selectedTower) {
    sendsDiv.style.display = 'none';
    upgradeDiv.style.display = 'flex';
    upgradeDiv.innerHTML = '';

    const tw = this.selectedTower;

    // 塔名標示
    const label = document.createElement('span');
    label.style.cssText = 'color:#aaa;font-size:11px;flex-shrink:0;';
    label.textContent = `${tw.icon || '🏰'} Lv${tw.level}`;
    upgradeDiv.appendChild(label);

    // 升塔按鈕（從 sidebar 的升塔邏輯提取）
    // 取得升塔選項（重用現有 getUpgradeOptions 或直接內嵌判斷）
    const upgrades = this._getMobileUpgradeOptions(tw);
    for (const upg of upgrades) {
      const btn = document.createElement('button');
      btn.className = 'mobile-hud-upgrade-btn' + (this.gold < upg.cost ? ' cannot-afford' : '');
      btn.textContent = `${upg.label} ${upg.cost}g`;
      btn.disabled = this.gold < upg.cost;
      btn.onclick = () => {
        upg.action();
        this.selectedTower = null;
        this.buildMobileHud();
      };
      upgradeDiv.appendChild(btn);
    }

    // 賣塔按鈕
    const sellVal = this._getSellValue(tw);
    const sellBtn = document.createElement('button');
    sellBtn.className = 'mobile-hud-upgrade-btn sell';
    sellBtn.textContent = `賣 +${sellVal}g`;
    sellBtn.onclick = () => {
      this.sellTower(tw);
      this.selectedTower = null;
      this.buildMobileHud();
    };
    upgradeDiv.appendChild(sellBtn);

    // ✕ 取消
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-hud-upgrade-btn';
    closeBtn.style.cssText = 'color:#888;border-color:#444;min-width:32px;';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => {
      this.selectedTower = null;
      this.buildMobileHud();
    };
    upgradeDiv.appendChild(closeBtn);

    // Ready 按鈕仍顯示
    this._buildMobileReadyBtn();
    return;
  }

  // ── 送兵模式 ──
  upgradeDiv.style.display = 'none';
  sendsDiv.style.display = 'flex';

  // （原有的金幣 + 送兵按鈕邏輯繼續...）
  // ...（此處接 step2 的送兵邏輯）
}
```

---

## 輔助方法：`_getMobileUpgradeOptions(tw)`

這個方法將現有 sidebar 的升塔條件邏輯濃縮為按鈕陣列：

```js
_getMobileUpgradeOptions(tw) {
  const opts = [];
  const lv = tw.level;

  if (lv === 1) {
    opts.push({ label: '升Lv2', cost: 80, action: () => this.upgradeTower(tw, 2) });
  } else if (lv === 2) {
    // 需要選元素 → 每個可選元素一個按鈕
    for (const ek of Object.keys(this.elemPicks || {})) {
      if ((this.elemPicks[ek] || 0) > 0) {
        opts.push({ label: `${ELEM[ek].icon}Lv3`, cost: 130, action: () => this.upgradeTower(tw, 3, ek) });
      }
    }
  } else if (lv === 3) {
    // 注入：選第二元素
    for (const ek of Object.keys(this.elemPicks || {})) {
      if ((this.elemPicks[ek] || 0) > 0) {
        opts.push({ label: `${ELEM[ek].icon}注入`, cost: 250, action: () => this.upgradeTower(tw, 4, ek) });
      }
    }
  } else if (lv === 4) {
    // Lv5 路線
    for (const ek of Object.keys(this.elemPicks || {})) {
      if ((this.elemPicks[ek] || 0) > 0) {
        opts.push({ label: `${ELEM[ek].icon}Lv5`, cost: 400, action: () => this.upgradeTower(tw, 5, ek) });
      }
    }
  } else if (lv === 5) {
    opts.push({ label: 'Lv6', cost: 600, action: () => this.upgradeTower(tw, 6) });
  }
  return opts;
}

_getSellValue(tw) {
  // 和 sellTower 一致的回收金計算
  const lv = tw.level;
  const costs = [0, 50, 80, 130, 250, 400, 600];
  const total = costs.slice(1, lv + 1).reduce((a, b) => a + b, 0);
  return lv <= 3 ? total : Math.floor(total * 0.8);
}
```

---

## canvas click handler 補充呼叫

在現有 click handler 中，選中塔後加：

```js
// 選塔後同步更新手機 HUD（如果在手機上）
if (window.innerWidth <= 768) this.buildMobileHud();
```

取消選取（點空格/點其他）後：

```js
this.selectedTower = null;
if (window.innerWidth <= 768) this.buildMobileHud();
```

---

## 驗證

- 手機：點塔 → HUD 切換為升塔選項，顯示可用升級按鈕 + 賣塔
- 點 ✕ 或點地圖空格 → HUD 回到送兵模式
- 升塔/賣塔後 → 塔狀態更新，HUD 恢復送兵模式
- 桌機：行為不變（sidebar 升塔面板照常運作）
