# Step 1：elemAdv 克制矩陣警示

> ⚠️ **條件依賴**：此步驟是否實作，取決於 `elem-vs-class-design` 設計決策。
> 若最終確定採用「無克制」方向（elemAdv 清空），本步驟不需執行。
> 決策未定案前，本步驟**暫緩**。

## 前置條件
elem-filter-editor/step1 已執行（`getActiveElems()` 已存在）

## 目標檔案
`skill-editor.html`

## 影響範圍
- 新增 `validateElemAdv()` 函數
- `renderConfigPanel()` 在 elemAdv 矩陣之後插入警示 UI

---

## 修改說明

### A. 新增 `validateElemAdv()` 函數

**定位**：在 `setElemAdv()` 函數（約 L1467）**之前**插入

```javascript
/**
 * 檢查 elemAdv 對目前 activeElems 的完整性
 * 回傳 { errors: string[], warnings: string[] }
 * errors（紅）：嚴重結構問題（元素無法被克制 / 無法克制任何人）
 * warnings（橙）：非嚴重但無意義的設定（指向非啟用元素的克制）
 */
function validateElemAdv() {
  const active = getActiveElems();
  const adv = editData.config.elemAdv || {};
  const errors = [];
  const warnings = [];

  for (const a of active) {
    // 找出 a 克制的啟用元素（adv > 1）
    const dominated = active.filter(d => (adv[a]?.[d] ?? 1) > 1);
    // 找出克制 a 的啟用元素
    const dominators = active.filter(s => (adv[s]?.[a] ?? 1) > 1);

    if (dominated.length === 0) {
      errors.push(`${ELEM[a].icon} ${ELEM[a].name} 無法克制任何啟用元素（攻擊無優勢）`);
    }
    if (dominators.length === 0) {
      errors.push(`${ELEM[a].icon} ${ELEM[a].name} 無法被任何啟用元素克制（防禦無弱點）`);
    }
  }

  // 找出指向非啟用元素的克制關係
  for (const [atk, advMap] of Object.entries(adv)) {
    if (!active.includes(atk)) continue; // 攻擊方未啟用，忽略
    for (const [def, val] of Object.entries(advMap)) {
      if (val > 1 && !active.includes(def)) {
        warnings.push(`${ELEM[atk]?.icon || atk} → ${ELEM[def]?.icon || def} ${def} 的克制無效（${def} 未啟用）`);
      }
    }
  }

  return { errors, warnings };
}
```

### B. `renderConfigPanel()` — 在 elemAdv 矩陣之後插入警示

**定位**：找到 elemAdv 矩陣的結尾 `</table></div>` HTML 段（約 L1457-1465 的結束位置）

在 elemAdv 區塊的 `</div>` 之後，加入：
```javascript
// === 克制關係驗證警示 ===
const validation = validateElemAdv();
if (validation.errors.length > 0 || validation.warnings.length > 0) {
  html += '<div style="margin-top:8px;padding:8px;background:#2a1010;border:1px solid #c44;border-radius:4px;">';
  html += '<div style="color:#ffd93d;font-size:11px;font-weight:bold;margin-bottom:4px;">⚠️ 克制關係問題</div>';
  for (const err of validation.errors) {
    html += `<div style="color:#e94560;font-size:11px;margin-bottom:2px;">🔴 ${err}</div>`;
  }
  for (const warn of validation.warnings) {
    html += `<div style="color:#ff9f43;font-size:11px;margin-bottom:2px;">🟠 ${warn}</div>`;
  }
  html += '</div>';
} else {
  html += '<div style="margin-top:8px;color:#4c4;font-size:11px;">✅ 克制關係完整</div>';
}
```

---

## 警示邏輯說明

| 情境 | 嚴重度 | 範例訊息 |
|------|--------|---------|
| 元素無法克制任何人 | 🔴 error | 「🌪️ 風 無法克制任何啟用元素」 |
| 元素無法被任何人克制 | 🔴 error | 「⚡ 雷 無法被任何啟用元素克制」 |
| 克制指向未啟用元素 | 🟠 warning | 「🔥→⛰️ 土 的克制無效（土未啟用）」 |
| 全部正常 | ✅ 綠色 | 「克制關係完整」 |

---

## 驗證

**正常案例（3 元素三角）**：
- activeElems = ['fire', 'water', 'wind']
- elemAdv: fire→water ×1.3, water→wind ×1.3, wind→fire ×1.3（各被剋 × 0.7 也設定好）
- → 顯示 ✅

**問題案例 1（破環）**：
- activeElems = ['fire', 'water', 'wind']
- 把 wind→fire 刪掉
- → 火：無法被任何啟用元素克制 🔴

**問題案例 2（跨元素）**：
- activeElems = ['fire', 'water', 'wind']
- elemAdv 中 fire→earth 仍存在（earth 未啟用）
- → 🟠 火→土的克制無效（土未啟用）
