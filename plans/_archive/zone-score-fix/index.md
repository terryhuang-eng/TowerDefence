# zone-score-fix — zone 技能重構

## 問題說明

`zone` 技能有兩個問題：

1. **評分固定 25 分**（`scorePrimary: null`），不受任何參數影響
2. **`effect` 是字串 enum**（`"slow"/"shred"`），skill-editor 用 `<input type="number">` 渲染 → 顯示空白；`value` 語義在不同 effect 下換算分母不同，設計師看不懂

## 決策：拆分為 zone_slow + zone_shred

```
zone_slow:  { radius:1.5, chillStacks:40 }   → 直接就是「圓內維持 40 層冰冷」
zone_shred: { radius:1.5, shredStacks:10 }   → 直接就是「圓內維持 10 層碎甲」
```

- 參數名稱對齊遊戲內部狀態（`e.chillStacks`、`e.shredStacks`），不需 `value/perStack` 換算
- UI 全部是數字欄位，顯示正常
- 評分各自設 scoreBase，反映強度差距（slow:20 / shred:30）

---

## 步驟清單

| 步驟 | 內容 | 檔案 |
|------|------|------|
| step1 | `skills.js` zone 定義加 scorePrimary/scoreFactors（評分動態化，選做） | `js/skills.js` |
| step2 | zone 拆分為 zone_slow + zone_shred | `js/skills.js` + `js/game.js` + `js/towers.js` + `skill-editor.html` |

step1 可單獨執行；step2 需 4 個檔案同時完成（中間狀態會報錯）。
若執行 step2，step1 的改動會被 step2 覆蓋（step2 已包含新的評分設定）。
