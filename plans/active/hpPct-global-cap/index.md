# 計畫：hpPct-global-cap — hpPct 上限移入 GLOBAL_CAPS

## 問題分析

### 現況：cap 分散在個別 makeSkill 裡，行為不一致

`hpPct` 的 `cap`（每次觸發的傷害上限）目前是每塔自行帶入 `makeSkill` 的 param，
但這個值在全站都是 `120`，屬於全域平衡數值，與 `chillPerStack`、`shredMaxStacks`、
`hpPctCd`（已在 GLOBAL_CAPS）的性質相同。

現況造成三個問題：
1. **12 支塔有 `cap:120`，2 支塔沒有**（水×水 Lv4、純水 Lv5）→ Bug：無封頂
2. **cap 值分散**：要調整封頂值需改 12 個地方，不是 1 個
3. **混淆語義**：skill-editor 的塔編輯面板顯示 `cap` 為可調 param，暗示各塔可設不同值，但實際上全部一樣

### GLOBAL_CAPS 現有欄位（已有 hpPctCd 先例）

```js
const GLOBAL_CAPS = {
  slowPct: 0.8,
  chillPerStack: 0.005, chillMaxStacks: 130, chillDecayRate: 6,
  atkSpdBonus: 2,
  shredPerStack: 0.005, shredMaxStacks: 130, shredDecayRate: 6,
  vulnPerStack: 0.02,   vulnMaxStacks: 37,   vulnDecayRate: 1.5,
  procMinInterval: 0.3,
  hpPctCd: 0.2,         // ← 已是全域
  // hpPctCap: 120      ← 要加這個
};
```

## 修正方案

1. `skills.js`：GLOBAL_CAPS 加 `hpPctCap: 120`
2. `game.js`：hpPct 觸發邏輯改讀 `GLOBAL_CAPS.hpPctCap`（不再讀 `hpPctSk.cap`）
3. `towers.js`：移除所有 12 處 `,cap:120`（全部 replace_all）
4. `skill-editor.html`：
   - `capLabels` 加 `hpPctCap: 'hpPctCap（每次上限）'`
   - `capComments` 加 `hpPctCap: '// %HP 傷害每次上限'`

修正後，cap 只在一處定義，兩支遺漏 cap 的塔也自動獲得封頂保護。

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | js/skills.js | GLOBAL_CAPS 加 `hpPctCap: 120` |
| step2.md | js/game.js | hpPct 觸發邏輯改讀 GLOBAL_CAPS.hpPctCap |
| step3.md | js/towers.js | 移除所有 `,cap:120`（replace_all） |
| step4.md | skill-editor.html | capLabels + capComments 加 hpPctCap 說明 |

## 執行順序
step1 → step2 → step3 → step4（依序）
