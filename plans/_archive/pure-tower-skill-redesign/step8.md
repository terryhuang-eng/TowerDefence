# Step 8：index.html — showSkillRef() 說明頁同步

## 目標
更新 `showSkillRef()` 函數（位於 index.html 末尾的 `<script>` 區塊），使說明頁反映所有新技能與異動。

## 改動位置
`index.html`，靠近末尾的 `showSkillRef()` 函數

---

## 需要同步的異動

| 技能 | 狀態 | 說明頁需要做什麼 |
|------|------|----------------|
| wealthScale | 新增 | 加入 damage 或 special 群組說明 |
| interest | 新增 | 加入 special 群組說明 |
| ramp | 行為改變 | 更新說明，提及切換衰減（不歸零） |
| frostbite | 廢棄 | 加 ⚠️ [廢棄] 前綴，或移到獨立廢棄區塊 |
| detonate | 歸屬調整 | 說明調整為「LV6 純火專屬簽名技能」|

---

## 改動一：新增 wealthScale 說明卡片

### 定位
Grep `showSkillRef\|skillRefContent\|case.*killGold` 找到 special 群組的技能說明區段。

在 killGold、unstable、permaBuff 的卡片之後加入：

```js
// wealthScale
`<div class="skill-card">
  <div class="skill-name">💰 財富積累 <span class="skill-group">special</span></div>
  <div class="skill-desc">
    <b>當前持有金幣轉化傷害</b><br>
    持有每 <b>divisor</b> g = +1 傷害，上限 +<b>cap</b>。<br>
    花錢升塔後傷害<b>即時下降</b>，金幣回收後恢復。<br>
    純無 LV5 獨有。
  </div>
</div>`,

// interest
`<div class="skill-card">
  <div class="skill-name">📈 利息 <span class="skill-group">special</span></div>
  <div class="skill-desc">
    <b>每波戰鬥結算時依持有金幣直接加金</b><br>
    bonus = min(floor(持有金幣 × <b>rate</b>), <b>cap</b>)<br>
    基準為 income 入帳後、pre_wave 開始前的金幣快照。<br>
    純無 LV6 獨有。場上有純無塔則觸發，多塔不疊加。
  </div>
</div>`,
```

---

## 改動二：更新 ramp 說明卡片

### 定位
Grep `越攻越快\|ramp` 在 showSkillRef 函數內找到 ramp 的說明卡片。

### 更新說明文字
```
連續攻擊同一目標，每次 +perHit 攻速加成（上限 +cap）。
切換目標時扣 switchLoss 層（不歸零），維持動量感。
快速清群時 ramp 幾乎不損失；停止攻擊或 Boss 戰後才全速建立。
```

---

## 改動三：frostbite 標記廢棄

### 定位
Grep `凍傷\|frostbite` 在 showSkillRef 函數內找到 frostbite 說明卡片。

### 更新
在卡片標題加上廢棄標記：
```html
<div class="skill-name">🧊 凍傷 <span class="skill-group deprecated">⚠️ 廢棄</span></div>
<div class="skill-desc">
  <b>⚠️ 此技能已廢棄，不再分配給純屬塔</b>（功能與 %HP傷害 高度重疊）。<br>
  命中後每秒造成 dmgPct×maxHP 水系傷害，持續 dur 秒。不疊加、不延長。
</div>
```

---

## 改動四：detonate 說明更新

### 定位
Grep `引爆\|detonate` 在說明卡片內找到 detonate。

### 更新說明末尾
加入一行：
```
純火塔 LV6 才解鎖引爆，LV5 只有灼燒+引燃。
```

---

## 改動五：CSS 加入廢棄樣式（若未存在）

Grep `.deprecated` 確認是否有此 class，若無則在 showSkillRef 的 `<style>` 區塊加入：

```css
.skill-group.deprecated { background: #555; color: #aaa; text-decoration: line-through; }
```

---

## 驗證方式
- 開啟遊戲主畫面，點「📖 技能說明」
- Tab1（塔技能）→ special 群組出現「💰 財富積累」和「📈 利息」
- ramp 說明提及「切換目標扣層，不歸零」
- frostbite 顯示廢棄標記
- detonate 說明提及 LV6 才解鎖
