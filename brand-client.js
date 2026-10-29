/* ============================================================
   FOM STUDIOS / SHOT BY A - client pages brand (portal, gallery, sign, contract view, feedback)
   ------------------------------------------------------------
   Shot by A clients arrive with ?b=sba (her portal link is fomstudios.co.za/shotbya/,
   and every link the dashboard makes for her adds it). The choice is remembered for the visit,
   so moving between portal, gallery and review keeps her branding.
   When she has her own domain, any host that is not fomstudios.co.za opens as Shot by A.
   Load this in the <head>, before the page's own scripts.
   ============================================================ */
(function(){
  'use strict';
  var q = new URLSearchParams(location.search), id = 'fom';
  try{
    var p = q.get('b');
    if(p === 'sba' || p === 'fom'){ id = p; sessionStorage.setItem('fom.b', p); }
    else if(sessionStorage.getItem('fom.b')) id = sessionStorage.getItem('fom.b');
    else if(!/fomstudios\.co\.za$|^localhost$|^127\.|github\.io$/.test(location.hostname)) id = 'sba';
  }catch(e){}
  if(id !== 'sba') id = 'fom';

  var root = /\/shotbya\//.test(location.pathname) ? '../' : '';
  var B = id === 'sba'
    ? { id:'sba', name:'Shot by A', upper:'SHOT BY A', legal:'Shot by A Photography', email:'amarah.rangraze@gmail.com',
        phone:'073 755 3136', wa:'27737553136', site:'instagram.com/shotbya_photography', siteUrl:'https://instagram.com/shotbya_photography',
        instagram:'shotbya_photography', portal:root + 'client-portal.html?b=sba', logo:root + 'shotbya/logo.png', icon:root + 'shotbya/icon.png', accent:'#780000' }
    : { id:'fom', name:'FOM Studios', upper:'FOM STUDIOS', portal:root + 'client-portal.html', accent:'#02367B' };
  window.FOM_CLIENT = B;
  document.documentElement.setAttribute('data-biz', id);
  if(id !== 'sba') return;

  /* ---- Shot by A theme: her palette over the shared tokens these pages use ---- */
  var css = ':root[data-biz="sba"]{--bg:#E4E3D9;--bg-pill:#F3F2EC;--panel:#F3F2EC;--panel-2:#D6D5C9;--bg-dark:#0A100D;--ink:#0A100D;--ink-soft:#5E5F55;--ink-dim:#8a8b7f;'
    + '--ink-on-dark:#F3F2EC;--line:#C9C8BA;--accent:#780000;--accent-hover:#630606;--accent-2:#C1121F;--accent-on-dark:#D6D5C9;--on-accent:#ffffff;}'
    + ':root[data-biz="sba"] .hero{background:linear-gradient(135deg,#630606 0%,#2a0a0a 55%,#0A100D 100%) !important;}'
    + ':root[data-biz="sba"] .hero .eyebrow{color:#E8B7B3 !important;} :root[data-biz="sba"] .hero h1 .accent,:root[data-biz="sba"] .meta .m .v.hi{color:#E8B7B3 !important;}'
    + ':root[data-biz="sba"] img.sba-logo{object-fit:contain;background:transparent !important;border-radius:0 !important;box-shadow:none !important;padding:0 !important;}'
    + ':root[data-biz="sba"] .login-card .mascot img{border-radius:0;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* FOM's navy and light blues written into page styles */
  var SW = [[/#02367B/gi,'var(--accent)'],[/#022a5f/gi,'var(--accent-hover)'],[/#5B9AE0/gi,'#C1121F'],[/#e7f0ff/gi,'#F2E3E1'],[/#bcd4f5/gi,'#E2C3C0'],
    [/#eef2fb/gi,'#F4E9E7'],[/#8fb8e8/gi,'#E8B7B3'],[/#bcd4f5/gi,'#E2C3C0']];
  var TEST = new RegExp(SW.map(function(x){ return x[0].source; }).join('|'), 'i');
  function swapCss(t){ for(var i = 0; i < SW.length; i++) t = t.replace(SW[i][0], SW[i][1]); return t; }
  function swapStyles(){ var a = document.querySelectorAll('style:not([data-b])'); for(var i = 0; i < a.length; i++){ if(TEST.test(a[i].textContent)) a[i].textContent = swapCss(a[i].textContent); a[i].setAttribute('data-b',''); } }
  swapStyles();

  /* ---- text, links and logos ---- */
  var R = [
    [/Frames Of Motion \(FOM\) Studios/g, B.legal], [/info@fomstudios\.co\.za/g, B.email],
    [/FOM Studios/g, B.name], [/FOM STUDIOS/g, B.upper], [/FOM studios/g, B.name],
    [/(^|[^\/\w.])www\.fomstudios\.co\.za(?![\/\w])/g, '$1' + B.site], [/(@?)fom_studios_/g, '$1' + B.instagram]
  ];
  function rb(s){ for(var i = 0; i < R.length; i++) s = s.replace(R[i][0], R[i][1]); return s; }
  window.FOM_CLIENT.rebrand = rb;
  var SKIP = { SCRIPT:1, STYLE:1, TEXTAREA:1, INPUT:1 };
  function fixImg(im){
    var src = im.getAttribute('src') || '';
    if(im.closest && im.closest('.card,.grid,#lbMedia,.lb,[data-norebrand]')) return;   // never the client's own photos
    if(/mascot|logo\.png/.test(src) && !im.hasAttribute('data-b')){
      im.setAttribute('data-b','');
      var small = (im.width && im.width < 70) || /topbar|mark|lb-|avatar/.test((im.parentNode && im.parentNode.className) || '');
      im.src = small ? B.icon : B.logo;
      if(!small) im.classList.add('sba-logo');
    }
  }
  function fix(n){
    if(n.nodeType === 3){ var p = n.parentNode; if(!p || SKIP[p.nodeName]) return; var v = n.nodeValue;
      if(/FOM|fomstudios|fom_studios_|Frames Of Motion/.test(v)){ var nv = rb(v); if(nv !== v) n.nodeValue = nv; } return; }
    if(n.nodeType !== 1 || SKIP[n.nodeName]) return;
    if(n.nodeName === 'IMG') fixImg(n);
    if(n.nodeName === 'A'){ var h = n.getAttribute('href') || '';
      if(/^mailto:info@fomstudios/.test(h)) n.setAttribute('href', 'mailto:' + B.email);
      else if(/^https?:\/\/(www\.)?instagram\.com\/fom_studios_/.test(h)) n.setAttribute('href', 'https://instagram.com/' + B.instagram);
      else if(h === '/' || /^https?:\/\/(www\.)?fomstudios\.co\.za\/?$/.test(h)) n.setAttribute('href', B.siteUrl); }
    ['alt','title','placeholder','aria-label'].forEach(function(a){ var v = n.getAttribute(a); if(v && /FOM/.test(v)) n.setAttribute(a, rb(v)); });
    var sa = n.getAttribute('style'); if(sa && TEST.test(sa)) n.setAttribute('style', swapCss(sa));
    for(var c = n.firstChild; c; c = c.nextSibling) fix(c);
  }
  document.title = rb(document.title);
  document.addEventListener('DOMContentLoaded', function(){
    document.title = rb(document.title); swapStyles();
    var ic = document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]'); for(var i = 0; i < ic.length; i++) ic[i].href = B.icon;
    fix(document.body);
    new MutationObserver(function(ms){ ms.forEach(function(m){
      if(m.type === 'characterData') fix(m.target); else for(var j = 0; j < m.addedNodes.length; j++) fix(m.addedNodes[j]);
    }); }).observe(document.body, { childList:true, subtree:true, characterData:true });
  });
})();
