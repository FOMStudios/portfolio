/* FOM Studios - live site details, controlled from the dashboard "Website" page.
   Reads Firestore siteContent/site (public read) and updates contact details, socials,
   location/hours and the announcement banner on every page that loads this file.
   The numbers already written in the HTML stay as the fallback, so the site never breaks.
   Load this in the <head> (not deferred) so WhatsApp links are right from the first paint. */
(function(){
  var DEF = {
    phone: '073 755 3136', email: 'info@fomstudios.co.za', instagram: 'fom_studios_',
    area: 'Johannesburg, South Africa', wa: '27737553136'
  };
  var KEY = 'fom.site.v1';
  var URL_ = 'https://firestore.googleapis.com/v1/projects/fom-studios/databases/(default)/documents/siteContent/site?key=AIzaSyCbRXQmIxzVWuFS0CRmDY33qYuzpcVL80A';

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
  function save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
  function digits(s){ return String(s||'').replace(/\D/g,''); }
  function intl(s){ var d = digits(s); if(!d) return ''; if(d.indexOf('27')===0 && d.length>=11) return d; if(d.charAt(0)==='0') return '27'+d.slice(1); return d; }
  function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function igHandle(v){ v = String(v||'').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/\/.*$/,''); return v; }

  var S = load();
  // Make the WhatsApp number available before page scripts read it
  window.FOM_SITE = { wa: intl(S.whatsapp || S.phone) || '' };

  function fromValue(v){
    if(!v) return null;
    if('stringValue' in v) return v.stringValue;
    if('booleanValue' in v) return v.booleanValue;
    if('integerValue' in v) return +v.integerValue;
    if('arrayValue' in v){ return (v.arrayValue.values||[]).map(fromValue); }
    if('mapValue' in v){ var o={}, f=v.mapValue.fields||{}; for(var k in f) o[k]=fromValue(f[k]); return o; }
    return null;
  }

  var origText = new WeakMap();
  function mapText(node, fn){
    var o = origText.has(node) ? origText.get(node) : node.nodeValue;
    origText.set(node, o);
    var t = o.trim(), r = fn(t);
    node.nodeValue = (r == null || r === t) ? o : o.replace(t, r);
  }
  function mapHref(a, fn){
    if(!a.hasAttribute('data-fom-h')) a.setAttribute('data-fom-h', a.getAttribute('href') || '');
    var o = a.getAttribute('data-fom-h'), r = fn(o);
    a.setAttribute('href', r == null ? o : r);
  }

  function isoOf(dt){ return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  function niceDay(v){ try{ return new Date(v + 'T00:00:00').toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }); }catch(e){ return v; } }
  function blockedFor(v){
    var a = (S && S.blockedDates) || [];
    for(var i = 0; i < a.length; i++){ var x = a[i]; if(x && x.from && v >= x.from && v <= (x.to || x.from)) return x; }
    return null;
  }
  /* booking form: add a preferred-date field that refuses the dates you blocked on the dashboard */
  function injectDate(){
    var ta = document.getElementById('bookingMessage'); if(!ta) return;
    var today = isoOf(new Date());
    var inp = document.getElementById('fomDate'), msg, hint;
    if(!inp){
      var holder = ta.closest ? ta.closest('.booking-field') : null; if(!holder || !holder.parentNode) return;
      var wrap = document.createElement('div'); wrap.className = 'booking-field'; wrap.id = 'fomDateField';
      wrap.innerHTML = '<label for="fomDate">Preferred shoot date (optional)</label><input type="date" id="fomDate">' +
        '<p id="fomDateMsg" style="font-size:12.5px;margin:6px 0 0;color:#c0392b;min-height:16px;"></p><p id="fomDateHint" style="font-size:12px;margin:2px 0 0;color:#6f6f6d;"></p>';
      holder.parentNode.insertBefore(wrap, holder);
      inp = document.getElementById('fomDate'); inp.min = today;
      var setLine = function(v){
        var rest = ta.value.split('\n').filter(function(l){ return !/^Preferred date:/i.test(l); }).join('\n');
        ta.value = v ? ('Preferred date: ' + niceDay(v) + (rest ? '\n' + rest : '')) : rest;
      };
      inp.addEventListener('change', function(){
        var v = inp.value, b = v && blockedFor(v), m = document.getElementById('fomDateMsg');
        if(b){ m.textContent = 'Sorry, we are not available on that date' + (b.label ? ' (' + b.label + ')' : '') + '. Please pick another date.'; inp.value = ''; setLine(''); }
        else if(v){ m.textContent = ''; setLine(v); }
        else setLine('');
      });
    }
    hint = document.getElementById('fomDateHint');
    var up = ((S && S.blockedDates) || []).filter(function(x){ return x && x.from && (x.to || x.from) >= today; }).slice(0, 3);
    hint.textContent = up.length ? 'Not available: ' + up.map(function(x){ var r = niceDay(x.from) + ((x.to && x.to !== x.from) ? ' to ' + niceDay(x.to) : ''); return r + (x.label ? ' (' + x.label + ')' : ''); }).join('; ') : '';
    if(inp.value && blockedFor(inp.value)){ inp.value = ''; inp.dispatchEvent(new Event('change')); }
  }

  function apply(){
    var d = S || {};
    var phone = (d.phone || '').trim(), email = (d.email || '').trim();
    var ig = igHandle(d.instagram), wa = intl(d.whatsapp || d.phone);
    var area = (d.area || '').trim();

    // ----- links -----
    [].forEach.call(document.querySelectorAll('a[href]'), function(a){
      var h = a.getAttribute('data-fom-h') || a.getAttribute('href') || '';
      if(phone && /^tel:/i.test(h)) mapHref(a, function(){ return 'tel:+' + intl(phone); });
      else if(email && /^mailto:/i.test(h)) mapHref(a, function(o){ return 'mailto:' + email + (o.indexOf('?')>-1 ? o.slice(o.indexOf('?')) : ''); });
      else if(ig && /instagram\.com\//i.test(h)) mapHref(a, function(){ return 'https://instagram.com/' + ig; });
      else if(wa && /wa\.me\/\d+/i.test(h)) mapHref(a, function(o){ return o.replace(/wa\.me\/\d+/i, 'wa.me/' + wa); });
      else if(d.whatsappCommunity && /chat\.whatsapp\.com\//i.test(h)) mapHref(a, function(){ return d.whatsappCommunity; });
    });

    // ----- visible text that matches the original defaults -----
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, nodes = [];
    while((n = w.nextNode())){
      var p = n.parentNode && n.parentNode.nodeName;
      if(p === 'SCRIPT' || p === 'STYLE' || p === 'NOSCRIPT') continue;
      nodes.push(n);
    }
    nodes.forEach(function(n){
      var base = origText.has(n) ? origText.get(n).trim() : n.nodeValue.trim();
      if(phone && base === DEF.phone) mapText(n, function(){ return phone; });
      else if(email && base === DEF.email) mapText(n, function(){ return email; });
      else if(ig && base === '@' + DEF.instagram) mapText(n, function(){ return '@' + ig; });
      else if(area && base === DEF.area) mapText(n, function(){ return area; });
    });

    // ----- footer extras: hours, service area, extra socials -----
    [].forEach.call(document.querySelectorAll('.site-footer .footer-col'), function(col){
      var h4 = col.querySelector('h4'), ul = col.querySelector('ul'); if(!h4 || !ul) return;
      [].forEach.call(ul.querySelectorAll('[data-fom-x]'), function(x){ x.remove(); });
      var title = h4.textContent.trim().toLowerCase();
      function add(html){ var li = document.createElement('li'); li.setAttribute('data-fom-x','1'); li.innerHTML = html; ul.appendChild(li); }
      if(title === 'location'){
        if(d.serviceArea) add('<span>We cover: ' + esc(d.serviceArea) + '</span>');
        if(d.hours) add('<span>Hours: ' + esc(d.hours) + '</span>');
      } else if(ul.querySelector('a[href*="instagram.com"]')){
        [['facebook','Facebook'],['tiktok','TikTok'],['youtube','YouTube']].forEach(function(s){
          var u = (d[s[0]] || '').trim();
          if(/^https?:\/\//i.test(u)) add('<a href="' + esc(u) + '" target="_blank" rel="noopener">' + s[1] + '</a>');
        });
      }
    });

    injectDate();

    // ----- announcement banner -----
    var old = document.getElementById('fomBanner'); if(old) old.remove();
    document.documentElement.classList.remove('fom-has-banner');
    var b = d.banner;
    if(b && b.on && b.text){
      var bar = document.createElement('div'); bar.id = 'fomBanner';
      var inner = esc(b.text);
      if(b.link && /^(https?:\/\/|\/|[a-z0-9_-]+\.html)/i.test(b.link)){
        inner = '<a href="' + esc(b.link) + '">' + inner + (b.linkLabel ? ' <b>' + esc(b.linkLabel) + ' &rarr;</b>' : '') + '</a>';
      }
      bar.innerHTML = '<div class="fb-in">' + inner + '</div>';
      document.body.insertBefore(bar, document.body.firstChild);
      document.documentElement.classList.add('fom-has-banner');
      var fit = function(){ var el = document.getElementById('fomBanner'); if(el) document.documentElement.style.setProperty('--fom-bh', el.offsetHeight + 'px'); };
      fit(); if(!window.__fomBannerFit){ window.__fomBannerFit = 1; addEventListener('resize', fit); }
    }
  }

  // styles for the banner (kept here so every page gets them)
  var css = document.createElement('style');
  css.textContent =
    '#fomBanner{position:fixed;top:0;left:0;right:0;z-index:1500;background:#02367B;color:#fff;font:600 13.5px/1.35 -apple-system,"Helvetica Neue",Arial,sans-serif;text-align:center;padding:9px 44px;}' +
    '#fomBanner a{color:#fff;text-decoration:none;display:block;}#fomBanner b{text-decoration:underline;text-underline-offset:3px;}' +
    '.fom-has-banner body{padding-top:var(--fom-bh,38px);}.fom-has-banner .nav-shell{top:var(--fom-bh,38px);}';
  (document.head || document.documentElement).appendChild(css);

  function run(){ try{ apply(); }catch(e){ if(window.console) console.warn('site-data', e); } }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();

  // fetch the latest, update cache, re-apply if it changed
  try{
    fetch(URL_).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if(!j || !j.fields) return;
      var fresh = {}; for(var k in j.fields) fresh[k] = fromValue(j.fields[k]);
      var changed = JSON.stringify(fresh) !== JSON.stringify(S);
      S = fresh; save(S);
      window.FOM_SITE = { wa: intl(S.whatsapp || S.phone) || '' };
      try{ document.dispatchEvent(new Event('fom-site')); }catch(e){}
      if(changed){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run(); }
    }).catch(function(){});
  }catch(e){}
})();
