// 🧰 The painting kit: the parts every painted page shares (splash.js, home.js).
// A page inlines its painting, then hands each kind of thing its motion from here.
window.Kit = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const rand = (a, b) => a + Math.random() * (b - a);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Inline a painting into `scene` so its layers can move.
  const inline = async (scene, url) => {
    const doc = new DOMParser().parseFromString(await (await fetch(url)).text(), 'image/svg+xml');
    const svg = document.importNode(doc.documentElement, true);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    scene.replaceChildren(svg);
    const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    return { svg, defs };
  };

  // 🖼️ The _Frame layer marks the screen: a wide rectangle for desktops, a tall one for phones.
  // The window takes the frame that matches the screen and widens it with painting from around it,
  // never past the meadow, so every screen shows at least its frame.
  const rectOf = r => Object.fromEntries(['x', 'y', 'width', 'height'].map(a => [a, +r.getAttribute(a)]));
  const frame = svg => {
    const frameLayer = svg.getElementById('_Frame');
    const frames = frameLayer ? [...frameLayer.querySelectorAll('rect')].map(rectOf).sort((a, b) => b.width / b.height - a.width / a.height) : [];
    frameLayer?.remove();
    const meadow = svg.querySelector('#LG_BG rect');
    const field = meadow ? rectOf(meadow) : null;
    const fit = () => {
      if (!frames.length) return;
      const aspect = innerWidth / innerHeight;
      const f = aspect >= 1 ? frames[0] : frames[frames.length - 1];
      let w = f.width, h = f.height;
      if (aspect > w / h) w = Math.min(field ? field.width : Infinity, h * aspect);
      else h = Math.min(field ? field.height : Infinity, w / aspect);
      let x = f.x + (f.width - w) / 2, y = f.y + (f.height - h) / 2;
      if (field) {
        x = Math.max(field.x, Math.min(x, field.x + field.width - w));
        y = Math.max(field.y, Math.min(y, field.y + field.height - h));
      }
      svg.setAttribute('viewBox', [x, y, w, h].map(v => v.toFixed(3)).join(' '));
    };
    fit();
    addEventListener('resize', fit);
    return fit;
  };

  // A CSS transform replaces an element's own transform attribute, so a placed image is moved through a wrapper.
  const wrap = el => {
    const g = document.createElementNS(NS, 'g');
    el.replaceWith(g);
    g.appendChild(el);
    return g;
  };

  const timing = (el, dur, delay) => {
    el.style.setProperty('--dur', `${dur.toFixed(2)}s`);
    el.style.setProperty('--delay', `${(-delay).toFixed(2)}s`);
  };

  // A smooth curve through waypoints.
  const smooth = pts => pts.reduce((d, c, i) => {
    if (!i) return `M${c}`;
    const a = pts[Math.max(0, i - 2)], b = pts[i - 1], n = pts[Math.min(pts.length - 1, i + 1)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (n[0] - b[0]) / 6, c[1] - (n[1] - b[1]) / 6];
    return `${d} C${c1} ${c2} ${c}`;
  }, '');
  const way = (defs, pts) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', smooth(pts));
    defs.appendChild(path);
    return { path, length: path.getTotalLength() };
  };

  // 🪶 Big moving pictures ride in their own layers above the painting. The graphics chip slides them
  // without redrawing the whole painting every frame, which is what made the motion stutter.
  // Each is drawn once onto a canvas laid exactly over its spot. The canvas holds only the detail the eye
  // needs: blurred pictures (the soft clouds, the front trees) at half a pixel per screen pixel, crisp ones
  // at full screen sharpness, no side past MAX_SIDE. The chip then carries a few MB, not hundreds.
  const MAX_SIDE = 2048;
  const lifter = lifted => {
    const lift = async el => {
      const g = wrap(el);
      const layer = g.parentNode;
      const b = g.getBBox();
      const art = `<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${b.x} ${b.y} ${b.width} ${b.height}">${el.outerHTML}</svg>`;
      const img = new Image();
      img.src = URL.createObjectURL(new Blob([art], { type: 'image/svg+xml' }));
      await img.decode().catch(() => {});
      const scale = layer.getScreenCTM().a;   // screen pixels per painting unit
      const soft = el.matches('image') || !!el.querySelector('image');
      const density = Math.min(soft ? 0.5 : devicePixelRatio, MAX_SIDE / (Math.max(b.width, b.height) * scale));
      const pic = document.createElement('canvas');
      pic.width = Math.max(1, Math.round(b.width * scale * density));
      pic.height = Math.max(1, Math.round(b.height * scale * density));
      pic.getContext('2d').drawImage(img, 0, 0, pic.width, pic.height);
      URL.revokeObjectURL(img.src);
      const place = () => {
        const m = layer.getScreenCTM();
        if (!m) return;
        Object.assign(pic.style, { left: `${m.a * b.x + m.e}px`, top: `${m.d * b.y + m.f}px`, width: `${m.a * b.width}px`, height: `${m.d * b.height}px` });
      };
      return { g, pic, place };
    };
    // Swap the painted originals for their lifted copies in one go, once every copy is ready, so nothing blinks.
    const liftAll = async els => {
      const lifts = await Promise.all(els.map(lift));
      for (const { g, pic, place } of lifts) {
        place();
        lifted.appendChild(pic);
        g.remove();
      }
      return lifts;
    };
    return liftAll;
  };

  // The blurred front row (_01) rides lifted and sways most.
  const frontTrees = async (svg, lifted) => {
    if (still) return [];
    const lifts = await lifter(lifted)([...svg.querySelectorAll('#_01 > image')]);
    for (const { pic, place } of lifts) {
      pic.classList.add('sway');
      pic.style.setProperty('--bend', `${rand(0.9, 1.3).toFixed(2)}deg`);
      timing(pic, rand(9, 13), rand(0, 13));
      addEventListener('resize', place);
    }
    return lifts;
  };

  // Paths whose boxes touch belong to one plant: wrap each plant in its own <g>.
  // Plants in different clumps never overlap, so moving them into groups keeps the paint order true.
  const clumps = (layer, kids = [...layer.children]) => {
    const boxes = kids.map(k => k.getBBox());
    const root = kids.map((_, i) => i);
    const find = i => (root[i] === i ? i : (root[i] = find(root[i])));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height) {
          root[find(i)] = find(j);
        }
      }
    }
    const groups = new Map();
    kids.forEach((k, i) => {
      const r = find(i);
      if (!groups.has(r)) {
        const g = document.createElementNS(NS, 'g');
        layer.appendChild(g);
        groups.set(r, g);
      }
      groups.get(r).appendChild(k);
    });
    return [...groups.values()];
  };

  // 🌾 Wind: every plant bends from its root, each on its own breath.
  const wind = (svg, ids) => {
    for (const id of ids) {
      const layer = svg.getElementById(id);
      if (!layer) continue;
      for (const plant of clumps(layer)) {
        plant.classList.add('sway');
        const h = plant.getBBox().height;
        plant.style.setProperty('--bend', `${Math.min(4, 1.2 + h * 0.1).toFixed(2)}deg`);
        timing(plant, rand(4.5, 7), rand(0, 7));
      }
    }
  };

  // 🌳 Trees sway slower and less than grass: the far row barely, the near ones a touch more.
  // Each tree layer keeps its placed pictures on top, as drawn. The blurred front row (_01) has been lifted out above.
  const TREES = [
    { id: '_03', bend: [0.5, 0.8], dur: [10, 14] },
    { id: '_02', bend: [0.7, 1.1], dur: [8, 12] },
    { id: '_01', bend: [0.9, 1.3], dur: [9, 13] },
  ];
  const woods = svg => {
    for (const { id, bend, dur } of TREES) {
      const layer = svg.getElementById(id);
      if (!layer) continue;
      const pictures = [...layer.querySelectorAll(':scope > image')].map(wrap);
      const drawn = [...layer.children].filter(k => !pictures.includes(k));
      const trees = drawn.length ? clumps(layer, drawn) : [];
      for (const p of pictures) layer.appendChild(p);
      for (const tree of [...trees, ...pictures]) {
        tree.classList.add('sway');
        tree.style.setProperty('--bend', `${rand(...bend).toFixed(2)}deg`);
        timing(tree, rand(...dur), rand(0, dur[1]));
      }
    }
  };

  // 🌿 Bushes breathe.
  const bushes = svg => {
    const layer = svg.getElementById('bush');
    if (!layer) return;
    for (const bush of clumps(layer)) {
      bush.classList.add('breathe');
      timing(bush, rand(7, 11), rand(0, 11));
    }
  };

  // 🪷 Lotuses rock on the current. Blooms drawn as one group each are taken as drawn; loose paths are grouped by touch.
  const blooms = svg => {
    const lotus = svg.getElementById('lotus');
    const all = [...lotus.children].every(k => k.tagName === 'g') ? [...lotus.children] : clumps(lotus);
    for (const bloom of all) {
      bloom.classList.add('bob');
      timing(bloom, rand(6, 9), rand(0, 9));
    }
    return { lotus, blooms: all };
  };

  // 💧 Light slides over the water along `flow`. A mask keeps it inside the water and clear of the brown bank.
  const shimmer = (svg, defs, flow, id) => {
    const river = svg.getElementById('River');
    const [water, bank] = river.querySelectorAll('path');
    const mask = document.createElementNS(NS, 'mask');
    mask.id = id;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    const wb = water.getBBox();
    for (const [a, v] of [['x', wb.x - 10], ['y', wb.y - 10], ['width', wb.width + 20], ['height', wb.height + 20]]) mask.setAttribute(a, v);
    const shape = (src, fill, stroke, width) => {
      const s = src.cloneNode();
      s.removeAttribute('class');
      s.setAttribute('fill', fill);
      s.setAttribute('stroke', stroke);
      s.setAttribute('stroke-width', width);
      mask.appendChild(s);
    };
    shape(water, 'white', 'black', 8);
    if (bank) shape(bank, 'black', 'black', 6);
    defs.appendChild(mask);
    const light = document.createElementNS(NS, 'g');
    light.setAttribute('mask', `url(#${id})`);
    light.classList.add('shimmer');
    for (const [dx, dy] of [[0, -4], [3, 0], [-2, 3], [1, 6], [-2, -5]]) {
      const line = document.createElementNS(NS, 'path');
      line.setAttribute('d', flow);
      line.setAttribute('transform', `translate(${dx} ${dy})`);
      timing(line, rand(14, 22), rand(0, 22));
      light.appendChild(line);
    }
    water.after(light);
  };

  // 🦆 A duck from duck.svg, `length` units long, placed by the middle of its body low down where it sits on the water.
  // It blinks in its own time: a lid in the colour just above the eye, clipped to the eye. The eye is the smallest
  // round shape that isn't a speck. Lighter water (`wake`) laps around its waterline: a flat underside and a bubbly top.
  const duckArt = async () => new DOMParser().parseFromString(await (await fetch('duck.svg')).text(), 'image/svg+xml').documentElement;
  const duck = ({ svg, defs, art, parent, length, wake, id }) => {
    const el = document.createElementNS(NS, 'g');
    const body = document.createElementNS(NS, 'g');
    for (const k of art.children) body.appendChild(document.importNode(k, true));
    el.appendChild(body);
    parent.appendChild(el);
    const box = body.getBBox();
    const shapes = [...body.querySelectorAll('path, circle, ellipse')].map(s => ({ s, b: s.getBBox() }));
    const speck = box.width * 0.04;
    const eye = shapes.filter(({ b }) => b.width > speck && b.width / b.height > 0.8 && b.width / b.height < 1.25)
      .sort((a, b) => a.b.width * a.b.height - b.b.width * b.b.height)[0];
    if (eye) {
      const pt = svg.createSVGPoint();
      pt.x = eye.b.x + eye.b.width / 2; pt.y = eye.b.y - eye.b.height * 0.25;   // just above the eye: the head
      const around = shapes.findLast(({ s }) => s !== eye.s && s.isPointInFill(pt));
      const clip = document.createElementNS(NS, 'clipPath');
      clip.id = id;
      clip.appendChild(eye.s.cloneNode());
      defs.appendChild(clip);
      const lid = document.createElementNS(NS, 'rect');
      for (const [a, v] of [['x', eye.b.x - 1], ['y', eye.b.y - 1], ['width', eye.b.width + 2], ['height', eye.b.height + 2]]) lid.setAttribute(a, v);
      lid.setAttribute('fill', around ? around.s.getAttribute('fill') : '#000');
      lid.setAttribute('clip-path', `url(#${clip.id})`);
      lid.classList.add('blink');
      timing(lid, rand(4, 7), rand(0, 7));
      body.appendChild(lid);
    }
    const scale = length / box.width;
    body.setAttribute('transform', `scale(${scale.toFixed(4)}) translate(${-(box.x + box.width / 2)} ${-(box.y + box.height * 0.75)})`);
    const waterline = box.height * 0.25 * scale - 0.15;
    const half = length * 0.38, top = waterline - 0.3, bottom = waterline + 0.35, bumps = 7, step = (half * 2) / bumps;
    let d = `M${-half},${bottom} Q${-half - 0.3},${top} ${-half},${top}`;
    for (let i = 0; i < bumps; i++) d += ` Q${-half + step * (i + 0.5)},${top - rand(0.25, 0.45)} ${-half + step * (i + 1)},${top}`;
    d += ` Q${half + 0.3},${top} ${half},${bottom} Q0,${bottom + 0.3} ${-half},${bottom}Z`;
    const lap = document.createElementNS(NS, 'path');
    lap.setAttribute('d', d.replace(/-?\d+\.\d+/g, n => (+n).toFixed(2)));
    lap.setAttribute('transform', `translate(${(length * 0.04).toFixed(2)} 0)`);
    lap.setAttribute('fill', wake);
    const breath = document.createElementNS(NS, 'g');
    breath.classList.add('lap');
    timing(breath, rand(3, 5), rand(0, 5));
    breath.appendChild(lap);
    el.appendChild(breath);
    el.style.visibility = 'hidden';
    return el;
  };
  // Bobs a duck on its spot `p` along the way, rocking a little.
  const paddle = (el, p, t) => {
    el.setAttribute('transform', `translate(${p.x.toFixed(2)} ${(p.y + Math.sin(t * 2.6) * 0.12).toFixed(2)}) rotate(${(Math.sin(t * 1.3) * 2).toFixed(1)})`);
  };

  // 🎞️ Sprites: Helios draws an animal's moves as frames in a row on animals.svg (Deer_walk, Deer_eat, Bird).
  // Frames are taken in sheet order, left to right, and pinned to the sheet's even grid so the body doesn't jitter.
  // show(at, next, fade) puts frame `at` up and lays `next` over it at `fade` opacity: the incoming frame dissolves
  // in on top of a solid one, which softens the jumps without the body ever going see-through.
  const sheet = async () => new DOMParser().parseFromString(await (await fetch('animals.svg')).text(), 'image/svg+xml').documentElement;
  const sprite = (art, id, scale, place) => {
    const el = document.createElementNS(NS, 'g');
    place(el);
    const frames = [...art.querySelector(`#${id}`).children].map(f => {
      const frame = el.appendChild(document.importNode(f, true));
      return { frame, box: frame.getBBox() };
    }).sort((a, b) => a.box.x - b.box.x);
    const first = frames[0].box, end = frames[frames.length - 1].box;
    const spacing = (end.x + end.width / 2 - (first.x + first.width / 2)) / (frames.length - 1);
    const feet = Math.max(...frames.map(({ box }) => box.y + box.height));
    frames.forEach(({ frame }, i) => {
      const cx = first.x + first.width / 2 + i * spacing;
      frame.setAttribute('transform', `scale(${scale.toFixed(4)}) translate(${-cx.toFixed(2)} ${-feet.toFixed(2)})`);
      frame.setAttribute('visibility', 'hidden');
    });
    let up = -1, over = -1;
    const show = (at, next = -1, fade = 0) => {
      if (fade <= 0) next = -1;
      if (at !== up) {
        if (up >= 0 && up !== next) frames[up].frame.setAttribute('visibility', 'hidden');
        frames[at].frame.setAttribute('visibility', 'visible');
        frames[at].frame.style.opacity = '';
        up = at;
      }
      if (next !== over) {
        if (over >= 0 && over !== up) frames[over].frame.setAttribute('visibility', 'hidden');
        if (next >= 0) { frames[next].frame.setAttribute('visibility', 'visible'); el.appendChild(frames[next].frame); }
        over = next;
      }
      if (next >= 0) frames[next].frame.style.opacity = fade.toFixed(2);
    };
    return { el, show, count: frames.length, tall: Math.max(...frames.map(({ box }) => box.height)) };
  };
  // Where a looping run of frames is at a given moment, with the next frame's dissolve over the last part of each.
  const DISSOLVE = 0.45;   // the share of each frame the next one spends fading in
  const cycle = (t, step, count) => {
    const at = Math.floor(t / step), f = t / step - at;
    return [at % count, (at + 1) % count, Math.max(0, (f - (1 - DISSOLVE)) / DISSOLVE)];
  };

  // 🐦 Birds flapping along a route, each in its own phase. `crew` lists [units behind, units above, s later] per bird.
  // Hidden by display, not visibility: a frame set visible would show through a hidden parent.
  const BIRD = { width: 3.6, step: 0.07 };
  const flight = ({ defs, art, route, crew, group, mirror }) => {
    const { path, length } = way(defs, route);
    return {
      path, length, mirror,
      birds: crew.map(([back, up, later]) => ({ back, up, later, look: sprite(art, 'Bird', BIRD.width / 4.4, g => group.appendChild(g)), phase: rand(0, 1) })),
    };
  };
  // Flies every bird `t` seconds into its own lap; `onLead` hears where the first bird of each flight is, and how far along.
  const fly = (flights, now, lap, speed, onLead) => {
    for (const f of flights) {
      for (const b of f.birds) {
        const t = now / 1000 - b.later - (f.delay || 0);
        const d = (t % lap) * speed - b.back;
        if (t < 0 || d < 0 || d > f.length) { b.look.el.style.display = 'none'; continue; }
        b.look.el.style.display = '';
        const p = f.path.getPointAtLength(d);
        if (f.birds[0] === b) onLead?.(f, p, d);
        const lift = b.up + Math.sin(now / 1000 * 3 + b.phase * 6) * 0.6;
        b.look.el.setAttribute('transform', `translate(${p.x.toFixed(2)} ${(p.y + lift).toFixed(2)})${f.mirror ? ' scale(-1 1)' : ''}`);
        const [at] = cycle(now / 1000 + b.phase, BIRD.step, b.look.count);
        b.look.show(at);
      }
    }
  };

  // Does a drawn shape cover a point? For finding one tree in a clump.
  const holding = svg => {
    const pin = svg.createSVGPoint();
    return ([x, y]) => el => { pin.x = x; pin.y = y; return [...el.querySelectorAll('path')].some(p => p.isPointInFill(pin)); };
  };
  // Parts a clump before its child number i; the parted-off front keeps a sway of its own.
  const partAt = (clump, i) => {
    const kids = [...clump.children];
    if (i <= 0 || i >= kids.length) return null;
    const front = clump.cloneNode(false);
    timing(front, rand(8, 12), rand(0, 12));
    clump.after(front);
    for (const k of kids.slice(i)) front.appendChild(k);
    return front;
  };

  const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  // Lays an HTML element exactly over a painted one, in screen pixels.
  const cover = (el, over) => {
    const b = over.getBBox(), m = over.getScreenCTM();
    if (!m) return;
    Object.assign(el.style, { left: `${m.a * b.x + m.e}px`, top: `${m.d * b.y + m.f}px`, width: `${m.a * b.width}px`, height: `${m.d * b.height}px` });
  };

  return {
    NS, rand, still, inline, frame, wrap, timing, smooth, way, lifter, frontTrees, clumps, wind, woods, bushes, blooms, shimmer,
    duckArt, duck, paddle, sheet, sprite, cycle, flight, fly, holding, partAt, overlaps, cover,
  };
})();
