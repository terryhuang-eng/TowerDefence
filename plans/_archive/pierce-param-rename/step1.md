# Step 1：js/skills.js — dmgUp→dmgDown + count 新增

## 目標檔案
`js/skills.js`

## 影響範圍
- SKILL_DEFS pierce：`defaults.dmgUp→dmgDown`，新增 `count`，修正 `scorePrimary`、`desc`
- `getSkillDesc()` case 'pierce'：參數名 + 文字方向修正 + count 顯示
- `getSkillBrief()` case 'pierce'：同上

---

## 修改說明

### A. SKILL_DEFS pierce 定義（約 L55）

修改前：
```javascript
pierce      : { category: 'tower', group: 'special', name: '穿透', defaults: {dmgUp:0.15}, desc: '穿透全路徑，每穿 +dmgUp', scoreBase: 60, scorePrimary: 'dmgUp', scoreRef: 0.15 },
```
修改後：
```javascript
pierce      : { category: 'tower', group: 'special', name: '穿透', defaults: {dmgDown:0.15, count:3}, desc: '直線穿透最多 count 體，每穿 −dmgDown 傷害', scoreBase: 60, scorePrimary: 'dmgDown', scoreRef: 0.15 },
```

### B. getSkillDesc() case 'pierce'（約 L138）

修改前：
```javascript
case 'pierce':   return '🌪️ 穿透：每穿 +' + Math.round(p.dmgUp * 100) + '%';
```
修改後：
```javascript
case 'pierce':   return '🌪️ 穿透：最多 ' + (p.count ?? 3) + ' 體，每穿 −' + Math.round(p.dmgDown * 100) + '%';
```

### C. getSkillBrief() case 'pierce'（約 L202）

修改前：
```javascript
case 'pierce':   return '穿透+' + Math.round(p.dmgUp * 100) + '%/體';
```
修改後：
```javascript
case 'pierce':   return '穿透×' + (p.count ?? 3) + '，−' + Math.round(p.dmgDown * 100) + '%/體';
```

---

## 驗證
- skill-editor 開啟含 pierce 塔 → 顯示 `dmgDown` 和 `count` 兩欄，tooltip 顯示「最多 N 體，每穿 −X%」
