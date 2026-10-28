// 물결 도안 만들기와 크림 일치 계산. 좌표는 모두 케이크 로컬 좌표.
(function () {
  const C = window.CONFIG;

  // 맨 위(12시)에서 시작해 시계 방향으로 한 바퀴. t는 0~1
  function pointAt(t) {
    const { ringRatio, amplitudeRatio, lobes } = C.wave;
    const R = C.cake.radius;
    const theta = -Math.PI / 2 + t * Math.PI * 2;
    const r = R * ringRatio + R * amplitudeRatio * Math.sin(lobes * t * Math.PI * 2);
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  }

  function buildPath() {
    const pts = [];
    for (let i = 0; i < C.wave.samples; i++) pts.push(pointAt(i / C.wave.samples));
    return pts;
  }

  // 물결의 볼록한 꼭짓점(바깥쪽 봉우리)에 과일 자리를 만든다. 과일 종류는 자리마다 무작위
  function buildFruitSpots() {
    const { lobes } = C.wave;
    const { spotEvery, types } = C.fruit;
    const spots = [];
    for (let j = 0; j < lobes; j += spotEvery) {
      const p = pointAt((j + 0.25) / lobes); // sin이 1이 되는 지점
      spots.push({ x: p.x, y: p.y, type: types[Math.floor(Math.random() * types.length)], placedAt: null });
    }
    return spots;
  }

  // 그린 점이 들어올 때마다 "도안이 얼마나 덮였는지"와 "얼마나 벗어났는지"를 누적한다.
  class CreamTracker {
    constructor(path) {
      this.path = path;
      this.reset();
    }
    reset() {
      this.covered = new Uint8Array(this.path.length);
      this.coveredCount = 0;
      this.drawn = 0;
      this.off = 0;
    }
    add(x, y) {
      const cover2 = C.cream.coverTolerance ** 2;
      const off2 = C.cream.offTolerance ** 2;
      let min2 = Infinity;
      for (let i = 0; i < this.path.length; i++) {
        const dx = this.path[i].x - x;
        const dy = this.path[i].y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < min2) min2 = d2;
        if (d2 <= cover2 && !this.covered[i]) {
          this.covered[i] = 1;
          this.coveredCount++;
        }
      }
      this.drawn++;
      if (min2 > off2) this.off++;
    }
    get coverage() { return this.coveredCount / this.path.length; }
    get accuracy() { return this.drawn ? 1 - this.off / this.drawn : 0; }
    get match() { return this.coverage * this.accuracy; }
  }

  window.Wave = { buildPath, buildFruitSpots, CreamTracker };
})();
