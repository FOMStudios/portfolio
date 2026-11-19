/* FOM Studios - event photo sales (photos.html)
   Buyers search their race, bib or car number, pick photos or take every photo of their number,
   pay with Yoco and download the full-size photos straight away.
   Data comes from the gallery Worker (/sales/...). Events are made on the dashboard (Photo Sales page). */
(function(){
'use strict';
var W = 'https://fom-gallery.cold-moon-d65c.workers.dev';
var D = document, Q = new URLSearchParams(location.search);
var EVID = (Q.get('ev') || '').toLowerCase().replace(/[^a-z0-9-]/g, ''), OID = Q.get('o'), KEY = Q.get('k');
var app = D.getElementById('saleApp');
var EV = null, CART = [], SHOW_ALL = false, NUM = '';
function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function R(n){ return 'R' + Math.round(n).toLocaleString('en-ZA'); }
function img(ev, v, n){ return W + '/file?g=' + encodeURIComponent('sales/' + ev + '/' + v + '/') + '&n=' + encodeURIComponent(n); }
function nice(d){ try{ return new Date(d + 'T12:00:00Z').toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'long', year:'numeric' }); }catch(e){ return d || ''; } }
function track(t, d){ try{ if(window.FOM_TRACK) FOM_TRACK(t, d); }catch(e){} }
function waLink(text){ var wa = (window.FOM_SITE && FOM_SITE.wa) || '27686901120'; return 'https://wa.me/' + wa + '?text=' + encodeURIComponent(text); }

var css = D.createElement('style');
css.textContent = [
'.sa-wrap{max-width:1100px;margin:0 auto;padding:0 var(--gutter,20px) 120px}',
'.sa-head{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:flex-end;margin-bottom:18px}',
'.sa-head h2{font-size:clamp(26px,4vw,38px);line-height:1.1}.sa-soft{color:var(--ink-soft);font-size:14.5px}',
'.sa-price{background:var(--bg-pill);border:1px solid var(--line);border-radius:999px;padding:8px 16px;font-weight:700;font-size:14px}',
'.sa-search{display:flex;gap:8px;background:var(--bg-pill);border:1px solid var(--line);border-radius:20px;padding:10px;margin:8px 0 14px}',
'.sa-search input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:18px;font-weight:700;padding:8px 10px;outline:0;color:var(--ink);text-transform:uppercase}',
'.sa-btn{border:0;background:#111;color:#fff;font:inherit;font-weight:800;font-size:15px;border-radius:999px;padding:12px 20px;cursor:pointer;white-space:nowrap}',
'.sa-btn.alt{background:var(--bg-pill);color:var(--ink);border:1px solid var(--line)}.sa-btn:disabled{opacity:.5}',
'.sa-bundle{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:#111;color:#fff;border-radius:20px;padding:16px 18px;margin-bottom:14px}',
'.sa-bundle .sa-btn{background:#fff;color:#111}',
'.sa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}',
'@media(max-width:520px){.sa-grid{grid-template-columns:repeat(2,1fr)}}',
'.sa-ph{position:relative;border-radius:14px;overflow:hidden;background:#ddd;aspect-ratio:3/2;cursor:zoom-in}',
'.sa-ph img{width:100%;height:100%;object-fit:cover;display:block}',
'.sa-ph .sa-pick{position:absolute;right:8px;bottom:8px;width:38px;height:38px;border-radius:50%;border:2px solid #fff;background:rgba(0,0,0,.45);color:#fff;font-size:18px;font-weight:900;cursor:pointer;display:grid;place-items:center}',
'.sa-ph.on{outline:3px solid #25D366;outline-offset:-3px}.sa-ph.on .sa-pick{background:#25D366;border-color:#25D366}',
'.sa-ph .sa-nums{position:absolute;left:8px;top:8px;display:flex;gap:4px;flex-wrap:wrap}.sa-ph .sa-nums span{background:rgba(0,0,0,.6);color:#fff;font-size:11px;font-weight:800;border-radius:999px;padding:2px 8px}',
'.sa-cart{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:900;width:min(640px,calc(100% - 24px));background:#111;color:#fff;border-radius:999px;padding:10px 10px 10px 22px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.25)}',
'.sa-cart .sa-btn{background:#25D366;color:#0b1f12}',
'.sa-lb{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:12px}',
'.sa-lb img{max-width:100%;max-height:78vh;border-radius:10px}.sa-lb .row{display:flex;gap:10px}',
'.sa-x{position:absolute;top:12px;right:16px;background:none;border:0;color:#fff;font-size:34px;cursor:pointer}',
'.sa-sheet{position:fixed;inset:0;z-index:3100;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}',
'.sa-sheet form{background:var(--bg);width:min(520px,100%);border-radius:24px 24px 0 0;padding:22px 20px 28px;max-height:92vh;overflow:auto}',
'@media(min-width:700px){.sa-sheet{align-items:center}.sa-sheet form{border-radius:24px}}',
'.sa-sheet label{display:block;font-size:13px;font-weight:700;margin:12px 0 5px}',
'.sa-sheet input{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px;font:inherit;background:var(--bg-pill)}',
'.sa-err{color:#b3261e;font-weight:700;font-size:14px;margin-top:10px}',
'.sa-card{display:block;background:var(--bg-pill);border:1px solid var(--line);border-radius:20px;overflow:hidden;text-decoration:none;color:inherit}',
'.sa-card .im{aspect-ratio:3/2;background:#ddd}.sa-card img{width:100%;height:100%;object-fit:cover;display:block}.sa-card .tx{padding:14px 16px}',
'.sa-events{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}',
'.sa-empty{padding:28px;text-align:center;color:var(--ink-soft);border:1px dashed var(--line);border-radius:20px}',
'.sa-dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}.sa-dl a{display:block;text-decoration:none;color:inherit;background:var(--bg-pill);border:1px solid var(--line);border-radius:14px;overflow:hidden;font-weight:700;font-size:13px;text-align:center}',
'.sa-dl img{width:100%;aspect-ratio:3/2;object-fit:cover;display:block}.sa-dl span{display:block;padding:8px}'
].join('\n');
D.head.appendChild(css);

function get(path){ return fetch(W + path, { cache:'no-store' }).then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || 'error'); return j; }); }); }

/* ---------- after paying: the downloads ---------- */
function orderView(){
  var tries = 0;
  app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">Confirming your payment... 💳</div></div>';
  (function poll(){
    get('/sales/order?o=' + encodeURIComponent(OID) + '&k=' + encodeURIComponent(KEY)).then(function(o){
      if(o.status === 'paid' && o.type === 'voucher'){
        track('gift_paid'); var v = o.voucher || {};
        app.innerHTML = '<div class="sa-wrap"><div class="sa-head"><div><h2>Your gift voucher is ready 🎁</h2><p class="sa-soft">We emailed it to you' + (v.to ? ' (and to ' + esc(v.to) + ' if you gave their email)' : '') + '. Screenshot it, forward the email or print it.</p></div></div>' +
          '<div style="background:#111;color:#fff;border-radius:24px;padding:30px 24px;text-align:center;max-width:460px"><div style="letter-spacing:.2em;font-size:12px;opacity:.7">FOM STUDIOS GIFT VOUCHER</div><div style="font-size:44px;font-weight:800;margin:10px 0">' + R(o.amount) + '</div><div>' + esc(v.label || '') + '</div>' + (v.to ? '<div style="margin-top:12px">For ' + esc(v.to) + (v.from ? ', from ' + esc(v.from) : '') + '</div>' : '') + (v.msg ? '<div style="margin-top:8px;font-style:italic;opacity:.85">"' + esc(v.msg) + '"</div>' : '') +
          '<div style="margin-top:18px;background:#fff;color:#111;border-radius:12px;padding:12px;font-size:24px;font-weight:800;letter-spacing:.08em">' + esc(v.code) + '</div><div style="font-size:12px;opacity:.7;margin-top:10px">Valid until ' + esc(v.expires || '') + '. Quote the code when booking on WhatsApp 068 690 1120 or the website.</div></div></div>';
      } else if(o.status === 'paid' && o.type === 'print'){
        track('print_paid'); if(window.FOM_PRINT) FOM_PRINT.clear();
        var stages = { 'new':'We have your order and are getting it printed.', ordered:'Your print is at the lab.', ready:'Your print is ready.', out:'Your print is on its way.', delivered:'Delivered. Enjoy it!' };
        app.innerHTML = '<div class="sa-wrap"><div class="sa-head"><div><h2>Thank you for your order 🎉</h2><p class="sa-soft">' + esc(o.label) + ' · ' + R(o.amount) + '. We emailed you a copy' + ((o.prints || []).length ? ' and will WhatsApp you as your print moves along' : '') + '.</p></div></div>' +
          ((o.prints || []).length ? '<div class="sa-empty" style="text-align:left;margin-bottom:14px"><b>' + esc(stages[o.stage] || stages['new']) + '</b>' + (o.delivery ? '<div class="sa-soft">' + esc(o.delivery) + '</div>' : '') + '<div class="sa-dl" style="margin-top:12px">' + o.prints.map(function(p){ return '<div style="font-size:13px"><img src="' + esc(p.thumb) + '" alt="" style="width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:10px"><div style="padding:6px 2px">' + esc(p.label) + '</div></div>'; }).join('') + '</div></div>' : '') +
          ((o.items || []).length ? '<h3 style="margin:10px 0">Your digital photos</h3><div class="sa-dl">' + o.items.map(function(x, i){ return '<a href="' + esc(x.url) + '" download><img src="' + esc(x.thumb) + '" alt="Photo ' + (i + 1) + '" loading="lazy"><span>⬇ Download</span></a>'; }).join('') + '</div>' : '') +
          '<p style="margin-top:18px"><a class="sa-btn alt" href="prints.html" style="text-decoration:none;display:inline-block">See more prints</a></p></div>';
      } else if(o.status === 'paid'){
        track('sale_paid', o.label);
        app.innerHTML = '<div class="sa-wrap"><div class="sa-head"><div><h2>Your photos are ready 🎉</h2><p class="sa-soft">' + esc(o.label) + ' from ' + esc(o.evTitle) + '. We also emailed you this link. It works for 60 days.</p></div>' +
          '<button class="sa-btn" id="saAll" type="button">Download all ' + o.items.length + '</button></div>' +
          '<div class="sa-dl">' + o.items.map(function(x, i){ return '<a href="' + esc(x.url) + '" download><img src="' + esc(x.thumb) + '" alt="Photo ' + (i + 1) + '" loading="lazy"><span>⬇ Download</span></a>'; }).join('') + '</div>' +
          '<p class="sa-soft" style="margin-top:22px">Posting them? Tag <a href="https://instagram.com/fom_studios_" target="_blank" rel="noopener">@fom_studios_</a> and we will share our favourites. On iPhone, open each photo and tap Save to Photos.</p>' +
          '<p style="margin-top:12px"><a class="sa-btn alt" href="photos.html?ev=' + esc(o.ev) + '" style="text-decoration:none;display:inline-block">Back to the event</a></p></div>';
        D.getElementById('saAll').onclick = function(){ o.items.forEach(function(x, i){ setTimeout(function(){ var a = D.createElement('a'); a.href = x.url; a.download = ''; D.body.appendChild(a); a.click(); a.remove(); }, i * 700); }); };
      } else if(o.status === 'expired'){
        app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">This download link has expired. <a href="' + waLink('Hi FOM Studios, my photo download link expired (' + OID + ').') + '">WhatsApp us</a> and we will sort it out.</div></div>';
      } else if(++tries < 60){ setTimeout(poll, 3000); }
      else app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">Your payment is still being confirmed. You will get an email with your photos as soon as it goes through. Questions? <a href="' + waLink('Hi FOM Studios, I paid for photos (order ' + OID + ') and am waiting for the download.') + '">WhatsApp us</a>.</div></div>';
    }).catch(function(){ app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">We could not find that order. <a href="' + waLink('Hi FOM Studios, I need help with my photo order ' + OID + '.') + '">WhatsApp us</a>.</div></div>'; });
  })();
}

/* ---------- list of events ---------- */
function eventsView(){
  app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">Loading events...</div></div>';
  get('/sales/events').then(function(j){
    var list = j.events || [];
    app.innerHTML = '<div class="sa-wrap">' + (list.length ? '<div class="sa-events">' + list.map(function(e){
      return '<a class="sa-card" href="photos.html?ev=' + esc(e.id) + '"><div class="im">' + (e.cover ? '<img src="' + img(e.id, 't', e.cover) + '" alt="" loading="lazy">' : '') + '</div><div class="tx"><b>' + esc(e.title) + '</b><div class="sa-soft">' + esc(nice(e.date)) + (e.place ? ', ' + esc(e.place) : '') + '</div><div class="sa-soft">' + e.count + ' photos</div></div></a>';
    }).join('') + '</div>' : '<div class="sa-empty">No events on sale right now. Follow <a href="https://instagram.com/fom_studios_" target="_blank" rel="noopener">@fom_studios_</a> to see when new photos go up.</div>') + '</div>';
  }).catch(function(){ app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">Could not load events. Please refresh.</div></div>'; });
}

/* ---------- one event ---------- */
function matches(){ var n = NUM.toUpperCase(); return n ? EV.photos.filter(function(p){ return (p.nums || []).some(function(x){ return String(x).toUpperCase() === n; }); }) : []; }
function price(items){ var p = +EV.prices.photo || 0, b = +EV.prices.bundle || 0, per = items * p; return b && per > b ? b : per; }
function drawEvent(){
  var m = matches(), show = NUM ? m : (SHOW_ALL ? EV.photos : []), pr = EV.prices || {};
  var h = '<div class="sa-wrap"><div class="sa-head"><div><h2>' + esc(EV.title) + '</h2><p class="sa-soft">' + esc(nice(EV.date)) + (EV.place ? ', ' + esc(EV.place) : '') + ' · ' + EV.photos.length + ' photos</p>' + (EV.about ? '<p class="sa-soft" style="margin-top:6px;max-width:640px">' + esc(EV.about) + '</p>' : '') + '</div>' +
    '<div class="sa-price">' + (pr.photo ? R(pr.photo) + ' a photo' : '') + (pr.bundle ? (pr.photo ? ' · ' : '') + 'all of you ' + R(pr.bundle) : '') + '</div></div>' +
    '<form class="sa-search" id="saFind"><input id="saNum" placeholder="' + esc(EV.numLabel || 'Your race number') + '" value="' + esc(NUM) + '" inputmode="text" autocomplete="off" aria-label="Your number"><button class="sa-btn" type="submit">Find my photos</button></form>';
  if(NUM){
    if(m.length && pr.bundle) h += '<div class="sa-bundle"><div><b style="font-size:18px">' + m.length + ' photo' + (m.length === 1 ? '' : 's') + ' of #' + esc(NUM) + '</b><div style="opacity:.8;font-size:14px">Get every one, full size, for ' + R(pr.bundle) + (pr.photo && m.length * pr.photo > pr.bundle ? ' (save ' + R(m.length * pr.photo - pr.bundle) + ')' : '') + '</div></div><button class="sa-btn" type="button" id="saAllMe">Get all ' + m.length + ' for ' + R(pr.bundle) + '</button></div>';
    if(!m.length) h += '<div class="sa-empty" style="margin-bottom:14px">No photos with #' + esc(NUM) + ' yet. We are still tagging, so check again later or browse all the photos below.</div>';
  }
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px"><button class="sa-btn alt" type="button" id="saToggle">' + (NUM ? 'Browse all photos' : SHOW_ALL ? 'Hide all photos' : 'Browse all ' + EV.photos.length + ' photos') + '</button></div>';
  if(NUM && !m.length && SHOW_ALL) show = EV.photos;
  h += '<div class="sa-grid">' + show.map(function(p){ var on = CART.indexOf(p.n) >= 0; return '<div class="sa-ph' + (on ? ' on' : '') + '" data-n="' + esc(p.n) + '"><img src="' + img(EV.id, 't', p.n) + '" alt="Event photo" loading="lazy">' + ((p.nums || []).length ? '<div class="sa-nums">' + p.nums.slice(0, 3).map(function(x){ return '<span>#' + esc(x) + '</span>'; }).join('') + '</div>' : '') + '<button type="button" class="sa-pick" aria-label="' + (on ? 'Remove' : 'Add') + '">' + (on ? '✓' : '+') + '</button></div>'; }).join('') + '</div>';
  h += '<p class="sa-soft" style="margin-top:22px">Previews are smaller and carry our watermark. You get the full-size photos without the watermark straight after paying. Questions? <a href="' + waLink('Hi FOM Studios, I have a question about photos from ' + EV.title) + '">WhatsApp us</a>.</p></div>';
  h += CART.length ? '<div class="sa-cart"><span><b>' + CART.length + ' photo' + (CART.length === 1 ? '' : 's') + '</b> · ' + R(price(CART.length)) + '</span><button class="sa-btn" type="button" id="saCheckout">Checkout</button></div>' : '';
  app.innerHTML = h;
  D.getElementById('saFind').onsubmit = function(e){ e.preventDefault(); NUM = D.getElementById('saNum').value.trim().toUpperCase().slice(0, 12); SHOW_ALL = false; track('sale_search', NUM); history.replaceState(null, '', 'photos.html?ev=' + EV.id + (NUM ? '&n=' + encodeURIComponent(NUM) : '')); drawEvent(); };
  D.getElementById('saToggle').onclick = function(){ if(NUM){ NUM = ''; SHOW_ALL = true; } else SHOW_ALL = !SHOW_ALL; drawEvent(); };
  var am = D.getElementById('saAllMe'); if(am) am.onclick = function(){ checkout({ num:NUM }, m.length + ' photos of #' + NUM, pr.bundle); };
  var co = D.getElementById('saCheckout'); if(co) co.onclick = function(){ checkout({ items:CART.slice() }, CART.length + ' photo' + (CART.length === 1 ? '' : 's'), price(CART.length)); };
}
function toggle(n){ var i = CART.indexOf(n); if(i >= 0) CART.splice(i, 1); else CART.push(n); try{ sessionStorage.setItem('fom.cart.' + EV.id, JSON.stringify(CART)); }catch(e){} }
app.addEventListener('click', function(e){
  var ph = e.target.closest('.sa-ph'); if(!ph || !EV) return;
  var n = ph.dataset.n;
  if(e.target.closest('.sa-pick')){ toggle(n); drawEvent(); return; }
  lightbox(n);
});
function lightbox(n){
  var list = (NUM ? matches() : EV.photos), i = list.findIndex(function(p){ return p.n === n; });
  var lb = D.createElement('div'); lb.className = 'sa-lb';
  function draw(){ var p = list[i], on = CART.indexOf(p.n) >= 0;
    lb.innerHTML = '<button class="sa-x" type="button" aria-label="Close">&times;</button><img src="' + img(EV.id, 'p', p.n) + '" alt="Preview"><div class="row"><button class="sa-btn alt" type="button" data-m="-1">‹</button><button class="sa-btn" type="button" data-t="1" style="' + (on ? 'background:#25D366;color:#0b1f12' : 'background:#fff;color:#111') + '">' + (on ? '✓ In your cart' : '+ Add to cart') + '</button><button class="sa-btn alt" type="button" data-m="1">›</button></div>' + (window.FOM_PRINT && FOM_PRINT.live() ? '<button class="sa-btn alt" type="button" data-pr="1" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">🖼 Order a print or frame</button>' : ''); }
  lb.onclick = function(e){ var b = e.target.closest('button');
    if(e.target === lb || (b && b.classList.contains('sa-x'))){ lb.remove(); drawEvent(); return; }
    if(!b) return; if(b.dataset.pr){ var pp = list[i]; FOM_PRINT.open({ src:'ev', ev:EV.id, n:pp.n, thumb:img(EV.id, 't', pp.n), preview:img(EV.id, 'p', pp.n), title:EV.title }); return; } if(b.dataset.m){ i = (i + +b.dataset.m + list.length) % list.length; draw(); } if(b.dataset.t){ toggle(list[i].n); draw(); } };
  draw(); D.body.appendChild(lb);
}
function checkout(sel, label, amount){
  var s = D.createElement('div'); s.className = 'sa-sheet';
  var saved = {}; try{ saved = JSON.parse(localStorage.getItem('fom.buyer') || '{}'); }catch(e){}
  s.innerHTML = '<form><h3 style="font-size:22px">Checkout</h3><p class="sa-soft">' + esc(label) + ' from ' + esc(EV.title) + ' · <b>' + R(amount) + '</b></p>' +
    '<label for="sbName">Your name</label><input id="sbName" autocomplete="name" required value="' + esc(saved.name || '') + '">' +
    '<label for="sbEmail">Email (we send your download link here)</label><input id="sbEmail" type="email" autocomplete="email" required value="' + esc(saved.email || '') + '">' +
    '<label for="sbPhone">WhatsApp number (optional)</label><input id="sbPhone" type="tel" autocomplete="tel" value="' + esc(saved.phone || '') + '">' +
    '<p class="sa-soft" style="font-size:12.5px;margin-top:10px">We only use your details to send your photos and help with this order (POPIA). Card payment is handled securely by Yoco.</p>' +
    '<div class="sa-err" id="sbErr"></div><div style="display:flex;gap:10px;margin-top:16px"><button class="sa-btn alt" type="button" id="sbBack">Back</button><button class="sa-btn" type="submit" id="sbPay" style="flex:1;background:#25D366;color:#0b1f12">Pay ' + R(amount) + ' with card</button></div></form>';
  D.body.appendChild(s);
  s.onclick = function(e){ if(e.target === s) s.remove(); };
  D.getElementById('sbBack').onclick = function(){ s.remove(); };
  s.querySelector('form').onsubmit = function(e){
    e.preventDefault();
    var buyer = { name:D.getElementById('sbName').value.trim(), email:D.getElementById('sbEmail').value.trim(), phone:D.getElementById('sbPhone').value.trim() };
    try{ localStorage.setItem('fom.buyer', JSON.stringify(buyer)); }catch(x){}
    var btn = D.getElementById('sbPay'); btn.disabled = true; btn.textContent = 'Opening secure payment...';
    track('sale_checkout', label + ' ' + R(amount));
    fetch(W + '/sales/checkout', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(Object.assign({ ev:EV.id, buyer:buyer, preview:/[?&]preview=1/.test(location.search) }, sel)) })
      .then(function(r){ return r.json(); }).then(function(j){ if(j.redirectUrl) location.href = j.redirectUrl; else throw new Error(j.error || 'Could not start the payment.'); })
      .catch(function(x){ D.getElementById('sbErr').textContent = x.message; btn.disabled = false; btn.textContent = 'Pay ' + R(amount) + ' with card'; });
  };
}
function eventView(){
  app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">Loading photos...</div></div>';
  get('/sales/event?ev=' + EVID + (Q.get('preview') ? '&preview=1' : '')).then(function(ev){
    EV = ev; EV.photos = EV.photos || []; EV.prices = EV.prices || {};
    try{ CART = JSON.parse(sessionStorage.getItem('fom.cart.' + EV.id) || '[]').filter(function(n){ return EV.photos.some(function(p){ return p.n === n; }); }); }catch(e){ CART = []; }
    NUM = (Q.get('n') || '').toUpperCase().slice(0, 12);
    D.title = EV.title + ' photos | FOM Studios';
    var hh = D.getElementById('saHero'); if(hh) hh.innerHTML = '<span class="eyebrow">Event photos</span><h1>Find your photos</h1><p>Type your number, pick your favourites and download them full size straight after paying.</p>';
    drawEvent();
  }).catch(function(){ app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">This event is not on sale. <a href="photos.html">See all events</a>.</div></div>'; });
}
function soon(){ app.innerHTML = '<div class="sa-wrap"><div class="sa-empty">Event photo sales open soon 📸 Follow <a href="https://instagram.com/fom_studios_" target="_blank" rel="noopener">@fom_studios_</a> to know when.</div></div>'; }
function route(){ if(OID && KEY) orderView(); else if(!(Q.get('preview') || D.documentElement.classList.contains('sales-on'))) soon(); else if(EVID) eventView(); else eventsView(); }
fetch(W + '/sales/live').then(function(r){ return r.json(); }).then(function(j){ D.documentElement.classList.toggle('sales-on', !!j.live); route(); }).catch(route);
})();
