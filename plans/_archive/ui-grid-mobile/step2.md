# Step 2：Mobile Send Bar Fix

## 目標
修正手機底部送兵列（`#mobile-hud`）不出現的問題。根本原因：`buildMobileHud()` 只在 `showUpgradePanel()` 內呼叫，但進入 pre_wave 狀態的主要路徑是 `showWavePreview()`，後者從未觸發 HUD 重建。

---

## 影響範圍

| 檔案 | 位置 | 動作 |
|------|------|------|
| `js/game.js` | `showWavePreview()` 方法末尾 | 新增 `this.buildMobileHud()` |

**不影響範圍：**
- 桌機版（`buildMobileHud()` 內有 `if (!_mq) return` 保護）
- `showUpgradePanel()` 的既有呼叫
- 任何遊戲邏輯

---

## 根本原因分析

```
波次結束 / 遊戲開始
  → state = 'pre_wave'
  → showWavePreview()     ← 只建立 wave-info sidebar 內容
     ❌ 沒有 buildMobileHud()   → 底部 HUD 空白 / hidden

點塔 → showUpgradePanel()
  → buildMobileHud()      ← 這才是唯一呼叫點
```

正確流程應為：

```
showWavePreview()
  → buildSidebar wave-info（現有）
  → this.buildMobileHud()  ← 加這行
     → if (!isMobileLayout()) return  → 桌機無影響
     → if (state !== 'pre_wave') return → 狀態保護
     → 建立金幣顯示 + 各兵種按鈕
```

---

## 實作重點

在 `showWavePreview()` 方法的最後一行程式碼之後（找到 method 的 `}` 前）加入：

```js
// 手機底部 HUD：進入 pre_wave 時重建送兵列
this.buildMobileHud();
```

### 定位方式

```
Grep "showWavePreview" → 找到 method 起始行
Read ±50 行確認 method 結尾
Edit：在最後一個 statement 後、`}` 前插入
```

`showWavePreview()` 目前在 game.js line ~1756，方法約 100 行。
執行前 Read line 1756–1870 確認結尾位置。

---

## 注意事項

- `buildMobileHud()` 內部已有完整的狀態保護：非 mobile layout → return；非 pre_wave → hide → return。不需要在外部再加條件。
- 此修正同時影響：初始進入 pre_wave（遊戲開始時）、每波結束後進入 pre_wave——兩個場景都會正確顯示。
- 若送兵列之前因 `showUpgradePanel()` 呼叫而建好內容，`buildMobileHud()` 會重新 build（innerHTML 清空重填），確保金幣和配額數字是最新的。
