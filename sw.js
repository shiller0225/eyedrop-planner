// 眼藥水規劃器 service worker
// 頁面：先抓網路（3 秒逾時改用快取），確保更新能送到；圖示與字型：先用快取，省流量。
const CACHE='eyedrop-v15';
const CORE=['./','./index.html','./manifest.webmanifest','./wenkai.woff2','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function put(req,res){if(res&&res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(req,c))}return res}
function networkFirst(req){
  return new Promise(resolve=>{
    let settled=false;const done=r=>{if(!settled&&r){settled=true;resolve(r)}};
    const fallback=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'));
    const timer=setTimeout(()=>fallback().then(done),3000);
    fetch(req).then(r=>{clearTimeout(timer);done(put(req,r))}).catch(()=>{clearTimeout(timer);fallback().then(r=>{if(r)done(r);else if(!settled){settled=true;resolve(Response.error())}})});
  });
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('.html')){e.respondWith(networkFirst(req));return}
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req).then(res=>put(req,res))));
});
