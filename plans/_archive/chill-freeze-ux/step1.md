# Step 1：修正 chill perStack 被忽略的 Bug

## 目標
讓 chill 技能的 `perStack` 參數實際影響減速效果。
**不調整任何塔的參數數值**，只修正程式邏輯。

---

## 問題位置

**`js/game.js`**

| 行號 | 現況 | 問題 |
|------|------|------|
| 2441 | `enemy.chillStacks = Math.min(chillSk.cap, (enemy.chillStacks || 0) + 1)` | 只記層數，沒記錄是哪個塔的 perStack |
| 2591 | `const chillSlow = Math.min(e.chillStacks * 0.02, GLOBAL_CAPS.slowPct)` | 硬寫 0.02，perStack 完全被忽略 |
| 1856 | `chillStacks: 0, chillDecay: 0` | enemy 初始化缺少 chillPerStack 欄位 |

---

## 解法：enemy 記錄 chillPerStack（取攻擊塔的最大值）

### 設計說明
- `chillStacks`：維持原有疊層邏輯（不變）
- `chillPerStack`：新增欄位，記錄「目前有效的每層減速量」
- 多塔 perStack 不同時，取最高值（用 Math.max）

### 修改一：enemy 初始化（line 1856）
**搜尋**：`chillStacks: 0, chillDecay: 0`
**改為**：`chillStacks: 0, chillDecay: 0, chillPerStack: 0`

---

### 修改二：攻擊時記錄 perStack（line 2440~2442 區塊）

**現況**：
```js
enemy.chillStacks = Math.min(chillSk.cap, (enemy.chillStacks || 0) + 1);
enemy.chillDecay = 0; // 重置衰減計時
```

**改為**：
```js
enemy.chillStacks = Math.min(chillSk.cap, (enemy.chillStacks || 0) + 1);
enemy.chillPerStack = Math.max(enemy.chillPerStack || 0, chillSk.perStack);
enemy.chillDecay = 0; // 重置衰減計時
```

---

### 修改三：slow 計算改用 chillPerStack（line 2591）

**現況**：
```js
const chillSlow = Math.min(e.chillStacks * 0.02, GLOBAL_CAPS.slowPct);
```

**改為**：
```js
const chillSlow = Math.min(e.chillStacks * (e.chillPerStack || 0.02), GLOBAL_CAPS.slowPct);
```

（保留 fallback `|| 0.02` 防止初始化邊界問題）

---

### 修改四：stacks 歸零時重置 chillPerStack（line 2596 後）

**現況**：
```js
if (decayStacks > 0) { e.chillStacks = Math.max(0, e.chillStacks - decayStacks); e.chillDecay -= decayStacks / 5; }
```

**改為**：
```js
if (decayStacks > 0) {
  e.chillStacks = Math.max(0, e.chillStacks - decayStacks);
  e.chillDecay -= decayStacks / 5;
  if (e.chillStacks === 0) e.chillPerStack = 0; // 清空，等下次攻擊重新設定
}
```

---

### 修改五：freeze 觸發時清空 chillPerStack（line 2448）

**現況**：
```js
enemy.stunTimer = Math.max(enemy.stunTimer, freezeSk.dur * ccMult);
enemy.chillStacks = 0;
```

**改為**：
```js
enemy.stunTimer = Math.max(enemy.stunTimer, freezeSk.dur * ccMult);
enemy.chillStacks = 0;
enemy.chillPerStack = 0;
```

---

### 修改六：狀態顯示更新（line 2274）

**現況**：
```js
if (enemy.chillStacks > 0) statusHtml += `<span style="color:#4cf">❄️冰冷${enemy.chillStacks}層（-${Math.round(Math.min(enemy.chillStacks*0.02, GLOBAL_CAPS.slowPct)*100)}%）</span> `;
```

**改為**：
```js
if (enemy.chillStacks > 0) {
  const ps = enemy.chillPerStack || 0.02;
  statusHtml += `<span style="color:#4cf">❄️冰冷${enemy.chillStacks}層（-${Math.round(Math.min(enemy.chillStacks*ps, GLOBAL_CAPS.slowPct)*100)}%）</span> `;
}
```

---

## 影響範圍
- `js/game.js` 共 6 處改動，不涉及其他檔案
- 所有塔的技能數值（perStack、cap、threshold）完全不變
- zone slow（line 2858）不動（已是直接設 chillStacks，不影響 perStack 邏輯）

## 預期效果
- 深寒（perStack:0.5）：每層減速 50%，2 層就達 GLOBAL_CAPS.slowPct 上限（75%）
- 其他 chill 塔（perStack:0.02）：行為與修改前完全相同
