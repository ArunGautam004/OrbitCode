import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  LineBasicMaterial,
  Line,
  Points,
  PointsMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

export const STRUCTURES = ['SOLAR SYSTEM'];

// Planet data: [name, size, distance, color, speed]
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
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.0, 64, 64]} />
      <meshBasicMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={1.2} />
      <pointLight intensity={2.5} color="#ffff99" distance={150} />
    </mesh>
  );
};

const Planet = ({ planet, time }) => {
  const meshRef = useRef(null);

  useFrame(() => {
    if (meshRef.current) {
      const angle = time * planet.speed;
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
      <lineBasicMaterial color="#555555" linewidth={1} transparent opacity={0.3} />
    </line>
  );
};

const SolarSystem = ({ uniforms }) => {
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta * 0.3;
  });

  return (
    <group>
      <Sun />
      {PLANETS.map((planet) => (
        <group key={planet.name}>
          <OrbitLine distance={planet.distance} />
          <Planet planet={planet} time={timeRef.current} />
        </group>
      ))}
    </group>
  );
};

const useSharedUniforms = () => {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uCollapse: { value: 0 },
      uBurst: { value: 0 },
      uFreeze: { value: 0 },
      uGlow: { value: 0 },
      uCyan: { value: new Color('#1ff8ff') },
      uMagenta: { value: new Color('#ff37d3') },
    }),
    []
  );
};

const Rig = ({ bridge, selected }) => {
  const groupRef = useRef(null);
  const uniforms = useSharedUniforms();

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const freeze = bridge.effects.freeze;
    const runDelta = freeze ? 0 : delta;

    uniforms.uTime.value += runDelta;
    uniforms.uCollapse.value += (bridge.smooth.pinch - uniforms.uCollapse.value) * 0.09;
    uniforms.uBurst.value += (bridge.effects.burst - uniforms.uBurst.value) * 0.16;
    uniforms.uFreeze.value += ((freeze ? 1 : 0) - uniforms.uFreeze.value) * 0.1;
    uniforms.uGlow.value += (bridge.smooth.spread - uniforms.uGlow.value) * 0.1;

    if (!freeze) {
      group.rotation.x += (bridge.smooth.rotX - group.rotation.x) * 0.08;
      group.rotation.y += (bridge.smooth.rotY - group.rotation.y) * 0.08;
      group.rotation.z += delta * 0.02;
      group.scale.setScalar(group.scale.x + (bridge.smooth.scale - group.scale.x) * 0.08);
      bridge.effects.burst *= 0.93;
    }

    const camTarget = 20 + bridge.smooth.zoom * 15;
    state.camera.position.z += (camTarget - state.camera.position.z) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <SolarSystem uniforms={uniforms} />
    </group>
  );
};

export const Scene3D = ({ bridge, structure }) => {
  return (
    <Canvas camera={{ position: [0, 8, 20], fov: 45 }}>
      <color attach="background" args={['#000011']} />
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffff99" />
      <Rig bridge={bridge} selected={structure} />
    </Canvas>
  );
};
