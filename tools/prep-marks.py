"""Copy each room's round mark from ../_Graphics into site/rooms/, small enough for the ware banners.

    python3 tools/prep-marks.py

Marks are Helios's own art; never redrawn, only scaled down (192 px: sharp at about 3rem on a Retina screen).
The dark versions are used, since they sit on the banner's light cream.
"""
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parent.parent
art = root.parent / '_Graphics'
MARKS = {
    'artline': 'ArtLine_V3_Round-B.png',
    'scriptorium': 'Scriptorium V1_Round-D.png',
    'bookeeper': 'Bookeeper_Round.png',
    'xmrange': 'XMRanger.png',
    'workbench': 'Workbench_circle.png',
    'house': 'House_Round.png',
    'lighthouse': 'Lighthouse_Round.png',
    'deepthought': 'Deep Thought.png',
    'emissaries': 'Emissary_V1.png',
    'helios': 'Glyph_V2_Round.png',   # the House's own mark, for About
}
out = root / 'site' / 'rooms'
out.mkdir(exist_ok=True)
for name, src in MARKS.items():
    subprocess.run(['sips', '-Z', '192', str(art / src), '--out', str(out / f'{name}.png')], check=True, capture_output=True)
    print(f'site/rooms/{name}.png from {src}')
