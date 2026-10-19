// 픽셀 스프라이트: 문자 그리드 + 팔레트 → SVG
// '.' 은 투명. 모든 그림은 코드로 그려서 이미지 파일이 필요 없어요.
(() => {
  'use strict';

  const BASE = {
    O: '#3b2414', // 외곽선
    B: '#1d1410', // 눈/코
    E: '#ffffff', // 눈 하이라이트
    P: '#f28b9b', // 혀
    K: '#f7a6b5', // 볼터치
    R: '#e04b3c',
    L: '#ff8f7a',
    Y: '#f0a040',
    W: '#fffaf0',
    G: '#b8b2a8',
    C: '#8fd3ff',
    S: '#cfe9fb',
    M: '#b8642a',
    N: '#e8a95a',
    D: '#5b2b0f',
    T: '#fff1c9',
    g: '#5fa33a',
    l: '#9ad66a',
    h: '#4c8a2c',
    w: '#c98a4b',
    v: '#8f5626',
  };

  const FUR = {
    '흰색': { W: '#fffaf0', G: '#d9d0c3' },
    '크림': { W: '#f7deb0', G: '#d8b47c' },
    '살구': { W: '#f6c08f', G: '#d9935a' },
    '황금': { W: '#eab45a', G: '#c08434' },
    '갈색': { W: '#c4813f', G: '#8f5626' },
    '레드': { W: '#c8622e', G: '#97431c' },
    '초코': { W: '#7e4f30', G: '#563420' },
    '회색': { W: '#bdbdc8', G: '#8d8d9a' },
    '은회색': { W: '#8f9bb0', G: '#66718a' },
    '검정': { W: '#4b4242', G: '#2f2828' },
  };

  const S = {
    syringe: [
      'O..OOOOOOOOOO...',
      'OGGOWWCCCCCCOO..',
      'OGGOWCCCCCCCOGGG',
      'OGGOWWCCCCCCOO..',
      'O..OOOOOOOOOO...',
    ],
    scale: [
      '.OOOOOOOOOO.',
      'OWWWWWWWWWWO',
      'OWOOOOOOOOWO',
      'OWOGGGRGGOWO',
      'OWOOOOOOOOWO',
      'OWWWWWWWWWWO',
      'OYYYYYYYYYYO',
      'OYYYYYYYYYYO',
      'OOOOOOOOOOOO',
    ],
    pill: [
      '.OOOOOOOO.',
      '.ORRRRRRO.',
      '.ORRRRRRO.',
      '.OOOOOOOO.',
      'OYYYYYYYYO',
      'OYWWWWWWYO',
      'OYWWRRWWYO',
      'OYWRRRRWYO',
      'OYWWRRWWYO',
      'OYWWWWWWYO',
      'OYYYYYYYYO',
      'OYYYYYYYYO',
      '.OOOOOOOO.',
    ],
    house: [
      '....OO....',
      '...ORRO...',
      '..ORRRRO..',
      '.ORRRRRRO.',
      'ORRRRRRRRO',
      '.OwwwwwwO.',
      '.OwOOwwwO.',
      '.OwOOwCCO.',
      '.OOOOOOOO.',
    ],
    chest: [
      '.OOOOOOOO.',
      'OMMMMMMMMO',
      'ONNNNNNNNO',
      'OOOOYYOOOO',
      'OMMMYYMMMO',
      'OMMMMMMMMO',
      'OMMMMMMMMO',
      'OOOOOOOOOO',
    ],
    heart: [
      '.OO.OO.',
      'OLROORO',
      'ORRRRRO',
      '.ORRRO.',
      '..ORO..',
      '...O...',
    ],
    bone: [
      '.OO......OO.',
      'OWWOOOOOOWWO',
      '.OWWWWWWWWO.',
      '.OWWWWWWWWO.',
      'OWWOOOOOOWWO',
      '.OO......OO.',
    ],
    sparkle: [
      '...Y...',
      '...Y...',
      '..YWY..',
      'YYWWWYY',
      '..YWY..',
      '...Y...',
      '...Y...',
    ],
    paw: [
      '.OO..OO.',
      'OKKOOKKO',
      'OKKOOKKO',
      '.OO..OO.',
      '..OOOO..',
      '.OKKKKO.',
      'OKKKKKKO',
      'OKKKKKKO',
      '.OOOOOO.',
    ],
    scroll: [
      '.OOOOOOOOOO.',
      'ONTTTTTTTTNO',
      'OOTTTTTTTTOO',
      '.OTOOOOOOTO.',
      '.OTTTTTTTTO.',
      '.OTOOOOOTTO.',
      '.OTTTTTTTTO.',
      '.OTOOOOOOTO.',
      'OOTTTTTTTTOO',
      'ONTTTTTTTTNO',
      '.OOOOOOOOOO.',
    ],
    sun: [
      '...Y..Y...',
      '....YY....',
      'Y.YYYYYY.Y',
      '..YYYYYY..',
      '.YYYYYYYY.',
      '.YYYYYYYY.',
      '..YYYYYY..',
      'Y.YYYYYY.Y',
      '....YY....',
      '...Y..Y...',
    ],
    camera: [
      '...OOOO.....',
      'OOOOWWOOOOOO',
      'OGGGGGGGGGGO',
      'OGGOOOOGGGGO',
      'OGOCCCCOGRGO',
      'OGOCSSCOGGGO',
      'OGGOOOOGGGGO',
      'OGGGGGGGGGGO',
      'OOOOOOOOOOOO',
    ],
    bubble: [
      '.OOOOOOOOOO.',
      'OWWWWWWWWWWO',
      'OWWWWWWWWWWO',
      'OWBBWBBWBBWO',
      'OWWWWWWWWWWO',
      'OWWWWWWWWWWO',
      '.OOOOWOOOOO.',
      '....OWO.....',
      '....OO......',
    ],
    cloud: [
      '.....WWWW.......',
      '...WWWWWWWW.WW..',
      '..WWWWWWWWWWWWW.',
      '.WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      '.SSSSSSSSSSSSSS.',
    ],
  };

  // 9-slice 테두리 (border-image 용)
  const FRAMES = {
    panel: { grid: [
      '..DDDDD..',
      '.DMMMMMD.',
      'DMNNNNNMD',
      'DMNTTTNMD',
      'DMNTTTNMD',
      'DMNTTTNMD',
      'DMNNNNNMD',
      '.DMMMMMD.',
      '..DDDDD..',
    ] },
    sign: { grid: [
      '..DDDDD..',
      '.DNNNNND.',
      'DNMMMMMND',
      'DNMwwwMND',
      'DNMwwwMND',
      'DNMwwwMND',
      'DNMMMMMND',
      '.DvvvvvD.',
      '..DDDDD..',
    ] },
  };

  const TILES = {
    grass: [
      '................',
      '..g.............',
      '.glg........g...',
      '..............g.',
      '...........glg..',
      '................',
      '................',
      '....g...........',
      '...glg..........',
      '................',
      '.........g......',
      '........glg.....',
      '................',
      '.l..............',
      '................',
      '................',
    ],
    ground: [
      '....h.......h...',
      '...hgh.....hgh..',
      'gggggggggggggggg',
      'gggglggggggggggg',
      'gggggggggglggggg',
      'gggggggggggggggg',
    ],
    fence: [
      '.OO.....',
      'OwwO....',
      'OwwOOOOO',
      'OwwwwwwO',
      'OwvOOOOO',
      'OwvO....',
      'OwvOOOOO',
      'OwwwwwwO',
      'OwvOOOOO',
      'OwvO....',
      'OwvO....',
      'OOOO....',
    ],
  };

  function toSVG(rows, pal, opts = {}) {
    const h = rows.length;
    const w = Math.max(...rows.map(r => r.length));
    let rects = '';
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let run = 1;
        while (row[x + run] === ch) run++;
        if (ch !== '.' && pal[ch]) {
          rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${pal[ch]}"/>`;
        }
        x += run;
      }
    });
    const size = opts.intrinsic ? ` width="${w}" height="${h}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${size} shape-rendering="crispEdges">${rects}</svg>`;
  }

  const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  function palette(fur) {
    return Object.assign({}, BASE, FUR[fur] || FUR['흰색']);
  }

  // 인라인 스프라이트 HTML. scale = 픽셀 하나당 화면 px
  function sprite(name, scale = 2, opts = {}) {
    const rows = S[name];
    if (!rows) return '';
    const w = Math.max(...rows.map(r => r.length));
    const pal = palette(opts.fur);
    const svg = toSVG(rows, pal);
    const cls = 'sprite' + (opts.className ? ' ' + opts.className : '');
    return `<span class="${cls}" style="width:${w * scale}px;height:${rows.length * scale}px" aria-hidden="true">${svg}</span>`;
  }

  // ---------- 조립식 강아지 ----------
  // 22x22 칸에 모양(타원·다각형)을 찍어서 얼굴을 만들어요. 찍을 때 테두리는 자동으로 그려져요.
  // 색 키: O 테두리, W/G 털·그늘, X/Z 무늬색·그늘, L 밝은 주둥이, I 귀 안쪽, B 눈·코, E 빛, P 혀, K 볼, Q 분홍 코, H 리본
  const N = 22;
  const C = N / 2;

  const ellipse = (cx, cy, rx, ry, n = 2, bump = 0, freq = 0) => (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const r = Math.pow(Math.abs(dx), n) + Math.pow(Math.abs(dy), n);
    const wobble = bump ? bump * Math.cos(freq * Math.atan2(Math.abs(dx), -dy)) : 0;
    return r <= 1 + wobble;
  };
  const polygon = pts => (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const mirror = shape => (x, y) => shape(N - x, y);
  const either = (a, b) => (x, y) => a(x, y) || b(x, y);

  function stamp(g, shape, fill, outline = true) {
    const m = [];
    for (let y = 0; y < N; y++) {
      m.push([]);
      for (let x = 0; x < N; x++) m[y].push(shape(x + 0.5, y + 0.5));
    }
    const at = (x, y) => y >= 0 && y < N && x >= 0 && x < N && m[y][x];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!m[y][x]) continue;
        const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
        g[y][x] = outline && edge ? 'O' : typeof fill === 'function' ? fill(x, y) : fill;
      }
    }
  }

  const SHAPES = {
    round: { cy: 12.6, rx: 8.6, ry: 7.6, n: 2 },
    long: { cy: 12.2, rx: 7.1, ry: 8.6, n: 2 },
    wide: { cy: 13.2, rx: 9.7, ry: 7, n: 2.7 },
    small: { cy: 13.6, rx: 7.7, ry: 6.6, n: 2 },
  };

  // 왼쪽 귀 기준 좌표 (둥근 얼굴 기준). 얼굴형에 맞춰 옮겨 그려요.
  const EARS = {
    pointy: { back: true, shape: polygon([[4.2, 0.4], [1, 9], [8.6, 5]]), inner: polygon([[4.2, 2.6], [2.6, 7.6], [6.6, 5.5]]) },
    bat: { back: true, shape: polygon([[2.4, -0.6], [-0.2, 11], [9, 5.4]]), inner: polygon([[2.9, 1.8], [1.6, 8.8], [6.8, 5.6]]) },
    round: { back: true, shape: ellipse(4.4, 5.4, 3.3, 3.3), inner: ellipse(4.4, 5.6, 1.7, 1.7) },
    fold: { back: false, shape: polygon([[0.6, 4.6], [9.2, 3.2], [4.6, 10.8]]) },
    drop: { back: false, shape: polygon([[7.4, 3.4], [3.4, 4.2], [1.2, 8.4], [1, 13.2], [2.6, 16], [4.8, 14.6], [6.2, 10.4], [7.6, 6.4]]) },
    long: { back: false, shape: polygon([[7.6, 3.2], [3.2, 4], [0.8, 8.6], [0.4, 14.4], [1.2, 18.6], [3.6, 19.6], [5.4, 16.8], [5.8, 12], [7.2, 8.2]]) },
  };

  const EYES = {
    dot: { w: 2, h: 2, px: ['BE', 'BB'] },
    big: { w: 3, h: 3, px: ['BEB', 'BBB', 'BBB'] },
    shiny: { w: 3, h: 4, px: ['BBB', 'BEB', 'BBB', 'EBB'] },
    sleepy: { w: 3, h: 2, px: ['...', 'BBB'], still: true },
    happy: { w: 3, h: 2, px: ['.B.', 'B.B'], still: true },
  };

  const NOSES = {
    small: { rows: [[10, 11]], color: 'B' },
    big: { rows: [[9, 10, 11, 12], [10, 11]], color: 'B', shine: true },
    pink: { rows: [[9, 10, 11, 12], [10, 11]], color: 'Q' },
  };

  const MOUTHS = {
    tongue: [['O', 9], ['P', 10], ['P', 11], ['O', 12], ['P', 10, 1], ['P', 11, 1]],
    smile: [['O', 8], ['O', 13], ['O', 9, 1], ['O', 10, 1], ['O', 11, 1], ['O', 12, 1]],
    open: [['O', 9], ['O', 10], ['O', 11], ['O', 12], ['O', 9, 1], ['P', 10, 1], ['P', 11, 1], ['O', 12, 1], ['O', 10, 2], ['O', 11, 2]],
    calm: [['O', 10], ['O', 11]],
  };

  const ACCESSORIES = {
    bow: { at: (h) => [Math.round(C - h.rx * 0.62 - 3), Math.round(h.cy - h.ry - 0.5)], px: ['OO...OO', 'OHO.OHO', 'OHHOHHO', 'OHO.OHO', 'OO...OO'] },
    flower: { at: (h) => [Math.round(C + h.rx * 0.5 - 1), Math.round(h.cy - h.ry - 0.5)], px: ['.O.O.', 'OEOEO', '.OYO.', 'OEOEO', '.O.O.'] },
  };

  const DEFAULT_LOOK = {
    shape: 'round', coat: 'smooth', ears: 'drop', eyes: 'big', nose: 'big', mouth: 'tongue', muzzle: 'short',
    pattern: 'solid', fur: '흰색', fur2: '흰색', earColor: 'dark', blush: 'on', acc: 'none',
  };

  // 예전 저장 형식(head/face, earColor main/second)도 그대로 그려요
  function normalizeLook(look) {
    const L = Object.assign({}, look || {});
    if (L.head && !L.coat) L.coat = L.head === 'fluffy' ? 'fluffy' : 'smooth';
    if (L.face && !L.muzzle) L.muzzle = L.face === 'flat' ? 'flat' : 'short';
    if (L.earColor === 'main') L.earColor = ['drop', 'long', 'fold'].includes(L.ears) ? 'dark' : 'same';
    return Object.assign({}, DEFAULT_LOOK, L);
  }

  function dogGrid(look, blink) {
    const L = normalizeLook(look);
    const h = Object.assign({}, SHAPES[L.shape] || SHAPES.round);
    if (L.coat === 'fluffy') { h.rx += 0.5; h.ry += 0.4; }
    const g = Array.from({ length: N }, () => Array(N).fill('.'));
    const put = (x, y, c) => { if (y >= 0 && y < N && x >= 0 && x < N) g[y][x] = c; };
    const earKey = { same: 'W', dark: 'G', second: 'X' }[L.earColor] || 'W';

    // 귀 위치를 얼굴 크기에 맞춰 옮겨요
    const base = SHAPES.round;
    const dx = base.rx - h.rx, dy = (h.cy - h.ry) - (base.cy - base.ry);
    const moved = shape => (x, y) => shape(x - dx, y - dy);
    const ear = EARS[L.ears] || EARS.pointy;
    const bothEars = either(moved(ear.shape), mirror(moved(ear.shape)));
    if (ear.back) {
      stamp(g, bothEars, earKey);
      if (ear.inner) stamp(g, either(moved(ear.inner), mirror(moved(ear.inner))), 'I', false);
    }

    const head = L.coat === 'fluffy'
      ? ellipse(C, h.cy, h.rx, h.ry, h.n, 0.07, 10)
      : ellipse(C, h.cy, h.rx, h.ry, h.n);
    stamp(g, head, 'W');
    if (L.coat === 'topknot') stamp(g, ellipse(C, h.cy - h.ry + 0.6, 4.4, 3.1, 2, 0.13, 7), 'W');
    if (!ear.back) stamp(g, bothEars, earKey);

    // 주둥이
    let noseY = Math.round(h.cy + 0.6);
    if (L.muzzle === 'short') {
      const my = h.cy + h.ry * 0.47;
      stamp(g, ellipse(C, my, 3.7, 2.7), 'L', false);
      noseY = Math.round(my - 2.4);
    } else if (L.muzzle === 'long') {
      const my = h.cy + h.ry * 0.62;
      stamp(g, ellipse(C, my, 3.9, 3.5), 'L');
      noseY = Math.round(my - 2.9);
    }
    if (L.coat === 'beard') stamp(g, ellipse(C, h.cy + h.ry - 0.8, 4.6, 2.9, 2, 0.16, 8), 'L');

    // 무늬: 얼굴 기준 좌표(u, v)로 털 칸을 무늬색으로 바꿔요
    const eye = EYES[L.eyes] || EYES.dot;
    const eyeY = Math.round(h.cy - 2.2);
    const eyeLX = Math.round(C - h.rx * 0.43 - eye.w / 2);
    const eyeRX = N - eyeLX - eye.w;
    const near = (x, y, ex) => Math.hypot(x + 0.5 - (ex + eye.w / 2), y + 0.5 - (eyeY + eye.h / 2)) < 2.8;
    const PAT = {
      solid: () => false,
      muzzle: (u, v) => v > 0.22 && Math.abs(u) < 0.78,
      blaze: (u, v) => (Math.abs(u) < 0.13 && v < 0.25) || (v > 0.25 && Math.abs(u) < 0.62),
      mask: (u, v, x, y) => near(x, y, eyeLX) || near(x, y, eyeRX) || (v > 0.22 && Math.abs(u) < 0.5),
      patchL: (u, v, x, y) => near(x, y, eyeLX),
      patchR: (u, v, x, y) => near(x, y, eyeRX),
      spots: (u, v, x, y) => [[5, 7], [16, 9], [7, 17], [14, 16], [12, 5], [4, 12]].some(([a, b]) => Math.hypot(x - a, y - b) < 1.3),
      half: (u, v, x) => x < C,
      tan: (u, v, x, y) => (y === eyeY - 2 && (x === eyeLX || x === eyeLX + 1 || x === eyeRX + eye.w - 1 || x === eyeRX + eye.w - 2)) || (v > 0.3 && Math.abs(u) > 0.42),
    };
    const inPattern = PAT[L.pattern] || PAT.solid;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (g[y][x] !== 'W' && g[y][x] !== 'L') continue;
        const u = (x + 0.5 - C) / h.rx, v = (y + 0.5 - h.cy) / h.ry;
        if (inPattern(u, v, x, y)) g[y][x] = 'X';
      }
    }

    // 오른쪽 아래 테두리 쪽에 그늘
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const c = g[y][x];
        if ((c === 'W' || c === 'X') && (g[y][x + 1] === 'O' || (g[y + 1] && g[y + 1][x] === 'O'))) g[y][x] = c === 'W' ? 'G' : 'Z';
      }
    }

    // 눈
    const drawEye = ex => {
      eye.px.forEach((row, r) => row.split('').forEach((c, i) => {
        if (blink && !eye.still) { if (r === eye.h - 1) put(ex + i, eyeY + r, 'B'); }
        else if (c !== '.') put(ex + i, eyeY + r, c);
      }));
    };
    drawEye(eyeLX);
    drawEye(eyeRX);
    if (L.blush === 'on') {
      const by = eyeY + eye.h + 1;
      [eyeLX - 1, eyeLX, eyeRX + eye.w - 1, eyeRX + eye.w].forEach(x => put(x, by, 'K'));
    }

    // 코와 입
    const nose = NOSES[L.nose] || NOSES.small;
    nose.rows.forEach((xs, r) => xs.forEach(x => put(x, noseY + r, nose.color)));
    if (nose.shine) put(10, noseY, 'E');
    const my = noseY + nose.rows.length;
    (MOUTHS[L.mouth] || MOUTHS.tongue).forEach(([c, x, r = 0]) => put(x, my + r, c));

    // 액세서리
    if (L.acc === 'scarf') {
      const by = Math.min(N - 4, Math.round(h.cy + h.ry - 2));
      stamp(g, polygon([[C - 6.5, by], [C + 6.5, by], [C, by + 4.6]]), 'R');
    } else if (ACCESSORIES[L.acc]) {
      const a = ACCESSORIES[L.acc];
      const [ax, ay] = a.at(h);
      a.px.forEach((row, r) => row.split('').forEach((c, i) => { if (c !== '.') put(ax + i, Math.max(0, ay) + r, c); }));
    }
    return g.map(r => r.join(''));
  }

  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');

  function lookPalette(look) {
    const L = normalizeLook(look);
    const main = FUR[L.fur] || FUR['흰색'];
    const second = FUR[L.fur2] || FUR['흰색'];
    return Object.assign({}, BASE, main, {
      X: second.W, Z: second.G, L: mix(main.W, '#ffffff', 0.45),
      I: mix(main.W, '#f28b9b', 0.55), Q: '#c9706f', H: '#ff6fa0',
      B: L.fur === '검정' ? '#0b0706' : BASE.B,
    });
  }

  // 눈 깜빡이는 강아지. look 은 생김새 객체 (예전 데이터는 털 색 문자열)
  function dog(scale = 4, look) {
    if (typeof look === 'string') look = { fur: look };
    const pal = lookPalette(look);
    const px = N * scale;
    return `<span class="dog" style="width:${px}px;height:${px}px" aria-hidden="true">` +
      `<span class="dog-open">${toSVG(dogGrid(look, false), pal)}</span>` +
      `<span class="dog-blink">${toSVG(dogGrid(look, true), pal)}</span></span>`;
  }

  // 고정된(깜빡이지 않는) 강아지 — 선택지 미리보기용
  function dogStill(scale = 3, look) {
    const px = N * scale;
    return `<span class="sprite" style="width:${px}px;height:${px}px" aria-hidden="true">${toSVG(dogGrid(look, false), lookPalette(look))}</span>`;
  }

  function installCSSVars() {
    const root = document.documentElement.style;
    for (const [name, f] of Object.entries(FRAMES)) {
      root.setProperty(`--frame-${name}`, uri(toSVG(f.grid, BASE, { intrinsic: true })));
    }
    for (const [name, t] of Object.entries(TILES)) {
      root.setProperty(`--tile-${name}`, uri(toSVG(t, BASE, { intrinsic: true })));
    }
  }

  window.Pixel = { sprite, dog, dogStill, installCSSVars, FUR, DEFAULT_LOOK, normalizeLook };
})();
