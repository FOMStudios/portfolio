/* "Our studios" section and the sister studio footer link, on both websites (17 Nov 2026).
   Edited on the dashboard Website page (Our studios card), saved as `studios` on
   siteContent/site (FOM) and siteContent/site_sba (Shot by A):
     { on, label, title, intro, footer, footerText, cards:[{ name, line, img, url, btn }] }
   FOM's data comes from site-data.js (window.FOM_SITE.studios, event 'fom-site');
   Shot by A's from shotbya/sba.js (window.SBA_SITE.studios, event 'sba-site').
   The section draws into <section id="studios">; footer links carry data-sister.
   Keep DEF in step with DEF_ST in dashboard/website.html. */
(function(){
  var WORKER = 'https://fom-gallery.cold-moon-d65c.workers.dev';
  var BIZ = /\/shotbya(\/|$)/.test(location.pathname) ? 'sba' : 'fom';
  var FOM_CARD = { name:'FOM Studios', line:'Sports, events, automotive and brand content. Photo, video and drone, all in one booking.', img:'/assets/mascot-head-color.png', url:'/', btn:'Visit FOM Studios' };
  var SBA_CARD = { name:'Shot by A', line:"Amarah's studio for birthdays, families, portraits and intimate events, with a warm, personal style.", img:'/shotbya/logo.png', url:'/shotbya/', btn:'Visit Shot by A' };
  var DEF = {
    fom: { on:true, label:'The FOM family', title:'Our studios', intro:'Two studios, two styles. Pick the one that fits your day.', footer:true, footerText:'Sister studio: Shot by A',
      cards:[ assign(FOM_CARD, { url:'#work', btn:'See our work' }), SBA_CARD ] },
    sba: { on:true, label:'The family', title:'Our studios', intro:'Shot by A is part of the FOM Studios family. Need sports, brand or video work? Meet the team.', footer:true, footerText:'Part of the FOM Studios family',
      cards:[ assign(SBA_CARD, { url:'gallery.html', btn:'See my work' }), FOM_CARD ] }
  };
  function assign(a, b){ var o = {}, k; for(k in a) o[k] = a[k]; for(k in b) o[k] = b[k]; return o; }
  function esc(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function str(v, max){ return String(v == null ? '' : v).trim().slice(0, max); }
  function okLink(u){ return /^(https?:\/\/|\/|#|[a-z0-9_-]+\.html)/i.test(u) && !/^javascript:/i.test(u); }
  function imgUrl(s){ s = str(s, 300); if(!s) return ''; if(s.indexOf('r2:') === 0) return WORKER + '/file?g=portfolio%2F&n=' + encodeURIComponent(s.slice(3)); return okLink(s) ? s : ''; }

  function norm(x){
    var d = DEF[BIZ];
    if(!x || typeof x !== 'object') return d;
    var cards = (Array.isArray(x.cards) ? x.cards : d.cards).filter(function(c){ return c && str(c.name, 50); }).slice(0, 4).map(function(c){
      return { name:str(c.name, 50), line:str(c.line, 220), img:str(c.img, 300), url:str(c.url, 300), btn:str(c.btn, 40) }; });
    return { on:x.on !== false, label:str(x.label, 40), title:str(x.title, 60) || d.title, intro:str(x.intro, 300),
      footer:x.footer !== false, footerText:str(x.footerText, 60) || d.footerText, cards:cards };
  }
  function data(){ var g = BIZ === 'sba' ? window.SBA_SITE : window.FOM_SITE; return norm(g && g.studios); }

  var css = document.createElement('style');
  css.textContent =
    '.st-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:8px}' +
    '.st-card{display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:var(--st-card,#fff);border:1px solid var(--st-line,rgba(0,0,0,.08));color:inherit;text-decoration:none;transition:transform .25s ease,box-shadow .25s ease}' +
    '.st-card:hover{transform:translateY(-3px);box-shadow:0 14px 34px rgba(0,0,0,.10)}' +
    '.st-img{aspect-ratio:2/1;background:var(--st-tint,#eef1f6);display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.st-img img{width:100%;height:100%;object-fit:cover}.st-img.logo img{width:auto;height:auto;max-width:58%;max-height:64%;object-fit:contain}' +
    '.st-body{padding:20px 22px 22px;display:flex;flex-direction:column;gap:8px;flex:1}' +
    '.st-body h3{margin:0;font-size:22px;line-height:1.2}.st-body p{margin:0;opacity:.78;font-size:15.5px;line-height:1.55;flex:1}' +
    '.st-btn{align-self:flex-start;margin-top:8px;display:inline-flex;align-items:center;gap:6px;padding:11px 20px;border-radius:999px;background:var(--st-accent,#02367B);color:#fff;font-weight:700;font-size:14.5px}' +
    '.st-card:hover .st-btn{filter:brightness(1.12)}' +
    (BIZ === 'sba'
      ? '#studios{--st-accent:var(--red,#780000);--st-card:var(--paper,#F3F2EC);--st-tint:var(--stone,#E4E3D9);--st-line:var(--line,rgba(10,16,13,.12))}#studios .st-body h3{font-family:var(--sans);font-weight:600}'
      : '#studios{--st-accent:var(--accent,#02367B);--st-tint:#eef1f6}#studios .st-body h3{font-weight:700}');
  (document.head || document.documentElement).appendChild(css);

  function logoLike(src){ return /logo|mascot|icon/i.test(src); }
  function card(c){
    var src = imgUrl(c.img), href = okLink(c.url) ? c.url : '';
    var ext = /^https?:\/\//i.test(href) && href.indexOf(location.host) < 0;
    var inner = (src ? '<div class="st-img' + (logoLike(src) ? ' logo' : '') + '"><img src="' + esc(src) + '" alt="' + esc(c.name) + '" loading="lazy" decoding="async" onerror="this.parentNode.style.display=\'none\'"></div>' : '') +
      '<div class="st-body"><h3>' + esc(c.name) + '</h3>' + (c.line ? '<p>' + esc(c.line) + '</p>' : '') +
      (href && c.btn ? '<span class="st-btn">' + esc(c.btn) + ' &rarr;</span>' : '') + '</div>';
    return href ? '<a class="st-card" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + inner + '</a>' : '<div class="st-card">' + inner + '</div>';
  }
  function draw(){
    var d = data(), sec = document.getElementById('studios');
    if(sec){
      if(!d.on || !d.cards.length){ sec.style.display = 'none'; sec.innerHTML = ''; }
      else {
        var head = BIZ === 'sba'
          ? '<div class="sec-head"><div>' + (d.label ? '<span class="label">' + esc(d.label) + '</span>' : '') + '<h2 class="script">' + esc(d.title) + '</h2></div>' + (d.intro ? '<p class="lead" style="max-width:420px">' + esc(d.intro) + '</p>' : '') + '</div>'
          : '<div class="section-head"><div>' + (d.label ? '<span class="eyebrow">' + esc(d.label) + '</span>' : '') + '<h2>' + esc(d.title) + '</h2></div>' + (d.intro ? '<p class="section-note">' + esc(d.intro) + '</p>' : '') + '</div>';
        sec.innerHTML = '<div class="wrap">' + head + '<div class="st-grid">' + d.cards.map(card).join('') + '</div></div>';
        sec.style.display = '';
      }
    }
    [].forEach.call(document.querySelectorAll('[data-sister]'), function(el){
      el.style.display = d.footer ? '' : 'none';
      var t = el.querySelector('[data-sister-text]'); if(t) t.textContent = d.footerText;
    });
  }
  function run(){ try{ draw(); }catch(e){ if(window.console) console.warn('studios', e); } }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  addEventListener('load', run);   // Shot by A's details are set by sba.js, which may finish after this file
  document.addEventListener(BIZ === 'sba' ? 'sba-site' : 'fom-site', run);
  window.FOM_STUDIOS = { draw:run, norm:norm, DEF:DEF };
})();
