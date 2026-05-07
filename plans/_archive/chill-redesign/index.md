# chill-redesign：冰冷機制重構

## 設計原則（確認後的規格）

| 維度 | 舊設計（程式碼現況） | 新設計 |
|------|-------------------|--------|
| perStack | per-tower 參數（0.01~0.5，各不同） | **全域常數** GLOBAL_CAPS.chillPerStack |
| cap（最大層數） | per-tower 參數（20~60，各不同） | **全域自動計算** = slowPct / chillPerStack |
| per-tower 唯一變數 | perStack + cap 兩個（語意混亂） | **stacksPerHit**（每次攻擊疊幾層） |
| 評分 | scorePrimary: 'cap'（cap 不反映效果） | scorePrimary: 'stacksPerHit' |
| 多塔疊加 | Math.max perStack（workaround） | 純疊加 chillStacks，無 per-enemy perStack |

## 新機制說明

```
每次攻擊：enemy.chillStacks += skill.stacksPerHit（上限 GLOBAL_CAPS.chillMaxStacks）
減速值：min(chillStacks × GLOBAL_CAPS.chillPerStack, GLOBAL_CAPS.slowPct)
評分公式：scoreBase × (stacksPerHit / scoreRef)
```

- 攻速高的塔自然疊得更快 → 合理，不需要程式碼特別處理

## 全域新增值（建議）

```js
GLOBAL_CAPS.chillPerStack = 0.02      // 每層 -2% 速度（全域固定）
GLOBAL_CAPS.chillMaxStacks = 38       // = ceil(0.75 / 0.02)，自動封頂
// slowPct: 0.75 保留不動
```

## 步驟清單

| # | 步驟 | 改動檔案 |
|---|------|---------|
| 1 | [step1.md](step1.md) | `js/skills.js`：GLOBAL_CAPS 新增 + SKILL_DEFS.chill 改參數 |
| 2 | [step2.md](step2.md) | `js/game.js`：chill 疊加邏輯 + 減速計算 + 初始化欄位 |
| 3 | [step3.md](step3.md) | `js/towers.js`：全部 makeSkill('chill', {...}) 換成 stacksPerHit |

## 各 step 執行前提
- step1 → step2 → step3 順序執行（互相依賴）
- step2 依賴 step1 的 GLOBAL_CAPS 新值
- step3 可獨立驗證，但需要 step1+2 才能正確運作
