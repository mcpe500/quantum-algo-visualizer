import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';
import { BlochQubitNode } from '../../../shared/components';

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

export { BlochQubitNode as BlochSphereNode, ResultBoard };
