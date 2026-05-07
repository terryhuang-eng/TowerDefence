# Step 2 — game.js 邏輯修改（4 處 + sandbox）

## 目標
在 `js/game.js` 中加入純屬 LV5 的升級邏輯、stats 讀取、以及 sandbox 精華按鈕。

## 影響範圍
- **檔案**：`js/game.js`
- **修改點**：5 處（如下）

---

## 修改 A — `maxTowerLevel()` 純屬路線加入 canLv5 判斷
**位置**：約 L378-383（`if (t.infuseElem === t.elem)` 區塊）

**現況**：
```javascript
if (t.infuseElem === t.elem) {
  const canLv6 = (this.elemPicks[t.elem] || 0) >= 3 &&
                 (this.essencePerElem[t.elem] || 0) >= CONFIG.essenceLv6Threshold &&
                 PURE_TOWERS[t.elem];
  if (canLv6) return 6;
}
```

**修改後**：
```javascript
if (t.infuseElem === t.elem) {
  const picks = this.elemPicks[t.elem] || 0;
  const canLv6 = picks >= 3 &&
                 (this.essencePerElem[t.elem] || 0) >= CONFIG.essenceLv6Threshold &&
                 PURE_TOWERS[t.elem];
  if (canLv6) return 6;
  const canLv5 = picks >= 2 && PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5;
  if (canLv5) return 5;
}
```

---

## 修改 B — `getTowerLvData()` 加入純屬 LV5 識別
**位置**：約 L655-658（Lv6 純屬塔條件之前）

在 `// Lv6 純屬塔` 前加入新 case：
```javascript
// Lv5 純屬塔（level=5, infuseElem=elem, thirdElem=null）
if (t.level === 5 && t.elem && t.infuseElem === t.elem && !t.thirdElem) {
  if (PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5) return PURE_TOWERS[t.elem].lv5;
}
```

---

## 修改 C — 升級面板 LV4 純屬路線改為先展示 LV5 選項
**位置**：約 L919-955（`if (t.level === 4 && t.infuseElem)` → 純屬分支）

**現況邏輯**：純屬路線直接顯示 LV6 按鈕（if-else 的 if 分支）

**修改邏輯**：純屬路線顯示 LV5 按鈕（當 picks>=2 且有 lv5 data）
LV6 按鈕改為在 LV5 已升時才顯示（Step 2D）

**具體修改**：
將 `if (t.infuseElem === t.elem && PURE_TOWERS[t.elem])` 區塊內容替換：

```javascript
if (t.infuseElem === t.elem && PURE_TOWERS[t.elem]) {
  const pure = PURE_TOWERS[t.elem];
  // 優先顯示 LV5 中間步驟（若有 lv5 資料且 picks >= 2）
  const picks = this.elemPicks[t.elem] || 0;
  if (pure.lv5 && picks >= 2) {
    const nextData = pure.lv5;
    info.innerHTML = statsHtml + `
      <div style="margin-top:4px;color:#ffd93d;font-size:11px;">
        ▶ Lv5 — 純屬強化（${ELEM[t.elem].icon}×2 → 純屬中級）
      </div>`;
    const btn = document.createElement('div');
    btn.className = 'upgrade-opt';
    btn.style.opacity = this.gold >= nextData.cost ? '1' : '0.4';
    btn.innerHTML = `
      <span style="font-size:14px">${pure.icon}</span>
      <span style="color:${ELEM[t.elem].color}">${pure.name} Lv5</span>
      <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
      <span style="color:#888;font-size:10px">${nextData.desc}</span>
      <span>💰${nextData.cost}</span>`;
    btn.onclick = () => {
      if (this.gold < nextData.cost) return;
      this.gold -= nextData.cost;
      t.level = 5;
      // thirdElem 保持 null（區別三屬 LV5）
      t.totalCost = (t.totalCost || 0) + nextData.cost;
      Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
      if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
      if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 5, elem: t.elem, infuseElem: t.infuseElem, thirdElem: null });
      this.rebuildSidebar();
    };
    opts.appendChild(btn);
  } else {
    // picks < 2，顯示說明（灰掉的 LV6 路線）
    const ess = this.essencePerElem[t.elem] || 0;
    const threshold = CONFIG.essenceLv6Threshold;
    const nextData = pure.lv6;
    const has3rdPick = picks >= 3;
    const hasEss = ess >= threshold;
    info.innerHTML = statsHtml + `
      <div style="margin-top:4px;color:#ffd93d;font-size:11px;">
        ▶ Lv6 — 純屬終極路線（${ELEM[t.elem].icon}×3 + 精華 ${ess}/${threshold}）
      </div>`;
    const btn = document.createElement('div');
    btn.className = 'upgrade-opt';
    btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && hasEss) ? '1' : '0.4';
    const pickHint = picks >= 2 ? (has3rdPick ? '' : ` <span style="color:#e94560">需第3次${ELEM[t.elem].name}pick</span>`) : ` <span style="color:#e94560">需第2次${ELEM[t.elem].name}pick</span>`;
    const essHint = hasEss ? '' : ` <span style="color:#e94560">精華不足(${ess}/${threshold})</span>`;
    btn.innerHTML = `
      <span style="font-size:14px">${pure.icon}</span>
      <span style="color:${ELEM[t.elem].color}">${pure.name}</span>
      <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
      <span style="color:#888;font-size:10px">${nextData.desc}</span>
      <span>💰${nextData.cost}${pickHint}${essHint}</span>`;
    btn.onclick = () => {
      if (this.gold < nextData.cost || !has3rdPick || !hasEss) return;
      this.gold -= nextData.cost;
      t.level = 6;
      t.thirdElem = t.elem;
      t.totalCost = (t.totalCost || 0) + nextData.cost;
      Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
      if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
      if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 6, elem: t.elem, infuseElem: t.infuseElem, thirdElem: t.elem });
      this.rebuildSidebar();
    };
    opts.appendChild(btn);
  }
}
```

---

## 修改 D — 升級面板新增 LV5 純屬 → LV6 純屬 section
**位置**：在現有 `if (t.level === 4 && t.infuseElem)` 區塊**之後**，加入新的 LV5 純屬升級處理。

在 `// === Lv4 →` 的下面（或找 `t.level === 5` 相關處理），在**三屬 LV5 渲染之後**加入：

```javascript
// === Lv5 純屬 → Lv6 純屬終極 ===
if (t.level === 5 && t.infuseElem === t.elem && !t.thirdElem && PURE_TOWERS[t.elem]) {
  const pure = PURE_TOWERS[t.elem];
  const ess = this.essencePerElem[t.elem] || 0;
  const threshold = CONFIG.essenceLv6Threshold;
  const nextData = pure.lv6;
  const picks = this.elemPicks[t.elem] || 0;
  const has3rdPick = picks >= 3;
  const hasEss = ess >= threshold;
  info.innerHTML = statsHtml + `
    <div style="margin-top:4px;color:#ffd93d;font-size:11px;">
      ▶ Lv6 — 純屬終極（${ELEM[t.elem].icon}×3 + 精華 ${ess}/${threshold}）
    </div>`;
  const btn = document.createElement('div');
  btn.className = 'upgrade-opt';
  btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && hasEss) ? '1' : '0.4';
  const pickHint = has3rdPick ? '' : ` <span style="color:#e94560">需第3次${ELEM[t.elem].name}pick</span>`;
  const essHint = hasEss ? '' : ` <span style="color:#e94560">精華不足(${ess}/${threshold})</span>`;
  btn.innerHTML = `
    <span style="font-size:14px">${pure.icon}</span>
    <span style="color:${ELEM[t.elem].color}">${pure.name}</span>
    <span style="color:#aaa;font-size:10px">DMG${nextData.damage} SPD${nextData.atkSpd} RNG${nextData.range}${nextData.aoe > 0 ? ' AOE'+nextData.aoe : ''}${nextData.skills && nextData.skills.length > 0 ? ` <span class="skill-tip" data-skills='${JSON.stringify(nextData.skills)}' style="color:#ffd93d;cursor:pointer;text-decoration:underline dotted;">${getSkillBrief(nextData.skills)} ℹ️</span>` : ''}</span>
    <span style="color:#888;font-size:10px">${nextData.desc}</span>
    <span>💰${nextData.cost}${pickHint}${essHint}</span>`;
  btn.onclick = () => {
    if (this.gold < nextData.cost || !has3rdPick || !hasEss) return;
    this.gold -= nextData.cost;
    t.level = 6;
    t.thirdElem = t.elem;
    t.totalCost = (t.totalCost || 0) + nextData.cost;
    Object.assign(t, { damage: nextData.damage, atkSpd: nextData.atkSpd, range: nextData.range, aoe: nextData.aoe, skills: nextData.skills || [] });
    if (nextData.dmgType !== undefined) t.dmgType = nextData.dmgType || null;
    if (this.mode === 'pvp') this.netSend({ type: 'towerUpgraded', x: t.x, y: t.y, level: 6, elem: t.elem, infuseElem: t.infuseElem, thirdElem: t.elem });
    this.rebuildSidebar();
  };
  opts.appendChild(btn);
  opts.appendChild(sellBtn);
  return;
}
```

---

## 修改 E — Sandbox 加入精華全解鎖按鈕
**位置**：`js/game.js` sandbox panel 建立處（約 L534-540 元素按鈕區域後）

在 sandbox panel HTML 中，元素按鈕列之後加入精華按鈕：
```javascript
'<div style="margin-top:6px;font-size:11px;color:#aaa;">精華（測試Lv6）</div>' +
'<button class="sb-btn" id="sb-ess-btn">💎 +100 精華（全元素）</button>' +
```

以及事件監聽：
```javascript
document.getElementById('sb-ess-btn').addEventListener('click', function() {
  const g = window._gameInst;
  if (!g) return;
  ELEM_KEYS.forEach(function(e) {
    g.essencePerElem[e] = (g.essencePerElem[e] || 0) + 100;
  });
});
```

---

## 注意事項
- 修改 C 和修改 D 都在升級面板，需確認 `return;` 的位置，避免 opts 重複 append sellBtn
- 修改 D 需找到正確插入位置（在 LV4 處理之後、LV5 三屬現有處理之前或之後）
- 先 Grep 找精確行號，Read ±10 行確認 context 後再 Edit
