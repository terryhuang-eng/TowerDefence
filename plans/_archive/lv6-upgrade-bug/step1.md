# step1 — 修復 maxTowerLevel 的 canLv6 條件

## 目標

移除 `maxTowerLevel` 中 `canLv6` 對精華門檻的依賴，讓「路線存在」與「能否立即升」分離。

## 影響檔案

`js/game.js`

## 修改位置

`maxTowerLevel(t)` 函數，`js/game.js` line ~391

### 現有程式碼

```js
if (t.infuseElem === t.elem) {
  const picks = this.elemPicks[t.elem] || 0;
  const canLv6 = picks >= 3 &&
                 (this.essencePerElem[t.elem] || 0) >= CONFIG.essenceLv6Threshold &&
                 PURE_TOWERS[t.elem];
  if (canLv6) return 6;
  const canLv5 = picks >= 2 && PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5;
  if (canLv5) return 5;
}
```

### 修改後

```js
if (t.infuseElem === t.elem) {
  const picks = this.elemPicks[t.elem] || 0;
  const canLv6 = picks >= 3 && PURE_TOWERS[t.elem];   // ← 移除精華門檻
  if (canLv6) return 6;
  const canLv5 = picks >= 2 && PURE_TOWERS[t.elem] && PURE_TOWERS[t.elem].lv5;
  if (canLv5) return 5;
}
```

## 確認精華門檻的正確位置

修改後，精華門檻仍在以下兩處正確控制升級：

| 位置 | 作用 | 現況 |
|------|------|------|
| `line ~1059` `btn.style.opacity` | 精華不足時按鈕半透明 | ✅ 正確 |
| `line ~1069` `btn.onclick` | `if (!hasEss) return` 阻止點擊 | ✅ 正確 |
| `line ~982` `line ~992`（Lv4→Lv6 direct 路徑）| 同上 | ✅ 正確 |

## 執行步驟

1. Grep `canLv6 = picks >= 3` → 確認行號
2. Read ±5 行確認 context
3. Edit 移除 `&& (this.essencePerElem[t.elem] || 0) >= CONFIG.essenceLv6Threshold`
4. 驗證：同函數中 `canLv5` 行不動

## 預期效果

| 場景 | 修復前 | 修復後 |
|------|--------|--------|
| Lv5 純屬，picks=3，精華=50 | 「已達目前最高等級」❌ | Lv6 按鈕（半透明，顯示精華不足 50/100）✅ |
| Lv5 純屬，picks=3，精華=100 | 正常（精華剛好夠，原本可能碰巧 ok）| Lv6 按鈕（可點擊）✅ |
| Lv5 純屬，picks=2，精華=任意 | 「已達目前最高等級」→ 正確（2 picks 不夠 Lv6）| 不變 ✅ |
| Lv5 三屬（thirdElem 已設定）| 「已達最高等級（三屬 Lv5）」 | 不變 ✅ |
