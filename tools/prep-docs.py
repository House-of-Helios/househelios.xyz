"""Render a room's docs into site/docs/<room>/: one finished HTML page per Markdown page, readable without script.

    tools/.venv/bin/python tools/prep-docs.py            # every room in ROOMS
    tools/.venv/bin/python tools/prep-docs.py xmrange    # one room

Each room writes its own pages in its own repo (docs/site/NN-title.md, first line "# Title", images in docs/site/img/);
this script only reads them. Never edit a room's files from here. Setup once:
    python3 -m venv tools/.venv && tools/.venv/bin/pip install markdown
"""
import html
import pathlib
import re
import shutil
import sys

import markdown

root = pathlib.Path(__file__).resolve().parent.parent
house = root.parent
# room id: (name, folder, accent, dark, download link or None)
THEME_HEAD = "<script>(function(){var r=document.documentElement;try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')r.dataset.theme=t;}catch(e){}r.classList.toggle('is-dark',r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches);})();</script>"   # Scriptorium's no-flash theme resolver
TOGGLE = '<button class="theme-toggle" type="button" aria-label="Switch colour theme" title="Switch light / dark"><svg class="ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg><svg class="ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg></button>\n<script>(function(){var r=document.documentElement,b=document.querySelector(\'.theme-toggle\'),mq=matchMedia(\'(prefers-color-scheme: dark)\');var eff=function(){return r.dataset.theme||(mq.matches?\'dark\':\'light\')};var sync=function(){r.classList.toggle(\'is-dark\',eff()===\'dark\')};sync();b.addEventListener(\'click\',function(){var n=eff()===\'dark\'?\'light\':\'dark\';r.dataset.theme=n;try{localStorage.setItem(\'theme\',n)}catch(e){}sync()});mq.addEventListener(\'change\',function(){if(!r.dataset.theme)sync()});})();</script>'   # Scriptorium's moon/sun toggle
ROOMS = {
    'xmrange': ('XMRange', 'XMRange', '#39ad7d', '#008344', 'https://github.com/House-of-Helios/xmrange/releases/latest'),
    'bookkeeper': ('Bookkeeper', 'Bookkeeper', '#39ad7d', '#008344', 'https://github.com/House-of-Helios/bookkeeper/releases/latest'),
}
MARKS = {'xmrange': 'xmrange', 'bookkeeper': 'bookeeper'}   # site/rooms/<mark>.png


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def build(room):
    name, folder, accent, dark, download = ROOMS[room]
    src = house / folder / 'docs' / 'site'
    pages = sorted(src.glob('[0-9][0-9]-*.md'))
    if not pages:
        print(f'{room}: no pages in {src}')
        return
    out = root / 'site' / 'docs' / room
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    if (src / 'img').is_dir():
        shutil.copytree(src / 'img', out / 'img')
    meta = []
    for p in pages:
        text = p.read_text()
        first = text.splitlines()[0]
        assert first.startswith('# '), f'{p.name}: first line must be "# Title"'
        meta.append((p, first[2:].strip(), p.stem + '.html'))
    for i, (p, title, file) in enumerate(meta):
        md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'], extension_configs={'toc': {'slugify': lambda t, sep: slug(t)}})
        # Rooms indent nested lists by 2 spaces; Python-Markdown wants 4.
        src_md = re.sub(r'^( +)(?=[-*] |\d+\. )', lambda m: m.group(1) * 2, p.read_text(), flags=re.M)
        body = md.convert(src_md)
        body = re.sub(r'href="(\d\d-[^".#]+)\.md(#[^"]*)?"', lambda m: f'href="{m.group(1)}.html{m.group(2) or ""}"', body)
        body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
        # Screenshots sit in a little Mac window (red, yellow, green lights) and open full size on click; small
        # pieces of the app (a pill, a badge) and pictures that are already a whole macOS window stay bare.
        bare = ('pill', 'about-this-mac', 'open-anyway', 'privacy-map', 'trial-math', 'trial-flow')   # diagrams are not windows
        body = re.sub(r'<img ([^>]*?)src="(img/[^"]+)"([^>]*)>', lambda m: m.group(0) if any(b in m.group(2) for b in bare) else f'<a class="shot" href="{m.group(2)}" target="_blank" rel="noopener"><span class="shot-bar" aria-hidden="true"><i></i><i></i><i></i></span><img {m.group(1)}src="{m.group(2)}"{m.group(3)}></a>', body)   # the room's notes to itself (where a screenshot will go)
        heads = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
        nav = '\n'.join(f'<li><a href="{f}"{" aria-current=\"page\"" if f == file else ""}>{html.escape(t)}</a></li>' for _, t, f in meta)
        toc = '\n'.join(f'<li><a href="#{a}">{t}</a></li>' for a, t in heads)
        prev = f'<a class="prev" href="{meta[i - 1][2]}">‹ {html.escape(meta[i - 1][1])}</a>' if i else '<span></span>'
        nxt = f'<a class="next" href="{meta[i + 1][2]}">{html.escape(meta[i + 1][1])} ›</a>' if i + 1 < len(meta) else '<span></span>'
        get = f'<a class="get" href="{download}">Download</a>' if download else ''
        page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} · {name} docs · House of Helios</title>
<meta name="description" content="{html.escape(name)} docs: {html.escape(title)}.">
<meta property="og:image" content="https://househelios.xyz/og.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,700,0,1&display=swap">
<link rel="stylesheet" href="../docs.css">
{THEME_HEAD}
</head>
<body style="--accent:{accent};--dark:{dark}">
<header class="top">
  <nav class="crumbs" aria-label="Where you are">
    <a class="home" href="../"><img src="../../rooms/helios.png" alt="" width="28" height="28">House of Helios docs</a>
    <span class="sep" aria-hidden="true">›</span>
    <a class="room" href="./"><img src="../../rooms/{MARKS[room]}.png" alt="" width="28" height="28">{name}</a>
  </nav>
  {get}
</header>
<div class="wrap">
  <nav class="pages" aria-label="{name} docs pages">
    <details open><summary>Pages</summary><ol>
{nav}
    </ol></details>
  </nav>
  <main>
{body}
    <footer class="turn">{prev}{nxt}</footer>
  </main>
  <aside class="toc" aria-label="On this page">{f"<p>On this page</p><ul>{toc}</ul>" if heads else ""}</aside>
</div>
{TOGGLE}
</body>
</html>
'''
        (out / file).write_text(page)
    (out / 'index.html').write_text(f'<!doctype html><meta charset="utf-8"><title>{name} docs</title><meta http-equiv="refresh" content="0; url={meta[0][2]}"><a href="{meta[0][2]}">{name} docs</a>\n')
    print(f'{room}: {len(meta)} pages → site/docs/{room}/')


TAGS = {'xmrange': "Mines Monero on your Mac's CPU for the most hashes per watt, fully local.", 'bookkeeper': 'Local-first accounting.'}


def index():
    """site/docs/index.html: every room's docs, one card each, with its first page's first picture."""
    cards = []
    for room, (name, folder, accent, dark, _) in ROOMS.items():
        d = root / 'site' / 'docs' / room
        pages = sorted(d.glob('[0-9][0-9]-*.html'))
        if not pages:
            continue
        shot = re.search(r'src="(img/[^"]+)"', pages[0].read_text())
        pic = f'<span class="shot"><span class="shot-bar" aria-hidden="true"><i></i><i></i><i></i></span><img src="{room}/{shot.group(1)}" alt=""></span>' if shot else ''
        cards.append(f'''<a class="doc-card" href="{room}/" style="--accent:{accent};--dark:{dark}">
      {pic}
      <span class="doc-name"><img src="../rooms/{MARKS[room]}.png" alt="" width="36" height="36">{name}</span>
      <span class="doc-tag">{html.escape(TAGS.get(room, ''))}</span>
      <span class="doc-count">{len(pages)} pages</span>
    </a>''')
    (root / 'site' / 'docs' / 'index.html').write_text(f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Docs · House of Helios</title>
<meta name="description" content="Docs for the House of Helios apps: how to install them, use them, and what stays on your Mac.">
<meta property="og:image" content="https://househelios.xyz/og.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,700,0,1&display=swap">
<link rel="stylesheet" href="docs.css">
{THEME_HEAD}
</head>
<body style="--accent:#cb4142;--dark:#9f353b">
<header class="top">
  <nav class="crumbs" aria-label="Where you are">
    <a class="home" href="./" aria-current="page"><img src="../rooms/helios.png" alt="" width="28" height="28">House of Helios docs</a>
  </nav>
  <a class="get quiet" href="../home.html">The Home</a>
</header>
<main class="shelf">
  <h1>Docs</h1>
  <p class="lead">How to install each of the House's apps, how to use it, and what stays on your Mac.</p>
  <div class="doc-cards">
    {"".join(cards)}
  </div>
</main>
{TOGGLE}
</body>
</html>
''')
    print(f'docs index: {len(cards)} rooms')


for r in (sys.argv[1:] or ROOMS):
    build(r)
index()
