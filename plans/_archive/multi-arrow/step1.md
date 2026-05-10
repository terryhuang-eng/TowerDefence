# Step 1：skills.js 加入 multiArrow 定義

## 修改點（共 3 處，均在 js/skills.js）

---

### 修改點 A：SKILL_DEFS 加 multiArrow 條目

**定位**：`Grep "multishot.*category"` → 找到行號 → Read ±1 行確認

在 `multishot` 那行**之後**插入：

```js
  multiArrow  : { category: 'tower', group: 'special', name: '多重箭', defaults: {shots:2,ratio:0.65}, desc: '每次攻擊同時射 shots 支箭，副目標各 ×ratio 傷害', scoreBase: 45, scorePrimary: 'shots', scoreRef: 2 },
```

---

### 修改點 B：skillDesc 加 multiArrow case

**定位**：`Grep "case 'multishot': return.*三連射"` → 找到行號 → Read ±1 行確認

在 `multishot` case **之後**插入：

```js
      case 'multiArrow': return `🏹 多重箭：同時射 ${p.shots} 支，副目標各 ${Math.round(p.ratio * 100)}% 傷害`;
```

---

### 修改點 C：skillShort 加 multiArrow case

**定位**：`Grep "case 'multishot': return.*連射"` → 找到行號（skillShort 區段）→ Read ±1 行確認

在 multishot 的 short label **之後**插入：

```js
      case 'multiArrow': return `多重箭×${p.shots}`;
```

---

## 驗證

開啟 skill-editor.html → 在任意塔手動加入 multiArrow 技能 → 確認技能說明顯示「🏹 多重箭：同時射 2 支，副目標各 65% 傷害」
