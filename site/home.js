// 🏡 The Home: the clearing past the sign, with the three wares hanging as banners (Home.svg, parts from kit.js).
// Home.build paints it out of sight and hands back show (bring it on stage), area (where the banners hang, on screen)
// and drop (unroll the banners). The splash paints it behind its clouds; home.html paints it on its own.
window.Home = (() => {
  const { NS, rand, still } = Kit;

  // 🪧 What each banner opens onto. Each ware's line is the House's own account of it (SOUL). Each room is described the
  // way it describes itself: its tagline from its own README or landing page (Art Line's page, XMRange's session), and
  // where a room has none yet, its line in SOUL's room table, until Helios gives his own.
  const WARES = {
    software: { title: 'software', edge: '#39ad7d', dark: '#008344', line: 'Apps you install. Free, under GPL-3.0.', rooms: ['bookkeeper', 'xmrange'] },
    netware: {
      title: 'netware', edge: '#42aae0', dark: '#0789c7',
      line: 'Networks and sites. Every quote names its edition, every event its venue. A page here is readable by people and by agents.',
      rooms: ['artline', 'scriptorium'],
    },
    codeware: {
      title: 'codeware', edge: '#cb4142', dark: '#9f353b', line: 'The tools that keep the House itself.',
      rooms: ['workbench', 'house', 'lighthouse', 'deepthought', 'emissaries'],
    },
  };
  // A room's card: mark (site/rooms/<mark>.png), name, tagline, a little more in grey, links.
  const ROOMS = {
    artline: { mark: 'artline', name: 'Art Line NYC', tag: "All the city's art, in one place.",
      more: 'New York art events from about a thousand venues, posted daily.',
      links: [['Instagram', 'https://www.instagram.com/artline.nyc/']] },
    scriptorium: { mark: 'scriptorium', name: 'Scriptorium', tag: 'The most well-indexed quote database on the planet.',
      more: 'Every quote is verified against its real source, carries its full context, and is scored.', links: [] },
    bookkeeper: { mark: 'bookeeper', name: 'Bookkeeper', tag: 'A quiet ledger for a Mac: what you hold in crypto, and where your money goes.',
      more: 'Keeps your holdings without ever touching a wallet key.', links: [] },
    xmrange: { mark: 'xmrange', name: 'XMRange', tag: "Mines Monero on your Mac's CPU for the most hashes per watt, fully local.",
      more: 'Runs on Apple silicon and Intel Macs, and needs no administrator password.',
      links: [['Docs', 'docs/xmrange/'], ['Download', 'https://github.com/House-of-Helios/xmrange/releases/latest']] },
    workbench: { mark: 'workbench', name: 'Workbench', tag: 'The one host app on both Macs.', more: "Every room's machinery plugs in as an app.", links: [] },
    house: { mark: 'house', name: 'The House', tag: 'A native Mac HUD for the Claude agents at work across the House.',
      more: 'Light, native SwiftUI. No web app.', links: [] },
    lighthouse: { mark: 'lighthouse', name: 'The Lighthouse', tag: 'The Discord bots: Sensei, Hermes and Thoth.', more: 'Workbench keeps them running.', links: [] },
    deepthought: { mark: 'deepthought', name: 'Deep Thought', tag: "Claude's own memory.", more: 'An Obsidian vault, and the healer jobs that tend it.', links: [] },
    emissaries: { mark: 'emissaries', name: 'Emissaries', tag: 'The view from the hill.', more: 'Where every room stands, drawn for Helios.', links: [] },
  };
  // 📜 About: opened from the House's round mark, on the same banner (netware's, re-dyed in the sun's amber). Words from
  // SOUL's "What the House is" and "What the House gives away".
  const ABOUT = {
    title: 'about', from: 'netware', edge: '#f0a830', dark: '#b06a12', about: true,
    card: { mark: 'helios', name: 'House of Helios', tag: 'One house, many rooms.',
      body: ['House of Helios makes things for the public good: tools that help, data drawn for people who learn by seeing, sites that make a life a little larger, games and worlds to wander in.',
        'Helios is an artist, an organizer, a friend and an architect. He sees in pictures and directs the vision. Claude does the building.',
        'What it gives away hangs here as three banners. Software: apps you install, free under GPL-3.0. Netware: networks and sites. Codeware: the tools that keep the House itself.',
        'A lesson learned in one room is light for all the others.'],
      links: [['houseofhelios@proton.me', 'mailto:houseofhelios@proton.me']] },
  };
  // Banners left to right: software, netware (hung higher, in the middle), codeware.
  const ORDER = ['software', 'netware', 'codeware'];

  // 💧 The river runs right to left across the foot of the clearing. Measured from the water shape: x, near bank
  // (top of the water), far bank (bottom), middle. Light on the water follows its middle.
  const RIVER = [[348, 148, 160, 154], [342, 145, 162.8, 153.9], [336, 142.3, 170, 156.1], [324, 140.3, 175, 157.6],
    [312, 139.8, 177.5, 158.6], [300, 139.5, 179, 159.3], [288, 140, 179.5, 159.8], [276, 141, 180.5, 160.8],
    [264, 142, 179.3, 160.6], [252, 145.8, 180.8, 163.3], [240, 151.3, 185.8, 168.5], [228, 154.3, 188.5, 171.4],
    [216, 155.3, 186.5, 170.9], [204, 154.5, 183.8, 169.1], [192, 152.3, 181.3, 166.8], [180, 148, 180.8, 164.4],
    [168, 145.3, 182.5, 163.9], [156, 144.8, 181.8, 163.3], [144, 145, 180.8, 162.9], [132, 146, 180.5, 163.3],
    [120, 147, 180.3, 163.6], [108, 149.3, 179.8, 164.5], [96, 152, 178, 165], [84, 162, 170.3, 166.1]];
  const at = (x, k) => {
    for (let i = 1; i < RIVER.length; i++) {
      const a = RIVER[i - 1], b = RIVER[i];
      if (x <= a[0] && x >= b[0]) return a[k] + (b[k] - a[k]) * (a[0] - x) / (a[0] - b[0]);
    }
    return (x > RIVER[0][0] ? RIVER[0] : RIVER[RIVER.length - 1])[k];
  };
  // 🪷 The blooms on the river stay where Helios painted them, rocking. Through them runs one steady stream on one lane,
  // all at one pace so the spacing holds: two ducks together, then 20 s apart a bloom, a duck, a bloom, and round again (STREAM). In from behind
  // the trees on the right, out behind the trees on the left. The stream is already under way when The Home shows
  // (STREAM.ahead): the first two ducks are out in mid-river below the reeds, the rest following.
  // LANE is the open water between the resting blooms and the reeds on the near bank, above the low middle bloom.
  // It dips under the bloom below the software banner, so a duck's head clears the bloom's foot instead of rising into it.
  const LANE = [[346, 161], [300, 162], [260, 163.5], [235, 164.5], [220, 165], [212, 165.3], [204, 166.8], [196, 168],
    [188, 168], [178, 167.5], [160, 167], [146, 167], [120, 166.5], [86, 166]];
  const STREAM = { speed: 3.5, period: 84, ahead: 33, beats: [['duck', 0], ['duck', 4], ['bloom', 24], ['duck', 44], ['bloom', 64]] };   // units a second; s
  const DUCK = { length: 8.7 };
  const WAKE = '#8fd0f2';

  // 🐦 As soon as the last banner is down, three birds rise from behind the near tree at the bottom left, swoop low under
  // the banners and up over the bush, in front of the cypress (the tree with the roots and the purple flowers), into the
  // middle of the dark evergreen on the right (drawn just under it; end checked inside).
  const PAIR = {
    route: [[112, 163], [150, 152], [185, 143], [215, 138.5], [240, 135], [262, 124], [282, 108], [298, 95], [312, 86]],
    birds: [[0, 0, 0], [3.5, -1.8, 0.15], [7, 0.8, 0.3]],
  };
  // Half a lap later a flock of seven comes out from behind the trees on the right, flies in front of the round mark and
  // over the mushrooms, and into the lime willow on the left. The near trees (_02) are drawn below the mark, so the flock
  // changes layers twice, each time in open sky (checked clear): in front of everything once the last bird is past
  // `front`, then just under the willow once the lead is past `willow`.
  const FLIGHT = {
    route: [[284, 67], [264, 68.5], [244, 71], [224, 74.5], [209, 77], [192, 80.5], [172, 84.5], [152, 88], [136, 90.5],
      [120, 92], [110, 93]],
    speed: 17, rest: 22, front: 244, willow: 175,
    birds: [[0, 0, 0], [3.5, -2, 0.12], [6.5, 1.5, 0.24], [9.5, -1, 0.36], [12.5, 1, 0.48], [15.5, -1.5, 0.6], [18.5, 0.5, 0.72]],
  };

  const build = async ({ scene, lifted }) => {
    const { svg, defs } = await Kit.inline(scene, 'home.svg');
    Kit.frame(svg);
    await Kit.frontTrees(svg, lifted);

    const banners = hang(svg);
    let begin = () => {};   // the river's first round, once there is a river to run
    const show = () => {
      scene.classList.add('shown');
      lifted.classList.add('shown');
      banners.place();
      begin();
    };
    const area = () => svg.getElementById('Banners').getBoundingClientRect();
    if (still) return { show, area, drop: banners.open };

    Kit.wind(svg, ['wheat-2', 'Layer_16', 'Layer_17', 'Layer_19', 'Layer_20', 'Layer_21', 'Layer_23', 'Layer_24', 'flowers']);
    Kit.woods(svg);
    Kit.bushes(svg);
    const { lotus, blooms } = Kit.blooms(svg);
    Kit.shimmer(svg, defs, Kit.smooth(RIVER.map(r => [r[0], r[3]])), 'home-river-mask');

    // 🪷🦆 The stream. Visitor blooms are copies of a resting one, in the lotus layer; ducks swim nearer than the reeds on
    // the bank and every bloom, so their pond sits above all the ground layers. Each is taken from a pool when its beat
    // comes and handed back when it has gone out of sight, so the pool only grows to what is on the water at once.
    const lane = Kit.way(defs, LANE);
    const river = blooms.filter(b => { const c = centre(b); return c.y > at(c.x, 1); });
    const seed = river[0], seedAt = centre(seed);
    const nearer = river.find(b => { const c = centre(b); return c.y > 168; });   // the low bloom in the middle
    const pond = document.createElementNS(NS, 'g');
    svg.getElementById('_02').before(pond);
    const art = await Kit.duckArt();
    const pools = { duck: [], bloom: [] };
    const make = {
      duck: n => {
        const phase = rand(0, 6);
        return { el: Kit.duck({ svg, defs, art, parent: pond, length: DUCK.length, wake: WAKE, id: `home-duck-eye-${n}` }),
          put: (el, p, t) => Kit.paddle(el, p, t + phase) };
      },
      bloom: () => {
        const el = document.createElementNS(NS, 'g');
        el.appendChild(seed.cloneNode(true));
        lotus.insertBefore(el, nearer ?? null);   // behind any resting bloom nearer than the lane
        el.style.visibility = 'hidden';
        return { el, put: (el, p) => el.setAttribute('transform', `translate(${(p.x - seedAt.x).toFixed(2)} ${(p.y - seedAt.y).toFixed(2)})`) };
      },
    };
    const take = kind => {
      let m = pools[kind].find(x => !x.busy);
      if (!m) pools[kind].push(m = make[kind](pools[kind].length));
      return Object.assign(m, { busy: true, s: 0 });
    };
    const travel = (m, dt, t) => {
      m.s += STREAM.speed * dt;
      if (m.s > lane.length) {   // out of sight on the left; back to the pool
        m.busy = false;
        m.el.style.visibility = 'hidden';
        return;
      }
      m.el.style.visibility = '';
      m.put(m.el, lane.path.getPointAtLength(m.s), t);
    };
    let started = null, beat = 0;
    const due = k => started + Math.floor(k / STREAM.beats.length) * STREAM.period + STREAM.beats[k % STREAM.beats.length][1];
    // Sets off every beat that has come due, placed as far along as it would be by now (skipping any already gone).
    const release = t => {
      for (; due(beat) <= t; beat++) {
        const along = (t - due(beat)) * STREAM.speed;
        if (along < lane.length) take(STREAM.beats[beat % STREAM.beats.length][0]).s = along;
      }
    };
    begin = () => { if (started === null) started = clock() / 1000 - STREAM.ahead; };

    // 🐦 Birds, from Helios's sprite sheet.
    const sheet = await Kit.sheet();
    const flock = document.createElementNS(NS, 'g');
    const pair = document.createElementNS(NS, 'g');
    const trees = svg.getElementById('_02');
    // The near trees sway as two clumps: cypress with evergreen on the right, branching tree with willow on the left.
    // Each front tree is parted off so a flight can slip between.
    const holding = Kit.holding(svg);
    const clumpAt = pt => [...trees.children].find(holding(pt));
    const right = clumpAt([284, 67]), left = clumpAt([110, 93]);
    const evergreen = right && Kit.partAt(right, [...right.children].findLastIndex(holding([308, 96])));
    const willow = left && Kit.partAt(left, [...left.children].findLastIndex(holding([110, 93])));
    trees.before(flock);
    if (evergreen) evergreen.before(pair); else trees.after(pair);
    const flockAt = { back: () => trees.before(flock), front: () => svg.appendChild(flock), willow: () => (willow ?? trees).before(flock) };
    let flockIs = 'back';
    const farBack = Math.max(...FLIGHT.birds.map(([back]) => back));
    const layer = (f, p, d) => {
      if (f !== flights[0]) return;
      const tail = f.path.getPointAtLength(Math.max(0, d - farBack)).x;
      const want = tail > FLIGHT.front ? 'back' : p.x > FLIGHT.willow ? 'front' : 'willow';
      if (want !== flockIs) { flockIs = want; flockAt[want](); }
    };
    const flights = [
      Kit.flight({ defs, art: sheet, route: FLIGHT.route, crew: FLIGHT.birds, group: flock, mirror: false }),
      Kit.flight({ defs, art: sheet, route: PAIR.route, crew: PAIR.birds, group: pair, mirror: true }),
    ];
    const lap = flights[0].length / FLIGHT.speed + FLIGHT.rest;
    for (const f of flights) f.delay = Infinity;   // nothing flies until the banners are down
    Kit.fly(flights, clock(), lap, FLIGHT.speed);

    let last;
    const tick = real => {
      if (hold.frozen) { last = null; requestAnimationFrame(tick); return; }   // held under a big banner (test switch)
      const now = clock(real);
      const dt = Math.min(0.05, (now - (last ?? now)) / 1000), t = now / 1000;
      last = now;
      Kit.fly(flights, now, lap, FLIGHT.speed, layer);
      if (started !== null) release(t);
      for (const m of [...pools.duck, ...pools.bloom]) if (m.busy) travel(m, dt, t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const drop = async () => {
      await banners.open();
      const t = clock() / 1000;
      flights[1].delay = t;            // the three from the bottom left first
      flights[0].delay = t + lap / 2;  // then the seven from the right
    };
    return { show, area, drop };
  };

  // 🌫️ How the clearing goes grey behind a big banner. Helios's test showed the flicker in Firefox came from the moving
  // scene being redrawn under a see-through grey sheet (holding the scene still cured it). So by default there is no
  // sheet: the clearing and its front trees dim themselves (`tint`, a brightness filter), and keep moving.
  // Test links: home.html?veil=sheet brings back the grey sheet; home.html?hold holds the scene still while open.
  const ASK = new URLSearchParams(location.search);
  const VEIL = ASK.get('veil') === 'sheet' ? 'sheet' : 'tint';
  const TINT = 0.56;   // brightness of the clearing behind a big banner, about as dark as the grey sheet was
  const HOLD_SCENE = ASK.has('hold');
  const hold = { frozen: false, since: 0, lost: 0 };
  const clock = (real = performance.now()) => real - hold.lost;
  const freeze = () => {
    if (!HOLD_SCENE) return;
    Object.assign(hold, { frozen: true, since: performance.now() });
    document.body.classList.add('held');
  };
  const thaw = () => {
    if (!hold.frozen) return;
    hold.lost += performance.now() - hold.since;
    hold.frozen = false;
    document.body.classList.remove('held');
  };

  const centre = el => { const b = el.getBBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

  // 🎏 Each banner unrolls from its rod, smoothly, drawn afresh each frame from the painted banner's own pieces.
  // Helios's six frames (_Assets/Banners.svg) set the start, the end and the way between: the rod's two round ends
  // never move (a line through the middle of the bar stays put); rolled, the cloth's top hem sits ROLL_UP above its
  // resting place, wound over a yellow roll ROLL thick; the sides grow to full length while the point keeps its shape,
  // and the roll thins away as the cloth comes down. At the bottom it springs back up a touch and sinks slowly to rest;
  // then the icon comes on. After that it hangs still for good.
  const UNROLL = 1080, STAGGER = 1000;             // ms to unroll, ms between banners
  const UNROLL_ORDER = ['netware', 'software', 'codeware'];
  const ROLL_UP = 0.56, ROLL = 2.23, ROLL_GONE = 0.5;   // painting units; the share of the unroll by which the roll is gone
  const SETTLE = { up: 0.03, rise: 220, sink: 700 };   // the bounce: share of the length it springs back, ms up, ms down
  // The icon and the banner's painted name fade in just before the cloth first hits the bottom, the way the splash's
  // "click to enter" does.
  // Fades are stepped by script, not by the browser's animations: an animated opacity gets a layer of its own that is
  // dropped at the end (a visible blink), and a held animation outlives any later change to the opacity.
  const FADE_IN = 2000;
  const FADE_AT = 0.82;   // the share of the unroll at which the fade starts, a touch before the bottom
  const KNOBS = ['#ce6449', '#ee9b21'];
  const SEAL = 0.12;   // painting units the hem tucks under the cloth             // the rod's round ends
  const union = els => els.map(k => k.getBBox()).reduce((a, r) => ({ x: Math.min(a.x, r.x), y: Math.min(a.y, r.y), r: Math.max(a.r, r.x + r.width), b: Math.max(a.b, r.y + r.height) }), { x: Infinity, y: Infinity, r: -Infinity, b: -Infinity });
  const pointsOf = el => el.getAttribute('points').trim().split(/[\s,]+/).map(Number);

  const wait = ms => new Promise(done => setTimeout(done, ms));
  // Runs fn(k) for k from 0 to 1 over ms, once a frame.
  const over = (ms, fn) => new Promise(done => {
    if (ms <= 0) { fn(1); return done(); }
    const start = performance.now();
    const step = now => { const k = Math.min(1, (now - start) / ms); fn(k); if (k < 1) requestAnimationFrame(step); else done(); };
    requestAnimationFrame(step);
  });
  // Fades elements from one opacity to another, eased in and out.
  const fade = (els, from, to, ms) => over(ms, k => {
    const v = from + (to - from) * k * k * (3 - 2 * k);
    for (const el of els) el.style.opacity = k < 1 ? v.toFixed(3) : (to === 1 ? '' : String(to));
  });
  // Unrolls a reel: the cloth's own weight takes it off the rod slowly, quickening all the way to the bottom; it springs
  // back `up` of its length and sinks slowly to rest, then the painted pieces are put back. The icon and `also` start
  // fading in just before the cloth first hits the bottom.
  const unfurl = async (r, up, ms = UNROLL, also = [], fadeMs = FADE_IN) => {
    const fades = [];
    await over(ms, k => {
      r.set(0.25 * k + 0.75 * k * k);
      if (k >= FADE_AT && !fades.length) fades.push(fade([...r.icon, ...also], 0, 1, fadeMs));
    });
    await over(SETTLE.rise, k => r.set(1 - up * Math.sin((k * Math.PI) / 2)));
    await over(SETTLE.sink, k => r.set(1 - up * (1 + Math.cos(k * Math.PI)) / 2));
    r.done();
    await Promise.all(fades);
  };

  // Readies one painted banner to unroll: set(p) draws it p of the way down (0 rolled, 1 hanging full length).
  const reel = (g, ware) => {
    const kids = [...g.children];
    const box = g.getBBox();
    const knobs = kids.filter(k => KNOBS.includes(k.getAttribute('fill')));
    const hem = kids.filter(k => !knobs.includes(k) && k.getBBox().height < 1.3 && k.getBBox().y < box.y + 0.5);
    const cloth = kids.filter(k => !knobs.includes(k) && !hem.includes(k));
    // The hem and the cloth meet edge to edge, so both edges soften on the same row of pixels and a hairline of whatever
    // is behind shows through (plain at painted size, a grey line on the big banner). The hem is drawn first, so its
    // lower edge is tucked a hair under the cloth.
    for (const el of hem.filter(k => k.hasAttribute('points') && !k.dataset.sealed)) {
      const v = pointsOf(el), low = Math.max(...v.filter((_, i) => i % 2));
      el.setAttribute('points', v.map((n, i) => (i % 2 && n === low ? n + SEAL : n)).join(' '));
      el.dataset.sealed = '1';
    }
    const edge = cloth.find(k => k.getAttribute('fill') === ware.edge && k.hasAttribute('points')) || cloth[0];
    const top = edge.getBBox().y;
    const parts = cloth.filter(k => { const b = k.getBBox(); return k.getAttribute('fill') !== '#c2d5db' && b.y > top + 1 && b.width < box.width * 0.8; });
    let icon = parts;
    // The icon fades as one picture: its pieces go into one group, so overlapping parts never show through each other.
    if (icon.length > 1) {
      const whole = document.createElementNS(NS, 'g');
      icon[0].before(whole);
      for (const k of icon) whole.appendChild(k);
      icon = [whole];
    }
    // How long the sides hang: from the top of the edge down to where its left side turns into the point.
    const ep = pointsOf(edge), left = Math.min(...ep.filter((_, i) => !(i % 2)));
    const side = Math.max(...ep.filter((v, i) => i % 2 && Math.abs(ep[i - 1] - left) < 0.01)) - top;
    // The icon's own pieces (grouped or not) never move with the cloth.
    const shapes = cloth.filter(k => !parts.includes(k) && k.hasAttribute('points')).map(el => ({ el, pts: pointsOf(el) }));
    const shift = el => +(/translate\(\s*0[\s,]+([-\d.]+)/.exec(el.getAttribute('transform') || '')?.[1] ?? 0);   // a piece already moved down
    const pieces = cloth.filter(k => !parts.includes(k) && !k.hasAttribute('points')).map(el => ({ el, y0: el.getBBox().y, y: el.getBBox().y + shift(el), was: el.getAttribute('transform') }));
    const hemTop = union(hem).y;
    const roll = document.createElementNS(NS, 'rect');
    for (const [a, v] of [['x', union(cloth).x], ['width', union(cloth).r - union(cloth).x], ['fill', '#ffd576']]) roll.setAttribute(a, v);
    g.insertBefore(roll, g.firstChild);   // behind the cloth, as in the sheet
    const set = p => {
      const rise = -ROLL_UP * (1 - Math.min(1, p)), short = side * (1 - p), at = top + rise;
      // A point d below the top of the cloth hangs at d less however much is still rolled up, never above the top.
      const drop = y => at + Math.max(0, y - top - short);
      for (const { el, pts } of shapes) el.setAttribute('points', pts.map((v, i) => (i % 2 ? drop(v).toFixed(3) : v)).join(' '));
      for (const { el, y, y0 } of pieces) el.setAttribute('transform', `translate(0 ${(drop(y) - y0).toFixed(3)})`);
      for (const el of hem) el.setAttribute('transform', `translate(0 ${rise.toFixed(3)})`);
      const thick = ROLL * Math.max(0, 1 - p / ROLL_GONE);
      roll.setAttribute('y', (hemTop + rise).toFixed(3));
      roll.setAttribute('height', thick.toFixed(3));
    };
    const done = () => {
      roll.remove();
      for (const { el, pts } of shapes) el.setAttribute('points', pts.join(' '));
      for (const { el, was } of pieces) if (was) el.setAttribute('transform', was); else el.removeAttribute('transform');
      for (const el of hem) el.removeAttribute('transform');
    };
    return { set, done, icon, top };
  };

  // Lays a door over each banner and its painted name, and rolls each banner up.
  const hang = svg => {
    const layer = svg.getElementById('Banners');
    const names = [...(svg.getElementById('Text')?.children || [])];
    const doors = document.createElement('div');
    doors.id = 'wares';
    document.body.appendChild(doors);
    const list = [...layer.children].sort((a, b) => a.getBBox().x - b.getBBox().x).map((g, i) => {
      const ware = WARES[ORDER[i]];
      const art = g.cloneNode(true);   // the banner as painted, for the big one
      const box = g.getBBox();   // the banner hanging full length, as painted: the door covers all of it
      const r = reel(g, ware);
      // The name painted above the banner opens it too.
      const name = names.find(n => { const b = n.getBBox(); return b.y + b.height < r.top && Math.abs(b.x + b.width / 2 - (box.x + box.width / 2)) < 4; });
      if (!still) {
        r.set(0);
        for (const k of [...r.icon, name].filter(Boolean)) k.style.opacity = 0;   // only the rolled banner shows at first
      }
      const door = document.createElement('button');
      door.type = 'button';
      door.className = 'ware-door';
      door.textContent = `Open ${ware.title}`;
      door.hidden = true;
      doors.appendChild(door);
      const nb = name?.getBBox() ?? box;
      const reach = { x: Math.min(box.x, nb.x), y: Math.min(box.y, nb.y), r: Math.max(box.x + box.width, nb.x + nb.width), b: box.y + box.height };
      const b = { g, art, reel: r, name, door, ware, reach };
      door.addEventListener('click', () => unroll(b));
      return b;
    });
    const place = () => {
      // Measured from the painting, not the screen: the banners may still be rolled up when the doors are placed.
      for (const { g, door, reach } of list) {
        const m = g.getScreenCTM();
        if (!m) continue;
        Object.assign(door.style, { left: `${m.a * reach.x + m.e}px`, top: `${m.d * reach.y + m.f}px`, width: `${m.a * (reach.r - reach.x)}px`, height: `${m.d * (reach.b - reach.y)}px` });
      }
    };
    // 📜 The House's round mark (the one squarish piece of the Text layer) opens About, on netware's banner re-dyed.
    const mark = names.map(n => ({ n, r: n.getBBox() })).filter(({ r }) => Math.abs(r.width - r.height) < 1.5).sort((a, c) => c.r.width - a.r.width)[0];
    if (mark) {
      const door = document.createElement('button');
      door.type = 'button';
      door.className = 'ware-door';
      door.textContent = 'About House of Helios';
      doors.appendChild(door);
      const net = list.find(x => x.ware.title === ABOUT.from);
      const a = { g: mark.n, art: net.art, door, ware: ABOUT, reach: { x: mark.r.x, y: mark.r.y, r: mark.r.x + mark.r.width, b: mark.r.y + mark.r.height } };
      door.addEventListener('click', () => unroll(a));
      list.push(a);
    }
    addEventListener('resize', place);
    // One, two, three: netware, software, codeware, a second apart.
    const open = () => Promise.all(list.filter(b => b.reel).map(b => wait(UNROLL_ORDER.indexOf(b.ware.title) * STAGGER).then(async () => {
      b.door.hidden = false;
      if (!still) await unfurl(b.reel, SETTLE.up, UNROLL, [b.name].filter(Boolean));
    })));
    return { place, open };
  };

  // 🪟 A banner opened: the painted banner itself, scaled up, unrolls over the clearing with its words on the cloth.
  // Only its straight sides grow, as far as the words need: rod, edge, point and tassels stay as Helios drew them.
  // Click outside it, the close mark or Escape to roll it back up.
  const SPLIT = 1.2;        // painting units below the top of the cloth: the line the sides are lengthened from
  const ICON = 0.7;         // the icon at the head of the big banner, against its painted size
  const SHADE = 0.49;   // how grey the clearing goes behind a big banner
  const BIG = { unroll: 1180, up: 0.015, close: 600, fade: 700, out: 220 };   // ms to unroll; half the small ones' spring; ms to roll back up; fade: icon and words in; out: before rolling up
  const FLIP = 640;   // ms for the card to turn over
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // A room's card (or About's): its mark at the head, name, tagline, a little more in grey, links.
  const cardHtml = (c, back) => `
    <img class="card-mark" src="rooms/${c.mark}.png" alt="">
    <h2 tabindex="-1">${esc(c.name)}</h2>
    <p class="card-tag">${esc(c.tag)}</p>
    ${(c.body || []).map(t => `<p class="card-body">${esc(t)}</p>`).join('')}
    ${c.more ? `<p class="card-more">${esc(c.more)}</p>` : ''}
    ${c.links.length ? `<p class="card-links">${c.links.map(([t, u]) => `<a href="${u}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`).join(' · ')}</p>` : ''}
    ${back ? '<button class="card-back" type="button">‹ back</button>' : ''}`;
  const unroll = b => {
    if (document.getElementById('ware')) return;
    const { ware } = b;
    const box = document.createElement('div');
    box.id = 'ware';
    box.innerHTML = `
      <div class="ware-banner" role="dialog" aria-modal="true" aria-label="${ware.about ? 'About House of Helios' : ware.title}" style="--dark:${ware.dark}">
        <svg class="ware-art" aria-hidden="true"></svg>
        <div class="ware-text"><div class="ware-card">
          ${ware.about ? `<section class="face card">${cardHtml(ware.card, false)}</section>` : `
          <section class="face front">
            <h2>${ware.title}</h2>
            <p class="ware-line">${ware.line}</p>
            <ul>${ware.rooms.map(k => ROOMS[k]).map((r, i) => `<li><button type="button" data-room="${i}"><img src="rooms/${r.mark}.png" alt="" width="48" height="48"><span><b>${esc(r.name)}</b> ${esc(r.tag)}</span><i aria-hidden="true">›</i></button></li>`).join('')}</ul>
          </section>
          <section class="face card" hidden></section>`}
        </div></div>
        <button class="ware-close" type="button" aria-label="Roll it back up">×</button>
      </div>`;
    document.body.appendChild(box);
    freeze();
    const banner = box.querySelector('.ware-banner'), pic = box.querySelector('.ware-art'), words = box.querySelector('.ware-text');
    const card = box.querySelector('.ware-card'), front = box.querySelector('.front'), back = box.querySelector('.face.card');
    const close = box.querySelector('.ware-close');
    // The clearing dims itself (see VEIL). The old grey sheet stays as a test: a layer of its own beside the scrolling box,
    // one solid colour see-through by its opacity (#ware-shade in splash.css).
    const veil = document.createElement('div');
    const dimmed = ['home', 'home-lifted'].map(id => document.getElementById(id)).filter(Boolean);
    let shade;
    if (VEIL === 'sheet') {
      veil.id = 'ware-shade';
      box.before(veil);
      shade = a => { veil.style.opacity = (SHADE * a).toFixed(3); };
    } else {
      shade = a => { for (const el of dimmed) el.style.filter = a > 0 ? `brightness(${(1 - (1 - TINT) * a).toFixed(3)})` : ''; };
    }
    const art = pic.appendChild(b.art.cloneNode(true));
    const kids = [...art.children];
    const all = art.getBBox();
    const hook = all.y;
    const rod = kids.filter(k => { const r = k.getBBox(); return r.height < 1.3 && r.y < hook + 0.5; });
    const cloth = kids.filter(k => !rod.includes(k));
    const top = Math.min(...cloth.map(k => k.getBBox().y)), split = top + SPLIT;
    let icon = cloth.filter(k => { const r = k.getBBox(); return k.getAttribute('fill') !== '#c2d5db' && r.y > top + 1 && r.width < all.width * 0.8; });
    const cream = cloth.find(k => k.getAttribute('fill') === '#ffe5ae');
    const creamBox = cream.getBBox();
    const ib = union(icon);
    const icx = (ib.x + ib.r) / 2;
    for (const k of icon) k.setAttribute('transform', `translate(${icx} ${ib.y}) scale(${ICON}) translate(${-icx} ${-ib.y})`);
    const wordsTop = ib.y + (ib.b - ib.y) * ICON + 0.4;
    // About borrows netware's banner: its painted icon comes off (the House's mark heads the card instead) and its
    // colours are re-dyed amber.
    if (ware.about) {
      for (const k of icon) k.remove();
      icon = [];
      const src = WARES[ware.from];
      for (const k of art.querySelectorAll('[fill]')) {
        const f = k.getAttribute('fill');
        if (f === src.edge) k.setAttribute('fill', ware.edge); else if (f === src.dark) k.setAttribute('fill', ware.dark);
      }
    }
    // Where the cream's straight sides end and its point begins.
    const ys = cream.getAttribute('points').trim().split(/[\s,]+/).filter((_, i) => i % 2).map(Number);
    const pointStart = [...new Set(ys)].sort((a, c) => c - a)[1];
    // Lengthen: every corner below the split line moves down; every piece wholly below it (tassels) moves down whole.
    const lengthen = grow => {
      for (const k of cloth) {
        if (icon.includes(k) || !k.isConnected) continue;
        if (!k.dataset.points && k.hasAttribute('points')) k.dataset.points = k.getAttribute('points');
        if (k.dataset.points) {
          const v = k.dataset.points.trim().split(/[\s,]+/).map(Number);
          k.setAttribute('points', v.map((n, i) => (i % 2 && n > split ? n + grow : n)).join(' '));
        } else if (k.getBBox().y > split) k.setAttribute('transform', `translate(0 ${grow})`);
      }
    };
    // The card starts where the icon's head is: the list leaves the painted icon its room above the words; a room's
    // card (or About) puts its own mark there instead.
    let unit = 1, grown = 0;
    const draw = grow => {
      grown = grow;
      lengthen(grow);
      pic.setAttribute('viewBox', `${all.x} ${all.y} ${all.width} ${all.height + grow}`);
      pic.style.height = `${(all.height + grow) * unit}px`;
    };
    const need = () => Math.max(0, words.offsetHeight / unit - (pointStart - ib.y) + 0.6);
    const fit = () => {
      unit = banner.clientWidth / all.width;
      Object.assign(words.style, { left: `${(creamBox.x + 0.5 - all.x) * unit}px`, width: `${(creamBox.width - 1) * unit}px`, top: `${(ib.y - all.y) * unit}px` });
      if (front) front.style.paddingTop = `${(wordsTop - ib.y) * unit}px`;
      card.style.setProperty('--mark', `${(ib.b - ib.y) * ICON * 0.8 * unit}px`);   // a room's mark: a touch smaller than the ware's icon
      draw(need());
      Object.assign(close.style, { right: `${(all.x + all.width - (creamBox.x + creamBox.width) + 0.3) * unit}px`, top: `${(creamBox.y - all.y + 0.3) * unit}px` });
    };
    fit();
    // The painted icon, faded as one picture (its group, once reel() has made one).
    const iconEls = () => { const p = icon[0]?.parentNode; return p && p !== art ? [p] : icon; };
    // 🔄 The card turns over on its middle line: the side showing turns away to edge-on, the other side turns in. The
    // cloth never moves; once the card is round, the banner's sides grow or shrink to the new side's length.
    let turning = false, from = null;
    const turn = async (show, hide, focus) => {
      if (turning) return;
      turning = true;
      const before = grown, ease = k => k * k * (3 - 2 * k);
      const half = still ? 0 : FLIP / 2;
      const painted = iconEls(), toCard = show === back;
      await over(half, k => {
        card.style.transform = `perspective(900px) rotateY(${(90 * ease(k)).toFixed(2)}deg)`;
        if (toCard) for (const el of painted) el.style.opacity = (1 - ease(k)).toFixed(3);
      });
      hide.hidden = true;
      show.hidden = false;
      await over(half, k => {
        card.style.transform = `perspective(900px) rotateY(${(-90 * (1 - ease(k))).toFixed(2)}deg)`;
        if (!toCard) for (const el of painted) el.style.opacity = ease(k).toFixed(3);
      });
      card.style.transform = '';
      if (!toCard) for (const el of painted) el.style.opacity = '';
      const after = need();
      await over(still ? 0 : 420, k => draw(before + (after - before) * ease(k)));
      focus?.focus({ preventScroll: true });
      turning = false;
    };
    if (front) {
      front.addEventListener('click', e => {
        const btn = e.target.closest('button[data-room]');
        if (!btn) return;
        from = btn;
        back.innerHTML = cardHtml(ROOMS[ware.rooms[+btn.dataset.room]], true);
        back.querySelector('.card-back').addEventListener('click', () => turn(front, back, from));
        turn(back, front, back.querySelector('h2'));
      });
    }
    // It unrolls the way the small ones do, its words and close mark fading in with the icon.
    const time = still ? 0 : 1;
    shade(0);
    over(400 * time, k => shade(k * k * (3 - 2 * k)));
    const late = [words, close];
    const opened = (async () => {
      if (still) return;
      const r = reel(art, ware);
      for (const el of [...r.icon, ...late]) el.style.opacity = 0;
      r.set(0);
      await unfurl(r, BIG.up, BIG.unroll, late, BIG.fade);
    })();
    opened.then(() => addEventListener('resize', fit));
    close.focus({ preventScroll: true });
    let closing = false;
    // Closing fades the icon (if it shows) and the words first, then rolls it back up onto its rod.
    const shut = async () => {
      if (closing) return;
      closing = true;
      await opened;
      while (turning) await wait(50);
      removeEventListener('keydown', key);
      removeEventListener('resize', fit);
      const r = still ? null : reel(art, ware);
      const showing = r && (!back || back.hidden || !front) ? r.icon : [];
      await fade([...showing, ...late], 1, 0, BIG.out * time);
      over(BIG.close * time, k => shade(1 - k * k * (3 - 2 * k)));
      if (r) await over(BIG.close, k => r.set(1 - (k * k * (3 - 2 * k))));
      box.remove();
      veil.remove();
      shade(0);
      thaw();
      b.door.focus({ preventScroll: true });
    };
    const key = e => { if (e.key === 'Escape') shut(); };
    addEventListener('keydown', key);
    close.addEventListener('click', shut);
    box.addEventListener('click', e => { if (e.target === box) shut(); });   // a click outside the banner (the box lies over the veil)
  };

  return { build };
})();
