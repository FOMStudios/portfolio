#!/usr/bin/env python3
"""Builds the Shot by A website pages into portfolio/shotbya/ with a shared head, header and footer."""
"""Run: python3 _tools/build_sba.py   (rewrites shotbya/index, gallery, book, contact, policy and 404.html)
Edit the pages here, not in the generated HTML, or the next build will undo the change.
The other files in shotbya/ (portal, sign, signed, gallery, feedback, paid, moodboard, contract-view) are NOT generated."""
import os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shotbya')
SITE = 'https://www.fomstudios.co.za/shotbya/'

WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z"/></svg>'
IG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>'
CAL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
MAIL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
TEL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>'

PAGES = [('index.html', 'Home'), ('gallery.html', 'Gallery'), ('book.html', 'Meet'), ('contact.html', 'Contact'), ('policy.html', 'Policy')]


def head(title, desc, path, extra=''):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#E4E3D9">
<link rel="canonical" href="{SITE}{'' if path == 'index.html' else path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Shot by A Photography">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE}{'' if path == 'index.html' else path}">
<meta property="og:image" content="{SITE}sba-icon-512.png">
<link rel="icon" href="favicon.ico?v=2" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="sba-favicon-32.png?v=2">
<link rel="icon" type="image/png" sizes="16x16" href="sba-favicon-16.png?v=2">
<link rel="apple-touch-icon" sizes="180x180" href="sba-touch-180.png?v=2">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="Shot by A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://firestore.googleapis.com">
<link rel="stylesheet" href="sba.css?v=1">
{extra}</head>
<body>
'''


def header(cur):
    links = ''.join(f'<a href="{p}"{" class=\"on\" aria-current=\"page\"" if p == cur else ""}>{n}</a>' for p, n in PAGES)
    sheet_links = ''.join(f'<a href="{p}"{" class=\"on\"" if p == cur else ""}>{n}</a>' for p, n in PAGES)
    return f'''<a class="sr" href="#main">Skip to content</a>
<header class="hdr">
  <div class="wrap">
    <a class="logo" href="index.html" aria-label="Shot by A, home"><img src="logo.png" alt="Shot by A Photography" width="214" height="100"></a>
    <nav class="nav" aria-label="Main">{links}</nav>
    <div class="hdr-cta">
      <a class="btn line" href="portal/">Client login</a>
      <a class="btn red" href="contact.html">Book a shoot</a>
      <button class="burger" type="button" data-menu="open" aria-label="Open menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="sheet" id="sheet" role="dialog" aria-label="Menu">
  <div class="sheet-top"><img src="logo.png" alt="Shot by A"><button class="x" type="button" data-menu="close" aria-label="Close menu">&times;</button></div>
  <nav aria-label="Menu">{sheet_links}</nav>
  <div class="sheet-btns"><a class="btn red" href="contact.html">Book a shoot</a><a class="btn line" href="portal/">Client login</a></div>
</div>
<main id="main">
'''


def footer():
    return f'''</main>
<footer class="ftr">
  <div class="wrap">
    <div class="grid">
      <div>
        <a class="logo" href="index.html"><img src="logo-light.png" alt="Shot by A Photography" width="148" height="62"></a>
        <p>People photography for events, birthdays, corporate and wellness days, and family portraits.</p>
      </div>
      <div>
        <h4>Explore</h4>
        <ul><li><a href="index.html">Home</a></li><li><a href="gallery.html">Gallery</a></li><li><a href="book.html">Book a meeting</a></li><li><a href="contact.html">Book a shoot</a></li><li><a href="policy.html">Booking policy</a></li><li><a href="portal/">Client login</a></li></ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a data-l="wa" href="https://wa.me/27844456657" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a data-l="tel" href="tel:+27844456657" data-t="phone">084 445 6657</a></li>
          <li><a data-l="mail" href="mailto:amarah.rangraze@gmail.com" data-t="email">amarah.rangraze@gmail.com</a></li>
        </ul>
      </div>
      <div>
        <h4>Follow</h4>
        <ul>
          <li><a data-l="ig" href="https://instagram.com/shotbya_photography" target="_blank" rel="noopener" data-t="ig">@shotbya_photography</a></li>
          <li data-opt style="display:none"><a data-l="facebook" href="#" target="_blank" rel="noopener">Facebook</a></li>
          <li data-opt style="display:none"><a data-l="tiktok" href="#" target="_blank" rel="noopener">TikTok</a></li>
          <li><span data-t="area">Johannesburg, South Africa</span></li>
          <li data-opt style="display:none"><span data-t="serviceArea"></span></li>
        </ul>
      </div>
    </div>
    <div class="bottom"><span>&copy; <span data-year>2026</span> Shot by A Photography. All rights reserved.</span><span class="by">Part of the <a href="../index.html">FOM Studios</a> family</span></div>
  </div>
</footer>
<a class="wa-fab" data-l="wa" href="https://wa.me/27844456657" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{WA_SVG}</a>
<script src="sba.js?v=2"></script>
</body>
</html>
'''


def page(name, title, desc, body, extra=''):
    html = head(title, desc, name, extra) + header(name) + body + footer()
    assert '\u2014' not in html and '&mdash;' not in html, 'no em dashes'
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(html)
    print('wrote', name, len(html))


# ------------------------------------------------------------------ HOME
LD = '''<script type="application/ld+json">{"@context":"https://schema.org","@type":"ProfessionalService","name":"Shot by A Photography","url":"https://www.fomstudios.co.za/shotbya/","image":"https://www.fomstudios.co.za/shotbya/icon-512.png","logo":"https://www.fomstudios.co.za/shotbya/logo.png","telephone":"+27844456657","email":"amarah.rangraze@gmail.com","founder":"Amarah Rangraze","areaServed":"Johannesburg, South Africa","sameAs":["https://instagram.com/shotbya_photography"],"description":"People photography for events, birthdays, corporate and wellness days, and family portraits."}</script>
'''

home = '''<section class="hero" style="padding-top:20px">
  <div class="wrap">
    <div>
      <span class="label rv">Photography by Amarah</span>
      <h1 class="script rv d1" data-x="heroTitle">Moments, beautifully kept</h1>
      <p class="lead rv d2" data-x="heroSub">Warm, natural photography for the people and occasions that matter: events, birthdays, corporate and wellness days, and family portraits.</p>
      <div class="btns rv d3">
        <a class="btn red" href="contact.html">Book a shoot</a>
        <a class="btn line" href="gallery.html">View the gallery</a>
      </div>
      <div class="meta rv d3">
        <span><b>Events</b>&amp; birthdays</span>
        <span><b>Brands</b>&amp; wellness</span>
        <span><b>Family</b>&amp; portraits</span>
      </div>
    </div>
    <div class="prints empty rv d2" id="prints" aria-label="Featured photos">
      <figure class="print p1"><div class="ph"><img src="icon-512.png" alt=""></div><figcaption class="cap">Shot by A</figcaption></figure>
      <figure class="print p2"><div class="ph"><img src="logo.png" alt=""></div><figcaption class="cap">Real moments</figcaption></figure>
      <figure class="print p3"><div class="ph"><img src="icon-512.png" alt=""></div><figcaption class="cap">With love</figcaption></figure>
    </div>
  </div>
  <span class="scroll-cue">Scroll</span>
</section>

<section class="paper" id="about">
  <div class="wrap about">
    <div class="about-photo empty rv" id="aboutPhoto"><div class="slot" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><img src="logo.png" alt=""></div><span class="about-badge">Hello!</span></div>
    <div class="about-text">
      <span class="label rv">About</span>
      <h2 class="script rv d1" data-x="aboutTitle">Hi, I&#39;m Amarah</h2>
      <p class="rv d2" data-x="aboutText">I love photographing people as they really are: the laughter around a birthday table, the focus in a pilates class, the quiet moments between a family. You enjoy your day, and I make sure it is remembered beautifully.</p>
      <div class="sign rv d3">Amarah</div>
      <p class="rv d3" style="margin-top:22px"><a class="link-arrow" href="contact.html">Let&#39;s plan your shoot</a></p>
    </div>
  </div>
</section>

<section id="services">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="label rv">What I shoot</span><h2 class="script rv d1">Made for people</h2></div>
      <p class="lead rv d2" style="max-width:420px">Every shoot is about the people in it. Pick what you have planned and see the kind of photos you will get.</p>
    </div>
    <div class="services" id="svcGrid"></div>
  </div>
</section>

<section class="paper" style="padding-bottom:70px">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="label rv">Recent work</span><h2 class="script rv d1">A few favourites</h2></div>
      <div class="strip-ctrl rv d2"><button type="button" data-strip="-1" aria-label="Scroll back">&#8592;</button><button type="button" data-strip="1" aria-label="Scroll forward">&#8594;</button></div>
    </div>
  </div>
  <div class="strip" id="strip"></div>
  <div class="wrap" style="margin-top:22px"><a class="link-arrow" href="gallery.html">See the full gallery</a></div>
</section>

<section class="dark">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="label rv">How it works</span><h2 class="script rv d1">Booking is easy</h2></div>
      <p class="lead rv d2" style="max-width:420px">From the first message to your finished photos, everything is simple and handled online.</p>
    </div>
    <div class="steps">
      <div class="step rv"><div class="n">1</div><h3>Say hello</h3><p>Tell me about your day on WhatsApp, or <a href="book.html" style="color:var(--moss)">book a quick meeting</a> to chat it through. I will send you a quote.</p></div>
      <div class="step rv d1"><div class="n">2</div><h3>Lock in your date</h3><p>Sign your contract online and pay the deposit. Your date is then reserved just for you.</p></div>
      <div class="step rv d2"><div class="n">3</div><h3>Shoot day</h3><p>Relax and enjoy it. I will guide you through poses and catch the natural moments in between.</p></div>
      <div class="step rv d3"><div class="n">4</div><h3>Your gallery</h3><p>Your edited photos arrive in a private online gallery to view, favourite and download.</p></div>
    </div>
  </div>
</section>

<section style="display:none">
  <div class="wrap">
    <div class="sec-head center" style="justify-content:center"><div><span class="label rv">Kind words</span><h2 class="script rv d1">From my clients</h2></div></div>
    <div class="reviews" id="revGrid"></div>
  </div>
</section>

<section class="cta">
  <div class="wrap">
    <h2 class="script rv">Let&#39;s create something beautiful</h2>
    <p class="rv d1">Dates fill up quickly, especially weekends. Send a message and let&#39;s talk about your shoot.</p>
    <div class="btns rv d2">
      <a class="btn light" data-l="wa" href="https://wa.me/27844456657" target="_blank" rel="noopener">''' + WA_SVG + ''' WhatsApp Amarah</a>
      <a class="btn ghost-light" href="book.html">''' + CAL_SVG + ''' Book a meeting</a>
      <a class="btn ghost-light" data-l="ig" href="https://instagram.com/shotbya_photography" target="_blank" rel="noopener">''' + IG_SVG + ''' Instagram</a>
    </div>
  </div>
</section>
'''

# ------------------------------------------------------------------ GALLERY
gallery = '''<section class="phead">
  <div class="wrap">
    <span class="label rv">Portfolio</span>
    <h1 class="script rv d1">The gallery</h1>
    <p class="lead rv d2">Events, birthdays, corporate and wellness days, and family portraits. Tap any photo to see it full screen.</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap">
    <div class="chips" id="chips" role="toolbar" aria-label="Filter by category"></div>
    <div class="masonry" id="grid"></div>
    <div class="more-row" id="gMore" style="display:none"><button class="btn line" type="button">Show more photos</button></div>
    <div class="empty-box" id="gEmpty" style="display:none">
      <h2 class="script">Coming soon</h2>
      <p id="gEmptyText">Amarah is busy curating her favourite shots. In the meantime, her latest work is on Instagram.</p>
      <a class="btn red" data-l="ig" href="https://instagram.com/shotbya_photography" target="_blank" rel="noopener">''' + IG_SVG + ''' See Instagram</a>
    </div>
  </div>
</section>
<section class="cta" style="padding:80px 0">
  <div class="wrap">
    <h2 class="script">Love what you see?</h2>
    <p>Tell me about your event, celebration or family session and I will send you a quote.</p>
    <div class="btns"><a class="btn light" href="contact.html">Book a shoot</a></div>
  </div>
</section>
'''

# ------------------------------------------------------------------ CONTACT
types = [('events', 'Event'), ('birthdays', 'Birthday'), ('corporate', 'Corporate or wellness'), ('family', 'Family portrait'), ('other', 'Something else')]
type_html = ''.join(f'<label><input type="radio" name="type" value="{k}" data-label="{v}"><span>{v}</span></label>' for k, v in types)
contact = '''<section class="phead">
  <div class="wrap">
    <span class="label rv">Book a shoot</span>
    <h1 class="script rv d1">Let&#39;s talk</h1>
    <p class="lead rv d2">Fill in a few details and send them straight to Amarah on WhatsApp or by email. She usually replies within a day.</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap contact">
    <form class="card rv" id="enq" novalidate>
      <div class="form-grid">
        <div class="f"><label for="qName">Your name</label><input id="qName" autocomplete="name" placeholder="Full name"></div>
        <div class="f"><label for="qContact">Phone or email</label><input id="qContact" autocomplete="tel" placeholder="So Amarah can reply"></div>
        <div class="f wide"><label>What are we shooting?</label><div class="types">''' + type_html + '''</div></div>
        <div class="f"><label for="qDate">Preferred date</label><input type="date" id="qDate"><span class="note" id="qDateMsg" role="alert"></span><span class="hint" id="qDateHint"></span></div>
        <div class="f"><label for="qWhere">Where</label><input id="qWhere" placeholder="Venue or area"></div>
        <div class="f wide"><label for="qMsg">Tell me more</label><textarea id="qMsg" placeholder="Number of guests, how long, the feel you are going for, anything else"></textarea></div>
      </div>
      <div class="send">
        <button class="btn red" type="button" id="qWa">''' + WA_SVG + ''' Send on WhatsApp</button>
        <button class="btn line" type="button" id="qMail">''' + MAIL_SVG + ''' Send by email</button>
      </div>
      <p class="note" id="qErr" role="alert" style="color:var(--red2);font-size:14px;margin-top:10px"></p>
      <p class="small">Nothing is saved on this site. Your message opens in WhatsApp or your email app so you can check it before sending.</p>
    </form>
    <div class="ways">
      <a class="way rv d1" data-l="wa" href="https://wa.me/27844456657" target="_blank" rel="noopener"><span class="ic">''' + WA_SVG + '''</span><span><small>WhatsApp</small><b data-t="phone">084 445 6657</b></span></a>
      <a class="way rv d1" data-l="tel" href="tel:+27844456657"><span class="ic">''' + TEL_SVG + '''</span><span><small>Call</small><b data-t="phone">084 445 6657</b></span></a>
      <a class="way rv d2" data-l="mail" href="mailto:amarah.rangraze@gmail.com"><span class="ic">''' + MAIL_SVG + '''</span><span><small>Email</small><b data-t="email">amarah.rangraze@gmail.com</b></span></a>
      <a class="way rv d2" data-l="ig" href="https://instagram.com/shotbya_photography" target="_blank" rel="noopener"><span class="ic">''' + IG_SVG + '''</span><span><small>Instagram</small><b data-t="ig">@shotbya_photography</b></span></a>
      <a class="way rv d3" href="book.html"><span class="ic">''' + CAL_SVG + '''</span><span><small>Meet first</small><b>Book a meeting time</b></span></a>
      <div class="info rv d3">
        <h2 class="script">Based in</h2>
        <p data-t="area" style="color:var(--paper);font-size:17px">Johannesburg, South Africa</p>
        <p data-opt style="display:none">I also cover: <span data-t="serviceArea"></span></p>
        <p data-opt style="display:none">Hours: <span data-t="hours"></span></p>
        <p style="margin-top:14px"><a href="portal/" style="color:var(--moss)">Already booked? Open your client portal &#8594;</a></p>
      </div>
    </div>
  </div>
</section>
'''

# ------------------------------------------------------------------ POLICY (FOM wording, business name swapped)
pol = [
    ('services', 'Services', ['Shot by A provides photography services including shooting, editing and delivery of final images.']),
    ('booking', 'Booking & Payment Terms', ['50% non-refundable deposit required.', 'Remaining balance payable before the shoot date.', 'No services rendered without full payment.', 'Payment confirms acceptance of this agreement.']),
    ('cancellation', 'Cancellation Policy', ['Deposit is non-refundable.', 'Cancellations more than 10 days before the shoot incur no additional payment.', 'Cancellations less than 10 days before the shoot incur an additional fee equal to 20% of the outstanding balance.', 'Cancellations must be submitted in writing.']),
    ('rescheduling', 'Rescheduling', ['One reschedule permitted per booking.', 'Payments transfer to the new date.', 'Subject to availability.']),
    ('delivery', 'Content Delivery', ['Delivery timelines communicated before booking.', 'Rush delivery incurs a 20% fee.', 'Raw files are not included unless agreed.']),
    ('usage', 'Creative Control & Usage Rights', ['Shot by A retains creative control.', 'Content may be used for portfolio and marketing purposes unless confidentiality is agreed in writing.']),
    ('liability', 'Liability', ['Shot by A is not liable for circumstances beyond reasonable control.', 'Force majeure provisions apply.']),
]
toc = ''.join(f'<a href="#{k}">{t.replace("&", "&amp;")}</a>' for k, t, _ in pol)
items = ''.join(
    f'<article class="pol-item rv" id="{k}"><span class="n">{i + 1:02d}</span><h2>{t.replace("&", "&amp;")}</h2><ul>' + ''.join(f'<li>{l}</li>' for l in ls) + '</ul></article>'
    for i, (k, t, ls) in enumerate(pol))
policy = '''<section class="phead">
  <div class="wrap">
    <span class="label rv">Booking terms</span>
    <h1 class="script rv d1">My policy</h1>
    <p class="lead rv d2">Everything you need to know before booking: payment, cancellations, rescheduling, delivery and usage rights.</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap pol">
    <nav class="toc" aria-label="On this page">''' + toc + '''</nav>
    <div>''' + items + '''
      <div class="card rv" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><span>Questions about any of this? Just ask.</span><a class="btn red" data-l="wa" href="https://wa.me/27844456657" target="_blank" rel="noopener">''' + WA_SVG + ''' WhatsApp Amarah</a></div>
    </div>
  </div>
</section>
'''

# ------------------------------------------------------------------ BOOK A MEETING
book = '''<section class="phead">
  <div class="wrap">
    <span class="label rv">Book a meeting</span>
    <h1 class="script rv d1">Let&#39;s meet</h1>
    <p class="lead rv d2">Pick a time that suits you to chat about your shoot on a phone call or video call. Amarah will confirm on WhatsApp.</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap" style="max-width:820px">
    <div id="bookApp"></div>
  </div>
</section>
'''
BOOK_HEAD = '''<style>#bookApp{--bk-accent:#780000;--bk-on:#F3F2EC;--bk-ink:#0A100D;--bk-card:#F3F2EC;--bk-bg:#E4E3D9;--bk-line:rgba(10,16,13,.12);--bk-soft:#4b4f4a;--bk-head:'Allura',cursive;--bk-headw:400;--bk-h3:clamp(32px,8.5vw,40px);--bk-headc:#780000;--bk-font:'Jost',-apple-system,Arial,sans-serif;--bk-r:22px;--bk-btntt:uppercase;--bk-btnls:.08em}</style>
<script>window.BOOK_CFG={biz:'sba',who:'Amarah',wa:'27844456657',home:'index.html'};</script>
<script src="../booking.js?v=3" defer></script>
'''

# ------------------------------------------------------------------ 404
notfound = '''<section class="phead" style="min-height:60vh;display:flex;align-items:center">
  <div class="wrap center">
    <span class="label">Error 404</span>
    <h1 class="script">Out of frame</h1>
    <p class="lead">That page does not exist, but there is plenty more to see.</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px"><a class="btn red" href="index.html">Go home</a><a class="btn line" href="gallery.html">View the gallery</a></div>
  </div>
</section>
'''

page('index.html', 'Shot by A Photography | Events, Birthdays, Corporate & Family Photography',
     'Shot by A is Amarah&#39;s people photography: events, birthdays, corporate and wellness days, and family portraits in Johannesburg.', home,
     LD + '<script>/* old portal links: fomstudios.co.za/shotbya?... still opens the client portal */if(/[?&]o=/.test(location.search))location.replace("portal/"+location.search+location.hash);</script>\n')
page('gallery.html', 'Gallery | Shot by A Photography', 'Browse Shot by A&#39;s photography: events, birthdays, corporate and wellness days, and family portraits.', gallery)
page('contact.html', 'Book a shoot | Shot by A Photography', 'Book Shot by A for your event, birthday, corporate or wellness day, or family portrait session. Send your details on WhatsApp or email.', contact)
page('policy.html', 'Booking policy | Shot by A Photography', 'Shot by A booking terms: payment, cancellations, rescheduling, delivery and usage rights.', policy)
page('book.html', 'Book a meeting | Shot by A Photography', 'Book a meeting with Shot by A: pick a time for a phone or video call about your event, birthday, corporate or family shoot.', book, BOOK_HEAD)
page('404.html', 'Page not found | Shot by A Photography', 'This page does not exist.', notfound, '<meta name="robots" content="noindex">\n')
