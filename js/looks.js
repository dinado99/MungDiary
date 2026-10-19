// 강아지 생김새 선택지 — 이름(견종) 없이 그림으로 골라요
(() => {
  'use strict';

  // [키, 행 제목, 값 목록]
  const PARTS = [
    ['shape', '얼굴형', ['round', 'long', 'wide', 'small']],
    ['coat', '털', ['smooth', 'fluffy', 'topknot', 'beard']],
    ['ears', '귀', ['pointy', 'bat', 'round', 'fold', 'drop', 'long']],
    ['eyes', '눈', ['dot', 'big', 'shiny', 'sleepy', 'happy']],
    ['muzzle', '주둥이', ['short', 'long', 'flat']],
    ['nose', '코', ['small', 'big', 'pink']],
    ['mouth', '입', ['tongue', 'smile', 'open', 'calm']],
    ['pattern', '무늬', ['solid', 'muzzle', 'blaze', 'mask', 'patchL', 'patchR', 'tan', 'spots', 'half']],
    ['earColor', '귀 색', ['same', 'dark', 'second']],
    ['blush', '볼터치', ['on', 'off']],
    ['acc', '꾸미기', ['none', 'bow', 'flower', 'scarf']],
  ];

  const L = (shape, coat, ears, eyes, muzzle, nose, mouth, pattern, fur, fur2, earColor = 'same', acc = 'none') =>
    ({ shape, coat, ears, eyes, muzzle, nose, mouth, pattern, fur, fur2, earColor, blush: 'on', acc });

  // 바로 고를 수 있는 다양한 모습
  const PRESETS = [
    L('round', 'fluffy', 'pointy', 'dot', 'short', 'small', 'tongue', 'solid', '흰색', '흰색'),
    L('long', 'smooth', 'fold', 'big', 'long', 'big', 'smile', 'half', '갈색', '흰색', 'dark'),
    L('round', 'smooth', 'pointy', 'sleepy', 'short', 'small', 'calm', 'muzzle', '황금', '크림'),
    L('wide', 'smooth', 'fold', 'happy', 'long', 'big', 'open', 'tan', '검정', '갈색', 'dark'),
    L('small', 'fluffy', 'drop', 'shiny', 'short', 'small', 'tongue', 'solid', '흰색', '흰색', 'same', 'bow'),
    L('long', 'smooth', 'drop', 'dot', 'long', 'big', 'smile', 'blaze', '레드', '흰색', 'dark'),
    L('round', 'topknot', 'long', 'big', 'short', 'small', 'tongue', 'solid', '살구', '살구', 'same', 'bow'),
    L('wide', 'smooth', 'bat', 'big', 'flat', 'big', 'calm', 'solid', '크림', '크림'),
    L('wide', 'smooth', 'fold', 'big', 'flat', 'big', 'tongue', 'mask', '크림', '검정', 'second'),
    L('long', 'beard', 'fold', 'dot', 'long', 'big', 'calm', 'muzzle', '회색', '흰색', 'dark'),
    L('round', 'smooth', 'pointy', 'dot', 'long', 'small', 'smile', 'blaze', '은회색', '흰색'),
    L('small', 'smooth', 'bat', 'shiny', 'short', 'pink', 'tongue', 'muzzle', '크림', '흰색'),
    L('round', 'smooth', 'drop', 'happy', 'short', 'big', 'open', 'patchL', '흰색', '갈색', 'second', 'scarf'),
    L('long', 'smooth', 'fold', 'big', 'long', 'big', 'smile', 'blaze', '검정', '흰색'),
    L('round', 'smooth', 'round', 'big', 'short', 'small', 'tongue', 'solid', '초코', '초코', 'same', 'flower'),
    L('round', 'smooth', 'pointy', 'happy', 'short', 'small', 'smile', 'muzzle', '레드', '흰색'),
    L('wide', 'fluffy', 'pointy', 'dot', 'short', 'small', 'open', 'solid', '흰색', '흰색', 'same', 'scarf'),
    L('round', 'smooth', 'drop', 'dot', 'short', 'big', 'tongue', 'spots', '흰색', '검정', 'second'),
    L('long', 'smooth', 'drop', 'sleepy', 'long', 'big', 'calm', 'solid', '황금', '황금', 'dark'),
    L('small', 'topknot', 'long', 'shiny', 'short', 'pink', 'smile', 'blaze', '흰색', '황금', 'second', 'bow'),
    L('round', 'smooth', 'fold', 'big', 'short', 'big', 'tongue', 'tan', '초코', '황금', 'dark'),
    L('wide', 'smooth', 'pointy', 'dot', 'long', 'big', 'smile', 'patchR', '회색', '흰색', 'same', 'scarf'),
  ];

  function random() {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const look = {};
    for (const [key, , values] of PARTS) look[key] = pick(values);
    const furs = Object.keys(window.Pixel.FUR);
    look.fur = pick(furs);
    look.fur2 = pick(furs);
    look.acc = Math.random() < 0.7 ? 'none' : look.acc;
    return look;
  }

  window.Looks = { PARTS, PRESETS, random };
})();
