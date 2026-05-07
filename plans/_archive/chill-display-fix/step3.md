# Step 3：skill-editor.html — 清除 chill scorePrimary 死碼

## 目標檔案
`skill-editor.html`

## 定位

Grep: `scorePrimary === 'cap'` 找行號（約 190）

## 修改

舊（約行 189-193）：
```js
const refInfo = sk.scorePrimary
  ? (sk.scorePrimary === 'cap' && sk.key === 'chill'
      ? `cap（層數上限）/ ${sk.scoreRef}`
      : `${sk.scorePrimary} / ${sk.scoreRef}`)
  : '固定';
```
新：
```js
const refInfo = sk.scorePrimary
  ? `${sk.scorePrimary} / ${sk.scoreRef}`
  : '固定';
```

## 說明
chill 的 scorePrimary 已是 'stacksPerHit'，原本的 'cap' 分支永遠不會觸發，直接移除。
