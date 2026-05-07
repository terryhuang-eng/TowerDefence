# Plan: fire-damage-tracker

## 問題
三種火系效果（灼燒 DOT / 引燃 / 引爆）各自造成多少傷害目前完全不可見，
導致無法判斷哪個效果過強、也無法針對性調整 dot/flat/ratio 參數。

## 目標
在 sandbox 模式下即時顯示各效果累計傷害，讓數值調整有依據。

## 傷害觸發點對應（game.js）
| 效果 | 行號 | 程式碼 |
|------|------|--------|
| 直接攻擊 | ~2380 | `applyDamage()` 中 `enemy.hp -= dmg` |
| 引燃 ignite | 2415 | `enemy.hp -= Math.floor(baseDmg * igniteSk.flat)` |
| 引爆 detonate | 2424-2431 | `enemy.hp -= detDmg` |
| 灼燒 DOT | 2619 | `e.hp -= e.burnDmg * dt` |

## 步驟清單

| 步驟 | 檔案 | 說明 |
|------|------|------|
| step1 | `js/game.js` | 4 個傷害點加 sandbox 追蹤 |
| step2 | `index.html` | sandbox panel 加火傷統計顯示 |

## 執行順序
step1 → step2（step2 依賴 step1 定義的 window.SANDBOX.fireDmg 結構）
