/* ============================================================
   Book a meeting widget, shared by fomstudios.co.za/book.html and fomstudios.co.za/shotbya/book.html
   ------------------------------------------------------------
   Host page sets window.BOOK_CFG = { biz:'fom'|'sba', who:'FOM Studios', wa:'2768...', home:'index.html' }
   and has <div id="bookApp"></div>. Colours come from CSS variables (--bk-*) set by the host.

   Reads (public, no personal data):
     siteContent/booking_<biz>  your hours, lengths, buffer, notice, places and busy times (dashboard Bookings page)
     siteContent/site(_sba)     blocked dates (dashboard Website page)
     slotHolds                  times other people have already requested
   Writes (one batch, so both or neither):
     slotHolds/<biz>_<start>    can only be created once: two people can never request the same start time
     meetingRequests/<id>       the request itself (only you can read it)
   Then pings the gallery Worker so your phone gets a "Meeting request" notification.
   All times are South African time (UTC+2, no daylight saving).
   ============================================================ */
(function(){
  'use strict';
  var C = window.BOOK_CFG || {}; var BIZ = C.biz === 'sba' ? 'sba' : 'fom';
  var KEY = 'AIzaSyCbRXQmIxzVWuFS0CRmDY33qYuzpcVL80A';
  var BASE = 'https://firestore.googleapis.com/v1/projects/fom-studios/databases/(default)/documents/';
  var WORKER = 'https://fom-gallery.cold-moon-d65c.workers.dev';
  var FB = { apiKey:KEY, authDomain:'fom-studios.firebaseapp.com', projectId:'fom-studios', storageBucket:'fom-studios.firebasestorage.app', messagingSenderId:'1049126528829', appId:'1:1049126528829:web:8ed0ea930e0b1579630754' };
  var TZ = 'Africa/Johannesburg';
  var DEF = { on:true, lengths:[30,45,60], buffer:15, notice:24, ahead:30,
    days:{ '1':['17:30','20:00'], '2':['17:30','20:00'], '3':['17:30','20:00'], '4':['17:30','20:00'], '5':['17:30','20:00'], '6':['09:00','13:00'] },
    inPerson:{ on:true, place:'' }, video:{ on:true }, busy:[] };
  var TYPES = BIZ === 'sba'
    ? [['Corporate / Event','Event or corporate'],['Birthday / Party','Birthday or party'],['Family / Portrait','Family or portrait'],['General','Something else']]
    : [['Wedding','Wedding'],['Corporate / Event','Event or corporate'],['Birthday / Party','Birthday or party'],['Family / Portrait','Family or portrait'],['Sports','Sports'],['Product / Brand','Product or brand'],['General','Something else']];

  var $ = function(s, r){ return (r || document).querySelector(s); };
  function esc(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fromValue(v){
    if(!v) return null;
    if('stringValue' in v) return v.stringValue; if('booleanValue' in v) return v.booleanValue;
    if('integerValue' in v) return +v.integerValue; if('doubleValue' in v) return v.doubleValue;
    if('timestampValue' in v) return v.timestampValue; if('nullValue' in v) return null;
    if('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
    if('mapValue' in v){ var o = {}, f = v.mapValue.fields || {}; for(var k in f) o[k] = fromValue(f[k]); return o; }
    return null;
  }
  function getDoc(path){ return fetch(BASE + path + '?key=' + KEY).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(!j || !j.fields) return null; var o = {}; for(var k in j.fields) o[k] = fromValue(j.fields[k]); return o; }).catch(function(){ return null; }); }
  function getHolds(){
    return fetch(BASE + 'slotHolds?pageSize=300&key=' + KEY).then(function(r){ return r.ok ? r.json() : {}; }).then(function(j){
      return (j.documents || []).map(function(d){ var o = {}; for(var k in d.fields) o[k] = fromValue(d.fields[k]); return o; }).filter(function(h){ return h.biz === BIZ && h.start; });
    }).catch(function(){ return []; });
  }

  /* ---- time helpers (South African time) ---- */
  function todaySA(){ return new Date().toLocaleDateString('en-CA', { timeZone:TZ }); }
  function addDays(day, n){ var d = new Date(day + 'T12:00:00+02:00'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dow(day){ return new Date(day + 'T12:00:00+02:00').getUTCDay(); }
  function at(day, hm){ return new Date(day + 'T' + hm + ':00+02:00'); }
  function isoSA(d){ var s = new Date(d.getTime() + 2 * 3600e3).toISOString(); return s.slice(0, 16) + '+02:00'; }   // 2026-11-10T17:30+02:00
  function hm(d){ return d.toLocaleTimeString('en-GB', { timeZone:TZ, hour:'2-digit', minute:'2-digit' }); }
  function dayLabel(day){ var d = new Date(day + 'T12:00:00+02:00'); return { w:d.toLocaleDateString('en-ZA', { timeZone:TZ, weekday:'short' }), n:d.toLocaleDateString('en-ZA', { timeZone:TZ, day:'numeric' }), m:d.toLocaleDateString('en-ZA', { timeZone:TZ, month:'short' }) }; }
  function longDay(d){ return d.toLocaleDateString('en-ZA', { timeZone:TZ, weekday:'long', day:'numeric', month:'long' }); }
  function lenLabel(n){ return n === 60 ? '1 hour' : n + ' min'; }

  var S = { cfg:DEF, blocked:[], holds:[], len:0, mode:'', day:'', start:null, busy:[], sending:false };

  function blockedDay(day){ for(var i = 0; i < S.blocked.length; i++){ var b = S.blocked[i]; if(b && b.from && day >= b.from && day <= (b.to || b.from)) return true; } return false; }
  function busyRanges(){
    var buf = (+S.cfg.buffer || 0) * 60e3, out = [];
    (S.cfg.busy || []).forEach(function(b){ if(b && b.s && b.e) out.push([new Date(b.s).getTime() - buf, new Date(b.e).getTime() + buf]); });
    S.holds.forEach(function(h){ var s = new Date(h.start).getTime(); if(!isNaN(s)) out.push([s - buf, s + (+h.len || 60) * 60e3 + buf]); });
    return out;
  }
  function slotsFor(day){
    var w = (S.cfg.days || {})[String(dow(day))]; if(!w || !w[0] || !w[1] || blockedDay(day)) return [];
    var len = S.len * 60e3, from = at(day, w[0]).getTime(), to = at(day, w[1]).getTime(), earliest = Date.now() + (+S.cfg.notice || 0) * 3600e3, step = 15 * 60e3, out = [];
    for(var t = from; t + len <= to; t += step){
      if(t < earliest) continue;
      var clash = false; for(var i = 0; i < S.busy.length; i++){ if(t < S.busy[i][1] && t + len > S.busy[i][0]){ clash = true; break; } }
      if(!clash) out.push(new Date(t));
    }
    return out;
  }
  function openDays(){ var out = [], start = todaySA(), n = Math.min(90, +S.cfg.ahead || 30); for(var i = 0; i <= n; i++){ var d = addDays(start, i), s = slotsFor(d); if(s.length) out.push({ day:d, slots:s }); } return out; }

  /* ---- render ---- */
  var root;
  function chip(on, attr, html, dis){ return '<button type="button" class="bk-chip' + (on ? ' on' : '') + '" ' + attr + (dis ? ' disabled' : '') + '>' + html + '</button>'; }
  function render(){
    if(!S.cfg.on){ root.innerHTML = '<div class="bk-card bk-center"><h3>Online booking is paused</h3><p>Send a message instead and we will find a time together.</p>' + waBtn('Hi, I would like to book a meeting.') + '</div>'; return; }
    var lens = (S.cfg.lengths || [30,45,60]).filter(function(n){ return [30,45,60].indexOf(+n) > -1; }).map(Number);
    if(lens.indexOf(S.len) < 0) S.len = lens[0] || 30;
    var modes = []; if(!S.cfg.inPerson || S.cfg.inPerson.on !== false) modes.push(['inperson','In person', (S.cfg.inPerson && S.cfg.inPerson.place) || '']); if(!S.cfg.video || S.cfg.video.on !== false) modes.push(['video','Video call','Link sent when we confirm']);
    if(!modes.some(function(m){ return m[0] === S.mode; })) S.mode = modes[0] ? modes[0][0] : '';
    S.busy = busyRanges();
    var days = openDays(); if(!days.some(function(d){ return d.day === S.day; })) { S.day = days[0] ? days[0].day : ''; S.start = null; }
    var slots = (days.filter(function(d){ return d.day === S.day; })[0] || { slots:[] }).slots;
    if(S.start && !slots.some(function(s){ return s.getTime() === S.start.getTime(); })) S.start = null;

    var h = '<div class="bk-card"><div class="bk-step"><span class="bk-n">1</span><h3>How long, and how?</h3></div>'
      + '<div class="bk-chips">' + lens.map(function(n){ return chip(S.len === n, 'data-len="' + n + '"', lenLabel(n)); }).join('') + '</div>'
      + '<div class="bk-modes">' + modes.map(function(m){ return '<button type="button" class="bk-mode' + (S.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '">' + (m[0] === 'video' ? ICON.video : ICON.pin) + '<span><b>' + m[1] + '</b>' + (m[2] ? '<small>' + esc(m[2]) + '</small>' : '') + '</span></button>'; }).join('') + '</div></div>';

    h += '<div class="bk-card"><div class="bk-step"><span class="bk-n">2</span><h3>Pick a day</h3></div>';
    if(!days.length){
      h += '<p class="bk-soft">There are no open times in the next few weeks. Send a WhatsApp and we will make a plan.</p>' + waBtn('Hi, I would like to book a meeting. Are there any times available?') + '</div>';
      root.innerHTML = h; bind(); return;
    }
    h += '<div class="bk-days" role="listbox" aria-label="Days">' + days.map(function(d){ var L = dayLabel(d.day); return '<button type="button" role="option" aria-selected="' + (S.day === d.day) + '" class="bk-day' + (S.day === d.day ? ' on' : '') + '" data-day="' + d.day + '"><small>' + L.w + '</small><b>' + L.n + '</b><small>' + L.m + '</small><i>' + d.slots.length + ' open</i></button>'; }).join('') + '</div></div>';

    h += '<div class="bk-card" id="bkTimes">' + (S.note ? '<p class="bk-err bk-note">' + esc(S.note) + '</p>' : '') + '<div class="bk-step"><span class="bk-n">3</span><h3>Pick a time</h3><span class="bk-tz">South African time</span></div><div class="bk-times">'
      + slots.map(function(s){ return chip(S.start && S.start.getTime() === s.getTime(), 'data-t="' + s.getTime() + '"', hm(s)); }).join('') + '</div></div>';

    if(S.start){
      var end = new Date(S.start.getTime() + S.len * 60e3);
      h += '<div class="bk-card" id="bkForm"><div class="bk-step"><span class="bk-n">4</span><h3>Your details</h3></div>'
        + '<div class="bk-sum">' + ICON.cal + '<span><b>' + esc(longDay(S.start)) + '</b>' + hm(S.start) + ' to ' + hm(end) + ' &middot; ' + (S.mode === 'video' ? 'Video call' : 'In person') + '</span></div>'
        + '<div class="bk-grid">'
        + '<label class="bk-f"><span>Your name</span><input id="bkName" autocomplete="name" maxlength="110" value="' + esc(S.name || '') + '"></label>'
        + '<label class="bk-f"><span>WhatsApp number</span><input id="bkPhone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="082 123 4567" value="' + esc(S.phone || '') + '"></label>'
        + '<label class="bk-f bk-w"><span>Email (optional)</span><input id="bkEmail" type="email" inputmode="email" autocomplete="email" maxlength="110" value="' + esc(S.email || '') + '"></label>'
        + '<label class="bk-f bk-w"><span>What is the shoot for?</span><select id="bkType">' + TYPES.map(function(t){ return '<option value="' + esc(t[0]) + '"' + (S.type === t[0] ? ' selected' : '') + '>' + esc(t[1]) + '</option>'; }).join('') + '</select></label>'
        + '<label class="bk-f bk-w"><span>Anything we should know? (optional)</span><textarea id="bkMsg" maxlength="1400" placeholder="Date of the event, venue, what you have in mind">' + esc(S.msg || '') + '</textarea></label>'
        + '</div><p class="bk-err" id="bkErr" role="alert"></p>'
        + '<button type="button" class="bk-go" id="bkGo">Request this time</button>'
        + '<p class="bk-soft bk-small">The time is held for you. ' + esc(C.who || 'We') + ' will confirm on WhatsApp' + (S.mode === 'video' ? ' and send the video link' : '') + '.</p></div>';
    }
    root.innerHTML = h; bind(); S.note = '';
  }
  function waBtn(t){ return '<a class="bk-go bk-wa" href="https://wa.me/' + esc(C.wa || '') + '?text=' + encodeURIComponent(t) + '" target="_blank" rel="noopener">' + ICON.wa + ' WhatsApp us</a>'; }
  function keepForm(){ var g = function(id){ var e = $('#' + id, root); return e ? e.value : undefined; }; if($('#bkName', root)){ S.name = g('bkName'); S.phone = g('bkPhone'); S.email = g('bkEmail'); S.type = g('bkType'); S.msg = g('bkMsg'); } }
  function bind(){
    root.onclick = function(e){
      var b = e.target.closest('button'); if(!b || b.disabled) return;
      if(b.hasAttribute('data-again')){ again(false); return; }
      if(b.hasAttribute('data-retry')){ again(true); return; }
      keepForm();
      if(b.dataset.len){ S.len = +b.dataset.len; S.start = null; render(); }
      else if(b.dataset.mode){ S.mode = b.dataset.mode; render(); }
      else if(b.dataset.day){ S.day = b.dataset.day; S.start = null; render(); }
      else if(b.dataset.t){ S.start = new Date(+b.dataset.t); render(); var f = $('#bkForm', root); if(f) f.scrollIntoView({ behavior:'smooth', block:'start' }); }
      else if(b.id === 'bkGo') send();
    };
    var dd = $('.bk-day.on', root); if(dd && dd.scrollIntoView) dd.scrollIntoView({ block:'nearest', inline:'center' });
  }

  /* ---- send ---- */
  function digits(s){ return String(s || '').replace(/\D/g, ''); }
  async function send(){
    if(S.sending) return; keepForm();
    var name = (S.name || '').trim(), phone = (S.phone || '').trim(), email = (S.email || '').trim().toLowerCase(), err = $('#bkErr', root);
    if(!name){ err.textContent = 'Please add your name.'; $('#bkName', root).focus(); return; }
    if(digits(phone).length < 9){ err.textContent = 'Please add a WhatsApp number so we can confirm.'; $('#bkPhone', root).focus(); return; }
    if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent = 'That email does not look right.'; return; }
    S.sending = true; var go = $('#bkGo', root); go.disabled = true; go.textContent = 'Sending...'; err.textContent = '';
    var start = isoSA(S.start), holdId = BIZ + '_' + start, when = longDay(S.start) + ', ' + hm(S.start);
    try{
      var A = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      var F = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      var app; try{ app = A.getApp('booking'); }catch(e){ app = A.initializeApp(FB, 'booking'); }
      var db = F.getFirestore(app), batch = F.writeBatch(db), req = F.doc(F.collection(db, 'meetingRequests'));
      batch.set(F.doc(db, 'slotHolds', holdId), { biz:BIZ, start:start, len:S.len, at:F.serverTimestamp() });
      batch.set(req, { biz:BIZ, start:start, len:S.len, mode:S.mode, name:name.slice(0, 110), phone:phone.slice(0, 30), email:email.slice(0, 110),
        type:String(S.type || 'General').slice(0, 40), msg:String(S.msg || '').trim().slice(0, 1400), status:'new', hold:holdId, at:F.serverTimestamp() });
      await batch.commit();
      try{ fetch(WORKER + '/event', { method:'POST', keepalive:true, headers:{ 'Content-Type':'text/plain' }, body:JSON.stringify({ t:'meeting', o:req.id, n:name, b:BIZ, d:when + ', ' + lenLabel(S.len) + ', ' + (S.mode === 'video' ? 'video call' : 'in person') }) }).catch(function(){}); }catch(e){}
      done(name, when);
    }catch(e){
      if(window.console) console.warn('booking', e);
      S.sending = false;
      // was the time really taken? (someone else's hold now exists for this start) or is online booking not set up yet?
      S.holds = await getHolds();
      var taken = S.holds.some(function(h){ return h.start === start; });
      if(taken){ S.start = null; S.note = 'Sorry, someone has just requested that time. Please pick another.'; render(); var tc = $('#bkTimes', root); if(tc) tc.scrollIntoView({ behavior:'smooth', block:'start' }); }
      else failed(name, phone, email, when);
    }
  }
  function summary(when){ return '<div class="bk-sum bk-sum-c">' + ICON.cal + '<span><b>' + esc(when) + '</b>' + lenLabel(S.len) + ' &middot; ' + (S.mode === 'video' ? 'Video call' : 'In person') + '</span></div>'; }
  function actions(){ return '<div class="bk-acts"><button type="button" class="bk-go" data-again>Book another meeting</button><a class="bk-go bk-ghost" href="' + esc(C.home || 'index.html') + '">Back to the website</a></div>'; }
  function done(name, when){
    S.sending = false;
    root.innerHTML = '<div class="bk-card bk-center bk-done"><div class="bk-tick">' + ICON.tick + '</div><h3>Request sent</h3><p>Thanks ' + esc(name.split(' ')[0]) + ', your time is held:</p>' + summary(when)
      + '<p class="bk-soft">' + esc(C.who || 'We') + ' will confirm on WhatsApp soon' + (S.mode === 'video' ? ', with the video link' : '') + '. Nothing else to do for now.</p>' + actions() + '</div>';
    root.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  // the online request could not be saved: never lose the client, send it on WhatsApp instead
  function failed(name, phone, email, when){
    S.sending = false;
    var t = 'Hi, I would like to book a meeting.\n\nName: ' + name + '\nWhen: ' + when + ' (' + lenLabel(S.len) + ')\nHow: ' + (S.mode === 'video' ? 'Video call' : 'In person') + '\nShoot: ' + (S.type || 'General') + (email ? '\nEmail: ' + email : '') + (S.msg ? '\n\n' + S.msg : '');
    root.innerHTML = '<div class="bk-card bk-center bk-done"><h3>Almost there</h3><p>We could not save your request online just now. Send it on WhatsApp instead and ' + esc(C.who || 'we') + ' will confirm:</p>' + summary(when)
      + '<a class="bk-go bk-wa" href="https://wa.me/' + esc(C.wa || '') + '?text=' + encodeURIComponent(t) + '" target="_blank" rel="noopener">' + ICON.wa + ' Send on WhatsApp</a>'
      + '<div class="bk-acts"><button type="button" class="bk-go bk-ghost" data-retry>Try again</button><button type="button" class="bk-go bk-ghost" data-again>Pick another time</button></div></div>';
    root.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  async function again(keepStart){
    S.sending = false; if(!keepStart){ S.start = null; S.msg = ''; }
    root.innerHTML = '<div class="bk-card bk-loading">Loading open times...</div>';
    S.holds = await getHolds(); render();
    if(keepStart && S.start){ var f = $('#bkForm', root); if(f) f.scrollIntoView({ behavior:'smooth', block:'start' }); }
    else root.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  var ICON = {
    video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    tick:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm5.5-5.8c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-1.6-.7-2.9-2-3.7-3.6-.2-.3 0-.5.1-.6l.5-.6.3-.5V9l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.8 3.6.6.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>'
  };

  var CSS = '.bk,.bk-card{scroll-margin-top:110px}.bk{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-width:0;max-width:100%;font-family:var(--bk-font,inherit);color:var(--bk-ink,#222)}'
    + '.bk-card{min-width:0;background:var(--bk-card,#fff);border:1px solid var(--bk-line,rgba(0,0,0,.1));border-radius:var(--bk-r,20px);padding:22px}'
    + '.bk-center{text-align:center}.bk-card h3{font-family:var(--bk-head,inherit);font-weight:var(--bk-headw,700);font-size:var(--bk-h3,19px);line-height:1.15;margin:0;color:var(--bk-headc,inherit)}'
    + '.bk-step{display:flex;align-items:center;gap:10px;margin-bottom:14px}.bk-n{width:28px;height:28px;border-radius:50%;background:var(--bk-accent,#222);color:var(--bk-on,#fff);display:grid;place-items:center;font-size:13px;font-weight:700;flex:none;font-family:var(--bk-font,inherit)}'
    + '.bk-tz{margin-left:auto;font-size:12px;color:var(--bk-soft,#777)}'
    + '.bk-chips,.bk-times{display:flex;flex-wrap:wrap;gap:8px}.bk-times{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr))}'
    + '.bk-chip{border:1px solid var(--bk-line,rgba(0,0,0,.15));background:var(--bk-bg,#f5f5f5);color:inherit;border-radius:999px;padding:11px 18px;font:inherit;font-size:15px;cursor:pointer;transition:.18s}'
    + '.bk-chip:hover{border-color:var(--bk-accent,#222)}.bk-chip.on{background:var(--bk-accent,#222);border-color:var(--bk-accent,#222);color:var(--bk-on,#fff)}'
    + '.bk-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:12px}'
    + '.bk-mode{display:flex;gap:12px;align-items:center;text-align:left;border:1px solid var(--bk-line,rgba(0,0,0,.15));background:var(--bk-bg,#f5f5f5);color:inherit;border-radius:16px;padding:14px 16px;font:inherit;cursor:pointer;transition:.18s}'
    + '.bk-mode svg{width:24px;height:24px;flex:none;color:var(--bk-accent,#222)}.bk-mode b{display:block;font-size:15px}.bk-mode small{display:block;font-size:12.5px;color:var(--bk-soft,#777);margin-top:2px}'
    + '.bk-mode.on{border-color:var(--bk-accent,#222);box-shadow:inset 0 0 0 1px var(--bk-accent,#222);background:var(--bk-card,#fff)}'
    + '.bk-days{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x proximity;scrollbar-width:thin}'
    + '.bk-day{flex:0 0 76px;scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;gap:1px;border:1px solid var(--bk-line,rgba(0,0,0,.15));background:var(--bk-bg,#f5f5f5);color:inherit;border-radius:16px;padding:10px 4px;font:inherit;cursor:pointer;transition:.18s}'
    + '.bk-day small{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.75}.bk-day b{font-size:22px;line-height:1.1}.bk-day i{font-style:normal;font-size:10.5px;margin-top:4px;opacity:.7}'
    + '.bk-day.on{background:var(--bk-accent,#222);border-color:var(--bk-accent,#222);color:var(--bk-on,#fff)}'
    + '.bk-sum{display:flex;gap:12px;align-items:center;background:var(--bk-bg,#f5f5f5);border-radius:14px;padding:12px 14px;margin-bottom:14px}.bk-sum svg{width:24px;height:24px;color:var(--bk-accent,#222);flex:none}.bk-sum b{display:block}'
    + '.bk-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bk-f{display:flex;flex-direction:column;gap:6px;min-width:0}.bk-w{grid-column:1/-1}'
    + '.bk-f span{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--bk-soft,#777)}'
    + '.bk-f input,.bk-f select,.bk-f textarea{width:100%;min-width:0;border:1px solid var(--bk-line,rgba(0,0,0,.15));background:var(--bk-bg,#f5f5f5);color:inherit;border-radius:12px;padding:13px 14px;font:inherit;font-size:16px;outline:none}'
    + '.bk-f textarea{min-height:96px;resize:vertical}.bk-f input:focus,.bk-f select:focus,.bk-f textarea:focus{border-color:var(--bk-accent,#222)}'
    + '.bk-go{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;border:0;border-radius:999px;background:var(--bk-accent,#222);color:var(--bk-on,#fff);padding:16px 22px;font:inherit;font-size:15.5px;font-weight:600;cursor:pointer;text-decoration:none;letter-spacing:var(--bk-btnls,0);text-transform:var(--bk-btntt,none)}'
    + '.bk-go:disabled{opacity:.6;cursor:wait}.bk-go:hover{filter:brightness(.92)}.bk-center .bk-go{width:auto;padding:14px 28px}'
    + '.bk-err{color:#c0392b;font-size:14px;margin:10px 0 0;min-height:0}.bk-soft{color:var(--bk-soft,#777)}.bk-small{font-size:13px;margin-top:10px;text-align:center}'
    + '.bk-tick{width:64px;height:64px;border-radius:50%;background:var(--bk-accent,#222);color:var(--bk-on,#fff);display:grid;place-items:center;margin:4px auto 14px}.bk-tick svg{width:32px;height:32px}'
    + '.bk-done p{margin:8px auto 0;max-width:420px}.bk-sum-c{max-width:420px;margin:16px auto 8px;text-align:left}'
    + '.bk-acts{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px}.bk-acts .bk-go{margin-top:0;width:auto;flex:1 1 200px}'
    + '.bk-ghost{background:transparent!important;color:var(--bk-ink,#222)!important;border:1px solid var(--bk-line,rgba(0,0,0,.2))!important}.bk-ghost:hover{border-color:var(--bk-accent,#222)!important}'
    + '.bk-wa{background:#1f8a4c!important;color:#fff!important}.bk-note{margin:0 0 12px;padding:10px 12px;background:rgba(192,57,43,.08);border-radius:10px}.bk-loading{padding:40px;text-align:center;color:var(--bk-soft,#777)}'
    + '@media(max-width:560px){.bk-card{padding:18px}.bk-grid{grid-template-columns:1fr}.bk-times{grid-template-columns:repeat(3,1fr)}}';

  async function start(){
    root = document.getElementById('bookApp'); if(!root) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root.classList.add('bk'); root.innerHTML = '<div class="bk-card bk-loading">Loading open times...</div>';
    var r = await Promise.all([getDoc('siteContent/booking_' + BIZ), getDoc('siteContent/' + (BIZ === 'sba' ? 'site_sba' : 'site')), getHolds()]);
    S.cfg = Object.assign({}, DEF, r[0] || {}); S.blocked = (r[1] && r[1].blockedDates) || []; S.holds = r[2] || [];
    var q = new URLSearchParams(location.search), ty = q.get('type');
    if(ty){ var m = TYPES.filter(function(t){ return t[0].toLowerCase().indexOf(ty.toLowerCase()) > -1; })[0]; if(m) S.type = m[0]; }
    render();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
