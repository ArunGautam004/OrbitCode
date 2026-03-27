import './HandDebugOverlay.css';

const HandDebugOverlay = ({ handLandmarks }) => {
  if (!handLandmarks) {
    return (
      <div className="debug-overlay">
        <div className="status">Waiting for hand...</div>
      </div>
    );
  }

  const { indexFingerTip, thumbTip, pinchDistance, isPinching, handedness } =
    handLandmarks;

  return (
    <div className="debug-overlay">
      <div className="status active">Hand Tracking Active</div>
      <div className="info">
        <p>Handedness: <strong>{handedness}</strong></p>
        <p>Index Finger X: <strong>{(indexFingerTip?.x || 0).toFixed(3)}</strong></p>
        <p>Index Finger Y: <strong>{(indexFingerTip?.y || 0).toFixed(3)}</strong></p>
        <p>Pinch Distance: <strong>{pinchDistance.toFixed(4)}</strong></p>
        <p>
          Status:{' '}
          <strong className={isPinching ? 'pinching' : 'not-pinching'}>
            {isPinching ? '✋ PINCHING - Gravitational Pull Active' : '👋 Open Hand'}
          </strong>
        </p>
      </div>
    </div>
  );
};

export default HandDebugOverlay;
