import '@mediapipe/hands';
import { lerp } from './handBridge';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const FRAME_MS = 1000 / 30;
const SMOOTH_FACTOR = 0.08;

const distance3 = (a, b) => {
  if (!a || !b) {
    return 0;
  }

  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const classifyGesture = (landmarks) => {
  if (!landmarks) {
    return {
      name: 'NO HAND',
      pinch: false,
      spread: false,
      fist: false,
      open: false,
      pinchDistance: 1,
      spreadDistance: 0,
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];

  const pinchDistance = distance3(thumbTip, indexTip);
  const spreadDistance = distance3(indexTip, middleTip);

  const extensions = [
    distance3(indexTip, indexMcp),
    distance3(middleTip, middleMcp),
    distance3(ringTip, ringMcp),
    distance3(pinkyTip, pinkyMcp),
  ];

  const wristDistances = [
    distance3(indexTip, wrist),
    distance3(middleTip, wrist),
    distance3(ringTip, wrist),
    distance3(pinkyTip, wrist),
  ];

  const allCurled = extensions.every((v) => v < 0.09) && wristDistances.every((v) => v < 0.22);
  const open = extensions.every((v) => v > 0.12);
  const pinch = pinchDistance < 0.055;
  const spread = spreadDistance > 0.11;

  let name = 'TRACKING';
  if (allCurled) {
    name = 'FIST FREEZE';
  } else if (pinch) {
    name = 'PINCH DETECTED';
  } else if (spread) {
    name = 'TWO FINGER SPREAD';
  } else if (open) {
    name = 'OPEN HAND ROTATE';
  }

  return {
    name,
    pinch,
    spread,
    fist: allCurled,
    open,
    pinchDistance,
    spreadDistance,
  };
};

const mapHandToTargets = (landmarks, gesture, bridge) => {
  if (!landmarks) {
    bridge.raw.pinch = lerp(bridge.raw.pinch, 0, SMOOTH_FACTOR);
    bridge.raw.spread = lerp(bridge.raw.spread, 0, SMOOTH_FACTOR);
    return;
  }

  const indexTip = landmarks[8];
  const wrist = landmarks[0];
  const clamp = bridge.clamp;

  const targetRotY = (indexTip.x - 0.5) * Math.PI * 1.45;
  const targetRotX = (indexTip.y - 0.5) * Math.PI * 1.1;
  const targetScale = clamp(0.7 + ((gesture.spreadDistance - 0.04) / 0.18) * 1.5, 0.6, 2.4);
  const targetZoom = clamp(11.5 + (wrist.z + 0.25) * 22, 7.5, 18.5);
  const targetPinch = gesture.pinch ? clamp((0.055 - gesture.pinchDistance) / 0.055, 0, 1) : 0;

  bridge.raw.rotX = lerp(bridge.raw.rotX, targetRotX, SMOOTH_FACTOR);
  bridge.raw.rotY = lerp(bridge.raw.rotY, targetRotY, SMOOTH_FACTOR);
  bridge.raw.scale = lerp(bridge.raw.scale, targetScale, SMOOTH_FACTOR);
  bridge.raw.zoom = lerp(bridge.raw.zoom, targetZoom, SMOOTH_FACTOR);
  bridge.raw.pinch = lerp(bridge.raw.pinch, targetPinch, SMOOTH_FACTOR);
  bridge.raw.spread = lerp(bridge.raw.spread, gesture.spread ? 1 : 0, SMOOTH_FACTOR);

  bridge.metrics.pinchDistance = gesture.pinchDistance;
  bridge.metrics.spreadDistance = gesture.spreadDistance;
  bridge.metrics.wristDepth = wrist.z;
};

export const startHandTracking = async ({ video, bridge, onOverlay, onStatus, onGesture }) => {
  onStatus?.('INITIALIZING TRACKER');

  const HandsCtor = window.Hands;
  if (!HandsCtor) {
    throw new Error('MediaPipe Hands failed to load in window context.');
  }

  const hands = new HandsCtor({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });

  let nextLandmarks = null;
  let running = true;
  let busy = false;
  let rafId = 0;
  let previousTs = 0;
  let previousPinch = false;

  hands.onResults((results) => {
    nextLandmarks = results.multiHandLandmarks?.[0] ?? null;
  });

  const frame = async (ts) => {
    if (!running) {
      return;
    }

    rafId = requestAnimationFrame(frame);

    if (ts - previousTs < FRAME_MS) {
      return;
    }

    previousTs = ts;

    if (!busy) {
      busy = true;
      try {
        await hands.send({ image: video });
      } catch (error) {
        console.error(error);
      }
      busy = false;
    }

    bridge.landmarks = nextLandmarks;

    const gesture = classifyGesture(nextLandmarks);
    mapHandToTargets(nextLandmarks, gesture, bridge);

    bridge.gesture.name = gesture.name;
    bridge.gesture.pinch = gesture.pinch;
    bridge.gesture.spread = gesture.spread;
    bridge.gesture.fist = gesture.fist;
    bridge.gesture.open = gesture.open;

    if (!previousPinch && gesture.pinch) {
      bridge.effects.burst = 0;
    }

    if (previousPinch && !gesture.pinch) {
      bridge.effects.burst = 1;
    }

    previousPinch = gesture.pinch;
    bridge.effects.freeze = gesture.fist;

    bridge.smooth.rotX = lerp(bridge.smooth.rotX, bridge.raw.rotX, SMOOTH_FACTOR);
    bridge.smooth.rotY = lerp(bridge.smooth.rotY, bridge.raw.rotY, SMOOTH_FACTOR);
    bridge.smooth.scale = lerp(bridge.smooth.scale, bridge.raw.scale, SMOOTH_FACTOR);
    bridge.smooth.zoom = lerp(bridge.smooth.zoom, bridge.raw.zoom, SMOOTH_FACTOR);
    bridge.smooth.pinch = lerp(bridge.smooth.pinch, bridge.raw.pinch, SMOOTH_FACTOR);
    bridge.smooth.spread = lerp(bridge.smooth.spread, bridge.raw.spread, SMOOTH_FACTOR);

    onOverlay?.(nextLandmarks);
    onGesture?.(gesture.name);
  };

  onStatus?.('TRACKING LOOP STARTED');
  rafId = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    hands.close();
    onOverlay?.(null);
    onStatus?.('TRACKING STOPPED');
  };
};

export { HAND_CONNECTIONS };
