import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

function ResultBoard({ x, classification, visible }: { x: number; classification: 'CONSTANT' | 'BALANCED'; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const isConstant = classification === 'CONSTANT';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const scale = visible ? 1 : 0.001;
    groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, scale, delta * 5);
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, scale, delta * 5);
    groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, scale, delta * 5);
  });

  return (
    <group ref={groupRef} position={[x, 0, 0.18]} scale={[0.001, 0.001, 0.001]}>
      <mesh>
        <planeGeometry args={[2.6, 1.9]} />
        <meshStandardMaterial color={isConstant ? '#DBEAFE' : '#FFEDD5'} transparent opacity={0.96} />
      </mesh>
      <Text position={[0, 0.32, 0.04]} fontSize={0.28} color={isConstant ? '#1D4ED8' : '#C2410C'} anchorX="center" anchorY="middle">
        {classification}
      </Text>
      <Text position={[0, -0.18, 0.04]} fontSize={0.13} color="#334155" anchorX="center" anchorY="middle" maxWidth={2.1} textAlign="center">
        {isConstant ? 'Semua bit input kembali ke 0.' : 'Ada bit input non-zero setelah interferensi.'}
      </Text>
    </group>
  );
}

function BlochSphereNode({
  y,
  targetX,
  phaseColor,
  blochState,
  p0,
}: {
  y: number;
  targetX: number;
  phaseColor: string;
  blochState: { bx: number; by: number; bz: number; label: string };
  p0: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const currentDirRef = useRef(new THREE.Vector3(0, 1, 0));
  const startTimeRef = useRef(performance.now());

  const { bx, by, bz, label } = blochState;

  const isZero = Math.abs(bz - 1) < 0.05;
  const isOne = Math.abs(bz + 1) < 0.05;
  const isSuper = !isZero && !isOne;
  const color = isSuper ? '#8B5CF6' : isOne ? '#F97316' : '#2563EB';

  const targetDir = new THREE.Vector3(bx, bz, by);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 4.4);
    const elapsedTime = (performance.now() - startTimeRef.current) / 1000;
    const bob = isSuper ? Math.sin(elapsedTime * 2.4 + y) * 0.07 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y + bob, delta * 5.5);

    if (matRef.current) {
      const target = new THREE.Color(color);
      matRef.current.color.lerp(target, delta * 4.6);
      matRef.current.emissive.lerp(target, delta * 3.8);
      matRef.current.emissiveIntensity += (((isSuper ? 0.48 : 0.15)) - matRef.current.emissiveIntensity) * delta * 4;
      matRef.current.opacity += (((isSuper ? 0.68 : 0.96)) - matRef.current.opacity) * delta * 4;
      matRef.current.wireframe = isSuper;
    }

    if (arrowRef.current) {
      currentDirRef.current.lerp(targetDir, delta * 4.0);
      currentDirRef.current.normalize();
      arrowRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentDirRef.current);
    }
  });

  return (
    <group ref={groupRef} position={[targetX, y, 0.32]}>
      <mesh>
        <sphereGeometry args={[0.42, 26, 26]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={isSuper ? 0.48 : 0.15} transparent opacity={isSuper ? 0.68 : 0.96} wireframe={isSuper} roughness={0.24} metalness={0.18} />
      </mesh>

      <mesh ref={arrowRef} position={[0, 0, 0]}>
        <group>
          <mesh position={[0, 0.24, 0]}>
            <coneGeometry args={[0.07, 0.16, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.18, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
          </mesh>
        </group>
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.028, 12, 48]} />
        <meshStandardMaterial color={phaseColor} emissive={phaseColor} emissiveIntensity={0.22} />
      </mesh>

      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      <Text position={[0, -0.56, 0]} fontSize={0.22} color={color} anchorX="center" anchorY="middle">
        {label}
      </Text>

      <Text position={[0, -0.78, 0]} fontSize={0.15} color="#475569" anchorX="center" anchorY="middle">
        {`P(|0⟩)=${Math.round(p0 * 100)}%`}
      </Text>
    </group>
  );
}

export { BlochSphereNode, ResultBoard };
