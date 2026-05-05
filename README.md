# 京都 2026 Travel App

純靜態前端旅遊頁，主要檔案為 `index.html`、`styles.css`、`app.js`。

## 本機啟動

```bash
python3 -m http.server 5550 --bind 127.0.0.1
```

開啟：

```text
http://127.0.0.1:5550/index.html
```

若 `5550` 顯示 `Address already in use`，代表本機 server 已在跑，可直接開上方網址，或改用其他 port。

## Supabase 測試重點

1. 在旅程 tab 登入。
2. 確認京都旅程可讀取。
3. 新增、重新整理、跨帳號確認、刪除測試旅程。
4. 新增/刪除花費，確認 `expenses` 同步。
5. 新增/刪除每日行程，確認 `itinerary_days` / `itinerary_items` 同步。
6. 勾選/取消準備清單，確認 `checklist_items.checked` 同步。
7. 新增/勾選/刪除購買清單，確認 `shopping_items` 同步。

未登入或 Supabase 不可用時，旅程相關資料會使用 active trip 專屬 localStorage fallback。

購買清單 Supabase 表尚未建立時，先執行 `supabase-shopping-items.sql`。

## 檢查指令

```bash
node --check app.js
git diff --check
```
