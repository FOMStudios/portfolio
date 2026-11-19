/* FOM Studios - prints and framing cart (shared by prints.html, photos.html and client-gallery.html)
   FOM_PRINT.open({ src:'ev'|'gallery', ev, g, n, thumb, preview, title, digital })  opens the product sheet.
   Sizes, finishes (print, framed, canvas), prices and delivery come from the dashboard (Photo Sales, Print settings)
   through the gallery Worker /sales/shop. Checkout: /sales/print-checkout (Yoco). FOM Studios only. */
(function(){
'use strict';
if(/\/shotbya\//.test(location.pathname)) return;
var W = 'https://fom-gallery.cold-moon-d65c.workers.dev', D = document, KEY = 'fom.printcart';
var CFG = null, CART = [];
var PREVIEW = /[?&]preview=1/.test(location.search);
try{ CART = JSON.parse(localStorage.getItem(KEY) || '[]'); }catch(e){ CART = []; }
function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function R(n){ return 'R' + Math.round(+n || 0).toLocaleString('en-ZA'); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(CART)); }catch(e){} badge(); }
function price(size, fin){ return CFG ? +((CFG.prices || {})[size + '|' + fin]) || 0 : 0; }
function cfg(){ return CFG ? Promise.resolve(CFG) : fetch(W + '/sales/shop', { cache:'no-store' }).then(function(r){ return r.json(); }).then(function(j){ CFG = j.cfg || {}; CFG.sizes = CFG.sizes || []; CFG.finishes = CFG.finishes || []; CFG.delivery = CFG.delivery || []; window.FOM_PRINT.shop = j.shop; return CFG; }); }
function track(t){ try{ if(window.FOM_TRACK) FOM_TRACK(t); }catch(e){} }
function avail(){ var out = []; (CFG.sizes || []).forEach(function(s){ (CFG.finishes || []).forEach(function(f){ if(price(s.id, f.id)) out.push([s, f]); }); }); return out; }

var css = D.createElement('style');
css.textContent = [
'.pc-sheet{position:fixed;inset:0;z-index:3200;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}',
'@media(min-width:760px){.pc-sheet{align-items:center}}',
'.pc-box{background:#f1f0ec;color:#2a2b2c;width:min(560px,100%);max-height:94vh;overflow:auto;border-radius:24px 24px 0 0;padding:20px 20px 26px;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}',
'@media(min-width:760px){.pc-box{border-radius:24px}}',
'.pc-box h3{font-size:21px;margin:0 0 4px}.pc-soft{color:#6f6f6d;font-size:13.5px}',
'.pc-img{width:100%;max-height:44vh;object-fit:contain;border-radius:12px;background:#ddd;margin:10px 0}',
'.pc-lbl{display:block;font-size:12.5px;font-weight:800;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em;color:#6f6f6d}',
'.pc-opts{display:flex;flex-wrap:wrap;gap:8px}',
'.pc-opt{border:1px solid #dcdad3;background:#fafaf9;border-radius:999px;padding:9px 14px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;color:#2a2b2c}',
'.pc-opt.on{background:#111;border-color:#111;color:#fff}.pc-opt:disabled{opacity:.35;cursor:default}',
'.pc-row{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:16px}',
'.pc-btn{border:0;background:#111;color:#fff;font:inherit;font-weight:800;font-size:15px;border-radius:999px;padding:13px 20px;cursor:pointer}',
'.pc-btn.alt{background:#fafaf9;color:#2a2b2c;border:1px solid #dcdad3}.pc-btn.go{background:#25D366;color:#0b1f12}.pc-btn:disabled{opacity:.5}',
'.pc-x{float:right;background:none;border:0;font-size:30px;line-height:1;cursor:pointer;color:#2a2b2c}',
'.pc-item{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #dcdad3}',
'.pc-item img{width:64px;height:48px;object-fit:cover;border-radius:8px;background:#ddd;flex:none}.pc-item div{flex:1;font-size:14px}',
'.pc-item button{border:0;background:none;font-size:18px;cursor:pointer;color:#6f6f6d}',
'.pc-in{width:100%;border:1px solid #dcdad3;border-radius:12px;padding:11px 12px;font:inherit;background:#fafaf9;margin-bottom:8px;box-sizing:border-box}',
'.pc-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
'.pc-err{color:#b3261e;font-weight:700;font-size:14px;margin-top:8px}',
'.pc-fab{position:fixed;right:16px;bottom:16px;z-index:950;background:#111;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);display:none}',
'.pc-fab.on{display:block}',
'.pc-tabs{display:flex;gap:6px;margin:10px 0 0}.pc-tabs button{flex:1}',
'.pc-ed{display:inline-block;background:#111;color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:800;margin-top:6px}.pc-ed.out{background:#b3261e}',
'.pc-wall{position:relative;width:100%;aspect-ratio:4/3;margin:10px 0;border-radius:12px;overflow:hidden;background:linear-gradient(180deg,#e9e4dc 0%,#e2dcd2 72%,#b9a58c 72%,#a68f74 100%)}',
'.pc-wall .light{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,rgba(255,255,255,.55),transparent 60%)}',
'.pc-wall .sofa{position:absolute;left:10%;right:10%;bottom:14%;height:24%;background:#5d6b63;border-radius:14px 14px 6px 6px;box-shadow:0 10px 18px rgba(0,0,0,.18)}',
'.pc-wall .sofa:before{content:"";position:absolute;left:-5%;right:-5%;bottom:0;height:55%;background:#53605a;border-radius:12px}',
'.pc-wall .sofa:after{content:"";position:absolute;left:6%;right:6%;bottom:-14%;height:14%;background:repeating-linear-gradient(90deg,transparent 0 8%,#3b332b 8% 10%,transparent 10% 90%,#3b332b 90% 92%,transparent 92%)}',
'.pc-wall .art{position:absolute;left:50%;transform:translateX(-50%);bottom:46%;box-shadow:0 12px 22px rgba(0,0,0,.25);box-sizing:border-box}',
'.pc-wall .art img{display:block;width:100%;height:100%;object-fit:cover}',
'.pc-wall .tag{position:absolute;left:10px;bottom:8px;background:rgba(255,255,255,.85);border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:700}',
'.pc-vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}'
].join('\n');
D.head.appendChild(css);
var fab = D.createElement('button'); fab.className = 'pc-fab'; fab.type = 'button'; fab.onclick = function(){ openCart(); };
D.addEventListener('DOMContentLoaded', function(){ D.body.appendChild(fab); badge(); });
if(D.body) D.body.appendChild(fab);
D.addEventListener('fom-sales-live', function(){ badge(); });
function badge(){ var n = CART.reduce(function(a, x){ return a + (x.digital ? 1 : x.qty || 1); }, 0); fab.textContent = '🖼 Cart · ' + n; fab.classList.toggle('on', n > 0 && window.FOM_PRINT && FOM_PRINT.live()); }
function sheet(html){ var s = D.createElement('div'); s.className = 'pc-sheet'; s.innerHTML = '<div class="pc-box">' + html + '</div>'; s.onclick = function(e){ if(e.target === s || e.target.classList.contains('pc-x')) s.remove(); }; D.body.appendChild(s); return s; }

/* ---------- wall mock-up: the print on a living room wall, sized next to a sofa ---------- */
function frameOf(fin){ var l = String(fin && fin.label || fin || '').toLowerCase();
  if(/canvas/.test(l)) return { border:'0', pad:'0', shadow:'4px 6px 0 rgba(0,0,0,.18), 0 12px 22px rgba(0,0,0,.25)' };
  if(/black/.test(l)) return { border:'6px solid #141414', pad:'7%', bg:'#fff' };
  if(/white/.test(l)) return { border:'6px solid #f7f7f5', pad:'7%', bg:'#fff' };
  if(/oak|wood/.test(l)) return { border:'6px solid #b38a5c', pad:'7%', bg:'#fff' };
  if(/frame/.test(l)) return { border:'6px solid #222', pad:'7%', bg:'#fff' };
  return { border:'0', pad:'0' }; }
function dims(size){ var l = String(size && size.label || '').toUpperCase(), cm = /(\d+(?:[.,]\d+)?)\s*X\s*(\d+(?:[.,]\d+)?)/.exec(l);
  if(cm){ var a = parseFloat(cm[1].replace(',', '.')), b = parseFloat(cm[2].replace(',', '.')); return [Math.min(a, b), Math.max(a, b)]; }
  var m = /A(\d)/.exec(l), A = { 0:[84,119], 1:[59,84], 2:[42,59], 3:[30,42], 4:[21,30], 5:[15,21] };
  return m && A[m[1]] ? A[m[1]] : [30, 42]; }
function wall(src, size, fin, ratio){
  // the couch is 2 m wide and fills 80% of the view, so 1% of the width = 2.5 cm: the print is drawn to scale
  var f = frameOf(fin), d = dims(size), land = (ratio || 1) >= 1, wcm = land ? d[1] : d[0], hcm = land ? d[0] : d[1];
  var framed = f.pad !== '0', extra = framed ? 6 : 0;   // a frame adds about 3 cm on each side
  var w = (wcm + extra) / 2.5;
  return '<div class="pc-wall"><div class="light"></div><div class="sofa"></div><div class="art" style="width:' + w.toFixed(1) + '%;aspect-ratio:' + (wcm + extra) + '/' + (hcm + extra) + ';border:' + f.border + ';background:' + (f.bg || 'transparent') + (f.shadow ? ';box-shadow:' + f.shadow : '') + '"><div style="position:absolute;inset:' + (framed ? '9%' : '0') + ';overflow:hidden;' + (framed ? 'box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)' : '') + '"><img src="' + esc(src) + '" alt=""></div></div><span class="tag">' + esc((size ? size.label : '') + (fin ? ', ' + fin.label : '')) + ' · to scale</span></div>'; }

/* ---------- product sheet ---------- */
function open(it){
  cfg().then(function(){
    var av = avail(), sizes = (CFG.sizes || []).filter(function(s){ return av.some(function(a){ return a[0].id === s.id; }); });
    var sel = { size: sizes[0] && sizes[0].id, finish: '', qty: 1, view: 'photo' };
    var left = it.edition ? Math.max(0, it.edition - (it.sold || 0)) : null, soldOut = left === 0;
    var ratio = 0.75; (function(){ var im = new Image(); im.onload = function(){ ratio = im.naturalWidth / im.naturalHeight; if(sel.view === 'wall') draw(); }; im.src = it.preview || it.thumb; })();
    var dig = +it.digital || 0;
    if(!sizes.length && !dig){ sheet('<button class="pc-x" type="button">&times;</button><h3>Prints coming soon</h3><p class="pc-soft">We are setting up prints and framing. WhatsApp us to order one now.</p>'); return; }
    track('print_open');
    var s = sheet('<div id="pcBody"></div>');
    function fins(){ return (CFG.finishes || []).filter(function(f){ return price(sel.size, f.id); }); }
    function draw(){
      if(!fins().some(function(f){ return f.id === sel.finish; })) sel.finish = (fins()[0] || {}).id;
      var p = sel.size && sel.finish ? price(sel.size, sel.finish) : 0;
      s.querySelector('#pcBody').innerHTML = '<button class="pc-x" type="button">&times;</button><h3>' + esc(it.title || 'Order a print') + '</h3><p class="pc-soft">' + esc(CFG.note || 'Printed by a professional lab and checked by us before it goes out.') + '</p>' +
        (it.edition ? '<span class="pc-ed' + (soldOut ? ' out' : '') + '">' + (soldOut ? 'Sold out' : 'Limited edition of ' + it.edition + ' · ' + left + ' left') + '</span>' : '') +
        (sizes.length && !soldOut ? '<div class="pc-tabs"><button type="button" class="pc-opt' + (sel.view === 'photo' ? ' on' : '') + '" data-view="photo">Photo</button><button type="button" class="pc-opt' + (sel.view === 'wall' ? ' on' : '') + '" data-view="wall">On a wall</button></div>' : '') +
        (sel.view === 'wall' ? wall(it.preview || it.thumb, (CFG.sizes || []).find(function(z){ return z.id === sel.size; }), (CFG.finishes || []).find(function(z){ return z.id === sel.finish; }), ratio) : '<img class="pc-img" src="' + esc(it.preview || it.thumb) + '" alt="">') +
        (sizes.length && !soldOut ? '<span class="pc-lbl">Size</span><div class="pc-opts">' + sizes.map(function(z){ return '<button type="button" class="pc-opt' + (z.id === sel.size ? ' on' : '') + '" data-size="' + esc(z.id) + '">' + esc(z.label) + '</button>'; }).join('') + '</div>' +
        '<span class="pc-lbl">Finish</span><div class="pc-opts">' + fins().map(function(f){ return '<button type="button" class="pc-opt' + (f.id === sel.finish ? ' on' : '') + '" data-fin="' + esc(f.id) + '">' + esc(f.label) + ' · ' + R(price(sel.size, f.id)) + '</button>'; }).join('') + '</div>' +
        '<div class="pc-row"><div class="pc-opts"><button type="button" class="pc-opt" data-q="-1">−</button><b style="padding:9px 6px">' + sel.qty + '</b><button type="button" class="pc-opt" data-q="1">+</button></div><b style="font-size:20px">' + R(p * sel.qty) + '</b></div>' +
        '<div class="pc-row"><button type="button" class="pc-btn alt" data-cart="1">Add to cart</button><button type="button" class="pc-btn go" data-buy="1" style="flex:1">Order now</button></div>' : '') +
        (dig ? '<div class="pc-row" style="border-top:1px solid #dcdad3;padding-top:14px"><div><b>Digital download</b><div class="pc-soft">Full size, no watermark, for personal use</div></div><button type="button" class="pc-btn alt" data-dig="1">' + R(dig) + '</button></div>' : '');
    }
    s.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b) return;
      if(b.dataset.size){ sel.size = b.dataset.size; draw(); }
      if(b.dataset.fin){ sel.finish = b.dataset.fin; draw(); }
      if(b.dataset.q){ sel.qty = Math.max(1, Math.min(left != null ? Math.max(1, left) : 10, sel.qty + +b.dataset.q)); draw(); }
      if(b.dataset.view){ sel.view = b.dataset.view; draw(); }
      if(b.dataset.cart || b.dataset.buy){
        CART.push({ src:it.src, ev:it.ev, g:it.g, n:it.n, thumb:it.thumb, title:it.title + (it.edition ? ' (limited edition)' : ''), size:sel.size, finish:sel.finish, qty:sel.qty, price:price(sel.size, sel.finish) }); save(); track('print_add');
        s.remove(); if(b.dataset.buy) openCart(); else toast('Added to your cart');
      }
      if(b.dataset.dig){ if(!CART.some(function(x){ return x.digital && x.n === it.n && x.ev === it.ev; })) CART.push({ src:'ev', ev:it.ev, n:it.n, thumb:it.thumb, title:it.title, digital:true, price:dig }); save(); s.remove(); openCart(); }
    });
    draw();
  }).catch(function(){ alert('Could not load print options. Please try again.'); });
}
function toast(m){ var t = D.createElement('div'); t.textContent = m; t.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#111;color:#fff;padding:11px 18px;border-radius:999px;font-weight:700;z-index:3300;font-family:-apple-system,Arial,sans-serif'; D.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2200); }

/* ---------- cart and checkout ---------- */
function label(x){ if(x.digital) return 'Digital download'; var s = (CFG.sizes || []).find(function(z){ return z.id === x.size; }), f = (CFG.finishes || []).find(function(z){ return z.id === x.finish; }); return (s ? s.label : x.size) + ', ' + (f ? f.label : x.finish) + (x.qty > 1 ? ' x' + x.qty : ''); }
function openCart(){
  cfg().then(function(){
    var saved = {}; try{ saved = JSON.parse(localStorage.getItem('fom.buyer') || '{}'); }catch(e){}
    var dv = (CFG.delivery || []).filter(function(d){ return d.on; }), pick = saved.delivery && dv.some(function(d){ return d.id === saved.delivery; }) ? saved.delivery : (dv[0] || {}).id;
    var s = sheet('<div id="pcCart"></div>');
    function draw(){
      var prints = CART.filter(function(x){ return !x.digital; }), d = dv.find(function(x){ return x.id === pick; });
      var sub = CART.reduce(function(a, x){ return a + (x.price || 0) * (x.digital ? 1 : x.qty || 1); }, 0), fee = prints.length && d ? +d.fee || 0 : 0;
      var a = saved.address || {};
      s.querySelector('#pcCart').innerHTML = '<button class="pc-x" type="button">&times;</button><h3>Your cart</h3>' +
        (CART.length ? CART.map(function(x, i){ return '<div class="pc-item"><img src="' + esc(x.thumb) + '" alt=""><div><b>' + esc(x.title || 'Photo') + '</b><div class="pc-soft">' + esc(label(x)) + '</div></div><b>' + R((x.price || 0) * (x.digital ? 1 : x.qty || 1)) + '</b><button type="button" data-rm="' + i + '" aria-label="Remove">✕</button></div>'; }).join('') : '<p class="pc-soft" style="margin:14px 0">Your cart is empty.</p>') +
        (prints.length ? '<span class="pc-lbl">Get your prints</span><div class="pc-opts">' + dv.map(function(x){ return '<button type="button" class="pc-opt' + (x.id === pick ? ' on' : '') + '" data-dv="' + esc(x.id) + '">' + esc(x.label) + (x.fee ? ' · ' + R(x.fee) : ' · Free') + '</button>'; }).join('') + '</div>' +
          (pick && pick !== 'collect' ? '<div style="margin-top:10px"><input class="pc-in" id="pcSt" placeholder="Street address" autocomplete="street-address" value="' + esc(a.street || '') + '"><div class="pc-two"><input class="pc-in" id="pcSu" placeholder="Suburb" value="' + esc(a.suburb || '') + '"><input class="pc-in" id="pcCi" placeholder="City" autocomplete="address-level2" value="' + esc(a.city || '') + '"></div><div class="pc-two"><input class="pc-in" id="pcCo" placeholder="Postal code" inputmode="numeric" autocomplete="postal-code" value="' + esc(a.code || '') + '"><input class="pc-in" id="pcPr" placeholder="Province" value="' + esc(a.province || 'Gauteng') + '"></div><input class="pc-in" id="pcNo" placeholder="Notes for delivery (optional)" value="' + esc(a.notes || '') + '"></div>' : (d && d.note ? '<p class="pc-soft" style="margin-top:8px">' + esc(d.note) + '</p>' : '')) : '') +
        (CART.length ? '<span class="pc-lbl">Your details</span><input class="pc-in" id="pcNa" placeholder="Name" autocomplete="name" value="' + esc(saved.name || '') + '"><input class="pc-in" id="pcEm" type="email" placeholder="Email" autocomplete="email" value="' + esc(saved.email || '') + '"><input class="pc-in" id="pcPh" type="tel" placeholder="WhatsApp number' + (prints.length ? '' : ' (optional)') + '" autocomplete="tel" value="' + esc(saved.phone || '') + '">' +
          '<p class="pc-soft" style="font-size:12.5px">We only use your details for this order (POPIA). Card payment is handled securely by Yoco.' + (prints.length && CFG.turnaround ? ' Prints are usually ready in ' + esc(CFG.turnaround) + '.' : '') + '</p>' +
          '<div class="pc-row"><span>Total' + (fee ? ' incl. ' + R(fee) + ' delivery' : '') + '</span><b style="font-size:22px">' + R(sub + fee) + '</b></div><div class="pc-err" id="pcErr"></div>' +
          '<div class="pc-row"><button type="button" class="pc-btn alt" id="pcMore">Keep looking</button><button type="button" class="pc-btn go" id="pcPay" style="flex:1">Pay ' + R(sub + fee) + '</button></div>' : '');
      var more = s.querySelector('#pcMore'); if(more) more.onclick = function(){ s.remove(); };
      var pay = s.querySelector('#pcPay'); if(pay) pay.onclick = function(){ checkout(s, pick, sub + fee); };
    }
    s.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return;
      if(b.dataset.rm){ CART.splice(+b.dataset.rm, 1); save(); draw(); }
      if(b.dataset.dv){ keep(s); pick = b.dataset.dv; try{ saved = JSON.parse(localStorage.getItem('fom.buyer') || '{}'); }catch(x){} draw(); } });
    draw();
  });
}
function val(s, id){ var e = s.querySelector('#' + id); return e ? e.value.trim() : ''; }
function keep(s){ var b = {}; try{ b = JSON.parse(localStorage.getItem('fom.buyer') || '{}'); }catch(e){}
  ['Na:name','Em:email','Ph:phone'].forEach(function(p){ var k = p.split(':'); if(s.querySelector('#pc' + k[0])) b[k[1]] = val(s, 'pc' + k[0]); });
  if(s.querySelector('#pcSt')) b.address = { street:val(s,'pcSt'), suburb:val(s,'pcSu'), city:val(s,'pcCi'), code:val(s,'pcCo'), province:val(s,'pcPr'), notes:val(s,'pcNo') };
  try{ localStorage.setItem('fom.buyer', JSON.stringify(b)); }catch(e){} return b; }
function checkout(s, pick, total){
  var b = keep(s); b.delivery = pick; try{ localStorage.setItem('fom.buyer', JSON.stringify(b)); }catch(e){}
  var btn = s.querySelector('#pcPay'); btn.disabled = true; btn.textContent = 'Opening secure payment...';
  track('print_checkout');
  fetch(W + '/sales/print-checkout', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({
    items: CART.map(function(x){ return { src:x.src, ev:x.ev, g:x.g, n:x.n, size:x.size, finish:x.finish, qty:x.qty, digital:!!x.digital }; }),
    delivery: { id:pick, address:b.address }, buyer: { name:b.name, email:b.email, phone:b.phone }, back: location.href.split('#')[0], from: location.pathname.split('/').pop(), preview: PREVIEW }) })
    .then(function(r){ return r.json(); }).then(function(j){ if(!j.redirectUrl) throw new Error(j.error || 'Could not start the payment.'); location.href = j.redirectUrl; /* the cart is cleared on the order page once paid */ })
    .catch(function(e){ s.querySelector('#pcErr').textContent = e.message; btn.disabled = false; btn.textContent = 'Pay ' + R(total); });
}
/* ---------- gift vouchers ---------- */
function gift(pre){
  cfg().then(function(){
    var opts = CFG.vouchers || [], pick = pre || (opts[0] && opts[0].id) || 'custom', saved = {}; try{ saved = JSON.parse(localStorage.getItem('fom.buyer') || '{}'); }catch(e){}
    var s = sheet('<div id="pcGift"></div>');
    function amt(){ var o = opts.find(function(x){ return x.id === pick; }); return o ? +o.amount : Math.round(+((s.querySelector('#gvAmt') || {}).value || 0)); }
    function draw(){
      s.querySelector('#pcGift').innerHTML = '<button class="pc-x" type="button">&times;</button><h3>Gift voucher 🎁</h3><p class="pc-soft">Emailed straight away with a code. Works on shoots and prints for 12 months, and any balance stays on the code.</p>' +
        '<span class="pc-lbl">Choose</span><div class="pc-opts">' + opts.map(function(o){ return '<button type="button" class="pc-opt' + (o.id === pick ? ' on' : '') + '" data-v="' + esc(o.id) + '">' + esc(o.label) + ' · ' + R(o.amount) + '</button>'; }).join('') + (CFG.voucherCustom ? '<button type="button" class="pc-opt' + (pick === 'custom' ? ' on' : '') + '" data-v="custom">Own amount</button>' : '') + '</div>' +
        (pick === 'custom' ? '<input class="pc-in" id="gvAmt" inputmode="numeric" placeholder="Amount in Rand (from R' + (CFG.voucherMin || 100) + ')" style="margin-top:8px">' : '') +
        '<span class="pc-lbl">Who is it for?</span><div class="pc-two"><input class="pc-in" id="gvTo" placeholder="Their name"><input class="pc-in" id="gvFrom" placeholder="From" value="' + esc(saved.name || '') + '"></div>' +
        '<input class="pc-in" id="gvMsg" placeholder="A short message (optional)" maxlength="240"><input class="pc-in" id="gvToEm" type="email" placeholder="Their email, to send it to them (optional)">' +
        '<span class="pc-lbl">Your details</span><input class="pc-in" id="pcNa" placeholder="Your name" value="' + esc(saved.name || '') + '"><input class="pc-in" id="pcEm" type="email" placeholder="Your email (you get a copy)" value="' + esc(saved.email || '') + '"><input class="pc-in" id="pcPh" type="tel" placeholder="WhatsApp number (optional)" value="' + esc(saved.phone || '') + '">' +
        '<div class="pc-err" id="pcErr"></div><div class="pc-row"><button type="button" class="pc-btn alt" data-close="1">Cancel</button><button type="button" class="pc-btn go" id="gvPay" style="flex:1">Pay ' + (pick === 'custom' ? '' : R(amt())) + '</button></div>';
      var a = s.querySelector('#gvAmt'); if(a) a.oninput = function(){ s.querySelector('#gvPay').textContent = 'Pay ' + (amt() ? R(amt()) : ''); };
      s.querySelector('#gvPay').onclick = function(){
        var b = keep(s), btn = this; btn.disabled = true; btn.textContent = 'Opening secure payment...'; track('gift_checkout');
        fetch(W + '/sales/voucher-checkout', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ id:pick === 'custom' ? '' : pick, amount:amt(), to:val(s, 'gvTo'), from:val(s, 'gvFrom'), msg:val(s, 'gvMsg'), toEmail:val(s, 'gvToEm'), buyer:{ name:b.name, email:b.email, phone:b.phone }, preview:PREVIEW }) })
          .then(function(r){ return r.json(); }).then(function(j){ if(!j.redirectUrl) throw new Error(j.error || 'Could not start the payment.'); location.href = j.redirectUrl; })
          .catch(function(e){ s.querySelector('#pcErr').textContent = e.message; btn.disabled = false; btn.textContent = 'Pay ' + R(amt()); });
      };
    }
    s.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; if(b.dataset.v){ pick = b.dataset.v; draw(); } if(b.dataset.close) s.remove(); });
    draw();
  });
}
window.FOM_PRINT = { open:open, openCart:openCart, gift:gift, cfg:cfg, shop:null, clear:function(){ CART = []; save(); }, live:function(){ return PREVIEW || D.documentElement.classList.contains('sales-on'); } };
})();
