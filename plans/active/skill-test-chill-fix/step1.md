# step1 — 修正三處 chill 衰減測試

## 影響範圍

- **唯一修改**：`skill-test.html`，三處（line ~1318 / ~1326 / ~1334）

---

## 修改 A — Test 1：expected 值 + comment（line ~1318）

```
舊：
  test('chill: tickEnemy 每秒衰減 chillDecayRate 層', () => {
    // chillDecayRate=15，1秒後：floor(1.0*15)=15 層衰減
    ...
    assertEqual(enemy.chillStacks, 15, 'decay 15 stacks/s after 1s');

新：
  test('chill: tickEnemy 每秒衰減 chillDecayRate 層', () => {
    // chillDecayRate=6，1秒後：floor(1.0*6)=6 層衰減，remain=30-6=24
    ...
    assertEqual(enemy.chillStacks, 24, 'decay 6 stacks/s after 1s');
```

---

## 修改 B — Test 2：comment 修正（line ~1326，assertion 不變）

```
舊：
  // 1.0s：decayStacks=15，chillDecay=1.0-15/15=0

新：
  // 1.0s：decayStacks=floor(1.0*6)=6，chillDecay=1.0-6/6=0
```

---

## 修改 C — Test 3：dt 值 + comment（line ~1334）

```
舊：
  // dt=0.06s：chillDecay=0.06, decayStacks=floor(0.06*15)=floor(0.9)=0
  game.tickEnemy(enemy, 0.06);
  assertEqual(enemy.chillStacks, 30, 'sub-threshold dt: no decay yet');
  // dt=0.067：chillDecay=0.067, floor(0.067*15)=floor(1.005)=1 → 1 層衰減
  game.tickEnemy(enemy, 0.067);
  assertEqual(enemy.chillStacks, 29, '1 stack decays at floor threshold');

新：
  // dt=0.16s：chillDecay=0.16, decayStacks=floor(0.16*6)=floor(0.96)=0
  game.tickEnemy(enemy, 0.16);
  assertEqual(enemy.chillStacks, 30, 'sub-threshold dt: no decay yet');
  // dt=0.01：累積 chillDecay=0.17, floor(0.17*6)=floor(1.02)=1 → 1 層衰減
  game.tickEnemy(enemy, 0.01);
  assertEqual(enemy.chillStacks, 29, '1 stack decays at floor threshold');
```

---

## 驗證

skill-test.html 重新開啟，chill 區段三個測試全部顯示 ✅。
