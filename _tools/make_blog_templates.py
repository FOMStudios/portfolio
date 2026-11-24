"""Builds the blog page templates from the contact pages, so the blog always matches the site.
Run from the portfolio folder:  python3 _tools/make_blog_templates.py
Writes blog/_post.html, blog/_list.html (FOM) and shotbya/blog/_post.html, shotbya/blog/_list.html (Shot by A),
plus an empty blog/index.html for each if none exists yet. The dashboard Blog page fills
<!--BLOG:HEAD--> (title, description, social tags, structured data) and <!--BLOG:MAIN--> (the post or the list)."""
import re, os

CSS_COMMON = '''
.bl{padding:clamp(110px,14vw,150px) 0 70px}
.bl .bl-in{max-width:760px;margin:0 auto;padding:0 22px}
.bl-back{display:inline-block;font-size:14px;margin-bottom:18px;opacity:.75;text-decoration:none}
.bl-back:hover{opacity:1}
.bl-meta{display:block;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-bottom:12px}
.bl h1{font-size:clamp(32px,5.4vw,52px);line-height:1.08;letter-spacing:-.01em;margin:0 0 16px}
.bl-lede{font-size:clamp(17px,1.9vw,20px);opacity:.82;margin:0 0 26px;line-height:1.55}
.bl-cover{margin:0 0 30px;border-radius:22px;overflow:hidden}
.bl-cover img{width:100%;height:auto;display:block}
.bl-body{font-size:17.5px;line-height:1.75}
.bl-body p{margin:0 0 18px}
.bl-body h2{font-size:clamp(23px,3vw,29px);line-height:1.2;margin:36px 0 12px}
.bl-body h3{font-size:20px;margin:26px 0 10px}
.bl-body ul,.bl-body ol{margin:0 0 18px 22px}
.bl-body li{margin:0 0 6px}
.bl-body a{text-decoration:underline;text-underline-offset:3px}
.bl-body figure{margin:26px 0}
.bl-body figure img{width:100%;height:auto;border-radius:18px;display:block}
.bl-body figcaption{font-size:13.5px;opacity:.7;margin-top:8px;text-align:center}
.bl-body blockquote{margin:22px 0;padding:4px 0 4px 18px;border-left:3px solid currentColor;opacity:.85;font-style:italic}
.bl-cta{margin:40px 0 10px;padding:26px 24px;border-radius:22px;text-align:center}
.bl-cta h2{font-size:clamp(22px,3vw,28px);margin:0 0 8px}
.bl-cta p{margin:0 0 16px;opacity:.85}
.bl-cta .bl-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.bl-btn{display:inline-flex;align-items:center;justify-content:center;padding:13px 24px;border-radius:999px;font-weight:600;font-size:14.5px;text-decoration:none;border:1.5px solid transparent}
.bl-more{margin-top:46px}
.bl-more h2{font-size:22px;margin:0 0 16px}
.bl-list-head{max-width:760px;margin:0 auto 34px;padding:0 22px}
.bl-grid{max-width:1180px;margin:0 auto;padding:0 22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:22px}
.bl-more .bl-grid{padding:0;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.bl-card{display:flex;flex-direction:column;border-radius:20px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .2s}
.bl-card:hover{transform:translateY(-3px)}
.bl-card .im{aspect-ratio:4/3;overflow:hidden}
.bl-card .im img{width:100%;height:100%;object-fit:cover;display:block}
.bl-card .tx{padding:16px 18px 20px}
.bl-card .tx small{display:block;font-size:12px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;margin-bottom:6px}
.bl-card .tx b{display:block;font-size:19px;line-height:1.25;margin-bottom:6px}
.bl-card .tx span{font-size:14.5px;opacity:.8;line-height:1.5}
.bl-empty{text-align:center;opacity:.75;padding:40px 22px}
'''
CSS_FOM = CSS_COMMON + '''
.bl{background:var(--bg);color:var(--ink)}
.bl h1,.bl-body h2,.bl-cta h2,.bl-more h2{font-weight:800;color:var(--ink)}
.bl-body a{color:var(--accent)}
.bl-cta{background:var(--bg-pill);border:1px solid var(--line)}
.bl-btn{background:var(--accent);color:#fff}
.bl-btn.line{background:transparent;color:var(--ink);border-color:var(--ink)}
.bl-card{background:var(--bg-pill);border:1px solid var(--line)}
'''
CSS_SBA = CSS_COMMON + '''
.bl h1{font-family:var(--script);font-weight:400;color:var(--red);font-size:clamp(46px,8vw,78px);line-height:1}
.bl-body h2,.bl-cta h2,.bl-more h2,.bl-card .tx b{font-weight:500}
.bl-body a{color:var(--red)}
.bl-cta{background:var(--paper);border:1px solid var(--line)}
.bl-btn{background:var(--red);color:var(--paper);text-transform:uppercase;letter-spacing:.08em;font-weight:500;font-size:13.5px}
.bl-btn.line{background:transparent;color:var(--ink);border-color:var(--ink)}
.bl-card{background:var(--paper);border:1px solid var(--line)}
'''

def cut(s, a, b, new):
    i = s.index(a); j = s.index(b, i) + (len(b) if b.endswith('>') and not b.startswith('<!--') else 0)
    return s[:i] + new + s[j:]

def fom():
    s = open('contact.html').read()
    # head: drop the contact page's own title, description, canonical and social tags
    s = re.sub(r'<title>.*?<meta name="twitter:image"[^>]*>\n', '<!--BLOG:HEAD-->\n', s, count=1, flags=re.S)
    s = re.sub(r'<link rel="canonical"[^>]*>\n', '', s)
    s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<base href="/">', 1)
    s = s.replace('</head>', '<style>/* blog */' + CSS_FOM + '</style>\n</head>', 1)
    s = s.replace(' class="active"', '')
    i = s.index('<!-- PAGE HEADER -->'); j = s.index('<!-- FOOTER -->')
    s = s[:i] + '<main class="bl" id="main">\n<!--BLOG:MAIN-->\n</main>\n\n' + s[j:]
    return s

def sba():
    s = open('shotbya/contact.html').read()
    s = re.sub(r'<title>.*?<meta property="og:image"[^>]*>\n', '<!--BLOG:HEAD-->\n', s, count=1, flags=re.S)
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/shotbya/">', 1)
    s = s.replace('</head>', '<style>/* blog */' + CSS_SBA + '</style>\n</head>', 1)
    s = s.replace(' class="on" aria-current="page"', '').replace(' class="on"', '')
    i = s.index('<main id="main">'); j = s.index('</main>') + len('</main>')
    s = s[:i] + '<main class="bl" id="main">\n<!--BLOG:MAIN-->\n</main>' + s[j:]
    s = s.replace('src="../', 'src="/')   # base is /shotbya/, so ../ would go to the root anyway; make it explicit
    s = s.replace('href="../index.html"', 'href="/index.html"')
    return s

EMPTY = {
  'fom': ('<title>Blog | FOM Studios, Johannesburg Photographer</title>\n<meta name="description" content="Stories, tips and behind the scenes from FOM Studios shoots around Johannesburg: events, sport, cars, portraits and brands.">\n<link rel="canonical" href="https://www.fomstudios.co.za/blog/">',
          '<section class="bl-list-head"><span class="eyebrow">Blog</span><h1>Stories from our shoots</h1><p class="bl-lede">Behind the scenes, tips and highlights from shoots around Joburg.</p></section>\n<div class="bl-empty">The first stories are on their way.</div>'),
  'sba': ('<title>Blog | Shot by A Photography</title>\n<meta name="description" content="Stories and tips from Shot by A shoots: events, birthdays, corporate and wellness days, and family portraits in Johannesburg.">\n<link rel="canonical" href="https://www.fomstudios.co.za/shotbya/blog/">',
          '<section class="bl-list-head"><span class="label">Blog</span><h1>Stories</h1><p class="bl-lede">Little stories from my shoots, plus tips for yours.</p></section>\n<div class="bl-empty">The first stories are on their way.</div>'),
}

for biz, base, tpl in (('fom', 'blog/', fom()), ('sba', 'shotbya/blog/', sba())):
    os.makedirs(base, exist_ok=True)
    for name in ('_post.html', '_list.html'):
        open(base + name, 'w').write(tpl)
    if not os.path.exists(base + 'index.html'):
        h, m = EMPTY[biz]
        open(base + 'index.html', 'w').write(tpl.replace('<!--BLOG:HEAD-->', h).replace('<!--BLOG:MAIN-->', m))
    print('wrote', base)
