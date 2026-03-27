import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';

const PARTICLE_COUNT = 5000;

const Galaxy = ({ handLandmarks }) => {
  const pointsRef = useRef(null);
  const particlesRef = useRef([]);
  const positionsRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const targetPosRef = useRef(new Vector3(0, 0, 0));
  const targetRotRef = useRef({ x: 0, y: 0 });
  const currentRotRef = useRef({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);

  // Initialize particles on mount
  useEffect(() => {
    const particles = [];
    const positions = positionsRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Create galaxy-like distribution
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 15;
      const height = (Math.random() - 0.5) * 8;

      const x = Math.cos(angle) * radius;
      const y = height;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      particles.push({
        originalPos: new Vector3(x, y, z),
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        mass: 0.5 + Math.random() * 1.5,
        index: i,
      });
    }

    particlesRef.current = particles;

    // Update geometry if points ref is ready
    if (pointsRef.current?.geometry) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, []);

  // Main animation loop
  useFrame(() => {
    if (!pointsRef.current || !handLandmarks.current) return;

    const hand = handLandmarks.current;
    const { indexFingerTip, isPinching } = hand;

    if (!indexFingerTip) return;

    // Map hand coordinates to 3D space
    targetPosRef.current.set(
      (indexFingerTip.x - 0.5) * 20,
      -(indexFingerTip.y - 0.5) * 20,
      (indexFingerTip.z || 0) * 10
    );

    // Map hand rotation
    targetRotRef.current.y = (indexFingerTip.x - 0.5) * Math.PI;
    targetRotRef.current.x = (indexFingerTip.y - 0.5) * Math.PI;

    // Smooth rotation transition
    currentRotRef.current.x +=
      (targetRotRef.current.x - currentRotRef.current.x) * 0.1;
    currentRotRef.current.y +=
      (targetRotRef.current.y - currentRotRef.current.y) * 0.1;

    isPinchingRef.current = isPinching;

    // Update particle positions
    const positions = positionsRef.current;
    const particles = particlesRef.current;

    particles.forEach((particle) => {
      const idx = particle.index;
      const x = positions[idx * 3];
      const y = positions[idx * 3 + 1];
      const z = positions[idx * 3 + 2];

      const currentPos = new Vector3(x, y, z);

      if (isPinching) {
        // Gravitational pull toward hand
        const direction = new Vector3().subVectors(
          targetPosRef.current,
          currentPos
        );
        const distance = direction.length();
        const maxDistance = 15;

        if (distance < maxDistance && distance > 0.1) {
          const force = (1 - distance / maxDistance) * 0.5;
          particle.velocity.addScaledVector(direction.normalize(), force);
        }
      } else {
        // Return to original position gradually
        const returnDirection = new Vector3().subVectors(
          particle.originalPos,
          currentPos
        );
        const returnForce = returnDirection.length() * 0.01;
        particle.velocity.addScaledVector(returnDirection.normalize(), returnForce);
        particle.velocity.multiplyScalar(0.98);
      }

      // Apply velocity
      particle.velocity.multiplyScalar(0.99);
      currentPos.add(particle.velocity);

      // Update position
      positions[idx * 3] = currentPos.x;
      positions[idx * 3 + 1] = currentPos.y;
      positions[idx * 3 + 2] = currentPos.z;

      // Wrap around edges
      const bound = 20;
      if (Math.abs(currentPos.x) > bound)
        positions[idx * 3] = currentPos.x > 0 ? -bound : bound;
      if (Math.abs(currentPos.y) > bound)
        positions[idx * 3 + 1] = currentPos.y > 0 ? -bound : bound;
      if (Math.abs(currentPos.z) > bound)
        positions[idx * 3 + 2] = currentPos.z > 0 ? -bound : bound;
    });

    // Update geometry
    if (pointsRef.current?.geometry?.attributes?.position) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Apply rotation
    pointsRef.current.rotation.x = currentRotRef.current.x;
    pointsRef.current.rotation.y = currentRotRef.current.y;

    // Subtle auto-rotation when not pinching
    if (!isPinching) {
      pointsRef.current.rotation.z += 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positionsRef.current}
          itemSize={3}
          needsUpdate={true}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        color={0x64b5f6}
        fog={true}
      />
    </points>
  );
};

const GalaxyScene = ({ handLandmarks }) => {
  return (
    <Canvas
      camera={{
        position: [0, 0, 25],
        fov: 75,
        near: 0.1,
        far: 1000,
      }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    >
      <Galaxy handLandmarks={handLandmarks} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Preload all />
    </Canvas>
  );
};

export default GalaxyScene;
