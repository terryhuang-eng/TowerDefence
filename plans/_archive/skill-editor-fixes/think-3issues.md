# THINK: 三個 UX 問題分析

**日期**：2026-05-04

---

## 問題一：分數面板位置太下面

### 現狀
`renderEditor()` 的順序：
1. 基本屬性區
2. 技能配置區（所有技能行）
3. 分數面板（最後 append）

技能很多時，要滾很遠才看到分數。

### 解法：移到最上方 + 可收合

分數面板應該在最上方（基本屬性之前），
類似 scoreDefsPanel 有標題列可點擊展開/收合，預設**展開**。

```html
<div class="section score-section">
  <h3 class="score-section-header" onclick="toggleScoreSection()">
    📊 分數分析 <span id="score-toggle">▼</span>
  </h3>
  <div id="score-body">
    ...分數內容...
  </div>
</div>
```

**狀態持久**：全域變數 `let scoreExpanded = true`，
`buildScoreHtml(bd)` 讀取它決定 body 是否顯示。
`renderPanel()` 替換 `.score-section` 時，新 HTML 反映當前 `scoreExpanded` 狀態。

---

## 問題二：取消技能後 params 被重置

### 現狀
```js
// 取消：移除整個物件
unit.skills = unit.skills.filter(s => s.type !== type);

// 再勾：用預設值新建物件
unit.skills.push({ type, enabled: true, params: { ...defaults }, scoreWeight: 1.0 });
```

→ 每次取消再開，params 回到 defaults，用戶設好的數值全部消失。

### 解法：改用 enabled flag

不移除物件，只切換 `enabled`：

```js
if (checked) {
  const existing = unit.skills.find(s => s.type === type);
  if (existing) {
    existing.enabled = true;   // 已有物件 → 只開啟
  } else {
    unit.skills.push({ type, enabled: true, params: { ...defaults }, scoreWeight: 1.0 });
  }
} else {
  const sk = unit.skills.find(s => s.type === type);
  if (sk) sk.enabled = false;  // 關閉，保留 params
}
```

**渲染同步更新**：
- checkbox `checked`：`active && active.enabled`（不再只看 active 存在）
- input `disabled`：`!active || !active.enabled`
- `computeScoreBreakdown` 已用 `.filter(s => s.enabled)` ✓

---

## 問題三：weight 沒有反應

### 兩個子問題

#### A. onchange 在 blur 才觸發

`onchange` 需要使用者點別處才觸發。
改成 `oninput` → 每次輸入即時更新。

```js
// 修改 weight input 的事件：
onchange="updateSkillWeight(...)"
→ oninput="updateSkillWeight(...)"

// 同樣修改 skill params 的事件：
onchange="updateSkillParam(...)"
→ oninput="updateSkillParam(...)"
```

#### B. weight 的用途說明不清楚

目前只顯示 `weight:` 沒有任何說明。
應該加 title tooltip 說明用途：

```html
<label class="score-weight-label" title="此技能分數的個別乘數（1.0＝全額，0.5＝折半）">
  weight:<input ...>
</label>
```

### weight 與 scoreBase 的定位差異（供參考）

| | 作用範圍 | 使用時機 |
|--|---------|---------|
| **scoreBase** (⚙️ 技能評分基準) | 全部塔 | 調整整個技能類型的基準分值 |
| **weight** (per-tower) | 單個塔 | 同技能在不同塔強度不同時做個別微調 |

---

## 步驟清單

| 步驟 | 修改內容 |
|------|---------|
| step4.md | 分數面板移到頂部 + 可收合 |
| step5.md | toggleSkill 改用 enabled flag |
| step6.md | onchange → oninput + weight tooltip |

### 執行順序

`step4` → `step5` → `step6`（各自獨立，可分次執行）
