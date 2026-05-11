# step1 — js/config.js：加入 maxLv6Towers

## 目標

在 CONFIG 新增 `maxLv6Towers: 1`，作為全場 Lv6 塔數量上限的設定值。

## 影響檔案

`js/config.js`

## 修改位置

`gridCols` 附近（尾端數值區），加在 `totalWaves` 之後。

### 現有

```js
  gridCols: 20,
  gridRows: 10,
  totalWaves: 20,
};
```

### 修改後

```js
  gridCols: 20,
  gridRows: 10,
  totalWaves: 20,
  maxLv6Towers: 1,   // 全場最多允許的 Lv6 塔數量（0 = 禁用 Lv6）
};
```

## 執行步驟

1. Grep `totalWaves` → 確認行號
2. Read ±3 行確認 context
3. Edit 在 `totalWaves` 行後插入新行

## 注意

- `editData.config` 在 skill-editor.html 以 `...JSON.parse(JSON.stringify(CONFIG))` 初始化，
  加入後 step3 的 config 面板可直接讀取 `editData.config.maxLv6Towers`，無需額外初始化。
- `essenceLv6Threshold`、`essenceMilestones`、`essenceMilestoneBonus` **不需要加入 config.js**：
  它們僅用於精華里程碑獎勵（game.js line ~1092），目前以 undefined 靜默失效不影響主流程。
  若要修正里程碑可另立計畫，本次不處理。
