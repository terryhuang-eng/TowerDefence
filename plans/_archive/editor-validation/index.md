# 計畫：Editor 驗證警示 + PVP 版本同步

## 目標
1. **elemAdv 警示**：設定頁的克制矩陣旁，自動偵測結構性問題並紅字提示
2. **波次抗性警示**：波次怪頁中，偵測無效/非啟用元素抗性並紅字標記
3. **PVP 版本同步**：skill-editor 匯出時埋入版本字串；PVP 大廳即時比對所有玩家版本

---

## 架構概覽

```
[skill-editor 設定頁]
  └── elemAdv 矩陣下方 → validateElemAdv() → 紅字警示清單

[skill-editor 波次頁]
  └── 波次列表項目 → 小紅點標記
  └── 右側編輯面板 → 詳細警示文字

[skill-editor 匯出]
  └── 任何匯出觸發 → 產生 dataVersion (timestamp)
  └── 所有匯出檔案嵌入 dataVersion（config.js 作為主要版本源）

[game.js PVP 大廳]
  └── lobbyJoin 訊息帶 dataVersion
  └── lobbyUpdate 廣播帶各玩家版本
  └── updateLobbyUI → 版本比對 → ⚠️ 紅字警告
```

---

## 步驟清單

| 步驟 | 檔案 | 內容 |
|------|------|------|
| step1.md | skill-editor.html | `validateElemAdv()` 函數 + 設定頁警示 UI **⚠️ 暫緩（等待 elem-vs-class-design 決策）** |
| step2.md | skill-editor.html | 波次列表紅點 + 編輯面板抗性警示 |
| step3.md | skill-editor.html + js/game.js | 匯出時埋入 dataVersion + PVP 大廳版本比對 |

---

## 依賴關係
- step1 依賴 `elem-vs-class-design` 設計決策：確定使用克制關係才執行，否則跳過
- step2/step3 依賴 elem-filter-editor/step1（`getActiveElems()` 需已存在）
- step2 和 step3 互相獨立，可並行

---

## 驗證清單
- [ ] 設定頁：全 6 元素且克制關係正常 → 無警示
- [ ] 設定頁：移除某元素克制關係 → 出現「無法被克制」紅字
- [ ] 設定頁：克制指向未啟用元素 → 出現「克制無效」橙字
- [ ] 波次頁：W7 固定抗性含未啟用元素 → 列表紅點 + 面板警示
- [ ] 波次頁：random resist → 面板提示「將從啟用元素中選取」
- [ ] 匯出 config.js 後開啟 → 看到 `dataVersion: '...'`
- [ ] 兩個 PVP 視窗使用同版本 config.js → 大廳顯示 ✅
- [ ] 兩個 PVP 視窗版本不同 → 大廳顯示 ⚠️ 紅字，Host 才能看到全員狀態
