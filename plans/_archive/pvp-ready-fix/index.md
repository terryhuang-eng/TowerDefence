# pvp-ready-fix — PVP 準備機制修正

## 問題摘要

| 項目 | 內容 |
|------|------|
| 現象 | 3 人對戰時，準備人數顯示不對（如停在 2/3），偶爾無法開始 |
| 根因 A | `onNetMsg 'ready'` 收到其他人 ready 後沒有呼叫 `showWavePreview()`，畫面計數器凍結在本人點擊當下 |
| 根因 B | 計數公式為 `readyPlayers.size / (alivePlayers.size - 1)`：分子排除自己（`readyPlayers` 只存其他人），分母也排除自己，導致最大顯示 `2/2` 而非直覺的 `2/3` |
| 影響 | 所有 PVP 波次銜接，每波都需按準備 |

## 追蹤記錄

### 關鍵確認（2026-05-13 分析）

- `readyPlayers`（Set）只存「其他人的 ID」，Host 自己透過 `myReady = true` 另外追蹤
- `checkAllReady()`：只有 Host 可觸發 `waveStart`；非 Host 進入後 `!isHost` 什麼都不做，等待 `waveStart` 訊息
- `waveStart` 廣播路徑：`netSend → pvpNet.broadcast → hostBroadcast → lobbyConns` ← 確認能到達所有 Guest
- Host 的 `ready` 廣播（`hostBroadcast`）**不會 loop back 給自己**，Host 自己靠 `myReady = true` 追蹤，正確
- 「永遠無法開始」很可能是**畫面凍結**讓用戶誤以為 stuck，邏輯上三人全 ready 後 Host 的 `checkAllReady()` 應能觸發

## 步驟清單

| 步驟 | 檔案 | 說明 | 風險 |
|------|------|------|------|
| [step1](step1.md) | `js/game.js` | 修正準備計數顯示（公式 + 即時刷新） | 低 |

## 驗證目標

- [ ] 3 人 PVP：按下準備後立即看到 `⏳ 1/3`
- [ ] 第 2 人按準備後，第 1 人畫面即時更新為 `⏳ 2/3`（不需重新點）
- [ ] 3 人全 ready → 顯示 `⏳ 3/3` → 波次自動開始
- [ ] 2 人 PVP 不受影響
