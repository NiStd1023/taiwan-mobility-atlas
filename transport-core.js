'use strict';
// Shared browser-local configuration, TDX authentication and refresh scheduling.
// Each open page has its own in-memory client and timer; preferences are shared.
window.TransportCore = (() => {
  const keys = Object.freeze({credentials:'flightAtlasTdxCredentials', mode:'flightAtlasUpdateMode', interval:'flightAtlasRefreshMinutes', connection:'trafficAtlasConnectionMode', demoSignal:'trafficAtlasDemoSignal'});
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const write = (key,value) => { try { localStorage.setItem(key,value); return true; } catch (_) { return false; } };
  const validInterval = value => Number.isInteger(value) && value >= 1 && value <= 1440;
  const settings = {
    credentials() { try { const c=JSON.parse(read(keys.credentials)); return c && typeof c.id==='string' && typeof c.secret==='string' && c.id && c.secret ? {id:c.id,secret:c.secret}:null; } catch (_) { return null; } },
    saveCredentials(id,secret) { if(!id||!secret) return false; return write(keys.credentials,JSON.stringify({id,secret})); },
    clearCredentials() { try { localStorage.removeItem(keys.credentials); return true; } catch (_) { return false; } },
    interval() { const n=Number(read(keys.interval)); return validInterval(n)?n:60; },
    saveInterval(n) { return validInterval(n) && write(keys.interval,String(n)); },
    mode() { return read(keys.mode)==='manual'?'manual':'auto'; },
    saveMode(mode) { return (mode==='auto'||mode==='manual') && write(keys.mode,mode); },
    isLive() { return read(keys.connection)==='live'; },
    setConnection(mode) { if(mode!=='live'&&mode!=='demo') return false; const previous=read(keys.connection), saved=write(keys.connection,mode); if(mode==='demo'&&previous==='demo') write(keys.demoSignal,Date.now()+'-'+Math.random()); return saved; },
    subscribe(handler) { window.addEventListener('storage', e => {
      if(e.key===keys.interval) {const n=Number(e.newValue); if(validInterval(n)) handler('interval',n);}
      else if(e.key===keys.mode && (e.newValue==='auto'||e.newValue==='manual')) handler('mode',e.newValue);
      else if((e.key===keys.credentials&&e.newValue===null)||e.key===null) handler('credentials-cleared');
      else if(e.key===keys.demoSignal) handler('connection','demo');
      else if(e.key===keys.connection && (e.newValue==='live'||e.newValue==='demo')) handler('connection',e.newValue);
    }); }
  };
  const base='https://tdx.transportdata.tw/api/basic/';
  function createTdxClient() {
    let credentials=null, token='', expires=0, pending=null, generation=0;
    function configure(id,secret) { if(credentials?.id===id&&credentials?.secret===secret) return; generation++; credentials=id&&secret?{id,secret}:null; token='';expires=0;pending=null; }
    function clear() { configure(null,null); }
    async function getToken() {
      if(token && Date.now()<expires) return token;
      if(pending) return pending;
      if(!credentials) throw Error('請先連接 TDX');
      const current=generation, c=credentials;
      const request=(async()=>{
        const response=await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:c.id,client_secret:c.secret})});
        if(!response.ok) throw Error('TDX 金鑰驗證失敗（HTTP '+response.status+'）');
        const result=await response.json();
        if(!result.access_token) throw Error('TDX 未回傳存取權杖');
        if(current!==generation) throw Error('連線設定已變更');
        token=result.access_token;expires=Date.now()+Math.max(0,(Number(result.expires_in)||3600)-60)*1000;
        return token;
      })();
      pending=request;
      try { return await request; } finally { if(current===generation&&pending===request) pending=null; }
    }
    async function request(path) {
      const current=generation, access=await getToken();
      if(current!==generation) throw Error('連線設定已變更');
      const url=base+path+(path.includes('?')?'&':'?')+'%24format=JSON';
      let response=await fetch(url,{headers:{Authorization:'Bearer '+access}});
      if(response.status===401 && current===generation) {
        if(token===access){token='';expires=0;}
        const renewed=await getToken();
        if(current!==generation) throw Error('連線設定已變更');
        response=await fetch(url,{headers:{Authorization:'Bearer '+renewed}});
      }
      if(!response.ok) throw Error('TDX 資料讀取失敗（HTTP '+response.status+'）');
      return response.json();
    }
    return {configure,clear,getToken,request};
  }
  function createRefreshScheduler({ready,minutes,refresh}) {
    let timer=null;
    function stop(){if(timer!==null)clearTimeout(timer);timer=null;}
    function schedule(){stop();if(ready())timer=setTimeout(()=>{timer=null;if(ready())refresh()},minutes()*60000);}
    return {stop,schedule};
  }
  return Object.freeze({settings,createTdxClient,createRefreshScheduler});
})();
