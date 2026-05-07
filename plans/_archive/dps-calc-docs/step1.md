# Step 1 — 在 dps-calc.html 加說明按鈕與 modal

## 目標

在工具頁頭部加一個「❓ 說明」按鈕，點擊後顯示 modal，說明所有欄位定義、計算公式、技能 eDPS 換算、Score 顏色判斷、adj 用途。

## 影響範圍

- **唯一修改檔案**：`tower-defense-prototype/dps-calc.html`
- 修改位置 1：`<style>` 區塊末尾（加 modal CSS）
- 修改位置 2：`<h1>` 行（加按鈕）
- 修改位置 3：`</body>` 前（加 modal HTML + JS）

## 具體修改說明

### A. CSS（加在 `#resetWeights:hover` 規則後，`</style>` 之前）

```css
/* Help Modal */
#helpModal {
  display: none; position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.7); align-items: flex-start; justify-content: center;
  padding: 24px 16px; overflow-y: auto;
}
#helpModal.open { display: flex; }
#helpBox {
  background: #16213e; border: 1px solid #0f3460; border-radius: 10px;
  padding: 20px 24px; max-width: 720px; width: 100%; position: relative;
}
#helpBox h2 { color: #ffd700; margin-bottom: 14px; font-size: 1em; }
#helpBox h3 { color: #4ecdc4; margin: 14px 0 6px; font-size: 0.9em; }
#helpBox p, #helpBox li { color: #ccc; font-size: 0.83em; line-height: 1.7; }
#helpBox code { background: #0f3460; padding: 1px 5px; border-radius: 3px; font-size: 0.88em; color: #e0e0e0; }
#helpBox table { border-collapse: collapse; width: 100%; margin: 6px 0; }
#helpBox th { background: #0f3460; color: #ffd700; padding: 5px 9px; font-size: 0.8em; text-align: left; }
#helpBox td { padding: 4px 9px; border-bottom: 1px solid #0f3460; font-size: 0.82em; color: #ccc; }
#helpClose {
  position: absolute; top: 12px; right: 14px;
  background: none; border: none; color: #888; font-size: 1.2em; cursor: pointer;
}
#helpClose:hover { color: #fff; }
#helpBtn {
  background: #0f3460; border: 1px solid #334; color: #888;
  border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 0.82em;
  margin-left: 10px; vertical-align: middle;
}
#helpBtn:hover { border-color: #4ecdc4; color: #4ecdc4; }
```

### B. 按鈕（在 `<h1>` 行末尾加按鈕）

修改前：
```html
<h1>⚔️ DPS 試算工具</h1>
```

修改後：
```html
<h1>⚔️ DPS 試算工具 <button id="helpBtn">❓ 說明</button></h1>
```

### C. Modal HTML（加在 `<script>` 之前、`</body>` 之前）

```html
<div id="helpModal">
  <div id="helpBox">
    <button id="helpClose">✕</button>
    <h2>⚔️ DPS 試算工具 — 使用說明</h2>

    <h3>欄位定義</h3>
    <table>
      <tr><th>欄位</th><th>說明</th></tr>
      <tr><td><b>DPS</b></td><td>純攻擊傷害：damage × atkSpd × armorMult（不含技能）</td></tr>
      <tr><td><b>eDPS</b></td><td>有效 DPS：含技能加成 × AOE 目標數，為主要比較指標</td></tr>
      <tr><td><b>eDPS/g</b></td><td>eDPS 除以建造成本，衡量性價比</td></tr>
      <tr><td><b>Score</b></td><td>綜合評分，與等級目標比對判斷平衡性</td></tr>
    </table>

    <h3>eDPS 計算公式</h3>
    <p>
      <code>baseDPS = damage × atkSpd</code><br>
      <code>armorMult = max(0.1, 1 − armor%)</code><br>
      <code>aoeTargets = aoe &gt; 0 ? 1 + 2×aoe : 1</code><br>
      <code>eDPS = (baseDPS × armorMult × skillMult + addDPS) × aoeTargets</code>
    </p>
    <p>技能分兩類：<b>addDPS 型</b>（burn/ignite/detonate/hpPct）直接疊加；<b>skillMult 型</b>（chill/shred/chain…）乘以倍率。</p>

    <h3>各技能 eDPS 換算</h3>
    <table>
      <tr><th>技能</th><th>換算方式</th></tr>
      <tr><td>burn</td><td>dot × dmg × min(dur,3) × spd × armorMult × aoeTargets</td></tr>
      <tr><td>ignite</td><td>flat × dmg × spd × 0.5 × armorMult × aoeTargets</td></tr>
      <tr><td>detonate</td><td>ratio × dmg × spd × 0.3 × aoeTargets（真實傷害）</td></tr>
      <tr><td>hpPct</td><td>pct × enemyHP × spd / every × aoeTargets</td></tr>
      <tr><td>chill</td><td>baseDPS × 0.25（減速等效傷害）</td></tr>
      <tr><td>freeze</td><td>baseDPS × 0.05</td></tr>
      <tr><td>shred</td><td>baseDPS × 0.15（護甲削減）</td></tr>
      <tr><td>vulnerability</td><td>baseDPS × cap</td></tr>
      <tr><td>chain</td><td>baseDPS × targets × decay</td></tr>
      <tr><td>ramp</td><td>baseDPS × (cap/2)（平均增傷估算）</td></tr>
      <tr><td>pierce</td><td>baseDPS × 0.10</td></tr>
      <tr><td>multishot</td><td>baseDPS × (count−1)</td></tr>
      <tr><td>execute</td><td>baseDPS × 0.10</td></tr>
      <tr><td>zone</td><td>baseDPS × 0.15</td></tr>
      <tr><td>warp/knockback/permaBuff</td><td>baseDPS × 0.05 / 0.10 / 0.05</td></tr>
      <tr><td>aura_* / lifedrain / killGold / unstable</td><td>不計入自身 eDPS（光環/特殊標記）</td></tr>
    </table>

    <h3>Score 計算公式</h3>
    <p>
      <code>dpsScore = damage × atkSpd × (range/3) × aoeMod × dpsScaleConst</code><br>
      <code>aoeMod = 1 + aoe × aoeScoreMod</code><br>
      <code>Score = (dpsScore + effectScore) × score_adj</code>
    </p>
    <p>effectScore 由各技能依評分權重 panel 的係數換算（不同技能公式不同）。</p>

    <h3>Score 顏色判斷</h3>
    <table>
      <tr><th>顏色</th><th>意義</th></tr>
      <tr><td style="color:#4ecdc4">■ 青色</td><td>在 lvN_Target ± lv4Tolerance% 範圍內（平衡）</td></tr>
      <tr><td style="color:#f0c040">■ 黃色</td><td>在 ±15% 緩衝區（略偏）</td></tr>
      <tr><td style="color:#ff5555">■ 紅色</td><td>超出容差（過強或過弱）</td></tr>
    </table>

    <h3>score_adj 用途</h3>
    <p>點擊 Score 欄的 <code>adj:x.x</code> 可即時微調。用於修正公式無法捕捉的設計意圖（如純輔助塔、特殊機制塔）。<br>
    「📋 匯出 adj 差異」→ 複製 JS patch 格式 → 貼入 towers.js 對應塔的 <code>score_adj</code> 欄位。</p>

    <h3>評分權重 panel</h3>
    <p>展開「⚙️ 評分權重」可調整 Score 公式的所有係數。修改後即時重算。「↺ 重置預設」還原所有係數至初始值。</p>

    <h3>技能 param 即時修改</h3>
    <p>點擊任一塔展開詳細資訊，可直接在輸入框修改技能參數（如 burn.dot、hpPct.pct），修改後即時更新 eDPS。「↺」按鈕重置該技能的所有修改。</p>
  </div>
</div>
```

### D. Modal JS（在 `DOMContentLoaded` 內，`render()` 呼叫之前加入）

```javascript
// Help modal
document.getElementById('helpBtn').addEventListener('click', function() {
  document.getElementById('helpModal').classList.add('open');
});
document.getElementById('helpClose').addEventListener('click', function() {
  document.getElementById('helpModal').classList.remove('open');
});
document.getElementById('helpModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});
```

## 驗證方式

1. 開啟 dps-calc.html，確認 h1 右側出現「❓ 說明」按鈕
2. 點擊按鈕 → modal 出現，內容完整
3. 點擊 modal 外部或 ✕ → 關閉
4. 確認原有功能（排序/篩選/展開/adj）無異常
