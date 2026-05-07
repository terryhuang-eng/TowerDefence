# Step 3：towers.js — 全部 makeSkill('chill') 換成 stacksPerHit

## 目標
將所有 `makeSkill('chill',{perStack:X, cap:Y})` 改為 `makeSkill('chill',{stacksPerHit:N})`

**只改 `js/towers.js`，共 20 處。**

---

## 換算原則

global chillPerStack = 0.02（每層 -2%）

```
舊 perStack → stacksPerHit 建議
0.01  →  1（弱冰冷副技能，維持 1）
0.02  →  1（基準）
0.03  →  2（中等，加速疊層）
0.04  →  2（接近 0.03）
0.5   →  5（深寒，純水 lv4 特色，AOE 快速疊層）
```

lv5/lv6 純水塔另外考慮（見下表）

---

## 完整換算表（建議值，可調整）

| 行號 | 塔名 | 現況 | 建議改為 |
|-----|------|------|---------|
| 175 | 深寒 lv4 | perStack:0.5, cap:40 | **stacksPerHit:5** |
| 179 | 泥沼塔（水底） lv4 | perStack:0.02, cap:40 | stacksPerHit:1 |
| 201 | 泥沼塔（土底） lv4 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 217 | 重力塔（土底） lv4 | perStack:0.04, cap:50 | stacksPerHit:2 |
| 227 | 暴雨塔（風底） lv4 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 253 | 感電塔（雷底） lv4 | perStack:0.01, cap:20 | stacksPerHit:1 |
| 279 | 虛空泉（無底） lv4 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 283 | 重力塔（無底） lv4 | perStack:0.04, cap:50 | stacksPerHit:2 |
| 310 | 颶風塔 lv5 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 314 | 間歇塔 lv5 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 330 | 沼澤塔 lv5 | perStack:0.03, cap:50 | stacksPerHit:2 |
| 338 | 暴風塔 lv5 | perStack:0.02, cap:40 | stacksPerHit:1 |
| 350 | 逆雷塔 lv5 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 354 | 逆焰塔 lv5 | perStack:0.02, cap:30 | stacksPerHit:1 |
| 358 | 逆潮塔 lv5 | perStack:0.03, cap:40 | stacksPerHit:2 |
| 374 | 迷霧塔 lv5 | perStack:0.03, cap:50 | stacksPerHit:2 |
| 398 | 冰河塔 lv5（純水） | perStack:0.04, cap:55 | **stacksPerHit:3** |
| 400 | 冰河塔 lv6（純水） | perStack:0.03, cap:60 | **stacksPerHit:5** |

> 深寒 lv4 = 5，冰河塔 lv5 = 3，冰河塔 lv6 = 5 的設計意圖：
> - 深寒(lv4)：AOE 高頻疊層，每次 5 層，幾秒內封頂 → 群控特色
> - 冰河塔 lv5：中等疊層，搭配更高傷害
> - 冰河塔 lv6：回到 5 層 + freeze，終極純水

---

## desc 同步更新

每個塔的 desc 中若有提到 perStack 數值的，一併更新為 stacksPerHit 語意：

| 塔 | 舊 desc 關鍵詞 | 建議新 desc |
|----|--------------|------------|
| 深寒 lv4 | 強力冰冷 AOE（每層 -50% 速度） | AOE 冰冷（每次 +5 層） |
| 冰河塔 lv5 | 純水強化：冰冷增強 AOE | 純水強化：AOE 冰冷（每次 +3 層） |
| 冰河塔 lv6 | 三純水終極：強冰冷AOE+冰凍 | 三純水終極：AOE 冰冷（每次 +5 層）+ 冰凍 |

其他塔的 desc 通常不直接提 perStack 數值，不需要改。

---

## 執行方式
逐行 Grep 定位 → Read ±5 行確認 → Edit 替換
每塔只改 makeSkill('chill',{...}) 內部參數與對應 desc
