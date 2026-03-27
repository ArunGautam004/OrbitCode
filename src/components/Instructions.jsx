import './Instructions.css';
import { useState } from 'react';

const Instructions = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button className="show-instructions-btn" onClick={() => setIsVisible(true)}>
        ?
      </button>
    );
  }

  return (
    <div className="instructions-panel">
      <button
        className="close-btn"
        onClick={() => setIsVisible(false)}
        title="Close instructions"
      >
        ✕
      </button>
      <h2>Particle Galaxy Controller</h2>
      <div className="instructions-content">
        <section>
          <h3>🎯 How to Play</h3>
          <ul>
            <li><strong>Move your hand:</strong> Align the galaxy rotation with your hand position</li>
            <li><strong>Pinch gesture:</strong> Pinch your thumb and index finger to activate gravitational pull</li>
            <li><strong>Watch the particles:</strong> They'll be attracted to your pinching hand position</li>
          </ul>
        </section>

        <section>
          <h3>⚙️ Features</h3>
          <ul>
            <li>🎬 Real-time MediaPipe hand tracking (21 landmarks)</li>
            <li>🌌 5,000+ particle galaxy system</li>
            <li>✨ Dynamic gravitational mechanics</li>
            <li>🔄 Smooth rotation mapping</li>
            <li>📊 Performance-optimized rendering</li>
          </ul>
        </section>

        <section>
          <h3>📋 Technical Details</h3>
          <ul>
            <li>Hand tracking: index finger tip (landmark 8) controls rotation</li>
            <li>Pinch detection: thumb to index finger distance</li>
            <li>Galaxy: 5000+ particles in orbital formation</li>
            <li>3D: React Three Fiber + Three.js</li>
          </ul>
        </section>

        <section className="permissions-note">
          <strong>⚠️ Camera Permission:</strong> This app requires webcam access to work
        </section>
      </div>
    </div>
  );
};

export default Instructions;
