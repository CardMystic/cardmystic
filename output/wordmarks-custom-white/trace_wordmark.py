from pathlib import Path
import sys
import xml.etree.ElementTree as ET
from io import BytesIO

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / '.tools'))
import vtracer
import resvg_py

# The fourth image displayed in the conversation is the joined MY design.
source = Image.open(ROOT / '03-custom-ligature.png').convert('RGB')
mask = source.convert('L').point(lambda value: 255 if value >= 128 else 0)
bounds = mask.getbbox()
mask = mask.crop(bounds)
padding = 20
canvas = Image.new('L', (mask.width + padding * 2, mask.height + padding * 2), 255)
canvas.paste(Image.eval(mask, lambda value: 255 - value), (padding, padding))
canvas.save(ROOT / 'trace-input.png')
output = ROOT / 'cardmystic-white.svg'
vtracer.convert_image_to_svg_py(
    str(ROOT / 'trace-input.png'), str(output), colormode='binary',
    mode='spline', filter_speckle=16, corner_threshold=90,
    length_threshold=2.0, max_iterations=10, splice_threshold=30,
    path_precision=3,
)
ET.register_namespace('', 'http://www.w3.org/2000/svg')
tree = ET.parse(output)
svg = tree.getroot()
svg.set('viewBox', f'0 0 {canvas.width} {canvas.height}')
svg.set('role', 'img')
svg.set('aria-label', 'CARDMYSTIC')
paths = svg.findall('{http://www.w3.org/2000/svg}path')
assert paths, 'Tracing produced no paths'
for path in paths:
    path.set('fill', '#ffffff')
assert all(element.tag.endswith(('svg', 'path')) for element in svg.iter())
tree.write(output, encoding='utf-8', xml_declaration=True)
rendered = resvg_py.svg_to_bytes(svg_string=output.read_text(encoding='utf-8'))
preview = Image.open(BytesIO(rendered)).convert('RGBA')
preview.save(ROOT / 'cardmystic-white.png')
alpha = np.array(preview.getchannel('A'))
expected = np.array(canvas) < 128
actual = alpha >= 128
iou = (expected & actual).sum() / (expected | actual).sum()
assert iou > 0.97, f'Trace mismatch: {iou}'
assert alpha[0, 0] == 0, 'Background must be transparent'
display = Image.new('RGBA', preview.size, '#111118')
display.alpha_composite(preview)
display.convert('RGB').save(ROOT / 'cardmystic-svg-preview.png')
print(f'Saved {output}\nPaths: {len(paths)}\nDimensions: {canvas.size}\nMask overlap: {iou:.4%}\nTransparent background verified')
