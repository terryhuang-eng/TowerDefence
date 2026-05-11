# sell-random-mode — 賣塔分級返還 + 隨機元素模式

## 設計規格

### 賣塔返還率
| 塔等級 | 一般返還率 | 隨機模式返還率 |
|--------|-----------|---------------|
| Lv1/2/3 | 100% | 100% |
| Lv4/5/6 | 80% | 100% |

### 隨機元素模式
- **觸發**：W3（第一次元素 pick，`totalPicks === 0`）新增「🎲 隨機」選項卡
- **選項卡文字**：「選擇後每次元素將隨機決定，賣塔全額 100% 返還」
- **點擊後**：`this.randomMode = true`，自動從 `getActiveKeys()` 隨機選一元素，套用與正常 pick 相同邏輯
- **後續 pick（W6/W9/W12）**：若 `randomMode` 為 true，略過 UI 直接自動隨機選元素
- **說明頁**：`buildRulesTab()` 補充說明

## 步驟清單

| # | 步驟 | 狀態 | 檔案 |
|---|------|------|------|
| step1 | 賣塔返還率分級（Lv1-3=100%，Lv4-6=80%） | ⬜ | js/game.js |
| step2 | 隨機模式狀態 + showElementScreen UI + 後續自動 pick | ⬜ | js/game.js |
| step3 | buildRulesTab 加入賣塔返還規則 + 隨機模式說明 | ⬜ | js/game.js |
