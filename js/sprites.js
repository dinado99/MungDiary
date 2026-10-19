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
  // 머리 + 귀 + 무늬 + 얼굴을 겹쳐서 16x16 강아지 얼굴을 만들어요.
  // 키: O 외곽선, W 털, G 털 그늘, X 무늬 색, A 귀 색, B 눈·코, E 눈빛, P 혀, K 볼터치, H 분홍(리본·꽃)
  const HEADS = {
    normal: [
      '................',
      '................',
      '....OOOOOOOO....',
      '..OOWWWWWWWWOO..',
      '.OWWWWWWWWWWWWO.',
      '.OWWWWWWWWWWWWO.',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      '.OWWWWWWWWWWWWO.',
      '.OWWWWWWWWWWWWO.',
      '..OWWWWWWWWWWO..',
      '...OOWWWWWWOO...',
      '.....OOOOOO.....',
    ],
    fluffy: [
      '.....OOOOOO.....',
      '...OOWWGWWWOO...',
      '..OWWWWWWWGWWO..',
      '.OWGWWWWWWWWWWO.',
      '.OWWWWWWWWWWGWO.',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      '.OWWWWWWWWWWWWO.',
      '.OWGWWWWWWWWGWO.',
      '..OOWWWWWWWWOO..',
      '....OOOOOOOO....',
    ],
    // 테리어: 복슬 눈썹 + 덥수룩한 수염
    terrier: [
      '................',
      '.....OOOOOO.....',
      '...OOWWWWWWOO...',
      '..OWWWWWWWWWWO..',
      '.OWWWWWWWWWWWWO.',
      'OWWWWWWWWWWWWWWO',
      'OWGGGWWWWWWGGGWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      '.OWWWWWWWWWWWWO.',
      '.OWOWWWWWWWWOWO.',
      '..O.OWOWWOWO.O..',
    ],
  };

  // 왼쪽 귀만 그리고 오른쪽은 거울처럼 뒤집어요. [시작 줄, 줄들]
  const EARS = {
    pointy: [0, ['..OO....', '.OGWO...', '.OGWWO..', '.OGWWWW.', '.OWWWW..']],
    bat: [0, ['.OO.....', 'OGWO....', 'OGWWO...', 'OGWWWO..', 'OGWWWWO.', '.OWWWW..']],
    fold: [1, ['...OO...', '..OAAO..', '.OAAAO..', '.OAAO...', '..OO....']],
    drop: [2, ['..OOO...', '.OAAAO..', 'OAAAO...', 'OAAAO...', 'OAAAO...', 'OAAAO...', 'OAAO....', '.OO.....']],
    long: [3, ['.OOO....', 'OAAAO...', 'OAAAO...', 'OAAAO...', 'OAAAO...', 'OAAAO...', 'OAAAO...', 'OAAAO...', '.OAAO...', '..OO....']],
  };

  // 무늬: 털(W) 칸 중에서 이 영역을 무늬 색(X)으로 바꿔요
  const inBox = (x, y, x1, x2, y1, y2) => x >= x1 && x <= x2 && y >= y1 && y <= y2;
  const PATTERNS = {
    solid: () => false,
    muzzle: (x, y) => inBox(x, y, 3, 12, 10, 15) || inBox(x, y, 5, 10, 9, 9),
    blaze: (x, y) => inBox(x, y, 7, 8, 0, 8) || inBox(x, y, 4, 11, 9, 15),
    mask: (x, y) => inBox(x, y, 5, 10, 8, 13) || inBox(x, y, 3, 5, 6, 9) || inBox(x, y, 10, 12, 6, 9),
    patch: (x, y) => inBox(x, y, 2, 6, 5, 9),
    patchR: (x, y) => inBox(x, y, 9, 13, 5, 9),
    tan: (x, y) => inBox(x, y, 4, 5, 5, 5) || inBox(x, y, 10, 11, 5, 5) || inBox(x, y, 2, 5, 10, 13) || inBox(x, y, 10, 13, 10, 13),
    spots: (x, y) => [[3, 4], [4, 4], [12, 6], [11, 12], [12, 12], [4, 12], [9, 3], [13, 9]].some(([a, b]) => a === x && b === y),
    half: x => x < 8,
  };

  // 눈: 왼쪽 눈 칸들. 오른쪽은 6칸 옆에 같은 모양으로 그려요 (빛은 같은 쪽)
  const EYES = {
    dot: { open: [[4, 7, 'B'], [5, 7, 'E'], [4, 8, 'B'], [5, 8, 'B']], blink: [[4, 8, 'B'], [5, 8, 'B']] },
    big: { open: [[3, 6, 'B'], [4, 6, 'E'], [5, 6, 'B'], [3, 7, 'B'], [4, 7, 'B'], [5, 7, 'B'], [3, 8, 'B'], [4, 8, 'B'], [5, 8, 'B']], blink: [[3, 8, 'B'], [4, 8, 'B'], [5, 8, 'B']] },
    happy: { open: [[3, 8, 'B'], [4, 7, 'B'], [5, 8, 'B']] },
    sleepy: { open: [[3, 8, 'B'], [4, 8, 'B'], [5, 8, 'B']] },
  };

  const FACES = {
    normal: { nose: [[7, 9], [8, 9], [7, 10], [8, 10]], m: 11 },
    flat: { nose: [[7, 9], [8, 9]], m: 10, wrinkle: [[6, 6], [9, 6]] },
  };

  // 입: [색, x, 코 아래 몇 번째 줄]
  const MOUTHS = {
    tongue: [['O', 7, 0], ['O', 8, 0], ['P', 7, 1], ['P', 8, 1], ['P', 7, 2], ['P', 8, 2]],
    smile: [['O', 6, 0], ['O', 9, 0], ['O', 7, 1], ['O', 8, 1]],
    open: [['O', 7, 0], ['O', 8, 0], ['O', 6, 1], ['P', 7, 1], ['P', 8, 1], ['O', 9, 1], ['O', 7, 2], ['O', 8, 2]],
    closed: [['O', 7, 0], ['O', 8, 0]],
  };

  const ACCESSORIES = {
    bow: { x: 1, y: 2, px: ['HH.HH', 'HHOHH', 'HH.HH'] },
    flower: { x: 11, y: 2, px: ['.H.', 'HYH', '.H.'] },
    scarf: { x: 2, y: 13, px: ['ORRRRRRRRRRO', '.ORRRRRRRRO.', '...ORRRRO...'] },
    collar: { x: 2, y: 13, px: ['ORRRRRRRRRRO', '.....OYO....', '.....OOO....'] },
  };

  const DEFAULT_LOOK = {
    head: 'normal', ears: 'pointy', eyes: 'dot', face: 'normal', mouth: 'tongue', pattern: 'solid',
    fur: '흰색', fur2: '흰색', earColor: 'main', blush: 'on', acc: 'none',
  };

  // 다른 버전에서 저장된 값도 귀엽게 그려요
  function normalizeLook(look) {
    const L = Object.assign({}, look || {});
    if (L.coat === 'fluffy' || L.coat === 'topknot') L.head = 'fluffy';
    if (L.coat === 'beard') L.head = 'terrier';
    if (L.muzzle === 'flat') L.face = 'flat';
    if (L.earColor && L.earColor !== 'second') L.earColor = 'main';
    if (L.eyes === 'shiny') L.eyes = 'big';
    if (L.mouth === 'calm') L.mouth = 'closed';
    if (L.pattern === 'patchL') L.pattern = 'patch';
    const out = Object.assign({}, DEFAULT_LOOK, L);
    if (!HEADS[out.head]) out.head = 'normal';
    if (!EARS[out.ears]) out.ears = 'pointy';
    if (!EYES[out.eyes]) out.eyes = 'dot';
    if (!FACES[out.face]) out.face = 'normal';
    if (!MOUTHS[out.mouth]) out.mouth = 'tongue';
    if (!PATTERNS[out.pattern]) out.pattern = 'solid';
    return out;
  }

  function dogGrid(look, blink) {
    const L = normalizeLook(look);
    const g = HEADS[L.head].map(r => r.split(''));
    const put = (x, y, c) => { if (g[y] && x >= 0 && x < 16) g[y][x] = c; };

    const [top, rows] = EARS[L.ears];
    rows.forEach((half, i) => {
      const full = half + half.split('').reverse().join('');
      full.split('').forEach((c, x) => { if (c !== '.') put(x, top + i, c); });
    });

    const inPattern = PATTERNS[L.pattern];
    g.forEach((row, y) => row.forEach((c, x) => { if (c === 'W' && inPattern(x, y)) row[x] = 'X'; }));

    const eye = EYES[L.eyes];
    const cells = blink && eye.blink ? eye.blink : eye.open;
    cells.forEach(([x, y, c]) => { put(x, y, c); put(x + 6, y, c); });

    const f = FACES[L.face];
    f.nose.forEach(([x, y]) => put(x, y, 'B'));
    MOUTHS[L.mouth].forEach(([c, x, r]) => put(x, f.m + r, c));
    (f.wrinkle || []).forEach(([x, y]) => put(x, y, 'G'));
    if (L.blush === 'on') [[2, 10], [3, 10], [12, 10], [13, 10]].forEach(([x, y]) => put(x, y, 'K'));

    const acc = ACCESSORIES[L.acc];
    if (acc) acc.px.forEach((row, r) => row.split('').forEach((c, i) => { if (c !== '.') put(acc.x + i, acc.y + r, c); }));
    return g.map(r => r.join(''));
  }

  function lookPalette(look) {
    const L = normalizeLook(look);
    const main = FUR[L.fur] || FUR['흰색'];
    const second = FUR[L.fur2] || FUR['흰색'];
    return Object.assign({}, BASE, main, { X: second.W, A: L.earColor === 'second' ? second.W : main.G, H: '#ff7aa8' });
  }

  // 눈 깜빡이는 강아지. look 은 생김새 객체 (예전 데이터는 털 색 문자열)
  function dog(scale = 4, look) {
    if (typeof look === 'string') look = { fur: look };
    const pal = lookPalette(look);
    const px = 16 * scale;
    return `<span class="dog" style="width:${px}px;height:${px}px" aria-hidden="true">` +
      `<span class="dog-open">${toSVG(dogGrid(look, false), pal)}</span>` +
      `<span class="dog-blink">${toSVG(dogGrid(look, true), pal)}</span></span>`;
  }

  // 고정된(깜빡이지 않는) 강아지 — 선택지 미리보기용
  function dogStill(scale = 3, look) {
    const px = 16 * scale;
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
