/* FOM website traffic (18 Nov 2026), on both websites.
   Cookieless: no cookies, nothing kept between visits, no IP stored. A visit gets a random id
   in sessionStorage that disappears when the tab closes. Sends page views, clicks, time on page
   and scroll depth, and form steps (window.FOM_TRACK) to the gallery Worker (/t).
   The dashboard Traffic page shows it. Your own visits: open the site once with ?fomnotrack=1
   on each device (?fomnotrack=0 to count them again). Skipped in client previews and for bots. */
(function(){
  var WORKER = 'https://fom-gallery.cold-moon-d65c.workers.dev';
  var BIZ = /^\/shotbya(\/|$)/.test(location.pathname) ? 'sba' : 'fom';
  function ls(k, v){ try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  var m = /[?&]fomnotrack=([01])/.exec(location.search);
  if(m) ls('fom.notrack', m[1] === '1' ? '1' : null);
  var off = ls('fom.notrack') === '1' || /[?&]preview=/.test(location.search) || navigator.webdriver ||
    /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp\//i.test(navigator.userAgent);
  window.FOM_TRACK = function(){};
  if(off){ if(m && m[1] === '1') console.info('FOM: your visits on this device are not counted.'); return; }

  var sid = '';
  try{ sid = sessionStorage.getItem('fom.sid') || ''; if(!sid){ sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); sessionStorage.setItem('fom.sid', sid); } }
  catch(e){ sid = Math.random().toString(36).slice(2, 14); }
  var ua = navigator.userAgent;
  var dev = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'phone' : 'computer';

  function send(o){
    o.b = BIZ; o.s = sid; o.p = location.pathname.replace(/index\.html$/, ''); o.d = dev;
    var body = JSON.stringify(o);
    try{ if(navigator.sendBeacon && navigator.sendBeacon(WORKER + '/t', new Blob([body], { type:'text/plain' }))) return; }catch(e){}
    try{ fetch(WORKER + '/t', { method:'POST', body:body, keepalive:true, headers:{ 'Content-Type':'text/plain' } }).catch(function(){}); }catch(e){}
  }

  /* where this visit came from: link tag, in-app browser, or the site that linked here */
  function source(){
    var q = new URLSearchParams(location.search), u = (q.get('utm_source') || q.get('src') || '').toLowerCase();
    // keep in step with the Tracked links on the dashboard Traffic page
    var map = { ig:'Instagram', instagram:'Instagram', igs:'Instagram stories', fb:'Facebook', facebook:'Facebook', tt:'TikTok', tiktok:'TikTok', google:'Google', gbp:'Google Business', wa:'WhatsApp', whatsapp:'WhatsApp', qr:'QR code', youtube:'YouTube', linkedin:'LinkedIn', email:'Email', newsletter:'Email', pinterest:'Pinterest' };
    if(u) return map[u] || u.slice(0, 30);
    if(q.get('fbclid')) return /Instagram/i.test(ua) ? 'Instagram' : 'Facebook';
    if(q.get('gclid')) return 'Google';
    if(/Instagram/i.test(ua)) return 'Instagram';
    if(/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
    if(/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
    var r = ''; try{ r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; }catch(e){}
    if(!r || r === location.hostname.replace(/^www\./, '')) return r ? '' : 'Direct';
    var hosts = [[/instagram/, 'Instagram'], [/facebook|fb\.com/, 'Facebook'], [/tiktok/, 'TikTok'], [/google\./, 'Google'], [/bing\./, 'Bing'], [/whatsapp|wa\.me/, 'WhatsApp'], [/youtube|youtu\.be/, 'YouTube'], [/linkedin|lnkd/, 'LinkedIn'], [/pinterest/, 'Pinterest'], [/mail\./, 'Email']];
    for(var i = 0; i < hosts.length; i++) if(hosts[i][0].test(r)) return hosts[i][1];
    return r;
  }
  var src = source();
  send({ t:'view', r: src });   // '' = came from another page on this site (the visit's first page keeps its source)

  /* time on page (only while it is on screen) and how far down they scrolled */
  var shown = Date.now(), visible = 0, maxScroll = 0, left = false;
  function scrollPct(){ var h = document.documentElement, max = Math.max(1, h.scrollHeight - innerHeight); maxScroll = Math.max(maxScroll, Math.min(100, Math.round((scrollY || h.scrollTop) / max * 100))); }
  addEventListener('scroll', scrollPct, { passive:true });
  function leave(){
    if(left) return; left = true;
    if(shown) visible += Date.now() - shown; shown = 0; scrollPct();
    send({ t:'leave', secs: Math.round(visible / 1000), sc: maxScroll });
  }
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden'){ if(shown){ visible += Date.now() - shown; shown = 0; } leave(); }
    else if(!shown){ shown = Date.now(); left = false; }   // came back: a later leave reports the total
  });
  addEventListener('pagehide', leave);

  /* clicks: buttons and links, named by data-track, else what the link does, else its text */
  function nice(t){ return String(t || '').replace(/\p{Extended_Pictographic}|\uFE0F/gu, ' ').replace(/\s+/g, ' ').replace(/[←-⇿→›»>]+/g, '').trim().slice(0, 50); }
  function label(el){
    if(el.getAttribute('data-track')) return el.getAttribute('data-track');
    var h = el.getAttribute('href') || '', t = nice(el.getAttribute('aria-label') || el.textContent);
    if(/wa\.me|whatsapp/i.test(h)) return 'WhatsApp' + (t && !/whatsapp/i.test(t) ? ': ' + t : '');
    if(/^tel:/i.test(h)) return 'Call';
    if(/^mailto:/i.test(h)) return 'Email';
    if(/instagram\.com/i.test(h)) return 'Instagram';
    if(/tiktok\.com/i.test(h)) return 'TikTok';
    if(/facebook\.com/i.test(h)) return 'Facebook';
    if(!t && el.querySelector('img')) t = nice(el.querySelector('img').getAttribute('alt')) || 'Picture';
    return t || (h ? h.replace(/^https?:\/\/(www\.)?/, '').slice(0, 50) : 'Button');
  }
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('a,button,[data-track],[role=button]');
    if(!el || el.hasAttribute('data-notrack')) return;
    if(el.closest('#cookieConsent')) return;
    send({ t:'click', l: label(el) });
  }, true);

  /* Microsoft Clarity heatmaps and visit recordings: only after the visitor accepts cookies
     (FOM's cookie banner, or the small one below on pages without it). Set CLARITY_ID to switch it on. */
  var CLARITY_ID = 'zfic33ye0e';
  function loadClarity(){
    if(!CLARITY_ID || window.clarity) return;
    (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}; t=l.createElement(r); t.async=1; t.src='https://www.clarity.ms/tag/'+i; y=l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y); })(window, document, 'clarity', 'script', CLARITY_ID);
    window.clarity('set', 'business', BIZ === 'sba' ? 'Shot by A' : 'FOM Studios');
  }
  function consent(){ return ls('fom_cookie_consent'); }
  if(CLARITY_ID){
    if(consent() === 'accepted') loadClarity();
    var whenReady = function(f){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', f); else f(); };
    whenReady(function(){
      var acc = document.getElementById('cookieAccept');   // FOM pages have their own banner
      if(acc){ acc.addEventListener('click', function(){ setTimeout(loadClarity, 0); }); return; }
      if(consent()) return;
      var box = document.createElement('div');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookies');
      box.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:380px;margin-left:auto;background:#fff;color:#222;border-radius:18px;padding:16px 18px;box-shadow:0 10px 40px rgba(0,0,0,.18);z-index:5000;font:14px/1.5 -apple-system,"Helvetica Neue",Arial,sans-serif';
      box.innerHTML = '<p style="margin:0 0 12px">We use cookies to see how visitors use this site, so we can make it better.</p><div style="display:flex;gap:8px"><button type="button" data-c="declined" data-notrack style="flex:1;padding:10px;border-radius:99px;border:1px solid #222;background:#fff;font:inherit;font-weight:700;cursor:pointer">Decline</button><button type="button" data-c="accepted" data-notrack style="flex:1;padding:10px;border-radius:99px;border:0;background:#222;color:#fff;font:inherit;font-weight:700;cursor:pointer">Accept</button></div>';
      box.addEventListener('click', function(e){ var b = e.target.closest('[data-c]'); if(!b) return; ls('fom_cookie_consent', b.getAttribute('data-c')); box.remove(); if(b.getAttribute('data-c') === 'accepted') loadClarity(); });
      document.body.appendChild(box);
    });
  }

  /* form steps from book-steps.js (Book a shoot) and booking.js (Book a meeting) */
  var stepped = {};
  window.FOM_TRACK = function(step){ step = String(step || '').slice(0, 30); if(!step || stepped[step]) return; stepped[step] = 1; send({ t:'step', l: step }); };
})();
