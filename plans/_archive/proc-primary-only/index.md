# proc-primary-only

## 設計決策

**Proc 效果（burn/chill/shred/vuln 等）只在主要目標觸發，副目標只受純傷害。**

## 根因

`doDmg(enemy, dmg, elem, tower)` 的第四個參數控制 proc：

```js
// game.js ~2414
if (tower) {
  // burn / chill / freeze / shred / vuln / hpPct / lifedrain / execute...
}
```

→ 傳 `tw`：proc 全部觸發。傳 `null`：只算傷害，無 proc。

## 受影響的呼叫點（均在 game.js 攻擊迴圈）

| 技能 | 呼叫位置 | 主目標 | 副目標 |
|------|---------|-------|-------|
| pierce | `lineTargets.forEach` | `e === target` | 其餘 |
| chain | `chainTargets.forEach` | ❌（全部都是副目標）| 全部 |
| multishot | `for (let s...)` | `s === 0` | `s > 0` |
| multiArrow（未實作）| 待加入 step | 主攻擊已處理 | 全部額外箭 |

## 步驟

| # | 步驟 | 說明 |
|---|------|------|
| 1 | [step1.md](step1.md) | 修改 pierce / chain / multishot 三個呼叫點 |

multiArrow 的 step2 在 `multi-arrow/step2.md` 中，插入時已直接使用 `null`，不需修改。
