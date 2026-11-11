/* FOM Studios: step-by-step "Book a shoot" form (Nov 2026).
   Takes over the Book a shoot popup on every FOM page that loads it (after the page's own script).
   Steps: 1 what are we shooting (cards), 2 package, 3 when and where, 4 your details, then Send on WhatsApp or Send by email.
   The cards, packages and the prices switch come from the dashboard Website page (siteContent/site.bookingForm, via site-data.js).
   Every enquiry is also saved to the dashboard Leads page (Firestore "leads", status "New enquiry") with a phone notification.
   If the Website page switches the step form off, the old simple form stays. */
(function(){
  var modal = document.querySelector('#bookingOverlay .booking-modal'), overlay = document.getElementById('bookingOverlay');
  if(!modal || !overlay) return;

  var WORKER = 'https://fom-gallery.cold-moon-d65c.workers.dev';
  var FB = { apiKey:'AIzaSyCbRXQmIxzVWuFS0CRmDY33qYuzpcVL80A', authDomain:'fom-studios.firebaseapp.com', projectId:'fom-studios', storageBucket:'fom-studios.firebasestorage.app', messagingSenderId:'1049126528829', appId:'1:1049126528829:web:8ed0ea930e0b1579630754' };
  var BREVO = 'https://96e55b7d.sibforms.com/serve/MUIFAOGZYJ5npzv65-wsmw0rzGzlvVrsLtrpQKJJSW_0bptJOWl-2SNXPFv5mujZ6ow-7ZYMDTKyZSVbp-bmpc8OtJSwj6iXVyRfu-lFfDTwAS08ru9flWlLPXeqMj_po4yqus2W7JW-QOujQUpqkvxcm8k_8taFHN8Ib1HtA4JT2jS72FKllyMvkQiYu2B0z9xXfzU_BMLz3pfuvw==';

  /* the same defaults as the dashboard Website page, used until it has been published */
  var DEF = { on:true, showPrices:true,
    cards:[
      { id:'wedding', label:'Wedding', icon:'💍' }, { id:'party', label:'Birthday / Party', icon:'🎉' },
      { id:'corporate', label:'Corporate / Event', icon:'🏢' }, { id:'family', label:'Family / Portrait', icon:'📸' },
      { id:'product', label:'Product / Brand', icon:'📦' }, { id:'sports', label:'Sports', icon:'⚽' }
    ],
    pkgs:[
      { id:'mini', name:'Mini Shoot', detail:'30 minutes, 20 photos or 1 reel', price:'R500' },
      { id:'pb', name:'Photography Bronze', detail:'2 hours, 30-40 photos', price:'R800' },
      { id:'ps', name:'Photography Silver', detail:'4 hours, 40-50 photos', price:'R1300' },
      { id:'pg', name:'Photography Gold', detail:'6 hours, 50-60 photos', price:'R1800' },
      { id:'vb', name:'Videography Bronze', detail:'2 hours, 1 reel', price:'R1000' },
      { id:'vs', name:'Videography Silver', detail:'4 hours, 2 reels', price:'R1700' },
      { id:'vg', name:'Videography Gold', detail:'6 hours, 2 reels and drone', price:'R3000' },
      { id:'cb', name:'Photo & Video Bronze', detail:'2 hours, photos and 1 reel', price:'R1500' },
      { id:'cs', name:'Photo & Video Silver', detail:'4 hours, photos and 2 reels', price:'R2700' },
      { id:'cg', name:'Photo & Video Gold', detail:'6 hours, photos, reels and drone', price:'R4500' },
      { id:'padel', name:'Padel League', detail:'Game day reel and photos every week', price:'R2500/wk', only:['sports'] }
    ] };

  function site(){ return window.FOM_SITE || {}; }
  function cfg(){
    var c = site().bookingForm, d = DEF;
    if(!c || typeof c !== 'object') return d;
    var cards = Array.isArray(c.cards) ? c.cards.filter(function(x){ return x && x.label && !x.off; }) : d.cards;
    var pkgs = Array.isArray(c.pkgs) ? c.pkgs.filter(function(x){ return x && x.name && !x.off; }) : d.pkgs;
    return { on:c.on !== false, showPrices:c.showPrices !== false, cards:cards.length ? cards : d.cards, pkgs:pkgs };
  }
  if(!cfg().on) return;

  var S = fresh(), root;
  function fresh(){ return { step:1, type:'', pkg:'', date:'', area:'', name:'', phone:'', email:'', note:'', sent:'', sending:false }; }
  function esc(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function $(id){ return document.getElementById(id); }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function iso(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nice(v){ var p = String(v || '').split('-'); if(p.length !== 3) return v; var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short', year:'numeric' }); }
  function blocked(v){ var a = site().blocked || []; for(var i = 0; i < a.length; i++){ var x = a[i]; if(x && x.from && v >= x.from && v <= (x.to || x.from)) return x; } return null; }
  function card(){ var c = cfg().cards; for(var i = 0; i < c.length; i++) if(c[i].id === S.type) return c[i]; return S.type === 'other' ? { id:'other', label:'Something else', icon:'✨' } : null; }
  function pkgsFor(t){ return cfg().pkgs.filter(function(p){ return !p.only || !p.only.length || p.only.indexOf(t) >= 0; }); }
  function pkg(){ var p = cfg().pkgs; for(var i = 0; i < p.length; i++) if(p[i].id === S.pkg) return p[i]; return null; }
  function wa(){ return site().wa || '27686901120'; }

  /* ---------- styles (the page's own colours) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#bookingOverlay{z-index:3100}',   /* above the cookie banner (3000), so it never covers the Send buttons */
    '.bw{text-align:left}',
    '.bw-top{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700;color:var(--ink-soft);margin:2px 44px 8px 0}',
    '.bw-bar{height:6px;border-radius:99px;background:var(--line);overflow:hidden;margin-bottom:18px}',
    '.bw-bar i{display:block;height:100%;border-radius:99px;background:var(--accent);transition:width .35s cubic-bezier(.2,.8,.2,1)}',
    '.bw h3{font-size:24px;font-weight:800;margin:0 0 4px;line-height:1.2}',
    '.bw .bw-sub{color:var(--ink-soft);font-size:14px;margin:0 0 16px}',
    '.bw-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.bw-card{border:1.5px solid var(--line);background:#fff;border-radius:16px;padding:16px 10px;cursor:pointer;font:inherit;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;transition:border-color .15s,transform .15s,box-shadow .15s;min-height:104px;justify-content:center}',
    '.bw-card:hover{border-color:var(--accent);box-shadow:0 6px 18px rgba(0,0,0,.06)}',
    '.bw-card:active{transform:scale(.97)}',
    '.bw-card.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent) inset}',
    '.bw-ic{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:rgba(2,54,123,.07)}',
    '.bw-card b{font-size:14.5px;font-weight:800;line-height:1.25}',
    '.bw-list{display:flex;flex-direction:column;gap:8px;max-height:min(52vh,420px);overflow:auto;padding:2px}',
    '.bw-pk{border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:12px 14px;cursor:pointer;font:inherit;color:var(--ink);display:flex;align-items:center;gap:12px;text-align:left;transition:border-color .15s}',
    '.bw-pk:hover{border-color:var(--accent)}',
    '.bw-pk.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent) inset}',
    '.bw-pk span{flex:1;min-width:0}',
    '.bw-pk b{display:block;font-size:15px;font-weight:800}',
    '.bw-pk small{display:block;font-size:13px;color:var(--ink-soft);margin-top:2px}',
    '.bw-pk em{font-style:normal;font-weight:800;font-size:14.5px;white-space:nowrap}',
    '.bw-pk.unsure{border-style:dashed}',
    '.bw-chips{display:flex;gap:8px;flex-wrap:wrap;margin:-4px 0 14px}',
    '.bw-chip{border:1px solid var(--line);background:#fff;border-radius:99px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer}',
    '.bw-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}',
    '.bw-sum{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}',
    '.bw-sum button{border:0;background:rgba(2,54,123,.07);color:var(--ink);border-radius:99px;padding:6px 11px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
    '.bw-next{width:100%;height:52px;border:0;border-radius:99px;background:var(--ink);color:#fff;font:inherit;font-size:15.5px;font-weight:800;cursor:pointer;margin-top:4px}',
    '.bw-foot{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:13px;gap:10px}',
    '.bw-foot button,.bw-foot a{border:0;background:none;color:var(--ink-soft);font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:6px 0;text-decoration:none}',
    '.bw-foot a{color:#1f8a4c}',
    '.bw-msg{font-size:12.5px;color:#c0392b;margin:6px 0 0;min-height:16px}',
    '.bw-hint{font-size:12px;color:var(--ink-soft);margin:2px 0 0}',
    '.bw input[type=date]{-webkit-appearance:none;appearance:none;display:block;min-height:48px;text-align:left}',
    '.bw input[type=date]::-webkit-date-and-time-value{text-align:left;margin:0}',
    '.bw-done{text-align:center;padding:10px 0 4px}',
    '.bw-done .bw-ic{margin:0 auto 12px;width:64px;height:64px;font-size:32px;border-radius:50%;background:rgba(31,138,76,.12)}',
    '.bw-done p{color:var(--ink-soft);font-size:14.5px;margin:6px 0 18px}',
    '.bw-step{animation:bwIn .28s ease}',
    '@keyframes bwIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}',
    '@media(max-width:380px){.bw-grid{gap:8px}.bw-card{min-height:96px;padding:14px 8px}}'
  ].join('');
  document.head.appendChild(css);

  /* keep the page's close button (its click handler lives in the page script), swap everything else */
  [].slice.call(modal.children).forEach(function(el){ if(!el.classList.contains('booking-close')) el.remove(); });
  root = document.createElement('div'); root.className = 'bw'; modal.appendChild(root);

  var TOTAL = 4;
  function render(){
    var st = S.step, h = '';
    if(S.sent){ h = done(); root.innerHTML = h; bind(); return; }
    h += '<div class="bw-top"><span>Step ' + Math.min(st, TOTAL) + ' of ' + TOTAL + '</span><span>Takes 30 seconds</span></div><div class="bw-bar"><i style="width:' + (st / TOTAL * 100) + '%"></i></div><div class="bw-step">';
    if(st === 1){
      h += '<h3>What are we shooting?</h3><p class="bw-sub">Tap one to start.</p><div class="bw-grid">' +
        cfg().cards.map(function(c){ return '<button type="button" class="bw-card' + (S.type === c.id ? ' on' : '') + '" data-type="' + esc(c.id) + '"><span class="bw-ic">' + esc(c.icon || '📷') + '</span><b>' + esc(c.label) + '</b></button>'; }).join('') +
        '<button type="button" class="bw-card' + (S.type === 'other' ? ' on' : '') + '" data-type="other"><span class="bw-ic">✨</span><b>Something else</b></button></div>';
    } else if(st === 2){
      var list = pkgsFor(S.type), sp = cfg().showPrices;
      h += '<h3>Pick a package</h3><p class="bw-sub">' + (sp ? 'Prices exclude transport. ' : '') + 'You can change your mind later.</p><div class="bw-list">' +
        list.map(function(p){ return '<button type="button" class="bw-pk' + (S.pkg === p.id ? ' on' : '') + '" data-pkg="' + esc(p.id) + '"><span><b>' + esc(p.name) + '</b>' + (p.detail ? '<small>' + esc(p.detail) + '</small>' : '') + '</span>' + (sp && p.price ? '<em>' + esc(p.price) + '</em>' : '') + '</button>'; }).join('') +
        '<button type="button" class="bw-pk unsure' + (S.pkg === 'unsure' ? ' on' : '') + '" data-pkg="unsure"><span><b>Not sure yet</b><small>Help me choose the right one</small></span></button></div>';
    } else if(st === 3){
      var today = iso(new Date());
      h += '<h3>When and where?</h3><p class="bw-sub">Both are optional, a rough idea helps.</p>' +
        '<div class="booking-field"><label for="bwDate">Shoot date</label><input type="date" id="bwDate" min="' + today + '" value="' + esc(S.date) + '"><p class="bw-msg" id="bwDateMsg"></p>' + upcomingBlocked(today) + '</div>' +
        '<div class="bw-chips"><button type="button" class="bw-chip' + (!S.date ? ' on' : '') + '" data-nodate="1">Not sure yet</button></div>' +
        '<div class="booking-field"><label for="bwArea">Area or venue</label><input id="bwArea" maxlength="80" placeholder="e.g. Sandton, or the venue name" value="' + esc(S.area) + '" autocomplete="address-level2"></div>' +
        '<button type="button" class="bw-next" data-next="1">Next</button>';
    } else {
      h += '<h3>Where should we reply?</h3><p class="bw-sub">We usually reply within a day.</p>' + summary() +
        '<div class="booking-field"><label for="bwName">Your name</label><input id="bwName" maxlength="80" placeholder="Jane Doe" autocomplete="name" value="' + esc(S.name) + '"></div>' +
        '<div class="booking-field"><label for="bwPhone">WhatsApp number</label><input id="bwPhone" type="tel" maxlength="20" placeholder="082 123 4567" autocomplete="tel" value="' + esc(S.phone) + '"></div>' +
        '<div class="booking-field"><label for="bwEmail">Email</label><input id="bwEmail" type="email" maxlength="100" placeholder="jane@email.com" autocomplete="email" value="' + esc(S.email) + '"></div>' +
        '<div class="booking-field"><label for="bwNote">Anything else? (optional)</label><textarea id="bwNote" rows="3" maxlength="800" placeholder="Times, guest count, the style you love...">' + esc(S.note) + '</textarea></div>' +
        '<p class="booking-field-err" id="bwErr"></p>' +
        '<div class="booking-actions">' +
          '<button class="booking-btn whatsapp" type="button" id="bwWa"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.6 6.3A8.8 8.8 0 0 0 12 4a8.8 8.8 0 0 0-7.6 13.2L3 21l3.9-1.3A8.8 8.8 0 0 0 12 20a8.8 8.8 0 0 0 5.6-15.7zM12 18.3c-1.4 0-2.7-.4-3.9-1.1l-.3-.2-2.7.9.9-2.6-.2-.3A6.9 6.9 0 0 1 12 5.7a6.9 6.9 0 0 1 0 12.6z"/></svg> Send on WhatsApp</button>' +
          '<button class="booking-btn email" type="button" id="bwMail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6l9 7 9-7" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg> <span id="bwMailL">Send by email</span></button>' +
        '</div><p class="booking-note">Sending by email adds you to our mailing list for booking updates and promos.</p>';
    }
    h += '</div><div class="bw-foot">' + (st > 1 ? '<button type="button" data-back="1">&larr; Back</button>' : '<span></span>') + '<a href="https://wa.me/' + wa() + '?text=' + encodeURIComponent(message(true)) + '" target="_blank" rel="noopener" data-chat="1">Prefer to chat? WhatsApp us</a></div>';
    root.innerHTML = h; bind();
  }
  function upcomingBlocked(today){
    var up = (site().blocked || []).filter(function(x){ return x && x.from && (x.to || x.from) >= today; }).slice(0, 3);
    return up.length ? '<p class="bw-hint">Not available: ' + up.map(function(x){ return esc(nice(x.from) + (x.to && x.to !== x.from ? ' to ' + nice(x.to) : '')); }).join('; ') + '</p>' : '';
  }
  function summary(){
    var c = card(), p = pkg(), bits = [];
    if(c) bits.push('<button type="button" data-go="1">' + esc(c.icon || '') + ' ' + esc(c.label) + '</button>');
    if(S.pkg) bits.push('<button type="button" data-go="2">' + esc(p ? p.name : 'Package: not sure') + '</button>');
    bits.push('<button type="button" data-go="3">' + esc(S.date ? nice(S.date) : 'Date: not sure') + (S.area ? ', ' + esc(S.area) : '') + '</button>');
    return '<div class="bw-sum">' + bits.join('') + '</div>';
  }
  function done(){
    return '<div class="bw-done bw-step"><div class="bw-ic">✓</div><h3>Thanks' + (S.name ? ', ' + esc(S.name.split(' ')[0]) : '') + '!</h3><p>' +
      (S.sent === 'wa' ? 'Your message is ready in WhatsApp. Just press send there and we will reply soon.' : 'We have your details and will be in touch within a day.') +
      '</p><button type="button" class="bw-next" data-close="1">Done</button><div class="bw-foot" style="justify-content:center"><a href="book.html" style="color:var(--ink-soft)">Rather talk first? Book a quick call</a></div></div>';
  }
  function keep(){
    ['Date','Area','Name','Phone','Email','Note'].forEach(function(k){ var el = $('bw' + k); if(el) S[k.toLowerCase()] = el.value; });
  }
  function go(n){ keep(); S.step = n; render(); if(modal.scrollTo) modal.scrollTo(0, 0); }
  function bind(){
    root.onclick = function(e){
      var t = e.target.closest('[data-type],[data-pkg],[data-next],[data-back],[data-go],[data-nodate],[data-close]');
      if(!t) return;
      if(t.dataset.type){ S.type = t.dataset.type; if(S.pkg && S.pkg !== 'unsure' && !pkgsFor(S.type).some(function(p){ return p.id === S.pkg; })) S.pkg = ''; go(pkgsFor(S.type).length ? 2 : 3); }
      else if(t.dataset.pkg){ S.pkg = t.dataset.pkg; go(3); }
      else if(t.dataset.next) go(4);
      else if(t.dataset.back) go(S.step === 3 && !pkgsFor(S.type).length ? 1 : S.step - 1);
      else if(t.dataset.go) go(+t.dataset.go);
      else if(t.dataset.nodate){ S.date = ''; var d = $('bwDate'); if(d) d.value = ''; $('bwDateMsg').textContent = ''; t.classList.add('on'); }
      else if(t.dataset.close){ close(); }
    };
    var chat = root.querySelector('[data-chat]'); if(chat) chat.onclick = function(){ keep(); chat.href = 'https://wa.me/' + wa() + '?text=' + encodeURIComponent(message(true)); };
    var d = $('bwDate');
    if(d) d.onchange = function(){
      var b = d.value && blocked(d.value), m = $('bwDateMsg'), nd = root.querySelector('[data-nodate]');
      if(b){ m.textContent = 'Sorry, we are not available on that date' + (b.label ? ' (' + b.label + ')' : '') + '. Please pick another.'; d.value = ''; }
      else m.textContent = '';
      S.date = d.value; if(nd) nd.classList.toggle('on', !d.value);
    };
    root.oninput = function(e){ if(e.target.closest('.booking-field')){ var er = $('bwErr'); if(er) er.textContent = ''; e.target.classList.remove('bad'); } };
    var w = $('bwWa'); if(w) w.onclick = sendWa;
    var em = $('bwMail'); if(em) em.onclick = sendMail;
  }

  /* ---------- the message, laid out so the dashboard WhatsApp enquiry reader fills every box ---------- */
  function message(partial){
    keep();
    var c = card(), p = pkg(), L = [];
    L.push('Hi FOM Studios' + (S.name.trim() ? ", I'm " + S.name.trim() : '') + '.');
    if(partial && !c){ L.push("I'd like to book a shoot."); return L.join('\n'); }
    L.push("I'd like to book a shoot:");
    if(c) L.push('Shoot: ' + c.label);
    if(S.pkg) L.push('Package: ' + (p ? p.name + (cfg().showPrices && p.price ? ' (' + p.price + ')' : '') : 'Not sure yet, please help me choose'));
    if(S.date) L.push('Date: ' + nice(S.date)); else if(!partial) L.push('Date: not sure yet');
    if(S.area.trim()) L.push('Area: ' + S.area.trim());
    if(S.phone.trim()) L.push('WhatsApp: ' + S.phone.trim());
    if(S.email.trim()) L.push('Email: ' + S.email.trim());
    if(S.note.trim()) L.push('Note: ' + S.note.trim());
    return L.join('\n');
  }
  function err(t, id){ var e = $('bwErr'); if(e) e.textContent = t || ''; if(id && $(id)) $(id).focus(); }
  function check(needEmail){
    keep(); err('');
    if(!S.name.trim()){ err('Please add your name.', 'bwName'); return false; }
    var em = S.email.trim();
    if(needEmail && !em){ err('Please add your email so we can reply.', 'bwEmail'); return false; }
    if(em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){ err('That email does not look right.', 'bwEmail'); return false; }
    if(needEmail === false && S.phone.trim() && S.phone.replace(/\D/g, '').length < 9){ err('That WhatsApp number looks too short.', 'bwPhone'); return false; }
    return true;
  }
  function sendWa(){
    if(S.sending || !check(false)) return;
    var text = message(false);
    window.open('https://wa.me/' + wa() + '?text=' + encodeURIComponent(text), '_blank');   // must open straight from the tap
    saveLead('whatsapp', text);
    S.sent = 'wa'; render();
  }
  async function sendMail(){
    if(S.sending || !check(true)) return;
    S.sending = true; var b = $('bwMail'), l = $('bwMailL'); if(b) b.disabled = true; if(l) l.textContent = 'Sending...';
    var text = message(false);
    try{ await brevo({ EMAIL:S.email.trim(), MESSAGE:'From ' + S.name.trim() + ': ' + text.replace(/\n/g, ' | ') }); }catch(e){}
    await saveLead('email', text);
    S.sending = false; S.sent = 'email'; render();
  }
  function brevo(fields){
    return new Promise(function(resolve){
      var n = 'brevo-submit-' + Date.now(), f = document.createElement('iframe'); f.name = n; f.style.display = 'none'; document.body.appendChild(f);
      var form = document.createElement('form'); form.method = 'POST'; form.action = BREVO; form.target = n; form.style.display = 'none';
      var data = Object.assign({}, fields, { email_address_check:'', locale:'en' });
      Object.keys(data).forEach(function(k){ var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = data[k]; form.appendChild(i); });
      document.body.appendChild(form); form.submit();
      setTimeout(function(){ resolve(); form.remove(); f.remove(); }, 900);
    });
  }
  /* saved to the dashboard Leads page; never blocks the client (WhatsApp or email still reaches you) */
  async function saveLead(via, text){
    var c = card(), p = pkg(), name = S.name.trim().slice(0, 80), id = '';
    var sum = [c ? c.label : '', S.pkg ? (p ? p.name : 'package not sure') : '', S.date ? nice(S.date) : 'date not sure'].filter(Boolean).join(', ');
    try{
      var A = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      var F = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      var app; try{ app = A.getApp('enquiry'); }catch(e){ app = A.initializeApp(FB, 'enquiry'); }
      var db = F.getFirestore(app), ref = F.doc(F.collection(db, 'leads'));
      var now = new Date(), lid = 'W' + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes());
      await F.setDoc(ref, {
        biz:'fom', source:'website', via:via, leadId:lid, status:'New enquiry', category:'Website enquiry',
        company:'', contact:name, email:S.email.trim().toLowerCase().slice(0, 100), phone:S.phone.trim().slice(0, 20), web:'', location:S.area.trim().slice(0, 80),
        emailed:'No', dateEmailed:'', followUp:'', comments:(sum + (S.phone.trim() ? '. WhatsApp ' + S.phone.trim() : '') + (via === 'whatsapp' ? '. Sent on WhatsApp' : '. Sent by email')).slice(0, 300),
        shootType:c ? c.label.slice(0, 40) : '', pkg:S.pkg ? (p ? p.name : 'Not sure').slice(0, 60) : '', shootDate:S.date || '',
        enquiry:text.slice(0, 1500), createdAt:F.serverTimestamp()
      });
      id = ref.id;
    }catch(e){ if(window.console) console.warn('enquiry not saved to Leads', e); }
    try{ fetch(WORKER + '/event', { method:'POST', keepalive:true, headers:{ 'Content-Type':'text/plain' }, body:JSON.stringify({ t:'enquiry', o:id, n:name, b:'fom', d:sum, x:text.slice(0, 1500), p:S.phone.trim().slice(0, 20), e:S.email.trim().slice(0, 100) }) }).catch(function(){}); }catch(e){}
  }

  /* ---------- open and close ---------- */
  function open(opts){
    if(S.sent) S = fresh();
    if(opts && opts.pkg){ var want = String(opts.pkg).toLowerCase().replace(/\s+/g, ' ').trim(), list = cfg().pkgs;
      var words = function(p){ return p.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); };
      var hit = list.filter(function(p){ return p.name.toLowerCase() === want; })[0] ||
                list.filter(function(p){ var w = words(p); return w.length && w.every(function(x){ return want.indexOf(x) >= 0; }); })
                    .sort(function(a, b){ return words(b).length - words(a).length; })[0];   // the most specific match wins
      if(hit) S.pkg = hit.id; }
    overlay.classList.add('show'); render();
  }
  function close(){ overlay.classList.remove('show'); if(S.sent) setTimeout(function(){ S = fresh(); render(); }, 300); }
  window.FOM_BOOK = { open:open, close:close };
  document.querySelectorAll('[data-open-booking], #navBookBtn').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); open(); }); });
  document.addEventListener('fom-site', function(){ if(!S.sent && S.step <= 2 && overlay.classList.contains('show')) render(); });
  render();
  if(/[?&]book=1\b/.test(location.search)) setTimeout(function(){ open(); }, 300);
})();
