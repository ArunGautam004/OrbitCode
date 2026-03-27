import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { Scene3D, STRUCTURES } from './components/Scene3D';
import { CameraHud, drawHandOverlay } from './components/CameraHud';
import { createHandBridge } from './lib/handBridge';
import { startHandTracking } from './lib/handTracking';

function App() {
  const videoRef = useRef(null);
  const svgRef = useRef(null);
  const bridge = useMemo(() => createHandBridge(), []);

  const [structureIndex, setStructureIndex] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [gestureLabel, setGestureLabel] = useState('None');

  useEffect(() => {
    let stopTracking = null;
    let stream = null;
    let mounted = true;

    const boot = async () => {
      try {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        setStatus('Requesting camera...');

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!mounted) {
          return;
        }

        video.srcObject = stream;
        await video.play();

        setStatus('Loading MediaPipe...');

        stopTracking = await startHandTracking({
          video,
          bridge,
          onOverlay: (landmarks) => {
            drawHandOverlay(svgRef.current, landmarks);
          },
          onStatus: (next) => {
            if (mounted) {
              setStatus(next);
            }
          },
          onGesture: (name) => {
            if (mounted) {
              setGestureLabel(name);
            }
          },
        });

        if (mounted) {
          setStatus('Ready');
        }
      } catch (error) {
        setStatus('Error');
        console.error(error);
      }
    };

    boot();

    return () => {
      mounted = false;

      if (stopTracking) {
        stopTracking();
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [bridge]);

  return (
    <div className="app-container">
      <Scene3D bridge={bridge} structure={STRUCTURES[structureIndex]} />
      
      <div className="ui-panel">
        <h1>Hand Gesture Control</h1>
        
        <div className="info-section">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Gesture:</strong> {gestureLabel}</p>
          <p><strong>Structure:</strong> {STRUCTURES[structureIndex]}</p>
        </div>

        <div className="controls-section">
          <h3>Controls:</h3>
          <ul>
            <li>Open hand → rotate</li>
            <li>Pinch → collapse/burst</li>
            <li>Fist → freeze</li>
            <li>Spread fingers → scale</li>
            <li>Palm depth → zoom</li>
          </ul>
        </div>

        <div className="structures-section">
          <h3>Select Structure:</h3>
          <div className="button-group">
            {STRUCTURES.map((name, index) => (
              <button
                key={name}
                className={`btn ${index === structureIndex ? 'btn-active' : ''}`}
                onClick={() => setStructureIndex(index)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CameraHud
        videoRef={videoRef}
        svgRef={svgRef}
        status={status}
        gestureLabel={gestureLabel}
      />
    </div>
  );
}

export default App;
