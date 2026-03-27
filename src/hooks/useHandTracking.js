import { useEffect, useRef, useCallback } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const useHandTracking = (videoElement) => {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const handLandmarksRef = useRef(null);
  const callbacksRef = useRef([]);

  // Normalize hand landmarks to 0-1 range
  const normalizeLandmarks = useCallback((landmarks) => {
    if (!landmarks || landmarks.length === 0) return null;

    return landmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility || 0,
    }));
  }, []);

  // Calculate distance between two landmarks
  const calculateDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return Infinity;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = (point2.z || 0) - (point1.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, []);

  // Callback for MediaPipe Hands results
  const onResults = useCallback((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = normalizeLandmarks(results.multiHandLandmarks[0]);
      const indexFingerTip = landmarks[8]; // Landmark 8
      const thumbTip = landmarks[4]; // Landmark 4
      const middleFingerTip = landmarks[12]; // Landmark 12

      // Calculate pinch distance (thumb to index finger)
      const pinchDistance = calculateDistance(thumbTip, indexFingerTip);
      const isPinching = pinchDistance < 0.05; // Threshold for pinch

      handLandmarksRef.current = {
        landmarks,
        indexFingerTip,
        thumbTip,
        middleFingerTip,
        pinchDistance,
        isPinching,
        handedness: results.multiHandedness[0]?.label || 'Right',
      };

      // Trigger callbacks
      callbacksRef.current.forEach((callback) => {
        callback(handLandmarksRef.current);
      });
    } else {
      handLandmarksRef.current = null;
    }
  }, [normalizeLandmarks, calculateDistance]);

  // Subscribe to hand tracking updates
  const subscribe = useCallback((callback) => {
    callbacksRef.current.push(callback);
    return () => {
      callbacksRef.current = callbacksRef.current.filter((cb) => cb !== callback);
    };
  }, []);

  // Get current hand landmarks
  const getHandLandmarks = useCallback(() => {
    return handLandmarksRef.current;
  }, []);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!videoElement) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 1280,
      height: 720,
    });

    camera.start();

    handsRef.current = hands;
    cameraRef.current = camera;

    return () => {
      camera.stop();
      hands.close();
    };
  }, [videoElement, onResults]);

  return {
    subscribe,
    getHandLandmarks,
    handLandmarks: handLandmarksRef,
  };
};

export default useHandTracking;
