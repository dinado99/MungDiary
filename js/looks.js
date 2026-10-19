// 강아지 생김새 선택지 — 이름(견종) 없이 그림으로 골라요
(() => {
  'use strict';

  // [키, 행 제목, 값 목록]
  const PARTS = [
    ['head', '털', ['normal', 'fluffy', 'terrier']],
    ['ears', '귀', ['pointy', 'bat', 'fold', 'drop', 'long']],
    ['eyes', '눈', ['dot', 'big', 'happy', 'sleepy']],
    ['face', '코', ['normal', 'flat']],
    ['mouth', '입', ['tongue', 'smile', 'open', 'closed']],
    ['pattern', '무늬', ['solid', 'muzzle', 'blaze', 'mask', 'patch', 'patchR', 'tan', 'spots', 'half']],
    ['earColor', '귀 색', ['main', 'second']],
    ['blush', '볼터치', ['on', 'off']],
    ['acc', '꾸미기', ['none', 'bow', 'flower', 'scarf', 'collar']],
  ];

  const L = (head, ears, eyes, face, mouth, pattern, fur, fur2 = fur, earColor = 'main', acc = 'none') =>
    ({ head, ears, eyes, face, mouth, pattern, fur, fur2, earColor, blush: 'on', acc });

  // 바로 고를 수 있는 모습들
  const PRESETS = [
    L('terrier', 'pointy', 'dot', 'normal', 'tongue', 'solid', '흰색'),
    L('terrier', 'fold', 'big', 'normal', 'closed', 'muzzle', '회색', '흰색'),
    L('terrier', 'pointy', 'dot', 'normal', 'tongue', 'tan', '회색', '황금'),
    L('terrier', 'fold', 'big', 'normal', 'open', 'solid', '검정'),
    L('terrier', 'drop', 'dot', 'normal', 'tongue', 'patch', '흰색', '갈색', 'second'),
    L('fluffy', 'pointy', 'dot', 'normal', 'tongue', 'solid', '흰색'),
    L('fluffy', 'pointy', 'dot', 'normal', 'tongue', 'muzzle', '황금', '크림'),
    L('fluffy', 'long', 'big', 'normal', 'tongue', 'solid', '흰색', '흰색', 'main', 'bow'),
    L('fluffy', 'long', 'dot', 'normal', 'smile', 'solid', '갈색', '갈색', 'main', 'flower'),
    L('fluffy', 'drop', 'big', 'normal', 'tongue', 'solid', '살구', '살구', 'main', 'bow'),
    L('normal', 'fold', 'dot', 'normal', 'tongue', 'patch', '흰색', '갈색', 'second'),
    L('normal', 'pointy', 'happy', 'normal', 'smile', 'muzzle', '레드', '흰색'),
    L('normal', 'drop', 'dot', 'normal', 'tongue', 'blaze', '갈색', '흰색'),
    L('normal', 'bat', 'big', 'normal', 'closed', 'muzzle', '크림', '흰색'),
    L('normal', 'bat', 'dot', 'normal', 'tongue', 'blaze', '황금', '흰색'),
    L('normal', 'fold', 'dot', 'flat', 'tongue', 'mask', '크림', '검정', 'second'),
    L('normal', 'bat', 'big', 'flat', 'closed', 'solid', '크림'),
    L('normal', 'drop', 'happy', 'normal', 'open', 'solid', '황금', '황금', 'main', 'scarf'),
    L('normal', 'fold', 'dot', 'normal', 'tongue', 'blaze', '검정', '흰색'),
    L('normal', 'pointy', 'dot', 'normal', 'smile', 'blaze', '은회색', '흰색'),
    L('normal', 'fold', 'happy', 'normal', 'tongue', 'half', '갈색', '흰색', 'main', 'collar'),
    L('normal', 'drop', 'dot', 'normal', 'tongue', 'spots', '흰색', '검정', 'second'),
    L('normal', 'pointy', 'sleepy', 'normal', 'closed', 'solid', '흰색'),
    L('normal', 'drop', 'dot', 'normal', 'tongue', 'tan', '검정', '갈색', 'main', 'collar'),
    L('normal', 'fold', 'big', 'normal', 'tongue', 'solid', '초코', '초코', 'main', 'scarf'),
  ];

  function random() {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const look = {};
    for (const [key, , values] of PARTS) look[key] = pick(values);
    const furs = Object.keys(window.Pixel.FUR);
    look.fur = pick(furs);
    look.fur2 = pick(furs);
    if (Math.random() < 0.6) look.acc = 'none';
    look.blush = 'on';
    return look;
  }

  window.Looks = { PARTS, PRESETS, random };
})();
