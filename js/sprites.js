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
    '갈색': { W: '#c4813f', G: '#8f5626' },
    '회색': { W: '#bdbdc8', G: '#8d8d9a' },
    '검정': { W: '#4b4242', G: '#2f2828' },
  };

  const S = {
    dog: [
      '................',
      '..OO........OO..',
      '.OGWO......OWGO.',
      '.OGWWOOOOOOWWGO.',
      '.OWWWWWWWWWWWWO.',
      'OWWWWWWWWWWWWWWO',
      'OWWBEWWWWWWBEWWO',
      'OWWBBWWWWWWBBWWO',
      'OWWWWWWWWWWWWWWO',
      'OKKWWWWBBWWWWKKO',
      '.OGWWWWBBWWWWGO.',
      '.OWGWWWOOWWWGWO.',
      '..OWWWWPPWWWWO..',
      '..OOGWWPPWWGOO..',
      '....OOOOOOOO....',
      '................',
    ],
    dogBlink: [
      '................',
      '..OO........OO..',
      '.OGWO......OWGO.',
      '.OGWWOOOOOOWWGO.',
      '.OWWWWWWWWWWWWO.',
      'OWWWWWWWWWWWWWWO',
      'OWWWWWWWWWWWWWWO',
      'OWWBBWWWWWWBBWWO',
      'OWWWWWWWWWWWWWWO',
      'OKKWWWWBBWWWWKKO',
      '.OGWWWWBBWWWWGO.',
      '.OWGWWWOOWWWGWO.',
      '..OWWWWPPWWWWO..',
      '..OOGWWPPWWGOO..',
      '....OOOOOOOO....',
      '................',
    ],
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

  // 눈 깜빡이는 강아지
  function dog(scale = 4, fur = '흰색') {
    const pal = palette(fur);
    const px = 16 * scale;
    return `<span class="dog" style="width:${px}px;height:${px}px" aria-hidden="true">` +
      `<span class="dog-open">${toSVG(S.dog, pal)}</span>` +
      `<span class="dog-blink">${toSVG(S.dogBlink, pal)}</span></span>`;
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

  window.Pixel = { sprite, dog, installCSSVars, FUR: Object.keys(FUR) };
})();
