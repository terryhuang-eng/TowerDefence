# sandbox-record-speed8 — 記錄按鈕 + 8x 速度

## 需求

1. **8x 速度**：速度列加第四個選項
2. **記錄按鈕**：快照當前 sandbox 設定，顯示在面板內（保留最近 5 筆）

## 設計決策

### 8x 速度
在現有 `1x / 2x / 4x` 列後直接加 `8x`。
既有 `querySelectorAll('.sb-speed-btn')` 事件監聽會自動涵蓋新按鈕，不需額外 JS。

### 記錄按鈕（快照）
按下後抓取當前狀態，以時間戳 + 設定值顯示在面板底部的 `#sbRecordLog`（最多 5 筆）。

**記錄的欄位**：
| 欄位 | 來源 |
|------|------|
| 波次 | `g.wave + 1`（當前波，若無遊戲則 N/A） |
| HP/數量倍率 | `SANDBOX.hpMult` / `SANDBOX.countMult` |
| 無限血量 | `SANDBOX.infHP` |
| AI 派兵 | `!SANDBOX.noAiSend` |
| 遊戲速度 | `g.gameSpeed`（或 active-speed 按鈕） |
| 元素解鎖 | `g.elemPicks`（各元素層數） |

顯示格式（每筆一行）：
```
[W5] HP1x Cnt1x Spd:2x 🔥×2💧×1 infHP:off
```

---

## 步驟

| 步驟 | 內容 | 檔案 |
|------|------|------|
| step1 | 8x 速度按鈕（HTML）+ 記錄按鈕 + log 區塊（HTML）+ JS 邏輯 | `index.html` |

單步完成。
