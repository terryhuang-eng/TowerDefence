# Step 1：dps-calc.html — 靜態 DPS 試算工具

## 目標

建立獨立的 HTML 工具，讓使用者可以：
1. 設定「標準敵人」參數（HP、護甲、速度）
2. 即時看到所有塔的「等效 DPS」排名
3. 點擊任意塔後修改其參數，立刻看到排名變化

## 檔案

- **新建**：`dps-calc.html`
- **讀取**：`js/towers.js`, `js/skills.js`（script src 引用）

## 等效 DPS 計算公式

### 基礎
```
baseDPS = damage × atkSpd
```

### 技能加成乘數（套用在 baseDPS 上）

| 技能 | 加成方式 | 估算 |
|------|---------|------|
| `burn` | DOT 額外傷害 | `+ dot × damage × min(dur, 敵存活s)` per attack → `+dot×3×atkSpd` |
| `ignite` | burn 觸發時爆傷 | `+ flat × damage × atkSpd × 0.5`（50% 觸發率） |
| `detonate` | ignite 爆炸 | `+ ratio × damage × atkSpd × 0.3`（30% 觸發） |
| `chill` | 減速 → 更多命中 | `× 1 / (1 - min(perStack × avgStacks, cap))` 約 `×1.25` |
| `freeze` | 完全停止 dur 秒 | `× 1.05`（偶發效果，難估） |
| `shred` | 護甲降低 → 傷倍 | `× (1 + amt × stacks × 目標護甲率)` 約 `×1.15` |
| `vulnerability` | 易傷 | `× (1 + amt × stacks)` 直接加成 |
| `chain` | 多目標 | `× (1 + targets × decay)` |
| `hpPct` | %HP 真傷 | `+ pct × 敵HP / every × atkSpd`（每 every 秒觸發） |
| `ramp` | 累積加速 | `× (1 + cap / 2)` |
| `pierce` | 穿甲 | `× (1 + dmgUp × avgTargets)` 約 `×1.10` |
| `multishot` | 多射 | `× count` |
| `execute` | 斬殺 | `× 1.10`（尾刀效率提升） |
| `unstable` | 隨機傷害 | 期望值不變 `×1.0`，但高方差 |
| `aura_dmg` | 光環加成他塔 | 不計入自身 DPS |
| `zone` | 區域減速 | 等同 chill 效果，約 `×1.15` |
| `warp` | 定身 | `×1.05` |
| `knockback` | 擊退（讓敵再走一段） | `×1.10` |
| `permaBuff` | 永久ATK | 後期加成，難估，`×1.05` |
| `lifedrain` | 回血 | 不加DPS，算「有效持久度」 |
| `killGold` | 賞金 | 不算 DPS |

### AOE 命中估算
```
aoeTargets = aoe > 0 ? 1 + 2 × aoe  // 半徑越大，命中越多
```
（aoe=1.0 → 約 3 目標，aoe=1.5 → 約 4 目標，aoe=2.0 → 約 5 目標）

最終：`effectiveDPS = baseDPS × aoeTargets × skillMult`

## UI 設計

```
┌────────────────────────────────────────────────────┐
│ 標準敵人：HP [500▼] 護甲 [0%▼] 速度 [1.0▼]         │
├────────────────────────────────────────────────────┤
│ 篩選：[全部] [Lv3] [Lv4] [Lv5] [Lv6]  元素:[全▼]  │
├──┬──────────────┬──────┬──────┬──────┬────────────┤
│# │ 塔名          │ DPS  │ eDPS │ 成本 │ eDPS/cost  │
├──┼──────────────┼──────┼──────┼──────┼────────────┤
│1 │🔥🔥 暴焰 Lv4 │ 145  │ 310  │ 250  │ 1.24       │
│2 │⚡⚡ 雷霆 Lv4  │ 102  │ 285  │ 250  │ 1.14       │
│..│              │      │      │      │            │
└──┴──────────────┴──────┴──────┴──────┴────────────┘
（點擊任一行 → 展開技能詳情 + 參數輸入框 → 即時更新排名）
```

## 影響範圍

- 只讀取 `js/towers.js` + `js/skills.js`
- 不修改任何遊戲邏輯
- 完全獨立工具

## 限制（已知不精確之處）

- `aura_*`：加成鄰近塔，自身 DPS 不計
- `zone`：依路徑幾何，靜態計算只能估
- `burn`/`chill`：實際效果依敵人 HP 多寡和存活時間而異
- `permaBuff`：累積效果，前期弱後期強
