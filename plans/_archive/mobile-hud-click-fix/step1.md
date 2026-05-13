# step1 — 擴展 mobile media query 涵蓋橫向

## 目標

將所有手機偵測從 `(max-width: 768px)` 改為同時涵蓋橫向手機的複合條件。

**新條件字串（JS 常數）：**
```
'(max-width: 768px), (max-height: 430px) and (orientation: landscape)'
```

## 影響範圍

- `index.html`：`@media (max-width: 768px)` 改為複合條件
- `js/game.js`：三處 `matchMedia('(max-width: 768px)')` 全部替換

---

## index.html — CSS @media 條件

```
舊：
@media (max-width: 768px) {

新：
@media (max-width: 768px), (max-height: 430px) and (orientation: landscape) {
```

---

## js/game.js — 三處 matchMedia

### 修改 A — initGrid() line ~558

```
舊：
    if (window.matchMedia('(max-width: 768px)').matches) {

新：
    if (window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches) {
```

### 修改 B — buildMobileHud() line ~1105

```
舊：
    if (!hud || !window.matchMedia('(max-width: 768px)').matches) return;

新：
    if (!hud || !window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches) return;
```

### 修改 C — showTowerActionPopup() line ~1285

```
舊：
    if (!window.matchMedia('(max-width: 768px)').matches) return;

新：
    if (!window.matchMedia('(max-width: 768px), (max-height: 430px) and (orientation: landscape)').matches) return;
```

---

## 驗證

- 手機直向（375px wide）：HUD 顯示，Ready 可點 ✓
- 手機橫向（932px wide，430px tall）：HUD 顯示，Ready 可點 ✓（原先失效）
- iPad 橫向（1024×768）：不觸發（height=768 > 430，width=1024 > 768）✓
- 桌機（1280px）：不觸發 ✓
