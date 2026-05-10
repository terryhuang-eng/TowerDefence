# multi-arrow：多重箭技能設計與實作

## 一、Chain vs Pierce 的相似性分析

用戶觀察正確——三者確實有架構上的相似：

| 比較面向 | chain | pierce | 多重箭（提案）|
|---------|-------|--------|------------|
| 觸發時機 | 每次攻擊 | 每次攻擊 | 每次攻擊 |
| 主目標傷害 | 100% | 100% | 100%（正常攻擊）|
| 副目標傷害 | 70% / 49%（decay^n）| 85% / 70%...（遞減）| 固定 ratio% |
| 目標選取 | 射程內 pathIdx 排序前 N | 直線方向篩選 | 射程內 pathIdx 排序前 shots-1 |
| 方向限制 | 無（任意跳躍）| 有（直線）| 無（任意）|

**三者的本質差異**：
- **chain**：「跳躍鏈」——依序跳到下一個目標，傷害指數衰減，targets 參數決定跳幾次
- **pierce**：「貫穿線」——方向固定，打直線上的所有敵人，傷害線性衰減
- **多重箭**：「分射扇」——同時射出多支箭，每支各打一個目標，傷害固定折損（不因順序遞減）

Chain 和 pierce 都是「主目標定義方向/起點，副目標依序處理」；多重箭是「同時射出，每支獨立」——這是核心差異。

---

## 二、確認設計決策

### 已確認
1. ✅ 加入多重箭技能
2. ✅ 參數 A = `ratio`（折損率，副目標傷害係數）
3. ✅ 參數 B = `shots`（總箭數，含主目標）

### 攻擊邏輯

```
主目標：正常攻擊，effDmg × 1.0（不折損）
副目標：shots-1 支額外箭，各打一個不同敵人，傷害 effDmg × ratio
```

**主目標不折損**的設計理由：
- 保持單體攻擊的「準心感」，多重箭是附加效果而非替換
- proc 效果（burn/chill/shred）對主目標仍正常觸發一次
- 數值直觀：shots=2, ratio=0.65 → DPS = 100% + 65% = 165% 分給 2 人

---

## 三、Proc 效果觸發分析

### 結論：多重箭的每支箭獨立觸發 proc

**現有多目標技能的 proc 行為**（doDmg 第三參數帶 `tower`）：

```js
// chain（game.js ~2905）
chainTargets.forEach((e, i) => {
  const chainDmg = Math.floor(effDmg * Math.pow(chainSk.decay, i + 1));
  this.doDmg(e, chainDmg, twDmgElem, tw);  // ← tw 傳入 → 每個跳躍目標都 proc
});

// pierce（game.js ~2862）
lineTargets.forEach((e, i) => {
  this.doDmg(e, Math.floor(effDmg * ratio), twDmgElem, tw);  // ← 每個穿透目標都 proc
});
```

→ **chain 跳躍到的每個敵人都觸發一次 proc；pierce 穿透的每個敵人也觸發一次 proc。**

多重箭遵循相同規則：每支箭呼叫 `doDmg(target, dmg, elem, tower)`，每個目標獨立觸發一次。

### Proc 觸發規則（doDmg 內部，game.js ~2414）

| proc 技能 | 觸發條件 | 多重箭行為 |
|---------|---------|----------|
| burn（灼燒）| 有 burn 技能且 tower 存在 | 每支箭的目標獨立疊 burn |
| chill（冰冷）| 有 chill 技能且 tower 存在 | 每支箭的目標獨立疊 chill 層 |
| shred（碎甲）| 有 shred 技能且 tower 存在 | 每支箭的目標獨立疊 shred 層 |
| vuln（易傷）| 有 vuln 技能且 tower 存在 | 每支箭的目標獨立疊 vuln 層 |
| ignite（引燃）| burn 覆蓋時觸發 | 只有副目標已有 burn 時才觸發 |
| detonate（引爆）| burnStacks ≥ 3 | 只有副目標已疊 3 層 burn 時才觸發 |

### 關鍵：同一攻擊不會雙重 proc 同一目標

多重箭的每支箭打不同目標（`filter(e => e !== target)`），所以不會有「同一個敵人被同一次攻擊 proc 兩次」的問題。

**與 procMinInterval 的關係**：
- `procMinInterval = 0.3s` 目前未實作
- 多重箭 + chill 在高攻速下的影響：atkSpd 2.0 × shots 2 = 每秒對 2 個目標各疊 2 次 chill
  → 等同於有兩座 atkSpd 2.0 的冰塔同時攻擊，強但不失控
- **不需要因多重箭而特別實作 procMinInterval**（chain/pierce 已有相同問題）

---

## 四、預設數值建議

```
multiArrow: {
  shots: 2,      // 總箭數（含主目標），有效範圍 2~4
  ratio: 0.65,   // 副目標傷害係數，主目標不折損
}
```

**DPS 倍率**：`1.0 + (shots-1) × ratio`
| shots | ratio | DPS 倍率 | 說明 |
|-------|-------|---------|------|
| 2 | 0.65 | 1.65× | 主 + 一支副 |
| 3 | 0.55 | 2.10× | 主 + 兩支副 |
| 3 | 0.65 | 2.30× | 主 + 兩支副（較強）|

推薦預設：shots=2, ratio=0.65（保守起步，實測後調整）

**scoreBase**：45（比 chain=30 高，因每次攻擊必觸發；比 multishot=40 略高）

---

## 五、步驟清單

| # | 步驟 | 修改檔案 |
|---|------|---------|
| 1 | [step1.md](step1.md) | `js/skills.js`：加 multiArrow 定義 + desc + label |
| 2 | [step2.md](step2.md) | `js/game.js`：實作多重箭攻擊邏輯 |
