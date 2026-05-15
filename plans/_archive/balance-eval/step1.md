# step1 — HTML 骨架 + Wave EHP Table + Gold Flow Table

## 目標

建立 `balance-eval.html`，載入與 `index.html` 相同的 JS 資料檔，自動計算並顯示：
1. **Wave EHP Table**（每波威脅分數 WTS）
2. **Gold Flow Table**（每波可用金幣估算）

## 影響範圍

| 檔案 | 操作 | 說明 |
|------|------|------|
| `balance-eval.html` | 新建 | 不影響任何現有檔案 |

**不影響：** index.html、game.js、任何 js/*.js

---

## 實作重點

### HTML 結構

```html
<!-- 載入順序同 index.html -->
<script src="js/config.js"></script>
<script src="js/skills.js"></script>
<script src="js/sends.js"></script>
<script src="js/towers.js"></script>
<script src="js/waves.js"></script>
<script>
  // 分析邏輯在這裡
</script>
```

頁面樣式參考 test.html（深色背景 #0a0a1e，Consolas 字體，`.ok/.warn/.err` 顏色系統）

---

### Table A：Wave EHP（WTS）

JS 計算邏輯：

```js
function calcWTS(wave) {
  const skillMult = (skills) => {
    let m = 1;
    if (skills.some(sk => sk.type === 'regen'))      m *= 1.15;
    if (skills.some(sk => sk.type === 'armorStack')) m *= 1.30;
    if (skills.some(sk => sk.type === 'enrage'))     m *= 1.10;
    if (skills.some(sk => sk.type === 'charge'))     m *= 1.05;
    return m;
  };
  const ehpBase = wave.hp / Math.max(0.01, 1 - wave.armor);
  const mult = skillMult(wave.skills || []);
  return wave.count * ehpBase * mult;
}
```

**注意**：skills 是 skill 物件陣列（用 `.type`，不是 `.id`）

輸出表格欄位：
```
| W# | 名稱 | Count | HP | Armor | EHP/單 | Skill× | WTS | killGold | dmgToBase | Boss? |
```

顏色規則：
- `dmgToBase >= 5`（Boss級）→ 整行 `.warn`（黃色）
- `isBoss: true` → 加 ⭐ 圖示
- `resist` 欄不在此表（Step 3 的 PThreat 才用到）

---

### Table B：Gold Flow

```js
function calcGoldFlow() {
  const rows = [];
  let cumKill = 0;
  const start = CONFIG.startGold;
  const income = CONFIG.baseIncome;

  for (let i = 0; i < WAVES.length; i++) {
    const available = start + cumKill + income * i;  // 這波「開始前」可用
    const kill = WAVES[i].count * WAVES[i].killGold; // 這波擊殺獎勵
    rows.push({
      wave: i + 1,
      available,       // 這波開始時手上的錢（假設前面全花在塔上即最小值）
      delta_kill: kill,
    });
    cumKill += kill;
  }
  return rows;
}
```

**說明：**
- `available` = 若玩家完全不花錢，手上的總金幣（上限估算）
- 實際金幣 = available 扣掉塔費和送兵費，但這裡只算「最大預算」
- `delta_kill` = 這波擊殺全清能拿多少金

輸出表格欄位：
```
| W# | 累積可用金幣 | 本波擊殺金 | 備注（ELEM_WAVE? Boss?）|
```

顏色規則：
- `ELEM_WAVES.includes(w-1)` → 標 `🔮`（元素選擇波）
- Boss 波 → 標 ⭐

---

## 注意事項

- `resist: 'random_dual'` 等字串形式的 resist 無法直接計算，在 WTS 欄旁邊用 `⚠️隨機` 提示即可
- `armor` 上限假設為 0.9（避免 EHP 無限大），即 `max_cap = Math.min(0.9, wave.armor)`
- Boss 的 `count` 很小（1-2），但 HP 超高，WTS 計算不需要特殊處理，公式統一
