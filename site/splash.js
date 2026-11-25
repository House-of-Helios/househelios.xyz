// Inline the painting so its layers can move, then give each kind of thing its own motion (parts from kit.js).
(async () => {
  const { NS, rand, still, wrap } = Kit;
  const scene = document.getElementById('scene');
  const { svg, defs } = await Kit.inline(scene, 'splash.svg');
  Kit.frame(svg);
  const lifted = document.getElementById('lifted');
  const liftAll = Kit.lifter(lifted);

  // ☁️ The page opens in the clouds. They glide off to the left. A breath after the last one clears the sign,
  // the way in fades up and stays.
  const clouds = svg.getElementById('Clouds');
  const CLOUDS = 2400, BREATH = 500, FADE = 1000;   // Helios (2026-11-25): the opening felt slow, so all three halved
  const prompt = svg.getElementById('Fade_In');
  if (prompt) {
    prompt.removeAttribute('display');
    prompt.style.opacity = 0;
    // The painted words say "(click to enter)"; Helios wants them softer for a thumb (2026-11-25). The glyphs are
    // outlines in the art, so they are hidden and the words are set in text over the same spot, same red.
    const box = prompt.getBBox();
    for (const glyphs of prompt.children) glyphs.setAttribute('display', 'none');
    const words = document.createElementNS(NS, 'text');
    words.setAttribute('x', (box.x + box.width / 2).toFixed(3));
    words.setAttribute('y', (box.y + box.height / 2).toFixed(3));
    words.setAttribute('font-size', (box.height * 0.92).toFixed(3));
    words.setAttribute('font-family', 'Helvetica Neue, Helvetica, Arial, sans-serif');
    words.setAttribute('fill', '#cb4142');
    words.setAttribute('text-anchor', 'middle');
    words.setAttribute('dominant-baseline', 'central');
    words.textContent = '(tap to enter)';
    prompt.appendChild(words);
  }
  let drift = [];
  // The clouds part to the left: a slow start, then away. Each cloud travels just far enough.
  const edges = pic => { const left = parseFloat(pic.style.left); return { left, right: left + parseFloat(pic.style.width) }; };
  const hide = () => drift.forEach(({ pic }) => { pic.style.visibility = 'hidden'; });
  const part = () => Promise.all(drift.map(({ pic }) => pic.animate(
    [{ transform: 'translateX(0)' }, { transform: `translateX(${-(edges(pic).right + 20).toFixed(0)}px)` }],
    { duration: CLOUDS, easing: 'cubic-bezier(.5, 0, .7, .45)', fill: 'forwards' },
  ).finished)).then(hide);
  // Entering: the whole bank sweeps across in one steady pass, in from the right and out to the left,
  // quicker than the opening and its parting together. Every cloud moves at the same speed and is
  // timed to reach its place at the same moment, so the screen is fully covered once, mid-pass.
  const PASS = (CLOUDS * 2) / 1.05 / 1.25;   // Helios: 25% quicker again; then halved with CLOUDS (2026-11-25)
  const pass = () => {
    drift.forEach(({ pic }) => { pic.style.visibility = ''; });
    const legs = drift.map(({ pic }) => ({ pic, inn: innerWidth - edges(pic).left + 20, out: edges(pic).right + 20 }));
    const farIn = Math.max(...legs.map(l => l.inn)), farOut = Math.max(...legs.map(l => l.out));
    const speed = (farIn + farOut) / PASS;   // pixels per millisecond
    const cover = farIn / speed;
    const runs = legs.map(({ pic, inn, out }) => pic.animate(
      [{ transform: `translateX(${inn.toFixed(0)}px)` }, { transform: `translateX(${(-out).toFixed(0)}px)` }],
      { duration: (inn + out) / speed, delay: cover - inn / speed, easing: 'linear', fill: 'both' },
    ).finished);
    return { covered: new Promise(done => setTimeout(done, cover)), gone: Promise.all(runs).then(hide), speed };
  };
  const frontTrees = await Kit.frontTrees(svg, lifted);
  if (clouds && !still) {
    clouds.removeAttribute('display');
    drift = await liftAll([...clouds.children]);   // the emptied layer stays, so the clouds can be re-placed on resize
    for (const { place } of drift) addEventListener('resize', place);
    part();
  } else clouds?.remove();

  const enter = document.getElementById('enter');
  // Resolves once no cloud covers the given patch of screen.
  const cleared = area => new Promise(done => {
    const look = () => {
      const spot = area();
      const over = spot && drift.some(({ pic }) => pic.isConnected && pic.style.visibility !== 'hidden' && Kit.overlaps(pic.getBoundingClientRect(), spot));
      if (over) requestAnimationFrame(look); else done();
    };
    look();
  });
  cleared(() => prompt?.getBoundingClientRect()).then(() => setTimeout(() => {
    if (entering) return;
    enter.hidden = false;
    enter.focus({ preventScroll: true });   // the Enter key opens it too
    prompt?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: still ? 0 : FADE, easing: 'ease-in-out', fill: 'forwards' });
  }, still ? 0 : BREATH));
  // The door is the sign itself: the round mark and the words House of Helios, nowhere else on the page.
  const mark = svg.getElementById('Text');
  const door = () => mark && Kit.cover(enter, mark);
  door();
  addEventListener('resize', door);

  // 🏡 Entering: The Home is painted out of sight while the clouds come in, and swapped in the moment they cover
  // the screen. Its banners hang rolled up as the clouds pass and drop once the clouds have cleared them.
  // If The Home is slow to paint, it is swapped in when ready, whatever the clouds are doing.
  let entering = false, running = true;
  enter.addEventListener('click', async () => {
    if (entering) return;
    entering = true;
    enter.hidden = true;
    const home = Home.build({ scene: document.getElementById('home'), lifted: document.getElementById('home-lifted') });
    const { covered, gone, speed = 0 } = drift.length ? pass() : { covered: Promise.resolve(), gone: Promise.resolve() };
    const [h] = await Promise.all([home, covered]);
    running = false;
    for (const { pic } of frontTrees) pic.remove();
    scene.remove();
    enter.remove();
    h.show();
    history.pushState(null, '', 'home.html');
    document.title = 'The Home · House of Helios';
    // The banners start EARLY ms before the clouds clear them: the clouds sweep left at a steady speed, so a patch
    // that far to the right of the banners clears exactly that much sooner.
    const EARLY = 500;
    const ahead = () => { const r = h.area(), dx = speed * EARLY; return { left: r.left + dx, right: r.right + dx, top: r.top, bottom: r.bottom }; };
    await Promise.race([cleared(ahead), gone]);
    h.drop();
  });
  addEventListener('popstate', () => location.reload());

  if (still) return;

  // Layers that grow from the ground and bend in the wind. Mushrooms (Layer_14) stay put.
  Kit.wind(svg, ['wheat', 'wheat-2', 'Layer_16', 'Layer_17', 'Layer_19', 'Layer_20', 'Layer_21', 'Layer_24', 'flowers']);
  Kit.woods(svg);
  Kit.bushes(svg);
  const { lotus, blooms } = Kit.blooms(svg);

  // 💧 The river runs from the upper right down to the lower left, along the middle of the water. Light on the water follows it.
  const FLOW = 'M322.3,85.5 C320.4,86.2 314.7,88.2 310.9,89.9 C307.1,91.6 303.3,93.5 299.4,95.4 C295.5,97.3 291.6,99.3 287.6,101.3 '
    + 'C283.6,103.3 279.6,105.3 275.6,107.4 C271.6,109.5 267.4,111.5 263.5,114 C259.6,116.5 255.7,119.2 251.9,122.1 '
    + 'C248.1,124.9 244.7,128.3 240.9,131.1 C237.2,133.9 233.4,136.8 229.4,138.9 C225.4,141 221.2,142.5 217.1,143.8 '
    + 'C212.9,145.2 208.7,146.1 204.5,147 C200.3,147.9 196.2,148.7 192.1,149.5 C188,150.3 183.9,150.8 179.8,151.7 '
    + 'C175.7,152.6 171.6,153.6 167.6,154.9 C163.6,156.2 159.6,157.9 155.7,159.6 C151.8,161.3 147.8,163.3 143.9,165.3 '
    + 'C140,167.3 136.1,169.5 132.3,171.6 C128.5,173.7 124.7,175.9 121,178.1 C117.3,180.3 113.8,182.5 110.3,184.7 '
    + 'C106.8,186.9 101.7,190.4 100,191.5';
  Kit.shimmer(svg, defs, FLOW, 'river-mask');

  // 🪷 The play on the water, as Helios directed it. The first tap comes FIRST_TAP seconds in, as the clouds part:
  // a lotus taps the top lotus of the middle three (the one by the bush) from behind and takes its spot.
  // Every lap after that, the visitor drifts in at the top right, slips between the reed and the lotus there and
  // hurries down behind the pine, easing to the pace of the current just before the tap. The tapped one sails out to the middle
  // of the stream, swings back over, slips between the right-hand lotus of the left three and the reed, and taps
  // the top middle one, taking its spot in turn. That one carries on down the river, out of sight,
  // and comes round again at the top right. Every other bloom gives way when brushed and drifts back.
  const SPOT = [[247.1, 114.5], [186.1, 146.3]];          // the two lodging spots, in painting units
  const ROUTES = [
    // In at the top right, between the reed and the corner lotus, down behind the pine, onto the first spot from above.
    [[321, 77], [310, 78.5], [298, 86], [287, 93], [274, 100], [261, 105.5], [250.7, 109.7]],
    // Out to the middle of the stream, back over, between the right-hand bloom and the reed, onto the second spot.
    [[247.1, 114.5], [241, 123], [231, 134], [218, 141.5], [205, 144], [193.5, 144.3]],
    // Carried on down the river with the current, between the reed and the lowest bloom, out of sight under the trees.
    [[186.1, 146.3], [179, 148.5], [170, 152.5], [160, 157.5], [148, 163.5], [136, 169.5], [124, 176.3], [112, 183.5], [100, 191.5]],
  ];
  const CRUISE = 4, KICK = 5.5, SETTLE = 2.8, R = 3.8, FLAT = 1.4, AWAY = 2.5;
  const HURRY = 9, EASE_IN = 22;   // the way in runs at HURRY until EASE_IN units short of the tap
  const FIRST_TAP = 1.75;          // seconds after the page opens (halved with the clouds, 2026-11-25)

  const routes = ROUTES.map(pts => Kit.way(defs, pts));

  const centre = el => { const b = el.getBBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const float = el => {
    const c = centre(el);
    return { el: wrap(el), c, x: c.x, y: c.y, home: { ...c }, angle: 0, spin: 0, mode: 'rest' };
  };
  // Helios took out the middle bloom of the middle three, opening a way between the other two for the ducks.
  const OPENED = [255, 116.7];
  const opened = blooms.find(b => { const c = centre(b); return Math.hypot(c.x - OPENED[0], c.y - OPENED[1]) < 1; });
  opened?.remove();
  const pads = blooms.filter(b => b !== opened).map(float);
  const near = ([x, y]) => pads.reduce((a, b) => (Math.hypot(b.x - x, b.y - y) < Math.hypot(a.x - x, a.y - y) ? b : a));
  const lodged = SPOT.map(near);
  // The first visitor is a fresh bloom, a copy of the one it will tap.
  const copy = lotus.insertBefore(lodged[0].el.firstChild.cloneNode(true), lotus.firstChild);
  const visitor = float(copy);
  pads.push(visitor);

  // A bloom pushed away downstream slips behind the plants on the bank (the yellow flowers between the trees),
  // so it rides just above the water until it comes round again.
  const under = document.createElementNS(NS, 'g');
  svg.getElementById('River').after(under);
  const sail = (b, leg, speed) => {
    if (leg === ROUTES.length - 1) under.appendChild(b.el);
    if (leg === 0) lotus.insertBefore(b.el, lotus.firstChild);
    return Object.assign(b, { mode: 'sail', leg, s: 0, v: speed });
  };
  const tapped = [];   // called at every tap on the first spot: the ducks set off after one, so they never meet the visitor
  const tap = (striker, at) => {
    if (at === 0) tapped.forEach(f => f());
    const struck = lodged[at];
    lodged[at] = striker;
    const gap = Math.hypot(SPOT[at][0] - striker.x, SPOT[at][1] - striker.y) || 1;
    Object.assign(striker, { mode: 'settle', from: { x: striker.x, y: striker.y }, t: 0, home: { x: SPOT[at][0], y: SPOT[at][1] },
      lead: Math.min(1.5, striker.v * SETTLE / gap) });
    striker.spin -= 12;
    struck.spin += 30;
    sail(struck, at + 1, KICK);
  };
  const arrive = b => {
    if (b.leg < 2) return tap(b, b.leg);
    b.mode = 'away';   // out of sight downstream; after a while it comes round again at the top right
    setTimeout(() => {
      const [x, y] = ROUTES[0][0];
      Object.assign(b, { x, y });
      sail(b, 0, HURRY);
    }, AWAY * 1000);
  };

  // The current sets the pace: a hurry on the way in, a kick after a tap, the plain current into the next tap.
  // Every change fades in, so nothing lurches.
  const pace = (leg, left, v, dt) => {
    const want = leg === 0 && left > EASE_IN ? HURRY : CRUISE;
    return v + (want - v) * 1.4 * dt;
  };
  const step = (b, dt) => {
    if (b.mode === 'sail') {
      b.v = pace(b.leg, routes[b.leg].length - b.s, b.v, dt);
      b.s = Math.min(routes[b.leg].length, b.s + b.v * dt);
      const p = routes[b.leg].path.getPointAtLength(b.s);
      b.x = p.x; b.y = p.y;
      if (b.s >= routes[b.leg].length) arrive(b);
    } else if (b.mode === 'settle') {
      b.t = Math.min(1, b.t + dt / SETTLE);
      // Carries on at the speed it arrived with, then comes to rest in the spot: no lurch either end.
      const t = b.t, e = b.lead * t + (3 - 2 * b.lead) * t * t + (b.lead - 2) * t ** 3;
      b.x = b.from.x + (b.home.x - b.from.x) * e;
      b.y = b.from.y + (b.home.y - b.from.y) * e;
      if (b.t >= 1) b.mode = 'rest';
    } else if (b.mode === 'rest') {
      // Brushed blooms are sprung back to where they belong.
      b.x += (b.home.x - b.x) * Math.min(1, 1.5 * dt);
      b.y += (b.home.y - b.y) * Math.min(1, 1.5 * dt);
    }
    // Blooms are drawn side-on, so a knock tips them and they rock back upright.
    b.spin += (-b.angle * 6 - b.spin * 1.6) * dt;
    b.angle += b.spin * dt;
  };
  // A sailing bloom never passes through a resting one: it nudges it aside and rocks it.
  // Blooms are seen side-on, wider than tall, so they meet sooner side to side than top to bottom.
  const brush = (mover, b) => {
    const dx = b.x - mover.x, dy = b.y - mover.y, d = Math.hypot(dx, dy * FLAT) || 0.001;
    const overlap = 2 * R - d;
    if (overlap <= 0) return;
    b.x += dx / d * overlap;
    b.y += dy / d * overlap / FLAT;
    b.spin += Math.sign(dx) * overlap * 4;
  };
  const draw = b => {
    b.el.setAttribute('transform', `translate(${(b.x - b.c.x).toFixed(2)} ${(b.y - b.c.y).toFixed(2)}) rotate(${b.angle.toFixed(1)} ${b.c.x.toFixed(2)} ${b.c.y.toFixed(2)})`);
  };

  // 🦆 Two ducks paddle slowly down the river, one behind the other. They come in at the top right by the lotus's
  // channel, go through the gap in the middle three, keep to the lower side of the river behind the middle
  // evergreen, pass between the two lowest blooms (just in front of the bottom-left one, behind the shore flowers)
  // and slip away under the willow, then come round again. Each blinks in its own time.
  const DUCK_ROUTE = [[321, 77], [310, 78.5], [298, 87], [286, 96], [274, 104], [262, 112], [250.5, 119.6], [239, 128],
    [227, 139], [214, 147], [201, 152.5], [189, 157], [179, 161.5], [166, 165.5], [150, 168.5], [133, 174.5], [116, 183], [100, 191.5]];
  const WAKE = '#8fd0f2';   // the river's blue, lightened
  const DUCK = { length: 8.7, speed: 2.6, behind: 4, after: 1 };   // painting units, units a second, s apart, s after the tap
  // Behind the two big trees up top, out of sight, they paddle faster (between these x's on the way down).
  const DUCK_HURRY = { speed: 6, from: 303, to: 252 };
  const SHORE = { x: 176, y: 155, width: 20, height: 18 };        // the yellow flowers that stay in front of the ducks
  const REEDS = { x: 298, y: 50, width: 22, height: 30 };         // the two reeds up top that stay behind the ducks
  const { path: duckWay, length: duckLength } = Kit.way(defs, DUCK_ROUTE);
  const pond = document.createElementNS(NS, 'g');   // ducks swim above the lotuses
  lotus.after(pond);
  const inside = (el, r) => { const b = el.getBBox(); return b.x >= r.x && b.y >= r.y && b.x + b.width <= r.x + r.width && b.y + b.height <= r.y + r.height; };
  for (const clump of [...svg.getElementById('flowers').children]) if (inside(clump, SHORE)) pond.after(clump);
  for (const id of ['Layer_19', 'Layer_16']) {
    for (const clump of [...(svg.getElementById(id)?.children || [])]) if (inside(clump, REEDS)) pond.before(clump);
  }
  // Where along the way the hurry starts and ends.
  const along = x => { for (let d = 0; d <= duckLength; d += 0.5) if (duckWay.getPointAtLength(d).x <= x) return d; return duckLength; };
  const hurryFrom = along(DUCK_HURRY.from), hurryTo = along(DUCK_HURRY.to);
  const duckArt = await Kit.duckArt();
  const makeDuck = n => ({
    el: Kit.duck({ svg, defs, art: duckArt, parent: pond, length: DUCK.length, wake: WAKE, id: `duck-eye-${n}` }),
    s: 0, v: DUCK.speed, waiting: true, startAt: null, phase: rand(0, 6),
  });
  const ducks = [makeDuck(0), makeDuck(1)];
  // The ducks wait out of sight until the visitor lotus has tapped the first spot, then set off behind it, one after
  // the other: the channel up top is clear, and the tapped bloom is always ahead of them and faster.
  tapped.push(() => {
    if (!ducks.every(d => d.waiting && d.startAt === null)) return;
    const now = performance.now() / 1000;
    ducks.forEach((d, i) => { d.startAt = now + DUCK.after + i * DUCK.behind; });
  });
  const swim = (d, dt, now) => {
    if (d.waiting) {
      if (d.startAt === null || now / 1000 < d.startAt) return;
      Object.assign(d, { waiting: false, startAt: null, s: 0, v: DUCK.speed });
      d.el.style.visibility = '';
    }
    const want = d.s > hurryFrom && d.s < hurryTo ? DUCK_HURRY.speed : DUCK.speed;
    d.v += (want - d.v) * 1.4 * dt;   // eases into the hurry and out of it
    d.s += d.v * dt;
    if (d.s > duckLength) {   // out of sight downstream; wait for the next tap
      d.waiting = true;
      d.el.style.visibility = 'hidden';
      return;
    }
    Kit.paddle(d.el, duckWay.getPointAtLength(Math.max(0, d.s)), now / 1000 + d.phase);
  };

  // 🐦 Birds from Helios's sprite sheet (animals.svg, row Bird). Deer (Deer_walk, Deer_eat) are on hold until
  // Helios comes back to them; their stroll and graze are in git history (1d227b9).
  // A little flock of five flies in from deep behind the evergreen on the right, crosses in front of the cypress
  // just above the sign and in front of the big branching tree, and vanishes into the lime-green willow on the left.
  // Trees that touch were one swaying clump each (evergreen with cypress, willow with the branching tree);
  // the code parts them, each keeping its own sway, so the flock can fly between.
  const sheet = await Kit.sheet();
  const FLIGHT = {
    route: [[292, 80], [276, 81], [262, 83], [238, 87], [214, 89], [190, 92], [166, 95], [146, 98]],
    cypress: [246, 82], branching: [170, 75], willow: [140, 100],   // a point on each tree, to find it
    speed: 17, rest: 22, first: 3.25,   // first: seconds in, after the first lotus tap (halved with the clouds)
    birds: [[0, 0, 0], [3.5, -2, 0.12], [6.5, 1.5, 0.24], [9.5, -1, 0.36], [12.5, 1, 0.48]],   // behind, above, s later
  };
  const trees = svg.getElementById('_02');
  const holding = Kit.holding(svg), partAt = Kit.partAt;
  const flock = document.createElementNS(NS, 'g');
  const cypressClump = [...trees.children].find(holding(FLIGHT.cypress));
  if (cypressClump) {
    partAt(cypressClump, [...cypressClump.children].findIndex(holding(FLIGHT.cypress)) + 1);   // the evergreen, in front
    cypressClump.after(flock);
  } else trees.after(flock);
  let willow = null;
  const willowClump = [...trees.children].find(holding(FLIGHT.branching));
  if (willowClump) {
    // The willow is the first part drawn after the branching tree (the tree's own trunk also crosses the willow's point).
    const kids = [...willowClump.children], b = kids.findIndex(holding(FLIGHT.branching));
    const w = kids.findIndex((k, i) => i > b && holding(FLIGHT.willow)(k));
    willow = partAt(willowClump, w);
    if (willow) flock.before(willowClump);   // what is left is the branching tree, behind the flock
  }
  // 🐦 Halfway through each lap, a pair flies the other way: from behind the evergreen on the far left edge, in front
  // of the lime willow, across below the sign, and up into the cypress. They are drawn facing left, so they are mirrored.
  // The willow is drawn above the cypress, so no one layer is in front of the one and behind the other: the pair
  // starts just above the willow (under the edge evergreen, parted off it) and, crossing open sky under the sign
  // where nothing overlaps, hops to just under the cypress.
  const PAIR = {
    route: [[106, 150], [130, 139], [160, 130], [192, 124], [218, 118], [238, 108], [251, 99]],
    birds: [[0, 0, 0], [3.5, -1.8, 0.15]],
    edgePine: [105, 160],   // a point on the evergreen at the far left edge
    hop: 205,               // the x where the pair changes layers
  };
  const pair = document.createElementNS(NS, 'g');
  const edgePine = willow && partAt(willow, [...willow.children].findIndex(holding(PAIR.edgePine)));
  const pairStart = () => (edgePine ? edgePine.before(pair) : trees.appendChild(pair));
  const pairEnd = () => (cypressClump ? cypressClump.before(pair) : trees.appendChild(pair));
  pairStart();
  const flights = [
    Kit.flight({ defs, art: sheet, route: FLIGHT.route, crew: FLIGHT.birds, group: flock, mirror: false }),
    Kit.flight({ defs, art: sheet, route: PAIR.route, crew: PAIR.birds, group: pair, mirror: true }),
  ];
  // Both flights keep the flock's lap. The flock first flies once the first lotus tap has happened and the tapped bloom
  // is under way; the pair comes half a lap later.
  const lap = flights[0].length / FLIGHT.speed + FLIGHT.rest;
  flights[0].delay = FLIGHT.first;
  flights[1].delay = FLIGHT.first + lap / 2;
  let hopped = false;
  const hop = (f, p) => { if (f.mirror && (p.x > PAIR.hop) !== hopped) { hopped = !hopped; (hopped ? pairEnd : pairStart)(); } };

  let last;
  const tick = now => {
    if (!running) return;   // The Home has taken over
    const dt = Math.min(0.05, (now - (last ?? now)) / 1000);
    last = now;
    Kit.fly(flights, now, lap, FLIGHT.speed, hop);
    for (const d of ducks) swim(d, dt, now);
    for (const b of pads) step(b, dt);
    for (const m of pads) {
      if (m.mode !== 'sail') continue;
      for (const b of pads) if (b.mode === 'rest' && !lodged.includes(b) && b !== m) brush(m, b);
    }
    for (const b of pads) draw(b);
    requestAnimationFrame(tick);
  };
  // The first visitor starts just behind the bloom it taps, so the tap lands FIRST_TAP seconds in.
  sail(visitor, 0, CRUISE);
  const arriveIn = s0 => {
    let s = s0, v = CRUISE, t = 0;
    while (s < routes[0].length && t < 60) { v = pace(0, routes[0].length - s, v, 1 / 60); s += v / 60; t += 1 / 60; }
    return t;
  };
  let lo = 0, hi = routes[0].length;
  for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (arriveIn(mid) > FIRST_TAP) lo = mid; else hi = mid; }
  visitor.s = lo;
  const p0 = routes[0].path.getPointAtLength(visitor.s);
  Object.assign(visitor, { x: p0.x, y: p0.y });
  for (const b of pads) draw(b);
  requestAnimationFrame(tick);
})();
