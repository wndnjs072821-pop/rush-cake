// 효과음 4종을 Web Audio로 만든다 (음원 파일 없음): 크림 짜기, 과일 올리기, 성공, 실패
(function () {
  const S = window.CONFIG.sound;
  let ac = null;
  let master = null;
  let noiseBuf = null;
  let muted = Save.getMuted();
  let lastCream = 0;

  // 브라우저 규칙상 소리는 첫 터치/클릭 이후에야 켤 수 있다
  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = S.master;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.2, to = null } = {}) {
    if (muted || !ac) return;
    const t = ac.currentTime + start;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // 크림이 나오는 "쭈욱" 소리: 걸러낸 잡음을 짧게
  function squirt() {
    if (muted || !ac) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.2), ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3;
    const f = 700 + Math.random() * 400;
    filter.frequency.setValueAtTime(f, t);
    filter.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.08);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(filter).connect(gain).connect(master);
    src.start(t);
    src.stop(t + 0.1);
  }

  window.Sound = {
    unlock,
    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      Save.setMuted(m);
    },
    cream() {
      const now = performance.now();
      if (now - lastCream < S.creamIntervalMs) return;
      lastCream = now;
      squirt();
    },
    fruit() {
      tone(520, 0, 0.12, { vol: 0.28, to: 880 });
      tone(1040, 0.05, 0.08, { vol: 0.12 });
    },
    success() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2, { type: 'triangle', vol: 0.25 }));
    },
    fail() {
      tone(330, 0, 0.22, { type: 'triangle', vol: 0.28, to: 262 });
      tone(262, 0.2, 0.38, { type: 'triangle', vol: 0.28, to: 196 });
    },
  };
})();
