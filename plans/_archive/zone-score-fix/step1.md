# zone-score-fix / step1 — skills.js zone 評分動態化

## 目標

讓 zone 技能分數隨 radius 和 value 動態計算，取代固定 25 分。

## 影響範圍

- 唯一修改檔案：`js/skills.js:56`
- 不影響 game.js / towers.js / skill-editor.html

## 修改說明

### 現況（`js/skills.js:56`）

```js
zone: { category: 'tower', group: 'special', name: '領域', defaults: {radius:1.5,effect:"slow",value:0.2}, desc: '放置持續效果區域', scoreBase: 25, scorePrimary: null, scoreRef: null },
```

### 改為

```js
zone: { category: 'tower', group: 'special', name: '領域', defaults: {radius:1.5,effect:"slow",value:0.2}, desc: '放置持續效果區域', scoreBase: 25, scorePrimary: 'radius', scoreRef: 1.5, scoreFactors: [{param:'value', ref:0.2}] },
```

## 數值驗證

基準塔（全部 radius:1.5, value:0.2）分數不變 = 25 分。

| radius | value | 分數 |
|--------|-------|------|
| 1.5 | 0.2 | 25 × (1.5/1.5) × (0.2/0.2) = **25** |
| 2.0 | 0.2 | 25 × (2.0/1.5) × (0.2/0.2) = **33.3** |
| 1.5 | 0.4 | 25 × (1.5/1.5) × (0.4/0.2) = **50** |
| 2.5 | 0.3 | 25 × (2.5/1.5) × (0.3/0.2) = **62.5** |

## effect 類型差異（暫用 weight 手動補）

如果某塔的 zone effect 改為 shred（強度約是 slow 的 1.8×），在 skill-editor 對該 zone 技能設 `scoreWeight: 1.8`。
框架層不修改，由設計師在 UI 上調整。

## 定位指令（執行用）

```
Grep 'zone.*scoreBase' js/skills.js → 確認行號 → Read ±3 行 → Edit
```
