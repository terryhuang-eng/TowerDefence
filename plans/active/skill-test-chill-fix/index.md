# skill-test-chill-fix — chill 衰減測試數值修正

## 根本原因

`skill-test.html` 的 chill 衰減測試寫死假設 `chillDecayRate=15`，但 `skills.js` 的 `GLOBAL_CAPS.chillDecayRate = 6`（MockGame 直接讀取真實 GLOBAL_CAPS）。

**代碼值是正確的（6）**，測試預期值過時，需更新測試。

## 失敗清單

| 測試名稱 | 假設 rate | 實際 rate | 狀態 |
|---------|-----------|-----------|------|
| `decay 15 stacks/s after 1s` | 15 | 6 | ❌ expected 15, got 24 |
| `chillDecay 餘量正確（整數批次）` | comment 寫 15 | 6 | ⚠️ assertion 過，comment 錯 |
| `小步長衰減使用 floor` | dt=0.067 在 rate=15 才夠 | rate=6 需更大 dt | ❌ expected 29, got 30 |

## 正確數值推導（rate=6）

**Test 1**：dt=1.0 → decayStacks = floor(1.0×6) = 6 → remain = 30-6 = **24**

**Test 2**（floor 門檻）：
- 閾值：accumulated >= 1/6 ≈ 0.167s
- dt1=0.16：floor(0.16×6)=floor(0.96)=0 → 無衰減，stacks=30 ✓
- dt2=0.01：accumulated=0.17，floor(0.17×6)=floor(1.02)=1 → 衰減 1 → stacks=**29** ✓

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 修正三處測試數值/dt/comment | ⬜ | skill-test.html |
