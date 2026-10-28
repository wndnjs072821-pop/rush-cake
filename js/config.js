// 조정 가능한 수치 모음. 숫자만 바꿔도 게임이 달라진다.
// 길이 단위는 "케이크 로컬 좌표"(케이크 반지름 = cake.radius)다.
window.CONFIG = {
  world: { width: 400, height: 500, pixelRatio: 2 },

  cake: { radius: 150, centerX: 200, centerY: 250 },

  // 점선 물결 도안: 케이크 안쪽을 한 바퀴 도는 둥근 물결 고리
  wave: {
    ringRatio: 0.68,       // 고리 평균 반지름 (케이크 반지름 대비)
    amplitudeRatio: 0.09,  // 물결 높이
    lobes: 12,             // 물결 봉우리 개수
    samples: 240,          // 도안을 나눈 점 개수 (일치율 계산 단위)
  },

  cream: {
    width: 14,             // 크림 굵기
    step: 3,               // 그린 선을 이 간격으로 촘촘히 채워 기록
    coverTolerance: 12,    // 도안 점이 "덮였다"고 보는 거리
    offTolerance: 20,      // 이보다 멀리 그린 점은 "벗어남"으로 센다
    colors: {
      white: { main: '#fffdf8', light: '#ffffff' },
      pink:  { main: '#ffb0c8', light: '#ffd6e2' },
      choco: { main: '#7a4a3a', light: '#a06a55' },
    },
  },

  // 과일은 물결 봉우리 중 spotEvery 개마다 하나씩 올린다 (봉우리 12개, 2개마다 -> 6개)
  fruit: {
    types: ['strawberry', 'blueberry', 'kiwi'],
    spotEvery: 2,
    radius: 13,            // 과일 크기
    tapRadius: 30,         // 자리에서 이 거리 안을 탭하면 붙는다 (화면 기준: 케이크가 작아져도 같다)
  },

  game: {
    lives: 3,
    startTimeSec: 20,      // 첫 케이크 제한 시간
    timeStepSec: 1.5,      // 성공할 때마다 줄어드는 시간
    minTimeSec: 7,         // 제한 시간의 하한
  },

  sound: {
    master: 0.8,             // 전체 음량 (0~1)
    creamIntervalMs: 80,     // 크림 짜는 소리가 이어지는 최소 간격
  },

  // 난이도 상승. "성공한 케이크 수"에 따라 적용된다.
  difficulty: {
    shrinkPerClear: 0.04,    // 성공할 때마다 케이크가 이만큼(비율) 작아짐
    minScale: 0.65,          // 처음 크기 대비 최소 크기
    moveStartCleared: 3,     // 성공 3개 후, 즉 4번째 케이크부터 좌우로 움직인다
    moveAmplitude: 50,       // 좌우 이동 폭 (화면 가장자리를 넘지 않게 자동으로 더 줄어듦)
    moveSpeedStart: 1.0,     // 처음 이동 속도 (라디안/초, 값이 클수록 빠름)
    moveSpeedStep: 0.12,     // 성공할 때마다 늘어나는 속도
    moveSpeedMax: 2.6,
  },

  judge: {
    coverToFruitPercent: 90, // 도안을 이만큼 덮고 손을 떼면 과일 단계로
    passPercent: 60,         // 일치율이 이 이상이어야 성공
  },
};
