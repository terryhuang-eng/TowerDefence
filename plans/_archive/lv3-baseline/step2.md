# Step 2：dps-calc.html 加入技能參數調整面板

## 目標

在 `dps-calc.html` 的展開行中，讓技能的每個 param 顯示為可編輯輸入框。修改後即時重算該塔 eDPS，並更新整張表的排名。

## 影響範圍

**檔案：dps-calc.html**
**改動位置：**
1. 展開行的 detail 區塊（技能描述改成輸入框）
2. 新增 `overrideParams` 狀態物件，記錄使用者覆蓋的參數
3. `calcEffectiveDPS()` 改為優先讀取 override 值
4. 每次輸入變動後呼叫 `render()`

---

## 技能可調整參數清單

每個技能有以下 params 可調（對應 SKILL_DEFS 的 defaults）：

| 技能 | 可調參數 | 說明 |
|------|---------|------|
| burn | dot、dur | dot = 每秒 %ATK，dur = 燒幾秒 |
| ignite | flat | 覆蓋瞬間額外 %ATK |
| detonate | ratio | 消耗燒爆傷 |
| chill | perStack、cap | 每層減速%、最大層數 |
| freeze | threshold、dur | 幾層觸發冰凍、定身秒數 |
| shred | amt、dur、cap | 每層碎甲%、持續、上限 |
| vulnerability | amt、dur、cap | 每層易傷%、持續、上限 |
| ramp | perHit、cap | 每攻+%攻速、上限 |
| hpPct | pct、every | %HP傷害、每幾次觸發 |
| chain | targets、decay | 彈射數、每跳倍率 |
| execute | threshold、mult | 觸發HP%、傷害倍率 |
| pierce | dmgUp | 每穿+%傷害 |
| multishot | count | 同時射幾發 |
| warp | dur、cd | 定身秒、冷卻秒 |
| zone | value | 減速幅度 |
| knockback | dist | 擊退格數 |

---

## 狀態設計

```js
// 使用者覆蓋的技能參數（key = towerId + '_' + skillType + '_' + paramKey）
const overrideParams = {};

function getParam(towerId, skillType, paramKey, defaultVal) {
  const key = towerId + '_' + skillType + '_' + paramKey;
  return key in overrideParams ? overrideParams[key] : defaultVal;
}
```

---

## UI 設計

展開行的技能區塊改為：

```
技能
─────────────────────────────────
🔥 灼燒  dot [0.30]  dur [3]   eDPS 貢獻：+56.7
🔥 引燃  flat [0.20]           eDPS 貢獻：+6.3
💥 引爆  ratio [0.80]          eDPS 貢獻：+15.1
─────────────────────────────────
（輸入任意數值後 Enter → 全表更新）
```

輸入框樣式：
- 小型 input（width: 60px）
- 顯示當前生效值（override 或 default）
- 修改後立即觸發 render()
- 重置按鈕：回復 default 值

---

## 實作要點

### 1. 展開行 detail 改用函數產生

```js
function buildDetailHTML(t) {
  const skillRows = (t.skills || []).map(function(skill) {
    const def = SKILL_DEFS[skill.type];
    if (!def) return '';
    const p = Object.assign({}, def.defaults, skill.params);
    const contrib = calcSkillContrib(t, skill, getEnemyParams());

    const paramInputs = Object.keys(p).map(function(k) {
      const overKey = t.id + '_' + skill.type + '_' + k;
      const val = overKey in overrideParams ? overrideParams[overKey] : p[k];
      return k + ' <input type="number" step="any" value="' + val + '"'
        + ' data-tower="' + t.id + '" data-skill="' + skill.type + '" data-param="' + k + '"'
        + ' style="width:60px;background:#0f3460;border:1px solid #334;color:#e0e0e0;border-radius:3px;padding:2px 4px;">';
    }).join('  ');

    return '<div>' + paramInputs + ' → <b style="color:#ff6b35">+' + Math.round(contrib) + ' eDPS</b></div>';
  }).join('');

  return '...'; // 組合完整 HTML
}
```

### 2. 事件委派（event delegation）

```js
document.getElementById('tableBody').addEventListener('input', function(e) {
  const el = e.target;
  if (!el.dataset.tower) return;
  const key = el.dataset.tower + '_' + el.dataset.skill + '_' + el.dataset.param;
  overrideParams[key] = parseFloat(el.value);
  render(); // 全表更新
});
```

### 3. calcEffectiveDPS 修改

```js
// 在 switch 每個 case 中，用 getParam() 取代固定的 p.xxx
// 例如 burn：
case 'burn':
  const dot = getParam(t.id, 'burn', 'dot', p.dot);
  const dur = getParam(t.id, 'burn', 'dur', p.dur);
  addDPS += dot * dmg * Math.min(dur, 3) * spd * armorMult;
  break;
```

---

## 限制

- override 存在 memory（JS 物件）中，重整頁面後消失
- 同一個 towerId 跨元素篩選時 override 持續生效（符合預期）
- 光環類技能（aura_*）override 後仍不計入自身 DPS（維持原邏輯）

## 依賴

- 不依賴 step1，可獨立執行
- 但 step1 完成後，此工具的比較更有意義
