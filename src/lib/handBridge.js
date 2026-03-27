const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (from, to, t) => from + (to - from) * t;

export const createHandBridge = () => ({
  landmarks: null,
  raw: {
    rotX: 0,
    rotY: 0,
    scale: 1,
    zoom: 14,
    pinch: 0,
    spread: 0,
  },
  smooth: {
    rotX: 0,
    rotY: 0,
    scale: 1,
    zoom: 14,
    pinch: 0,
    spread: 0,
  },
  gesture: {
    name: 'NO HAND',
    pinch: false,
    fist: false,
    spread: false,
    open: false,
  },
  effects: {
    collapse: 0,
    burst: 0,
    freeze: false,
  },
  metrics: {
    pinchDistance: 1,
    spreadDistance: 0,
    wristDepth: 0,
  },
  clamp,
});
