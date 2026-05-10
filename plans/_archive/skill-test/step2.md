# Step 2：直接傷害修飾類技能測試

## 目標
驗證 doDmg 中影響最終傷害數值的技能計算是否正確。

## 技能列表
`unstable`, `execute`, `shred`（護甲穿透）, `vulnerability`（易傷），`hpPct`, `fortify`, `resilient`, `dodge`

## 測試案例

### unstable（variance 隨機浮動）
```
tower.skills = [makeSkill('unstable', {variance: 0.5})]
enemy.hp = 1000
執行 1000 次 doDmg(enemy, 100)
每次 dmg 獨立計算（不累積）
→ assert: min dmg ≥ 50, max dmg ≤ 150
→ assert: mean dmg ≈ 100 ±5（機率測試，容忍 ±5）
```

### execute（低 HP 加倍）
```
tower.skills = [makeSkill('execute', {threshold: 0.2, mult: 2})]

案例 A: enemy.hp=80, maxHp=100（HP 80%，高於門檻）
doDmg(enemy, 50) → finalDmg = 50
assert: enemy.hp == 30

案例 B: enemy.hp=15, maxHp=100（HP 15%，低於門檻 20%）
doDmg(enemy, 50) → finalDmg = 100
assert: enemy.hp == -85（即 15-100）
```

### shred（碎甲減護甲）
```
enemy.armor = 0.5, enemy.shredStacks = 0
tower.skills = [makeSkill('shred', {stacksPerHit: 2})]

第一次 doDmg(enemy, 100)：
→ 先扣直接傷害（armor=0.5 → dmg=50）
→ 然後 shredStacks += 2

第二次 doDmg(enemy, 100)：
→ shredAmt = 2 * 0.005 = 0.01
→ armor = max(0, 0.5 - 0.01) = 0.49
→ dmg = 100 * (1 - 0.49) = 51

驗證：
→ 命中後 enemy.shredStacks == 2
→ 第二次傷害 > 第一次傷害（護甲被部分削除）
→ shredStacks=120時 shredAmt = 0.6，與 armor=0.5 計算後 armor 不為負（max 0）
```

### vulnerability（易傷增傷）
```
enemy.vulnStacks = 0
tower.skills = [makeSkill('vulnerability', {stacksPerHit: 5})]

doDmg(enemy, 100)：
→ vulnStacks += 5，但此次 doDmg 對 vulnStacks 的施加在傷害計算之後
  （檢查 game.js 順序：vuln 計算在 shred 之後，POST-damage 施加？或 PRE？）

⚠️ 關鍵檢查點：
查看 game.js doDmg 中 vulnAmt 計算時機：
- 2382行：vulnAmt = enemy.vulnStacks * GLOBAL_CAPS.vulnPerStack
- 2383行：if (vulnAmt > 0) dmg *= (1 + vulnAmt)
- 2480行：POST-damage: vulnSk → enemy.vulnStacks += stacksPerHit

→ 結論：同一次攻擊的 vuln 疊層「在此次傷害計算之後」才生效
→ 第一次 doDmg 時 vulnStacks=0，傷害未放大
→ 第二次 doDmg 時 vulnStacks=5，dmg *= (1 + 5*0.02) = × 1.1

驗證：
assert: 第一次 dmg == 100
assert: 第二次 dmg ≈ 110（±1 誤差允許 floor）
```

### hpPct（每 N 次附加 %maxHP）
```
tower.skills = [makeSkill('hpPct', {pct: 0.05, every: 3, cd: 0.5, cap: 200})]
enemy.maxHp = 1000

atkCount=0: doDmg → atkCount=1（0 % 3 == 0 成立？）
⚠️ 關鍵：game.js 2487行：if (tower.atkCount % hpPctSk.every === 0)
  tower.atkCount 在哪裡遞增？（搜尋 atkCount++）

先確認 atkCount 遞增位置再寫測試。

預期行為：
- atkCount = 0, 3, 6, ... 時觸發
- 觸發時 enemy.hp -= min(1000*0.05, 200) = min(50, 200) = 50
- CD：同一目標 0.5s 內不再觸發
- 測試：連續 3 次攻擊，第 3 次（atkCount=2 之後到3時？）應觸發
```

### fortify（單次傷害上限）
```
enemy.skills = [makeSkill('fortify', {dmgCap: 30})]
doDmg(enemy, 100) → finalDmg = min(100, 30) = 30
assert: enemy.hp == 70

doDmg(enemy, 20) → finalDmg = min(20, 30) = 20
assert: enemy.hp == 50（未被 fortify 截斷）
```

### resilient（累積減傷）
```
enemy.skills = [makeSkill('resilient', {stack: 0.02, cap: 0.4})]
enemy._resilientReduction = 0

⚠️ 關鍵：resilient 的 _resilientReduction 在哪裡疊加？
搜尋 game.js 中 resilient 的邏輯... 2391行只有讀取，但疊加邏輯需要搜尋。

若疊加邏輯在 doDmg 內（post-damage）：
第1次 doDmg(100) → finalDmg = 100（reduction=0），然後 reduction += 0.02
第2次 doDmg(100) → finalDmg = 98（reduction=0.02）
...

驗證減傷上限：reduction 不超過 0.4
```

### dodge（閃避）
```
enemy.skills = [makeSkill('dodge', {chance: 0.5})]
執行 1000 次 doDmg(enemy, 10)
→ 約 500 次完全不扣血，500 次各扣 10
→ assert: 總傷害在 4000～6000 範圍
```

## 執行前置

先在 game.js 中確認以下函數呼叫順序（Grep 定位）：
1. `atkCount` 遞增位置（攻擊前/後？）
2. `resilient` 疊加邏輯
3. `vuln` 施加時機（pre 還是 post damage）

這些時機差異決定測試的期望值設定。
