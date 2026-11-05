/* Shot by A website: live content from the FOM dashboard (Shot by A mode).
   - siteContent/site_sba        contact details, socials, banner, blocked dates, page text, services (Website page)
   - siteContent/portfolio_sba   her photo list (Photos page)
   - siteContent/testimonials_sba featured reviews (Reviews page, Feature button)
   Everything written in the HTML stays as the fallback, so the site never breaks if Firestore is slow. */
(function(){
  'use strict';
  var KEY = 'AIzaSyCbRXQmIxzVWuFS0CRmDY33qYuzpcVL80A';
  var BASE = 'https://firestore.googleapis.com/v1/projects/fom-studios/databases/(default)/documents/siteContent/';
  var WORKER = 'https://fom-gallery.cold-moon-d65c.workers.dev';
  var DEF = { phone:'084 445 6657', email:'amarah.rangraze@gmail.com', instagram:'shotbya_photography', area:'Johannesburg, South Africa' };
  var CATS = [['events','Events'],['birthdays','Birthdays'],['corporate','Corporate & wellness'],['family','Family & portraits'],['other','More']];
  var CATL = {}; CATS.forEach(function(c){ CATL[c[0]] = c[1]; });
  var SVC = [
    { key:'events', title:'Events', text:'Launches, celebrations and gatherings, covered from start to finish so you can stay in the moment.' },
    { key:'birthdays', title:'Birthdays', text:'From first birthdays to milestone parties: the decor, the cake and every happy face.' },
    { key:'corporate', title:'Corporate & wellness', text:'Brand activations and wellness mornings, like pilates at a car dealership, ready for your socials.' },
    { key:'family', title:'Family portraits', text:'Relaxed family and portrait sessions at home, in the park or anywhere that means something to you.' }
  ];
  var ICON = {
    events:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 21l3-12 8 8-11 4z"/><path d="M14 4v2M19 9h2M17.5 5.5L16 7M10 3l.5 2M20 14l-2 .5"/></svg>',
    birthdays:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 21h16v-8H4zM4 16c2 1.2 4 1.2 6 0s4-1.2 6 0 3 1 4 0M12 13V9M12 6.5c-1-1 0-2.5 0-2.5s1 1.5 0 2.5z"/></svg>',
    corporate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="5" r="2"/><path d="M12 7v6M7 10l5 2 5-2M9 21l3-8 3 8M4 21h16"/></svg>',
    family:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="6" r="2.2"/><circle cx="16" cy="6" r="2.2"/><circle cx="12" cy="12" r="1.8"/><path d="M4 21v-5a4 4 0 018 0M12 21v-5a4 4 0 018 0"/></svg>'
  };

  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function digits(s){ return String(s || '').replace(/\D/g,''); }
  function intl(s){ var d = digits(s); if(!d) return ''; if(d.indexOf('27') === 0 && d.length >= 11) return d; if(d.charAt(0) === '0') return '27' + d.slice(1); return d; }
  function igHandle(v){ return String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/[/?#].*$/,''); }
  function okUrl(u){ return /^https?:\/\//i.test(String(u || '').trim()); }
  function load(k){ try{ return JSON.parse(localStorage.getItem('sba.' + k)); }catch(e){ return null; } }
  function keep(k, v){ try{ localStorage.setItem('sba.' + k, JSON.stringify(v)); }catch(e){} }
  function fromValue(v){
    if(!v) return null;
    if('stringValue' in v) return v.stringValue;
    if('booleanValue' in v) return v.booleanValue;
    if('integerValue' in v) return +v.integerValue;
    if('doubleValue' in v) return v.doubleValue;
    if('timestampValue' in v) return v.timestampValue;
    if('nullValue' in v) return null;
    if('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
    if('mapValue' in v){ var o = {}, f = v.mapValue.fields || {}; for(var k in f) o[k] = fromValue(f[k]); return o; }
    return null;
  }
  function fetchDoc(id){
    return fetch(BASE + id + '?key=' + KEY).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if(!j || !j.fields) return null; var o = {}; for(var k in j.fields) o[k] = fromValue(j.fields[k]); return o;
    }).catch(function(){ return null; });
  }

  var S = load('site') || {}, P = load('photos') || [], R = load('reviews') || [];

  /* ---------------- photos ---------------- */
  function srcOf(s){
    s = String(s || '');
    if(s.indexOf('r2:') === 0 && /^[a-z0-9._-]+$/i.test(s.slice(3))) return WORKER + '/file?g=portfolio%2F&n=' + encodeURIComponent(s.slice(3));
    if(/^https:\/\//.test(s)) return s;
    return '';
  }
  function cleanPhotos(a){
    if(!Array.isArray(a)) return [];
    return a.map(function(p){
      if(!p || p.hide) return null; var u = srcOf(p.src); if(!u) return null;
      var cap = String(p.cap || '').slice(0, 80), cat = CATL[p.cat] ? p.cat : 'other';
      return { id:String(p.id || ''), u:u, cap:cap, cat:cat, home:!!p.home, size:p.size || 'square',
               alt:String(p.alt || ((cap || CATL[cat]) + ', photography by Shot by A')).slice(0, 160) };
    }).filter(Boolean).slice(0, 400);
  }
  var photos = cleanPhotos(P);
  function homePhotos(){ var h = photos.filter(function(p){ return p.home; }); return h.length ? h : photos.slice(0, 12); }
  function firstOf(cat){ var h = photos.filter(function(p){ return p.cat === cat; }); var hh = h.filter(function(p){ return p.home; }); return (hh[0] || h[0]) || null; }
  function imgTag(p, cls){ return '<img src="' + esc(p.u) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + ' onerror="this.style.visibility=\'hidden\'">'; }

  /* ---------------- lightbox ---------------- */
  var LB = { list:[], i:0 };
  function lbEl(){
    var el = $('#lb'); if(el) return el;
    el = document.createElement('div'); el.className = 'lb'; el.id = 'lb'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-label','Photo viewer');
    el.innerHTML = '<button class="lb-x" type="button" aria-label="Close">&times;</button><button class="lb-p" type="button" aria-label="Previous">&#8592;</button><img alt=""><button class="lb-n" type="button" aria-label="Next">&#8594;</button><div class="lb-meta"></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function(e){
      if(e.target.closest('.lb-x') || e.target === el) close();
      else if(e.target.closest('.lb-p')) step(-1);
      else if(e.target.closest('.lb-n')) step(1);
    });
    var sx = 0, sy = 0;
    el.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive:true });
    el.addEventListener('touchend', function(e){
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if(dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    }, { passive:true });
    document.addEventListener('keydown', function(e){
      if(!el.classList.contains('show')) return;
      if(e.key === 'Escape') close(); else if(e.key === 'ArrowLeft') step(-1); else if(e.key === 'ArrowRight') step(1);
    });
    return el;
  }
  function show(){
    var el = lbEl(), p = LB.list[LB.i]; if(!p) return;
    var img = el.querySelector('img'); img.style.opacity = 0;
    img.onload = function(){ img.style.opacity = 1; }; img.src = p.u; img.alt = p.alt;
    el.querySelector('.lb-meta').innerHTML = (p.cap ? '<b>' + esc(p.cap) + '</b>' : '') + (LB.i + 1) + ' / ' + LB.list.length;
    var one = LB.list.length < 2; el.querySelector('.lb-p').style.visibility = one ? 'hidden' : ''; el.querySelector('.lb-n').style.visibility = one ? 'hidden' : '';
    [LB.i + 1, LB.i - 1].forEach(function(j){ var q = LB.list[(j + LB.list.length) % LB.list.length]; if(q){ var pre = new Image(); pre.src = q.u; } });
  }
  function open(list, i){ LB.list = list; LB.i = i; var el = lbEl(); el.classList.add('show'); document.documentElement.style.overflow = 'hidden'; show(); el.querySelector('.lb-x').focus(); }
  function close(){ var el = $('#lb'); if(el) el.classList.remove('show'); document.documentElement.style.overflow = ''; }
  function step(d){ LB.i = (LB.i + d + LB.list.length) % LB.list.length; show(); }

  /* ---------------- site details ---------------- */
  function applySite(){
    var d = S || {};
    var phone = (d.phone || DEF.phone).trim(), email = (d.email || DEF.email).trim(), ig = igHandle(d.instagram) || DEF.instagram;
    var wa = intl(d.whatsapp || phone), area = (d.area || DEF.area).trim();
    window.SBA_SITE = { phone:phone, email:email, wa:wa, ig:ig, area:area, blocked:d.blockedDates || [] };
    $$('[data-l]').forEach(function(a){
      var k = a.getAttribute('data-l');
      if(k === 'wa'){ var t = a.getAttribute('data-wa-text') || 'Hi Amarah, I found you on your website and would like to ask about a shoot.'; a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(t); }
      else if(k === 'tel') a.href = 'tel:+' + intl(phone);
      else if(k === 'mail') a.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Shoot enquiry');
      else if(k === 'ig') a.href = 'https://instagram.com/' + ig;
      else { var u = (d[k] || '').trim(); var li = a.closest('[data-opt]') || a; if(okUrl(u)){ a.href = u; li.style.display = ''; } else li.style.display = 'none'; }
    });
    $$('[data-t]').forEach(function(el){
      var k = el.getAttribute('data-t'), v = '';
      if(k === 'phone') v = phone; else if(k === 'email') v = email; else if(k === 'ig') v = '@' + ig; else if(k === 'area') v = area;
      else v = String(d[k] || '').trim();
      var row = el.closest('[data-opt]');
      if(v){ el.textContent = v; if(row) row.style.display = ''; } else if(row) row.style.display = 'none';
    });
    // page text you can edit on the dashboard Website page
    var tx = d.text || {};
    $$('[data-x]').forEach(function(el){ var v = String(tx[el.getAttribute('data-x')] || '').trim(); if(v) el.textContent = v; });
    banner(d.banner);
  }
  function banner(b){
    var old = $('#sbaBanner'); if(old) old.remove();
    document.documentElement.style.setProperty('--bh', '0px');
    if(!b || !b.on || !b.text) return;
    var bar = document.createElement('div'); bar.id = 'sbaBanner';
    var inner = esc(b.text), link = String(b.link || '').trim();
    if(link && /^(https?:\/\/|[a-z0-9_-]+\.html)/i.test(link)) inner = '<a href="' + esc(link) + '">' + inner + (b.linkLabel ? ' <b>' + esc(b.linkLabel) + ' &#8594;</b>' : '') + '</a>';
    bar.innerHTML = inner; document.body.insertBefore(bar, document.body.firstChild);
    var fit = function(){ document.documentElement.style.setProperty('--bh', bar.offsetHeight + 'px'); document.body.style.paddingTop = bar.offsetHeight + 'px'; };
    fit(); addEventListener('resize', fit);
  }

  /* ---------------- home ---------------- */
  function renderPrints(){
    var box = $('#prints'); if(!box) return;
    var h = homePhotos().slice(0, 3);
    if(!h.length){ box.classList.add('empty'); return; }
    box.classList.remove('empty');
    $$('.print', box).forEach(function(pr, i){
      var p = h[i % h.length];
      pr.querySelector('.ph').innerHTML = imgTag(p);
      pr.querySelector('.cap').textContent = p.cap || CATL[p.cat];
      pr.onclick = function(){ open(homePhotos(), homePhotos().indexOf(p)); };
      pr.style.cursor = 'zoom-in';
    });
  }
  function renderAbout(){
    var box = $('#aboutPhoto'); if(!box) return;
    var pick = null, want = String((S.text || {}).aboutPhoto || '');
    if(want) pick = photos.filter(function(p){ return p.id === want; })[0];
    if(!pick){ var fam = firstOf('family'); pick = fam || homePhotos()[3] || homePhotos()[0]; }
    if(!pick) return;
    box.classList.remove('empty'); box.querySelector('.slot').innerHTML = imgTag(pick);
  }
  function renderServices(){
    var box = $('#svcGrid'); if(!box) return;
    var ov = Array.isArray(S.services) ? S.services : [];
    var list = SVC.map(function(s){
      var o = ov.filter(function(x){ return x && x.key === s.key; })[0] || {};
      return { key:s.key, title:(o.title || s.title), text:(o.text || s.text), off:!!o.off };
    }).filter(function(s){ return !s.off; });
    box.innerHTML = list.map(function(s, i){
      var p = firstOf(s.key);
      return '<a class="svc rv d' + (i % 4) + '" href="gallery.html?cat=' + s.key + '">' +
        '<div class="ph">' + (p ? imgTag(p) : '<span class="ic">' + (ICON[s.key] || '') + '</span>') + '</div>' +
        '<div class="body"><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p><span class="more">See the photos &#8594;</span></div></a>';
    }).join('');
    reveal();
  }
  function renderStrip(){
    var box = $('#strip'); if(!box) return;
    var sec = box.closest('section'), h = homePhotos();
    if(!h.length){ if(sec) sec.style.display = 'none'; return; }
    if(sec) sec.style.display = '';
    box.innerHTML = h.map(function(p, i){ return '<button class="it" type="button" data-i="' + i + '">' + imgTag(p) + (p.cap ? '<span class="cap">' + esc(p.cap) + '</span>' : '') + '</button>'; }).join('');
    $$('.it', box).forEach(function(b){ b.onclick = function(){ if(box.dataset.dragged === '1') return; open(h, +b.dataset.i); }; });
  }
  function stripControls(){
    var box = $('#strip'); if(!box) return;
    $$('[data-strip]').forEach(function(b){ b.onclick = function(){ box.scrollBy({ left:(+b.dataset.strip) * box.clientWidth * .7, behavior:'smooth' }); }; });
    // drag to scroll on desktop
    var down = false, x0 = 0, s0 = 0, moved = 0;
    box.addEventListener('mousedown', function(e){ down = true; moved = 0; x0 = e.pageX; s0 = box.scrollLeft; box.style.scrollSnapType = 'none'; box.dataset.dragged = '0'; });
    addEventListener('mouseup', function(){ if(!down) return; down = false; box.style.scrollSnapType = ''; setTimeout(function(){ box.dataset.dragged = '0'; }, 0); if(moved > 6) box.dataset.dragged = '1'; });
    box.addEventListener('mousemove', function(e){ if(!down) return; e.preventDefault(); moved = Math.abs(e.pageX - x0); box.scrollLeft = s0 - (e.pageX - x0); });
  }
  function renderReviews(){
    var box = $('#revGrid'); if(!box) return;
    var sec = box.closest('section');
    var list = (Array.isArray(R) ? R : []).filter(function(r){ return r && String(r.message || '').trim(); }).slice(0, 3);
    if(!list.length){ if(sec) sec.style.display = 'none'; return; }
    if(sec) sec.style.display = '';
    box.innerHTML = list.map(function(r, i){
      var n = Math.max(1, Math.min(5, +r.rating || 5));
      return '<div class="rev rv d' + i + '"><div class="stars" aria-label="' + n + ' out of 5 stars">' + '&#9733;'.repeat(n) + '</div><p>' + esc(String(r.message).trim()) + '</p><div class="who">' + esc(r.name || 'Client') + '</div></div>';
    }).join('');
    reveal();
  }

  /* ---------------- gallery ---------------- */
  var gCat = 'all', gShown = 0, PAGE = 24;
  function renderGallery(){
    var grid = $('#grid'), chips = $('#chips'); if(!grid) return;
    var count = {}; photos.forEach(function(p){ count[p.cat] = (count[p.cat] || 0) + 1; });
    var q = (location.search.match(/[?&]cat=([a-z]+)/) || [])[1];
    if(q && (q === 'all' || CATL[q])) gCat = q;
    chips.innerHTML = '<button class="chip' + (gCat === 'all' ? ' on' : '') + '" data-c="all" type="button">All<small>' + photos.length + '</small></button>' +
      CATS.filter(function(c){ return count[c[0]] || c[0] === gCat; }).map(function(c){ return '<button class="chip' + (gCat === c[0] ? ' on' : '') + '" data-c="' + c[0] + '" type="button">' + esc(c[1]) + '<small>' + (count[c[0]] || 0) + '</small></button>'; }).join('');
    chips.style.display = photos.length ? '' : 'none';
    chips.onclick = function(e){ var b = e.target.closest('.chip'); if(!b) return; gCat = b.dataset.c; try{ history.replaceState(null, '', gCat === 'all' ? 'gallery.html' : 'gallery.html?cat=' + gCat); }catch(err){} gShown = 0; renderGallery(); };
    var list = photos.filter(function(p){ return gCat === 'all' || p.cat === gCat; });
    var empty = $('#gEmpty'), more = $('#gMore');
    if(!list.length){
      grid.innerHTML = ''; if(more) more.style.display = 'none';
      if(empty){ empty.style.display = ''; var t = $('#gEmptyText'); if(t) t.textContent = photos.length ? 'No ' + (CATL[gCat] || '').toLowerCase() + ' photos up yet. Have a look at the rest of the gallery, or ask Amarah for more examples.' : 'Amarah is busy curating her favourite shots. In the meantime, her latest work is on Instagram.'; }
      return;
    }
    if(empty) empty.style.display = 'none';
    gShown = Math.max(gShown, Math.min(PAGE, list.length));
    grid.innerHTML = list.slice(0, gShown).map(function(p, i){ return '<button class="it" type="button" data-i="' + i + '">' + imgTag(p) + (p.cap ? '<span class="cap">' + esc(p.cap) + '</span>' : '') + '</button>'; }).join('');
    grid.onclick = function(e){ var b = e.target.closest('.it'); if(b) open(list, +b.dataset.i); };
    if(more){ more.style.display = gShown < list.length ? '' : 'none'; more.querySelector('button').onclick = function(){ gShown += PAGE; renderGallery(); }; }
  }

  /* ---------------- contact form ---------------- */
  function iso(dt){ return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  function nice(v){ try{ return new Date(v + 'T00:00:00').toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'long', year:'numeric' }); }catch(e){ return v; } }
  function blockedFor(v){ var a = (S && S.blockedDates) || []; for(var i = 0; i < a.length; i++){ var x = a[i]; if(x && x.from && v >= x.from && v <= (x.to || x.from)) return x; } return null; }
  function contactForm(){
    var f = $('#enq'); if(!f) return;
    var date = $('#qDate'), today = iso(new Date());
    date.min = today;
    var t = (location.search.match(/[?&]type=([a-z]+)/) || [])[1];
    if(t){ var r = f.querySelector('input[name=type][value="' + t + '"]'); if(r) r.checked = true; }
    function hint(){
      var up = ((S && S.blockedDates) || []).filter(function(x){ return x && x.from && (x.to || x.from) >= today; }).slice(0, 3);
      $('#qDateHint').textContent = up.length ? 'Already booked: ' + up.map(function(x){ return nice(x.from) + ((x.to && x.to !== x.from) ? ' to ' + nice(x.to) : ''); }).join('; ') : '';
    }
    hint(); document.addEventListener('sba-site', hint);
    date.addEventListener('change', function(){
      var b = date.value && blockedFor(date.value);
      $('#qDateMsg').textContent = b ? 'Sorry, Amarah is already booked on that date' + (b.label ? ' (' + b.label + ')' : '') + '. Please pick another date.' : '';
      if(b) date.value = '';
    });
    function compose(){
      var v = function(id){ return ($('#' + id).value || '').trim(); };
      var type = f.querySelector('input[name=type]:checked');
      var bad = [];
      [['qName', v('qName')], ['qContact', v('qContact')]].forEach(function(x){ var el = $('#' + x[0]); el.classList.toggle('bad', !x[1]); if(!x[1]) bad.push(el); });
      if(bad.length){ bad[0].focus(); $('#qErr').textContent = 'Please add your name and a way to reach you.'; return null; }
      $('#qErr').textContent = '';
      var lines = ['Hi Amarah, I would like to book a shoot.', ''];
      lines.push('Name: ' + v('qName'));
      lines.push('Contact: ' + v('qContact'));
      if(type) lines.push('Shoot: ' + type.getAttribute('data-label'));
      if(v('qDate')) lines.push('Date: ' + nice(v('qDate')));
      if(v('qWhere')) lines.push('Where: ' + v('qWhere'));
      if(v('qMsg')){ lines.push(''); lines.push(v('qMsg')); }
      return { text:lines.join('\n'), subject:'Shoot enquiry' + (type ? ': ' + type.getAttribute('data-label') : '') + ' from ' + v('qName') };
    }
    $('#qWa').onclick = function(){ var m = compose(); if(!m) return; window.open('https://wa.me/' + (window.SBA_SITE ? SBA_SITE.wa : intl(DEF.phone)) + '?text=' + encodeURIComponent(m.text), '_blank', 'noopener'); };
    $('#qMail').onclick = function(){ var m = compose(); if(!m) return; location.href = 'mailto:' + (window.SBA_SITE ? SBA_SITE.email : DEF.email) + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.text); };
    f.addEventListener('input', function(e){ if(e.target.classList) e.target.classList.remove('bad'); });
    f.addEventListener('submit', function(e){ e.preventDefault(); $('#qWa').click(); });
  }

  /* ---------------- shell: header, menu, reveal, year ---------------- */
  var io = null;
  function reveal(){
    var els = $$('.rv:not(.in)');
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('in'); }); return; }
    if(!io) io = new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin:'0px 0px -8% 0px', threshold:.05 });
    els.forEach(function(e){ io.observe(e); });
  }
  function shell(){
    var hdr = $('.hdr');
    var onScroll = function(){ if(hdr) hdr.classList.toggle('solid', scrollY > 10); };
    onScroll(); addEventListener('scroll', onScroll, { passive:true });
    var sheet = $('#sheet');
    $$('[data-menu]').forEach(function(b){ b.onclick = function(){ var o = b.getAttribute('data-menu') === 'open'; sheet.classList.toggle('open', o); document.documentElement.style.overflow = o ? 'hidden' : ''; }; });
    $$('#sheet a').forEach(function(a){ a.addEventListener('click', function(){ sheet.classList.remove('open'); document.documentElement.style.overflow = ''; }); });
    $$('[data-year]').forEach(function(e){ e.textContent = new Date().getFullYear(); });
    reveal();
  }

  function renderAll(){
    applySite(); renderPrints(); renderAbout(); renderServices(); renderStrip(); renderReviews(); renderGallery();
  }
  function start(){
    shell(); stripControls(); contactForm();
    try{ renderAll(); }catch(e){ if(window.console) console.warn('sba', e); }
    fetchDoc('site_sba').then(function(d){ if(!d) return; delete d.updatedAt; if(JSON.stringify(d) === JSON.stringify(S)) return; S = d; keep('site', d); applySite(); renderAbout(); renderServices(); try{ document.dispatchEvent(new Event('sba-site')); }catch(e){} });
    fetchDoc('portfolio_sba').then(function(d){ if(!d || !d.json) return; var a; try{ a = JSON.parse(d.json); }catch(e){ return; } keep('photos', a); var n = cleanPhotos(a); if(JSON.stringify(n) === JSON.stringify(photos)) return; photos = n; renderPrints(); renderAbout(); renderServices(); renderStrip(); renderGallery(); });
    fetchDoc('testimonials_sba').then(function(d){ if(!d || !d.json) return; var a; try{ a = JSON.parse(d.json); }catch(e){ return; } if(!Array.isArray(a)) return; keep('reviews', a); R = a; renderReviews(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
