# Banner card flip and About — design (short)

## Intent
The big ware banner on The Home becomes a place you can go deeper in. Click a room in its list and the card inside the banner turns over to show that room alone; turn it back to return. Clicking the House of Helios mark opens the same banner shape with About on its card. The words must be true: each room is described the way it describes itself elsewhere.

## Approaches
1. **Card turns over (3D flip)** — picked by Helios. The words area spins on its vertical middle like a playing card. Cloth, rod, edge and tassels never move.
2. Slide — list slides out, room slides in. Rejected: reads like a phone app, loses the card.
3. Fade swap — rejected: nothing says "deeper".

## Design
- **Front (list):** as today: ware icon, ware name, ware line, one row per room (mark, name, line). Each row is a button.
- **Back (room):** room's round mark at the top, a bit smaller than the ware icon; room name; its real tagline; a smaller grey line; links (Instagram, site) where the room has them; a "back" control that turns the card back over. The ware icon and ware line are not shown on the back.
- **Flip:** `rotateY` 0 → 180°, about 0.6 s, ease in-out, `backface-visibility: hidden`. Stepped by script like the other fades only if the browser animation blinks (house lesson); try CSS first.
- **Length:** when the back is taller or shorter than the front, the banner's sides grow or shrink smoothly after the flip, with the same `reel()` lengthening the big banner already uses. No jump.
- **About:** clicking the House of Helios mark (painted `Text` layer on The Home) opens the same big banner. Edge colour: the mark's red (Claude's call). Card front: what the House is and how it works, from SOUL's "What the House is" and "What the House gives away". No rooms list, so no flip there for now.
- **Close:** close mark, click outside or Escape rolls the banner up from whichever side is showing.
- **Phone and desktop:** same behaviour. Escape/Enter/Tab work; "back" is a real button; each side is a labelled region.
- **Reduced motion:** no spin, a plain swap.

## Words (source of each line)
- Art Line NYC: "All the city's art, in one place" (Art Line's own landing page). Grey: Art Line's own line. Links: Instagram @artline.nyc, Art Line's page.
- Scriptorium, Bookkeeper, XMRange, The House: first line of each room's README.
- Workbench, The Lighthouse, Deep Thought, Emissaries: no README yet. SOUL's room table line until Helios gives his own.
- Fix the room name spelling to match the rooms: Bookkeeper (README) vs Bookeeper (SOUL) — ask Helios.

## Non-goals
No new pages or addresses; no change to the small banners, the river, the birds; no new art.

## Left to the builder
Exact sizes, the back control's look, the grey shade.

## Docs pages (added 2026-11-17)
- **What:** a Docs page per software room, first XMRange and Bookkeeper, at `househelios.xyz/docs/<room>/`, laid out like docs.venice.ai: left list of pages, the page in the middle, its headings on the right; screenshots inline. A plain page, outside the painting, so the no-chrome rule does not apply there (Claude's call). Linked from the room's card back ("Docs").
- **Hand-off (each room keeps its walls):** the room writes plain Markdown in its own repo, `docs/site/NN-title.md` (first line `# Title`) plus `docs/site/img/`. This room's `tools/prep-docs.py` copies and renders them into `site/docs/<room>/` as finished HTML (readable by people and agents, no script needed to read). We never edit a room's files.
- **Approach:** pages rendered ahead of time by the prep script (Claude's call). Not picked: rendering Markdown in the browser from a CDN library (pages blank to agents and without script).
- **Privacy:** screenshots show no real amounts, addresses, hostnames or home paths; `check-publish.sh` scans the rendered pages before any push.
- **Status:** XMRange agreed (xmrange-97): pages 01-overview · 02-install · 03-first-run · 04-trials-and-profiles · 05-default-wallet · 06-privacy · 07-updates in `XMRange/docs/site/`, after its repo cleanup and 0.0.1 release; it will message when ready. Its card tagline: "Mines Monero on your Mac's CPU for the most hashes per watt, fully local." The default wallet is GhostDrip's dev wallet, never to be called an XMRange wallet. Bookkeeper: no open session found.
