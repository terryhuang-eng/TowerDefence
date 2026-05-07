# Plan: chill-display-fix

## 問題

1. **NaN/undefined**：`skills.js:116/165` display 函式仍讀 `p.perStack`/`p.cap`，
   chill-redesign 已換成 `stacksPerHit`，兩個 key 都是 `undefined`。
2. **死碼**：`skill-editor.html:190` `scorePrimary === 'cap' && sk.key === 'chill'`
   永遠為 false（scorePrimary 已改為 'stacksPerHit'），殘留誤導性邏輯。
3. **decay rate 隱藏**：`game.js:2594` hardcode `* 5`（每秒 -5 層），
   未進 GLOBAL_CAPS，display 也沒顯示，行為完全不透明。

## 決策

- decay rate 加入 `GLOBAL_CAPS.chillDecayRate: 5`（全域，與 chillPerStack 同層）
- 不設為 per-skill 參數（chill 是全域層疊系統，各塔差異由 stacksPerHit 表達）
- display 格式：`❄️ 冰冷：每攻擊 +N 層（衰減 5層/秒，全域每層 -2%）`

## 步驟

- [step1.md](step1.md)：`js/skills.js` — GLOBAL_CAPS 加 chillDecayRate，修 display 116/165
- [step2.md](step2.md)：`js/game.js` — hardcode `5` 換成 `GLOBAL_CAPS.chillDecayRate`
- [step3.md](step3.md)：`skill-editor.html` — 清除 scorePrimary === 'cap' 死碼
