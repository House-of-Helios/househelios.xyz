"""Copy a painting from _Assets into site/, framed and ready.

    python3 tools/prep-splash.py "_Assets/Splash V2.svg"
    python3 tools/prep-splash.py "_Assets/Home.svg" home.svg

The second argument names the file in site/ (splash.svg when left out).

The art's `_Frame` layer marks the screen. Its wide rectangle becomes the file's viewBox, so the
file on its own (no script) shows the desktop view. `_Frame`, `Clouds` and `Fade_In` start hidden;
splash.js reads the frames and brings the clouds and the way in on stage.
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
out = sys.argv[2] if len(sys.argv) > 2 else 'splash.svg'
s = src.read_text()

frame = re.search(r'<g id="_Frame".*?</g>', s, re.S)
if not frame:
    sys.exit('No _Frame layer: draw the screen as a rectangle on a layer called _Frame.')
rects = [
    tuple(float(re.search(fr'\b{a}="([-\d.]+)"', r)[1]) for a in ('x', 'y', 'width', 'height'))
    for r in re.findall(r'<rect[^>]*>', frame[0])
]
wide = max(rects, key=lambda r: r[2] / r[3])
s = re.sub(r'viewBox="[^"]*"', 'viewBox="%g %g %g %g"' % wide, s, count=1)
for layer in ('_Frame', 'Clouds', 'Fade_In'):
    s = s.replace(f'<g id="{layer}"', f'<g id="{layer}" display="none"', 1)

(root / 'site' / out).write_text(s)
print(f'site/{out} from {src.name}: desktop frame {wide}')
