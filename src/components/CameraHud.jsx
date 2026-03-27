import { HAND_CONNECTIONS } from '../lib/handTracking';

const SVG_NS = 'http://www.w3.org/2000/svg';

const getOrCreate = (svg, cls, count, kind) => {
  const cacheKey = `__${cls}`;
  if (!svg[cacheKey]) {
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const el = document.createElementNS(SVG_NS, kind);
      el.setAttribute('class', cls);
      svg.appendChild(el);
      nodes.push(el);
    }
    svg[cacheKey] = nodes;
  }

  return svg[cacheKey];
};

export const drawHandOverlay = (svg, landmarks) => {
  if (!svg) {
    return;
  }

  const circles = getOrCreate(svg, 'joint', 21, 'circle');
  const lines = getOrCreate(svg, 'bone', HAND_CONNECTIONS.length, 'line');

  if (!landmarks) {
    circles.forEach((circle) => {
      circle.setAttribute('r', '0');
    });
    lines.forEach((line) => {
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', '0');
    });
    return;
  }

  const w = 100;
  const h = 100;

  for (let i = 0; i < circles.length; i += 1) {
    const lm = landmarks[i];
    circles[i].setAttribute('cx', `${lm.x * w}`);
    circles[i].setAttribute('cy', `${lm.y * h}`);
    circles[i].setAttribute('r', i === 8 || i === 4 ? '1.5' : '1.0');
  }

  for (let i = 0; i < lines.length; i += 1) {
    const [a, b] = HAND_CONNECTIONS[i];
    const la = landmarks[a];
    const lb = landmarks[b];
    lines[i].setAttribute('x1', `${la.x * w}`);
    lines[i].setAttribute('y1', `${la.y * h}`);
    lines[i].setAttribute('x2', `${lb.x * w}`);
    lines[i].setAttribute('y2', `${lb.y * h}`);
  }
};

export const CameraHud = ({ videoRef, svgRef, status, gestureLabel }) => {
  return (
    <div className="camera-widget">
      <div className="camera-header">
        <span>LIVE CAM</span>
        <span>{status}</span>
      </div>

      <div className="camera-frame">
        <video ref={videoRef} muted playsInline className="camera-video" />
        <svg ref={svgRef} className="camera-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" />
        <div className="scanlines" />
      </div>

      <div className="gesture-chip">{gestureLabel}</div>
    </div>
  );
};
