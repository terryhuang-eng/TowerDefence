# step3 — 產生 dist/game.html（單一 HTML 發布檔）

## 目標

將所有 JS 模組 inline 進單一 HTML 檔案，玩家只需收到並開啟一個 `.html` 檔即可遊玩。

## 影響檔案

新建 `dist/game.html`（不修改原始檔）

## 執行方式（Bash 腳本）

```bash
mkdir -p dist

# 讀取各 JS 檔內容，替換 script src 為 inline script
python3 - <<'EOF'
import re, os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 移除 autotest.js（若 step1 尚未執行也一併處理）
html = re.sub(r'\s*<script src="autotest\.js"></script>', '', html)

# inline 所有 js/*.js
def inline_script(m):
    src = m.group(1)
    if src.startswith('http'):
        return m.group(0)  # CDN 連結保留
    try:
        with open(src, 'r', encoding='utf-8') as f:
            content = f.read()
        return f'<script>\n{content}\n</script>'
    except FileNotFoundError:
        return ''  # 找不到的略過

html = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)

os.makedirs('dist', exist_ok=True)
with open('dist/game.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ dist/game.html 產生完成')
EOF
```

## 預期輸出

```
dist/
└── game.html   (~288 KB，包含 CDN PeerJS link + 所有 JS inline)
```

## 驗證

1. 開啟 `dist/game.html` → 遊戲正常啟動
2. 確認 browser console 無 404 錯誤
3. 確認 `dist/game.html` 為單一自足檔案（ls -la dist/）

## 若需要完全離線版（含 PeerJS inline）

先執行 step2 將 peerjs.min.js 下載至 `js/peerjs.min.js`，
並將 index.html 的 CDN src 改為本機路徑，
則上述腳本會自動將 peerjs.min.js 一同 inline（約 458 KB 單檔）。

---

✅ 所有步驟完成。測試通過後請執行 `/saveclear` 封存計畫並同步 git。
