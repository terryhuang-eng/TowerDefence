# step1 — 評分框架通用化（scoreFactors）

## 目標

在 `skill-editor.html` 的評分計算中支援可選的 `scoreFactors`，
讓有多個影響強度參數的技能（如 burn 的 dot + dur）能正確反映在分數裡。

**沒有 scoreFactors 的技能行為完全不變。**

## 影響檔案

`skill-editor.html` 只動兩處：
1. `computeScoreBreakdown`（評分計算邏輯）
2. 匯出 skills.js 的函數（保留 scoreFactors 欄位）

## 改動一：computeScoreBreakdown（約 line 906~914）

找到這段：
```js
let score = def.scoreBase;
if (def.scorePrimary && def.scoreRef) {
  const cur = (s.params && s.params[def.scorePrimary] !== undefined)
    ? s.params[def.scorePrimary]
    : def.defaults[def.scorePrimary];
  score = def.scoreBase * (cur / def.scoreRef);
}
const weight = (s.scoreWeight !== undefined) ? s.scoreWeight : 1.0;
score = Math.round(score * weight * 10) / 10;
```

在 `const weight` 那行之前，插入：
```js
// scoreFactors：次要參數乘數（可選，不設則不影響計算）
if (def.scoreFactors && def.scoreFactors.length > 0) {
  for (const f of def.scoreFactors) {
    const fVal = (s.params && s.params[f.param] !== undefined)
      ? s.params[f.param]
      : (def.defaults[f.param] ?? 1);
    score *= fVal / f.ref;  // fVal = f.ref 時 ×1.0（中性值）
  }
}
```

## 改動二：匯出 skills.js（約 line 1388~1390）

找到這行：
```js
lines.push(`  ${type.padEnd(12)}: { ... scoreBase: ${def.scoreBase}, scorePrimary: ${spRef}, scoreRef: ${def.scoreRef === null ? 'null' : def.scoreRef} },`);
```

改為：
```js
const sfStr = (def.scoreFactors && def.scoreFactors.length > 0)
  ? `, scoreFactors: ${JSON.stringify(def.scoreFactors)}`
  : '';
lines.push(`  ${type.padEnd(12)}: { ... scoreBase: ${def.scoreBase}, scorePrimary: ${spRef}, scoreRef: ${def.scoreRef === null ? 'null' : def.scoreRef}${sfStr} },`);
```

> 注意：line 1388 和 line 1398 是相同邏輯的兩個地方（塔技能 / 敵人技能），兩處都要改。

## 完成標準

- 開啟 skill-editor.html，現有技能評分結果不變（無 scoreFactors 的技能不受影響）
- 手動在 SKILL_DEFS 的 `burn` 加上 `scoreFactors: [{param:'dur', ref:3}]` 後，
  burn(dot:0.3, dur:3) 的分數不變；burn(dot:0.3, dur:6) 的分數變為 2 倍

## 不需要做的事

- 不需要在 UI 上加 scoreFactors 的輸入框（手動在 skills.js 裡加即可）
- 不需要修改 game.js / towers.js / skills.js（step1 只動 skill-editor.html）
