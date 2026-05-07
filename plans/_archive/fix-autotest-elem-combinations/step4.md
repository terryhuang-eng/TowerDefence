# Step 4: 修正 AI 第 4 次 pick 邏輯

## 目標
讓 AI 在已設定 aiThirdElem 時，W12 第 4 次 pick 有機率加 thirdElem，使三屬路線真正可用。

## 影響範圍
- **檔案**：`js/game.js`
- **位置**：`startWave()` 內的 AI 元素選擇區塊（約 1623–1625 行）
- **不影響**：W3/W6/W9 的 pick 邏輯、AI 升塔邏輯本身

## 問題根因

現行程式碼（約 1623–1625 行）：
```js
if (this.wave >= 12 && this.getTotalAiPicks() < 4) {
  this.aiElemPicks[this.aiBaseElem] = (this.aiElemPicks[this.aiBaseElem] || 0) + 1;
}
```

問題：
- AI 第 4 pick 永遠加 baseElem
- `aiThirdElem` 在 W9 時已設定（若有對應 TRIPLE_TOWERS）
- 但 W12 後 `aiElemPicks[aiThirdElem]` 仍只有 1，無法達到三屬 Lv5 條件
- AI 的 `getAiTowerData(lv=5)` 回傳的是 TRIPLE_TOWERS，但 picks 條件不滿足，升 Lv5 失敗

## 三屬升塔條件確認

`autotest.js` Bot.upgradeTowers Lv4→Lv5（約 300–315 行）：
```js
const e3 = ELEM_KEYS.find(e => e !== t.elem && e !== t.infuseElem && (g.elemPicks[e] || 0) >= 1);
```
只需第三元素 ≥ 1 pick 即可，所以 AI 也只需 thirdElem ≥ 1 就夠。
→ W9 時 aiThirdElem 已設且 aiElemPicks[thirdElem] = 1，**理論上已可升 Lv5**。

## 重新確認實際問題

再看 `game.js` AI 升塔邏輯中 Lv4→Lv5 部分：
```js
if (lv >= 6 && this.aiThirdElem === elem && inf === elem) { ... }  // Lv6 純屬
// Lv5 路線在 getAiTowerData 中：
if (lv === 5) {
  const key = this.getTripleKey(elem, inf, this.aiThirdElem);
  return TRIPLE_TOWERS[key]?.lv5;
}
```

問題點：若 W12 前 AI tower 已升到 Lv4，W12 後才有 thirdElem pick，但 aiTowerLevel 在 W13 才升到 5。
→ 這個時序是 OK 的。

**真正問題**：W12 第 4 pick 給 baseElem 而非 thirdElem，導致：
- aiElemPicks 分布如 fire=3, water=1（baseElem=fire, thirdElem=water, infuseElem=water）
- 這不影響三屬判斷（thirdElem ≥ 1 即可）

**→ Step 4 實際上影響的是 Lv6 純屬路線**：
- 純屬 Lv6 條件：`(this.elemPicks[t.elem] || 0) >= 3` AND `essencePerElem ≥ threshold`
- 現行 AI：baseElem 最終有 3 個 pick（W3+W6（50%）+W12），可走 Lv6
- 若 W12 改加 thirdElem：baseElem 可能只有 2 picks → AI 無法走 Lv6

## 修正方案（保守）

目標：W12 的第 4 pick 隨機選 thirdElem 或 baseElem（50/50），保留 Lv6 可能性的同時增加三屬多樣性：

```js
if (this.wave >= 12 && this.getTotalAiPicks() < 4) {
  // 若三屬路線可用，50% 機率加 thirdElem（確保 thirdElem 有 picks）
  // 另 50% 加 baseElem（保留純屬 Lv6 路線可能）
  const addElem = (this.aiThirdElem && Math.random() < 0.5)
    ? this.aiThirdElem
    : this.aiBaseElem;
  this.aiElemPicks[addElem] = (this.aiElemPicks[addElem] || 0) + 1;
}
```

## 影響說明

| 情況 | 修正前 | 修正後 |
|------|--------|--------|
| aiThirdElem 未設定 | 加 baseElem | 加 baseElem（不變）|
| aiThirdElem 已設定 | 固定加 baseElem | 50% 加 thirdElem / 50% 加 baseElem |
| AI Lv6 路線可能性 | 高（baseElem ≥ 3 機率高）| 中（baseElem ≥ 3 機率降低）|
| AI 三屬多樣性 | 無額外加成 | 略有提升（thirdElem picks 更均衡）|

## 注意事項
- 此修正是隨機性調整，不會讓 AI 行為完全固定
- 若要讓 AI 完全確定走三屬路線，需要更大幅改動（超出本 task 範圍）
- 修正後需重跑幾次 autotest 觀察 AI 行為變化
