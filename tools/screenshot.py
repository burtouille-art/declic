# Capture d'écran pour vérifier le design : python3 tools/screenshot.py URL sortie.png LARGEUR HAUTEUR [1=page entière|0] [light|dark]
# Le site doit tourner (npm run build && npx vite preview --port 4173).
import sys, asyncio
from playwright.async_api import async_playwright
url = sys.argv[1]; out = sys.argv[2]; w = int(sys.argv[3]); h = int(sys.argv[4]); full = sys.argv[5] == '1' if len(sys.argv) > 5 else True
scheme = sys.argv[6] if len(sys.argv) > 6 else 'light'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1, color_scheme=scheme)
        msgs = []
        pg.on('console', lambda m: msgs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: msgs.append(f'PAGEERROR: {e}'))
        await pg.goto(url, wait_until='networkidle')
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=out, full_page=full)
        print('\n'.join(msgs[:20]))
        await b.close()
asyncio.run(main())
