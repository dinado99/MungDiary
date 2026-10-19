// 강아지 생김새 선택지와 견종별 기본 생김새
(() => {
  'use strict';

  const OPTIONS = {
    ears: [['pointy', '쫑긋'], ['bat', '큰 귀'], ['fold', '접힌 귀'], ['drop', '늘어진 귀'], ['long', '긴 털 귀']],
    head: [['normal', '짧은 털'], ['fluffy', '복슬복슬']],
    face: [['normal', '보통 코'], ['flat', '납작 코']],
    pattern: [
      ['solid', '단색'], ['muzzle', '주둥이'], ['blaze', '가운데 줄'], ['mask', '마스크'],
      ['patch', '눈 반점'], ['tan', '눈썹·볼'], ['spots', '점박이'], ['half', '반반'],
    ],
    earColor: [['main', '털 색'], ['second', '무늬 색']],
  };

  const L = (ears, head, face, pattern, fur, fur2 = '흰색', earColor = 'main') =>
    ({ ears, head, face, pattern, fur, fur2, earColor });

  // 많이 키우는 견종 + 믹스 예시. 고른 뒤 귀·무늬·색을 마음대로 바꿀 수 있어요.
  const BREEDS = [
    ['믹스견', L('fold', 'normal', 'normal', 'half', '갈색', '흰색')],
    ['믹스견 (황구)', L('pointy', 'normal', 'normal', 'muzzle', '황금', '크림')],
    ['믹스견 (흑구)', L('fold', 'normal', 'normal', 'tan', '검정', '갈색')],
    ['믹스견 (점박이)', L('drop', 'normal', 'normal', 'spots', '흰색', '초코')],
    ['말티즈', L('long', 'fluffy', 'normal', 'solid', '흰색')],
    ['푸들', L('long', 'fluffy', 'normal', 'solid', '갈색')],
    ['비숑 프리제', L('drop', 'fluffy', 'normal', 'solid', '흰색')],
    ['포메라니안', L('pointy', 'fluffy', 'normal', 'muzzle', '황금', '크림')],
    ['시츄', L('long', 'fluffy', 'flat', 'blaze', '황금', '흰색')],
    ['치와와', L('bat', 'normal', 'normal', 'muzzle', '크림', '흰색')],
    ['요크셔테리어', L('pointy', 'fluffy', 'normal', 'tan', '회색', '황금')],
    ['웨스트 하이랜드 화이트 테리어', L('pointy', 'fluffy', 'normal', 'solid', '흰색')],
    ['진돗개', L('pointy', 'normal', 'normal', 'solid', '흰색')],
    ['시바견', L('pointy', 'normal', 'normal', 'muzzle', '갈색', '흰색')],
    ['웰시코기', L('bat', 'normal', 'normal', 'blaze', '황금', '흰색')],
    ['골든 리트리버', L('drop', 'normal', 'normal', 'solid', '황금')],
    ['래브라도 리트리버', L('drop', 'normal', 'normal', 'solid', '검정')],
    ['비글', L('drop', 'normal', 'normal', 'blaze', '갈색', '흰색')],
    ['닥스훈트', L('drop', 'normal', 'normal', 'tan', '검정', '갈색')],
    ['보더콜리', L('fold', 'normal', 'normal', 'blaze', '검정', '흰색')],
    ['잭 러셀 테리어', L('fold', 'normal', 'normal', 'patch', '흰색', '갈색', 'second')],
    ['슈나우저', L('fold', 'normal', 'normal', 'muzzle', '회색', '흰색')],
    ['시베리안 허스키', L('pointy', 'normal', 'normal', 'blaze', '회색', '흰색')],
    ['사모예드', L('pointy', 'fluffy', 'normal', 'solid', '흰색')],
    ['프렌치 불독', L('bat', 'normal', 'flat', 'solid', '크림')],
    ['퍼그', L('fold', 'normal', 'flat', 'mask', '크림', '검정', 'second')],
  ];

  window.Looks = { OPTIONS, BREEDS };
})();
