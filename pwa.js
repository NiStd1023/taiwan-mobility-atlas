'use strict';
(() => {
  let deferredInstall=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const top=document.querySelector('.top-actions');
  if(!top)return;
  const install=document.createElement('button');
  install.type='button';install.className='settings pwa-install';install.textContent='⊕ 安裝 App';install.setAttribute('aria-haspopup','dialog');install.hidden=standalone();top.insertBefore(install,top.querySelector('.settings'));
  const dialog=document.createElement('dialog');dialog.id='pwaHelp';dialog.setAttribute('aria-labelledby','pwaHelpTitle');
  dialog.innerHTML='<form method="dialog" class="dialog-head"><div><div class="section-kicker">INSTALL APP</div><h2 id="pwaHelpTitle">安裝交通儀表板</h2></div><button aria-label="關閉">×</button></form><div class="dialog-body"><p>將儀表板加入裝置主畫面，可像 App 一樣開啟。</p><p><strong>電腦 Chrome／Edge：</strong>使用網址列右側的安裝圖示，或在瀏覽器選單中選擇安裝。</p><p><strong>iPhone／iPad：</strong>使用 Safari 開啟，點選「分享」後選擇「加入主畫面」。</p><p><strong>Android：</strong>開啟瀏覽器選單，選擇「安裝應用程式」或「加到主畫面」。</p><p class="hint">離線可開啟介面，但即時交通資料需要網路與有效的 TDX 連線。</p><p class="hint" id="pwaStatus" role="status">正在準備離線介面…</p></div>';
  document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  install.addEventListener('click',async()=>{if(deferredInstall){const prompt=deferredInstall;deferredInstall=null;try{await prompt.prompt();await prompt.userChoice}catch(_){dialog.showModal()}}else dialog.showModal()});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(!standalone())install.hidden=false});
  window.addEventListener('appinstalled',()=>{deferredInstall=null;install.hidden=true});
  const banner=document.createElement('div');banner.className='pwa-offline';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');document.querySelector('header')?.after(banner);
  function showNetworkState(){if(!navigator.onLine){banner.hidden=false;banner.textContent='目前離線：無法取得即時交通資料，先前資料可能已過時。'}else{banner.hidden=true;banner.textContent=''}}
  window.addEventListener('offline',showNetworkState);window.addEventListener('online',showNetworkState);showNetworkState();
  if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>{document.getElementById('pwaStatus').textContent='離線介面已備妥。'}).catch(()=>{document.getElementById('pwaStatus').textContent='目前無法準備離線介面，請確認網路後重新整理。'})}else document.getElementById('pwaStatus').textContent='此瀏覽器環境不支援離線介面。';
})();
