import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';
import type { QubitState } from './constants';
import { stateToBlochCoords } from './constants';

interface BlochSphereProps {
  state: QubitState;
}

function StateArrow({ targetDir, color }: { targetDir: THREE.Vector3; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const currentDirRef = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    currentDirRef.current.lerp(targetDir, delta * 6);
    currentDirRef.current.normalize();
    groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentDirRef.current);
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function AxisLabels() {
  return (
    <>
      <Text position={[1.25, 0, 0]} fontSize={0.18} color="#EF4444" anchorX="center" anchorY="middle">|+⟩</Text>
      <Text position={[-1.25, 0, 0]} fontSize={0.18} color="#EF4444" anchorX="center" anchorY="middle">|−⟩</Text>
      <Text position={[0, 1.25, 0]} fontSize={0.18} color="#2563EB" anchorX="center" anchorY="middle">|0⟩</Text>
      <Text position={[0, -1.25, 0]} fontSize={0.18} color="#2563EB" anchorX="center" anchorY="middle">|1⟩</Text>
      <Text position={[0, 0, 1.25]} fontSize={0.18} color="#10B981" anchorX="center" anchorY="middle">|+i⟩</Text>
      <Text position={[0, 0, -1.25]} fontSize={0.18} color="#10B981" anchorX="center" anchorY="middle">|−i⟩</Text>
      <Text position={[1.35, 0, 0]} fontSize={0.13} color="#94A3B8" anchorX="left" anchorY="middle">x</Text>
      <Text position={[0, 1.35, 0]} fontSize={0.13} color="#94A3B8" anchorX="center" anchorY="bottom">z</Text>
      <Text position={[0, 0, 1.35]} fontSize={0.13} color="#94A3B8" anchorX="center" anchorY="bottom">y</Text>
    </>
  );
}

function BlochSphereScene({ state }: BlochSphereProps) {
  const bloch = stateToBlochCoords(state);
  const targetDir = new THREE.Vector3(bloch.x, bloch.z, bloch.y);
  const isZero = Math.abs(bloch.z - 1) < 0.05;
  const isOne = Math.abs(bloch.z + 1) < 0.05;
  const color = isZero ? '#2563EB' : isOne ? '#F97316' : '#8B5CF6';

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 2, -3]} intensity={0.3} color="#BFDBFE" />

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#F8FAFC" transparent opacity={0.12} roughness={0.9} />
      </mesh>

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#E2E8F0" wireframe />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.008, 8, 64]} />
        <meshBasicMaterial color="#CBD5E1" />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[1, 0.008, 8, 64]} />
        <meshBasicMaterial color="#CBD5E1" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1, 0.008, 8, 64]} />
        <meshBasicMaterial color="#CBD5E1" />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

      <StateArrow targetDir={targetDir} color={color} />

      <AxisLabels />

      <mesh position={[targetDir.x * 1.15, targetDir.z * 1.15, targetDir.y * 1.15]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </>
  );
}

export function BlochSphere({ state }: BlochSphereProps) {
  return <BlochSphereScene state={state} />;
}
