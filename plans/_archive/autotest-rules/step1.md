# step1 — test.html 框架 + Layer 1 資料完整性測試

## 目標

建立 `test.html`，包含：
1. assert 斷言框架（通過/失敗計數、失敗顯示期望 vs 實際）
2. 自動載入 `js/*.js`（等 DOMContentLoaded 後執行）
3. Layer 1：純靜態資料驗證（不需要 Game instance）
4. 結果 UI：通過綠色 ✅ / 失敗紅色 ❌ + 原因

## 目標檔案

`test.html`（新建，專案根目錄）

## 影響範圍

只新建 test.html，不修改任何現有檔案。

---

## 實作說明

### HTML 結構

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>🧪 Tests — Tower Defense</title>
  <!-- 最小樣式：深色背景、等寬字體、紅綠色 -->
</head>
<body>
  <h1>🧪 Tower Defense — Test Suite</h1>
  <div id="summary"></div>   <!-- 通過/失敗統計 -->
  <div id="results"></div>  <!-- 每條測試結果 -->

  <!-- 依序載入（與 index.html 相同順序） -->
  <script src="js/config.js"></script>
  <script src="js/skills.js"></script>
  <script src="js/sends.js"></script>
  <script src="js/towers.js"></script>
  <script src="js/waves.js"></script>
  <!-- 不載入 game.js（依賴 Canvas/DOM，Layer 2 用 mock） -->

  <script>
    // 測試框架 + Layer 1 測試
  </script>
</body>
</html>
```

### 斷言框架

```js
let passed = 0, failed = 0;
const resultsEl = document.getElementById('results');

function assert(condition, label, detail = '') {
  if (condition) {
    passed++;
    resultsEl.innerHTML += `<div class="pass">✅ ${label}</div>`;
  } else {
    failed++;
    resultsEl.innerHTML += `<div class="fail">❌ ${label}${detail ? `<span class="detail"> — ${detail}</span>` : ''}</div>`;
  }
}

function section(title) {
  resultsEl.innerHTML += `<div class="section">${title}</div>`;
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, label, `期望 ${JSON.stringify(expected)}，實際 ${JSON.stringify(actual)}`);
}

function assertDefined(val, label) {
  assert(val !== undefined && val !== null, label, `值為 ${val}`);
}
```

### Layer 1 測試內容

```js
// ── CONFIG 必要欄位 ──
section('CONFIG 必要欄位');
['startGold', 'startHP', 'baseIncome', 'towerCost', 'maxLv6Towers', 'gridCols', 'gridRows'].forEach(key => {
  assertDefined(CONFIG[key], `CONFIG.${key} 存在`);
});

// ── INFUSIONS 完整性 ──
section('INFUSIONS 完整性');
const ELEM_KEYS_TEST = ['fire', 'water', 'earth', 'wind', 'thunder', 'none'];
for (const base of ELEM_KEYS_TEST) {
  for (const inj of ELEM_KEYS_TEST) {
    const inf = INFUSIONS[base]?.[inj]?.lv4;
    assert(!!inf, `INFUSIONS[${base}][${inj}].lv4 存在`);
    if (inf) {
      assert(inf.cost > 0,    `INFUSIONS[${base}][${inj}].lv4.cost > 0`);
      assert(inf.damage > 0,  `INFUSIONS[${base}][${inj}].lv4.damage > 0`);
      assert(inf.atkSpd > 0,  `INFUSIONS[${base}][${inj}].lv4.atkSpd > 0`);
    }
  }
}

// ── PURE_TOWERS 完整性 ──
section('PURE_TOWERS 完整性');
for (const elem of ELEM_KEYS_TEST) {
  const p = PURE_TOWERS[elem];
  assert(!!p,           `PURE_TOWERS[${elem}] 存在`);
  assert(!!p?.lv5,      `PURE_TOWERS[${elem}].lv5 存在`);
  assert(!!p?.lv6,      `PURE_TOWERS[${elem}].lv6 存在`);
}

// ── 技能 ID 合法性 ──
section('技能 ID 合法性');
const allSkillIds = new Set(Object.keys(SKILL_DEFS));
const towerSets = [
  ...Object.values(INFUSIONS).flatMap(obj => Object.values(obj)),
  ...Object.values(TRIPLE_TOWERS),
  ...Object.values(PURE_TOWERS),
];
for (const tw of towerSets) {
  for (const lvKey of ['lv4', 'lv5', 'lv6']) {
    const lvData = tw[lvKey];
    if (!lvData?.skills) continue;
    for (const sk of lvData.skills) {
      assert(allSkillIds.has(sk.id), `技能 ID "${sk.id}" 存在於 SKILL_DEFS`);
    }
  }
}

// ── WAVES killGold ──
section('WAVES killGold');
WAVES.forEach((wave, i) => {
  assert(wave.killGold !== undefined, `WAVES[${i}]（W${i + 1}）有 killGold`);
});

// ── INCOME_SENDS 完整性 ──
section('INCOME_SENDS 完整性');
INCOME_SENDS.forEach((s, i) => {
  ['id', 'name', 'icon', 'cost', 'income', 'count', 'hp', 'dmgToBase'].forEach(key => {
    assertDefined(s[key], `INCOME_SENDS[${i}] (${s.id || i}).${key}`);
  });
});
```

### 最後顯示統計

```js
window.addEventListener('DOMContentLoaded', () => {
  runTests();
  const total = passed + failed;
  document.getElementById('summary').innerHTML = `
    <div class="${failed > 0 ? 'summary-fail' : 'summary-pass'}">
      ${failed > 0 ? '❌' : '✅'} ${passed}/${total} 通過
      ${failed > 0 ? ` — <strong>${failed} 失敗</strong>` : ''}
    </div>`;
});
```

## 注意事項

- **不載入 game.js**：game.js 依賴 `document.getElementById('canvas')` 等 DOM，會在非遊戲頁面報錯。Layer 2 改用 mock。
- TRIPLE_TOWERS 數量大（20種），若測試太冗長可只驗代表性幾種（或全部但折疊顯示）。
- 測試名稱保持簡短，失敗時才顯示 detail。
