// 이 기기의 브라우저에 최고 기록과 음소거 설정을 저장한다.
// 브라우저 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서도 게임은 돌아가야 한다.
(function () {
  const BEST_KEY = 'rushCake.best';
  const MUTED_KEY = 'rushCake.muted';

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // 저장 실패는 무시: 이번 접속에서만 유지된다
    }
  }

  window.Save = {
    getBest: () => Number(read(BEST_KEY)) || 0,
    setBest: (score) => write(BEST_KEY, String(score)),
    getMuted: () => read(MUTED_KEY) === '1',
    setMuted: (muted) => write(MUTED_KEY, muted ? '1' : '0'),
  };
})();
