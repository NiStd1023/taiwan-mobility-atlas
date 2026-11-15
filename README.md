# 台灣交通儀表板 Taiwan Mobility Atlas

整合台灣飛航、台鐵及台灣高鐵資訊的互動式儀表板，支援進階篩選、車站及站間車次查詢，以及可安裝的 PWA 介面。

## 使用方式

使用支援 JavaScript 的現代瀏覽器開啟網站。首次使用可先瀏覽示範資料；如需使用交通部 TDX 資料，請至 [TDX 運輸資料流通服務](https://tdx.transportdata.tw/) 申請帳號與 API 憑證，並於網站的「資料連線」設定輸入。不要將自己的憑證提交至公開儲存庫。

資料可用性依 TDX 權限及資料來源而定；實際交通資訊請以營運單位公告為準。離線時僅提供已快取的網站介面，無法取得即時資料。

## 本機執行

在本目錄執行 `python3 -m http.server 8000`，然後使用瀏覽器開啟 `http://localhost:8000/`。Service Worker 需要 HTTPS 或 localhost 安全環境。

## 專案結構

- `index.html`、`app.js`：飛航資訊。
- `train.html`、`train.js`、`train.css`：台鐵資訊。
- `thsr.html`、`thsr.js`：台灣高鐵資訊。
- `transport-core.js`、`map-interactions.js`、`style.css`：共用資料與介面功能。
- `manifest.webmanifest`、`pwa.js`、`service-worker.js`、`icons/`：PWA 設定與離線介面。

網站資料可能有延遲或異動；請勿將儀表板顯示視為即時營運資訊的唯一依據。
