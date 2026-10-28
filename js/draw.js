// canvas 그리기. 게임 상태를 받아 한 장면을 그린다.
(function () {
  const C = window.CONFIG;
  const { width: W, height: H } = C.world;

  function tracePath(ctx, path) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.closePath();
  }

  function drawCake(ctx) {
    const R = C.cake.radius;
    // 접시
    ctx.save();
    ctx.shadowColor = 'rgba(160, 100, 110, 0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, R + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 케이크 옆면 테두리와 윗면
    ctx.fillStyle = '#f5c6a5';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(-30, -30, 10, 0, 0, R - 8);
    g.addColorStop(0, '#fff3e6');
    g.addColorStop(1, '#ffe0c8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R - 9, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGuide(ctx, path) {
    ctx.save();
    ctx.setLineDash([1, 9]);
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e8869f';
    tracePath(ctx, path);
    ctx.stroke();
    ctx.restore();
    // 시작점 표시
    ctx.fillStyle = '#8fe3c7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function strokePolyline(ctx, stroke) {
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.01, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }

  function drawCream(ctx, strokes, colorName) {
    const color = C.cream.colors[colorName];
    const w = C.cream.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [width, style, dx, dy] of [
      [w + 4, 'rgba(120, 70, 70, 0.18)', 0, 1.5],
      [w, color.main, 0, 0],
      [w * 0.35, color.light, -1.5, -2],
    ]) {
      ctx.lineWidth = width;
      ctx.strokeStyle = style;
      ctx.save();
      ctx.translate(dx, dy);
      for (const s of strokes) strokePolyline(ctx, s);
      ctx.restore();
    }
  }

  function dot(ctx, x, y, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 과일 그림 (원점 중심, 반지름 약 C.fruit.radius)
  const FRUITS = {
    strawberry(ctx) {
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.ellipse(0, 1, 11, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const [x, y] of [[-4, -2], [4, -2], [0, 3], [-5, 5], [5, 5]]) dot(ctx, x, y, 1.2, '#ffe08a');
      ctx.fillStyle = '#4cb86a';
      for (const a of [-0.9, 0, 0.9]) {
        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -2, 2.6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      dot(ctx, -5, -4, 2, 'rgba(255,255,255,0.45)');
    },
    blueberry(ctx) {
      dot(ctx, 0, 0, 11, '#5468d4');
      dot(ctx, 0, -1, 3.2, '#34429c');
      dot(ctx, 0, -1, 1.2, '#8f9cf0');
      dot(ctx, -4.5, -4.5, 2.6, 'rgba(255,255,255,0.45)');
    },
    kiwi(ctx) {
      dot(ctx, 0, 0, 13, '#8a6a34');
      dot(ctx, 0, 0, 11.5, '#8fcf4a');
      dot(ctx, 0, 0, 7.5, '#c5ee8a');
      dot(ctx, 0, 0, 3, '#f4ffd8');
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        dot(ctx, Math.cos(a) * 5.6, Math.sin(a) * 5.6, 1, '#2d3a1a');
      }
    },
  };

  const POP_MS = 260;

  function drawFruit(ctx, f, now) {
    const k = Math.min(1, (now - f.placedAt) / POP_MS);
    const s = k < 0.6 ? (k / 0.6) * 1.25 : 1.25 - ((k - 0.6) / 0.4) * 0.25; // 톡 튀어나오는 느낌
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(s, s);
    dot(ctx, 1.5, 3, C.fruit.radius - 1, 'rgba(120, 70, 70, 0.22)');
    FRUITS[f.type](ctx);
    ctx.restore();
  }

  // 과일 단계에서 아직 안 올린 자리를 희미한 동그라미로 표시
  function drawSpot(ctx, f, now) {
    const pulse = 0.55 + 0.25 * Math.sin(now / 220);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `rgba(232, 134, 159, ${pulse + 0.2})`;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, C.fruit.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function render(ctx, state) {
    const now = performance.now();
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(state.cake.x, state.cake.y);
    ctx.scale(state.cake.scale, state.cake.scale);
    drawCake(ctx);
    drawGuide(ctx, state.path);
    drawCream(ctx, state.strokes, state.creamColor);
    if (state.phase !== 'cream') {
      for (const f of state.fruits) {
        if (f.placedAt === null) {
          if (state.phase === 'fruit') drawSpot(ctx, f, now);
        } else {
          drawFruit(ctx, f, now);
        }
      }
    }
    ctx.restore();
  }

  window.Draw = { render };
})();
