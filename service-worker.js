'use strict';
// Cache only this app's public, static shell. TDX requests and credentials never enter Cache Storage.
const CACHE_NAME='taiwan-mobility-shell-v1';
const SHELL=['index.html','train.html','thsr.html','style.css','train.css','app.js','train.js','thsr.js','transport-core.js','map-interactions.js','pwa.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
const scopeURL=new URL(self.registration.scope);
const shellURLs=new Set(SHELL.map(file=>new URL(file,scopeURL).href));
function canonical(url){if(url.origin!==scopeURL.origin||url.search||url.hash)return null;if(url.pathname===scopeURL.pathname)return new URL('index.html',scopeURL).href;return shellURLs.has(url.href)?url.href:null}
function cacheable(response,expected){if(!response.ok||response.redirected||response.type!=='basic')return false;const actual=new URL(response.url);if(actual.href!==expected)return false;const contentType=(response.headers.get('content-type')||'').toLowerCase();return !expected.endsWith('.html')||contentType.includes('text/html')}
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);for(const file of SHELL){const url=new URL(file,scopeURL).href;const response=await fetch(url,{cache:'reload',credentials:'same-origin'});if(!cacheable(response,url))throw new Error('Failed to cache static application shell');await cache.put(url,response)}await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('taiwan-mobility-shell-')&&name!==CACHE_NAME)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const target=canonical(new URL(req.url));if(!target)return;event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);try{const response=await fetch(req);if(cacheable(response,target)){try{await cache.put(target,response.clone())}catch(_){}}return response}catch(error){const cached=await cache.match(target);if(cached)return cached;throw error}})())});
