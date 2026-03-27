import { useEffect, useRef } from 'react';
import './VideoFeed.css';

const VideoFeed = ({ videoRef, onVideoReady }) => {
  const localVideoRef = useRef(null);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;

    // Request webcam access
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        // Wait for video to be ready before calling callback
        video.onloadedmetadata = () => {
          if (videoRef) {
            videoRef.current = video;
          }
          onVideoReady?.(video);
        };
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
      });

    return () => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef, onVideoReady]);

  return (
    <div className="video-container">
      {/* Hidden video element for MediaPipe processing */}
      <video
        ref={localVideoRef}
        className="video-feed"
        playsInline
        muted
        style={{
          position: 'absolute',
          width: '1280px',
          height: '720px',
          left: '-9999px', // Hide off-screen
        }}
      />
      {/* This will be displayed by Three.js or mirrored for user feedback */}
    </div>
  );
};

export default VideoFeed;
