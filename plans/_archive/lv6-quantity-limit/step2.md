# step2 — js/game.js：countLv6Towers + maxTowerLevel + UI 三處

## 目標

以數量限制取代精華限制，修正 Lv6 升級路徑的四個相關位置。

## 影響檔案

`js/game.js`

---

## 修改 A：新增 `countLv6Towers()` helper

**位置**：`getAvailableElements()` 函數附近（line ~478），插入新 method。

```js
// 計算目前場上 Lv6 塔數量
countLv6Towers() {
  return this.towers.filter(t => t.level >= 6).length;
}
```

**定位方式**：Grep `getAvailableElements()` → 在其前一行插入。

---

## 修改 B：`maxTowerLevel()` 中的 canLv6 條件

**位置**：`maxTowerLevel(t)` 函數，line ~391。

### 現有
```js
const canLv6 = picks >= 3 &&
               (this.essencePerElem[t.elem] || 0) >= CONFIG.essenceLv6Threshold &&
               PURE_TOWERS[t.elem];
if (canLv6) return 6;
```

### 修改後
```js
const canLv6 = picks >= 3 && PURE_TOWERS[t.elem] &&
               this.countLv6Towers() < (CONFIG.maxLv6Towers ?? 1);
if (canLv6) return 6;
```

**說明**：
- 移除精華門檻（`essencePerElem >= threshold`）
- 加入數量限制（`countLv6Towers() < maxLv6Towers`）
- `?? 1` fallback 防止 CONFIG 未定義時永遠鎖死

---

## 修改 C：Lv4 純屬 `else` 分支 UI（picks < 2 時顯示的鎖定 Lv6 預覽）

**位置**：line ~969–1002（`if (pure.lv5 && picks >= 2)` 的 else 分支）

這個分支在 picks < 2 時顯示 Lv6 路線的「鎖定預覽」。

### 現有（line ~971–984 區段）
```js
const ess = this.essencePerElem[t.elem] || 0;
const threshold = CONFIG.essenceLv6Threshold;
const nextData = pure.lv6;
const has3rdPick = picks >= 3;
const hasEss = ess >= threshold;
...
btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && hasEss) ? '1' : '0.4';
const pickHint = picks >= 2 ? (has3rdPick ? '' : `...`) : `...`;
const essHint = hasEss ? '' : ` <span style="color:#e94560">精華不足(${ess}/${threshold})</span>`;
btn.innerHTML = `... <span>💰${nextData.cost}${pickHint}${essHint}</span>`;
```

### 修改後
```js
const lv6Count = this.countLv6Towers();
const maxLv6 = CONFIG.maxLv6Towers ?? 1;
const nextData = pure.lv6;
const has3rdPick = picks >= 3;
const atLimit = lv6Count >= maxLv6;
...
btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && !atLimit) ? '1' : '0.4';
const pickHint = has3rdPick ? '' : ` <span style="color:#e94560">需第3次${ELEM[t.elem].name}pick</span>`;
const limitHint = atLimit ? ` <span style="color:#e94560">Lv6上限已達（${lv6Count}/${maxLv6}）</span>` : '';
btn.innerHTML = `... <span>💰${nextData.cost}${pickHint}${limitHint}</span>`;
```

onclick 守衛同步更新：
```js
// 現有
if (this.gold < nextData.cost || !has3rdPick || !hasEss) return;
// 修改後
if (this.gold < nextData.cost || !has3rdPick || atLimit) return;
```

---

## 修改 D：Lv5 → Lv6 升級面板 UI

**位置**：line ~1044–1082（`if (t.level === 5 && t.infuseElem === t.elem && !t.thirdElem && PURE_TOWERS[t.elem])`）

### 現有（line ~1047–1061 區段）
```js
const ess = this.essencePerElem[t.elem] || 0;
const threshold = CONFIG.essenceLv6Threshold;
...
const has3rdPick = picks >= 3;
const hasEss = ess >= threshold;
...
btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && hasEss) ? '1' : '0.4';
const pickHint = has3rdPick ? '' : ` ...`;
const essHint = hasEss ? '' : ` <span ...>精華不足(${ess}/${threshold})</span>`;
```

### 修改後
```js
const lv6Count = this.countLv6Towers();
const maxLv6 = CONFIG.maxLv6Towers ?? 1;
...
const has3rdPick = picks >= 3;
const atLimit = lv6Count >= maxLv6;
...
btn.style.opacity = (this.gold >= nextData.cost && has3rdPick && !atLimit) ? '1' : '0.4';
const pickHint = has3rdPick ? '' : ` <span style="color:#e94560">需第3次${ELEM[t.elem].name}pick</span>`;
const limitHint = atLimit ? ` <span style="color:#e94560">Lv6上限已達（${lv6Count}/${maxLv6}）</span>` : '';
```

onclick 守衛同步：
```js
// 修改後
if (this.gold < nextData.cost || !has3rdPick || atLimit) return;
```

---

## 修改 E：info panel 標題文字

**位置**：line ~2193

### 現有
```js
h += `<h3 ...>💎 純屬塔 Lv6（同元素×3 + 精華${CONFIG.essenceLv6Threshold}）</h3>`;
```

### 修改後
```js
h += `<h3 ...>💎 純屬塔 Lv6（同元素×3，全場限 ${CONFIG.maxLv6Towers ?? 1} 座）</h3>`;
```

---

## 執行順序

1. Grep `countLv6Towers\|getAvailableElements` → 確認 A 的插入位置
2. 插入 `countLv6Towers()` method
3. Grep `canLv6 = picks >= 3` → 修改 B
4. Grep `const ess = this.essencePerElem\[t\.elem\] \|\| 0` → 找到兩處（C 和 D）分別修改
5. Grep `純屬塔 Lv6` → 修改 E
