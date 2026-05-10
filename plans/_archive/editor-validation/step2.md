# Step 2：波次頁抗性元素警示

## 前置條件
elem-filter-editor/step1 已執行（`getActiveElems()` 已存在）

## 目標檔案
`skill-editor.html`

## 影響範圍
- `renderList()` waves 分支：列表項目加入紅點標記
- `renderEditor()` 或波次右側面板：詳細警示文字

---

## 警示邏輯

### 需要警示的情況

| 情況 | 嚴重度 | 說明 |
|------|--------|------|
| `resist` 為物件且含**非啟用**元素 key | 🔴 error | 怪物抗某元素但玩家不可能有該元素塔；此設定無意義 |
| `resist: 'random'` 或 `'random_dual'` | ℹ️ info | 無問題（game.js step4 已修正為從 activeElems 中選）；可加淡色提示 |
| `resist` 含**啟用**元素 | 無警示 | 正常設計（玩家有這個元素，抗性是有效阻力） |

### 判斷函數

**定位**：在 `validateElemAdv()` 附近新增：

```javascript
/**
 * 檢查單一波次的抗性設定是否有問題
 * 回傳 { hasError: bool, messages: string[] }
 */
function validateWaveResist(wave) {
  const active = getActiveElems();
  const resist = wave.resist;
  const messages = [];
  let hasError = false;

  if (!resist || resist === 'none') return { hasError: false, messages: [] };

  if (resist === 'random' || resist === 'random_dual') {
    // 無問題：game.js 已修正隨機只從 activeElems 選
    messages.push(`ℹ️ 隨機抗性將從啟用元素中選取（game.js 已修正）`);
    return { hasError: false, messages };
  }

  if (typeof resist === 'object') {
    for (const [elem, val] of Object.entries(resist)) {
      if (!active.includes(elem)) {
        hasError = true;
        messages.push(`🔴 ${ELEM[elem]?.icon || elem} ${elem} 抗性無效（${elem} 未啟用，玩家無此元素塔）`);
      }
    }
  }

  return { hasError, messages };
}
```

---

## 修改說明

### A. `renderList()` waves 分支 — 列表項目加紅點

**定位**：`renderList()` 的 waves 分支，`editData.waves.forEach((w, i) => {` 迴圈內（約 L346-358）

在 `item.innerHTML = ...` 的模板字串中，**加入紅點標記**：

```javascript
const wv = validateWaveResist(w);
const redDot = wv.hasError ? ' <span style="color:#e94560;font-size:10px;" title="抗性警示">●</span>' : '';
item.innerHTML = `<span><span class="idx">W${i+1}</span>${w.icon||''} ${w.name}${w.isBoss ? ' ⭐' : ''}${redDot}</span><span class="skills-count">${sc > 0 ? sc + '技能' : ''}</span>`;
```

> 小紅點放在波次名稱之後、技能計數之前，視覺醒目但不干擾。

### B. `renderEditor()` 波次面板 — 詳細警示

**定位**：波次的 `renderEditor()` 或右側 `renderPanel()` 函數（約 L591-700 波次 panel 渲染段）

找到波次 panel 渲染時，在最後的「抗性編輯器」下方插入：

```javascript
// 波次抗性警示
if (currentTab === 'waves') {
  const unit = getSelectedUnit();
  if (unit) {
    const wv = validateWaveResist(unit);
    if (wv.messages.length > 0) {
      const warnDiv = document.createElement('div');
      warnDiv.style.cssText = 'margin-top:8px;padding:6px 8px;background:#2a1010;border:1px solid #c44;border-radius:4px;font-size:11px;';
      warnDiv.innerHTML = wv.messages.map(m =>
        m.startsWith('🔴')
          ? `<div style="color:#e94560;margin-bottom:2px;">${m}</div>`
          : `<div style="color:#aaa;margin-bottom:2px;">${m}</div>`
      ).join('');
      panel.appendChild(warnDiv);
    }
  }
}
```

> `panel` 是 edit-panel 的 DOM 節點，已在 `renderPanel()` 中定義。

---

## 驗證

**無問題波次（W1，固定火抗，火已啟用）**：
- `resist: { fire: 0.5 }`, activeElems 含 fire
- → 列表無紅點，右側無警示

**問題波次（W5，固定土抗，土未啟用）**：
- `resist: { earth: 0.5 }`, activeElems = ['fire', 'water', 'wind']
- → 列表 W5 出現紅點，右側顯示「🔴 ⛰️ earth 抗性無效」

**random resist 波次**：
- `resist: 'random'`
- → 列表無紅點（非 error），右側顯示灰色 ℹ️ 提示

**多重抗性，混合啟用/未啟用**：
- `resist: { fire: 0.5, earth: 0.3 }`，earth 未啟用
- → 列表紅點出現，右側只顯示 earth 的警示（fire 正常不提示）
