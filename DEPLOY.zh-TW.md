# ChrisTorng Cloudmark — 個人部署說明

這個 Fork 使用 Cloudflare Workers 提供網頁與 API、Cloudflare D1 儲存書籤。
Android、Windows 只需要瀏覽器，不需要安裝額外 App。

## 部署方式（不使用 ChatGPT Cloudflare／GitHub Repo Creator 連接器）

1. 以自己的 Cloudflare 帳號進入 [API Tokens](https://dash.cloudflare.com/profile/api-tokens)，建立 **Custom Token**，限制在自己的帳號，至少授予 **Workers Scripts: Edit**、**D1: Edit**。不要在聊天、Issue 或公開檔案貼上 Token。
2. 在 Cloudflare Dashboard 查詢自己的 Account ID（帳號概覽或 Workers & Pages）。
3. 開啟 [GitHub Actions Secrets](https://github.com/ChrisTorng/cloudmark/settings/secrets/actions)，新增兩個 **Repository secrets**：
   - `CLOUDFLARE_API_TOKEN`：Cloudflare Custom API Token
   - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare Account ID
4. 打開 [Deploy Cloudmark to Cloudflare](https://github.com/ChrisTorng/cloudmark/actions/workflows/deploy-cloudflare.yml)，按 **Run workflow**（第一次可能先要啟用 Actions）。
5. 待 Actions 執行成功，打開預期網址：
   - https://cloudmark-christorng.christorng.workers.dev/
   - https://cloudmark-christorng.christorng.workers.dev/api/health （應回傳 `{"ok":true,"service":"cloudmark"}`）

**注意**：上面是預期的網址，目前只有程式碼，尚未成功部署網站；如果帳號的 workers.dev 子網域不同，請以 Actions 及 Cloudflare Dashboard 回報的網址為準。

此 Workflow 會自動：
- 建立或重用名為 `cloudmark-christorng` 的 D1；
- 把當次執行取得的 D1 UUID 注入 `wrangler.jsonc`（不提交回 Git）；
- 套用 migrations；
- 將前端及 API 一起部署成 `cloudmark-christorng` Worker。

本 repo 的 `wrangler.jsonc` 有全零的 **佔位** D1 UUID。不要直接使用 Fork 前上游的 D1 UUID，也不要使用上游的 `cloudmark.site` 網域設定。

## 第一次使用

進入自己的 Cloudmark 網頁後，建立一個 Collection（mark）及獨立的 write token，再儲存好 write token。原版 Cloudmark 具有公開或私人 Collection 設定，請先確認自己想要的可見性。

Bookmarklet 預設可能會將 token 放在網址查詢參數；這是上游設計，不要公開含 token 的完整網址。跨網站收集的 Tampermonkey 整合尚未在本 Fork 實作。

## 後續規劃（未實作）

- BetaCat 點擊文章加入清單，保留原文標題、摘要、圖片
- 待讀／已讀標記、閱讀時間及持續保存歷史
- 自動分類與 AI 摘要
- 以公開唯讀方式嵌入部落格

目前沿用上游資料結構：`url`、`title`、`description`、`category`、`favicon` 等欄位，不要把上面規劃中的功能視為已完成。

## Windows 本機部署備案

使用 Node.js 22+、pnpm，並於 PowerShell 執行：

```powershell
git clone https://github.com/ChrisTorng/cloudmark.git
cd cloudmark
corepack enable
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm exec wrangler d1 create cloudmark-christorng
```

若 D1 已存在，請從 Cloudflare Dashboard 查詢現有 UUID，不要重複建立資料庫。把 `wrangler.jsonc` 的佔位 `database_id` 改為正確 UUID，然後執行：

```powershell
pnpm exec wrangler d1 migrations apply cloudmark-christorng --remote
pnpm run deploy
```

本機方式使用 Wrangler 官方登入，不經過 ChatGPT 連接器。
