import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { BufferGeometry, Vector3 } from 'three';

export const STRUCTURES = ['SOLAR SYSTEM'];

const PLANETS = [
  { name: 'Mercury', radius: 0.38, distance: 4, color: '#8c7853', speed: 4.15 },
  { name: 'Venus', radius: 0.95, distance: 6, color: '#ffc649', speed: 1.62 },
  { name: 'Earth', radius: 1.0, distance: 8.5, color: '#4a90e2', speed: 1.0 },
  { name: 'Mars', radius: 0.53, distance: 11, color: '#e27b58', speed: 0.53 },
  { name: 'Jupiter', radius: 2.8, distance: 15, color: '#c88b3a', speed: 0.084 },
  { name: 'Saturn', radius: 2.35, distance: 19, color: '#d4af85', speed: 0.034 },
  { name: 'Uranus', radius: 1.6, distance: 22.5, color: '#4fd0e7', speed: 0.012 },
  { name: 'Neptune', radius: 1.54, distance: 25.5, color: '#4166f5', speed: 0.006 },
];

const Sun = () => {
  const meshRef = useRef(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.0, 64, 64]} />
      <meshStandardMaterial color="#ffd76a" emissive="#ff9f1a" emissiveIntensity={1.5} roughness={0.25} />
      <pointLight intensity={2.6} color="#ffe29a" distance={180} decay={1.7} />
    </mesh>
  );
};

const Planet = ({ planet }) => {
  const meshRef = useRef(null);

  useFrame((state) => {
    if (meshRef.current) {
      const angle = state.clock.elapsedTime * 0.22 * planet.speed;
      meshRef.current.position.x = Math.cos(angle) * planet.distance;
      meshRef.current.position.z = Math.sin(angle) * planet.distance;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[planet.radius, 32, 32]} />
      <meshStandardMaterial color={planet.color} roughness={0.7} metalness={0.1} />
    </mesh>
  );
};

const OrbitLine = ({ distance }) => {
  const points = useMemo(() => {
    const segments = 128;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
    }
    return pts;
  }, [distance]);

  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setFromPoints(points);
    return geom;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#5f6673" transparent opacity={0.32} />
    </line>
  );
};

const Starfield = () => {
  const positions = useMemo(() => {
    const count = 2000;
    const values = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const r = 120 + Math.random() * 130;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      values[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      values[i * 3 + 1] = r * Math.cos(phi);
      values[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    return values;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#dce7ff" size={0.9} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
};

const SolarSystem = () => {
  const groupRef = useRef(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <Sun />
      {PLANETS.map((planet) => (
        <group key={planet.name}>
          <OrbitLine distance={planet.distance} />
          <Planet planet={planet} />
        </group>
      ))}
    </group>
  );
};

const Rig = ({ bridge }) => {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const freeze = bridge.effects.freeze;

    if (!freeze) {
      group.rotation.x += (bridge.smooth.rotX - group.rotation.x) * 0.08;
      group.rotation.y += (bridge.smooth.rotY - group.rotation.y) * 0.08;
      group.rotation.z += delta * 0.02;
      group.scale.setScalar(group.scale.x + (bridge.smooth.scale - group.scale.x) * 0.08);
    }

    const camTarget = bridge.smooth.zoom;
    state.camera.position.z += (camTarget - state.camera.position.z) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <SolarSystem />
      <Starfield />
    </group>
  );
};

export const Scene3D = ({ bridge }) => {
  return (
    <Canvas camera={{ position: [0, 6, 14], fov: 52 }}>
      <color attach="background" args={['#03060f']} />
      <ambientLight intensity={0.28} />
      <hemisphereLight intensity={0.2} groundColor="#050505" color="#8aa7ff" />
      <Rig bridge={bridge} />
    </Canvas>
  );
};
