import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface SingleBlochData {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  pZero: number;
  pOne: number;
  label: string;
}

interface BlochSphere3DProps {
  blochData: SingleBlochData[];
  numQubits: number;
}

function getStateColor(x: number, y: number, z: number): string {
  const distToZero = Math.sqrt((x - 0) ** 2 + (y - 0) ** 2 + (z - 1) ** 2);
  const distToOne = Math.sqrt((x - 0) ** 2 + (y - 0) ** 2 + (z + 1) ** 2);
  const threshold = 0.3;

  if (distToZero < threshold) return '#3b82f6';
  if (distToOne < threshold) return '#f97316';
  return '#a855f7';
}

function SingleBlochSphere({
  index,
  bloch,
  numQubits,
}: {
  index: number;
  bloch: SingleBlochData;
  numQubits: number;
}) {
  const targetVector = useMemo(
    () => new THREE.Vector3(bloch.x, bloch.z, bloch.y),
    [bloch.x, bloch.y, bloch.z]
  );
  const vectorLength = useMemo(() => Math.min(targetVector.length(), 1), [targetVector]);
  const direction = useMemo(() => {
    if (vectorLength < 1e-6) {
      return new THREE.Vector3(0, 1, 0);
    }

    return targetVector.clone().normalize();
  }, [targetVector, vectorLength]);
  const arrowQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction),
    [direction]
  );

  const color = useMemo(
    () => getStateColor(bloch.x, bloch.y, bloch.z),
    [bloch.x, bloch.y, bloch.z]
  );

  const sphereScale = numQubits <= 1 ? 1.0 : numQubits === 2 ? 0.9 : 0.65;
  const spacing = numQubits <= 1 ? 0 : numQubits === 2 ? 2.4 : 2.0;
  const posX = (index - (numQubits - 1) / 2) * spacing;
  const headLength =
    vectorLength < 0.12 ? Math.max(vectorLength * 0.6, 0.04) : Math.min(0.18, vectorLength * 0.28);
  const shaftLength = Math.max(vectorLength - headLength, 0);

  return (
    <group position={[posX, 0, 0]} scale={[sphereScale, sphereScale, sphereScale]}>
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {bloch.label}
      </Text>

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#f3f4f6"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.SphereGeometry(1, 32, 32)]} />
        <lineBasicMaterial color="#d1d5db" transparent opacity={0.5} />
      </lineSegments>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.008, 16, 100]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <Text position={[0, 1.38, 0]} fontSize={0.18} color="#6b7280" anchorX="center">
        |0⟩
      </Text>
      <Text position={[0, -1.38, 0]} fontSize={0.18} color="#6b7280" anchorX="center">
        |1⟩
      </Text>
      <Text position={[1.35, 0, 0]} fontSize={0.18} color="#6b7280" anchorX="center">
        |+⟩
      </Text>
      <Text position={[-1.35, 0, 0]} fontSize={0.18} color="#6b7280" anchorX="center">
        |−⟩
      </Text>
      <Text position={[0, 0, 1.35]} fontSize={0.18} color="#6b7280" anchorX="center">
        |+i⟩
      </Text>
      <Text position={[0, 0, -1.35]} fontSize={0.18} color="#6b7280" anchorX="center">
        |−i⟩
      </Text>

      <group quaternion={arrowQuaternion}>
        {shaftLength > 0.01 && (
          <mesh position={[0, shaftLength * 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, shaftLength, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
        {vectorLength > 0.02 && (
          <mesh position={[0, shaftLength + headLength * 0.5, 0]}>
            <coneGeometry args={[0.055, headLength, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
      </group>

      <Text position={[0, -2, 0]} fontSize={0.16} color="#374151" anchorX="center">
        {`θ: ${(bloch.theta * 180 / Math.PI).toFixed(1)}°`}
      </Text>
      <Text position={[0, -2.25, 0]} fontSize={0.16} color="#374151" anchorX="center">
        {`φ: ${(bloch.phi * 180 / Math.PI).toFixed(1)}°`}
      </Text>
    </group>
  );
}

export function BlochSphere3D({ blochData, numQubits }: BlochSphere3DProps) {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} />

      {blochData.map((bloch, i) => (
        <SingleBlochSphere key={i} index={i} bloch={bloch} numQubits={numQubits} />
      ))}
    </group>
  );
}

interface StatevectorBarsProps {
  statevector: { re: number; im: number }[];
}

export function StatevectorBars({ statevector }: StatevectorBarsProps) {
  const probabilities = useMemo(() => {
    return statevector.map((sv) => ({
      amplitude: sv,
      probability: sv.re ** 2 + sv.im ** 2,
    }));
  }, [statevector]);

  const maxProb = useMemo(
    () => Math.max(...probabilities.map((p) => p.probability), 0.001),
    [probabilities]
  );

  const generateBasisLabel = (index: number, totalQubits: number): string => {
    const binaryStr = index.toString(2).padStart(totalQubits, '0');
    return `|${binaryStr}⟩`;
  };

  const numQubits = Math.log2(statevector.length) || 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '5px',
        padding: '8px 12px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        minHeight: '80px',
        width: '100%',
        overflowX: 'auto',
      }}
    >
      {probabilities.map((p, i) => {
        const barHeight = Math.max((p.probability / maxProb) * 60, 2);
        const hue = (p.amplitude.re >= 0 ? 200 : 0) + (p.amplitude.im * 30);
        const saturation = 70 + Math.abs(p.amplitude.im) * 30;
        const lightness = 45 + p.probability * 20;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '34px',
            }}
          >
            <div
              style={{
                height: `${barHeight}px`,
                width: '20px',
                backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.3s ease',
              }}
            />
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                color: '#9ca3af',
                marginTop: '3px',
                textAlign: 'center',
              }}
            >
              {generateBasisLabel(i, numQubits)}
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '8px',
                color: '#6b7280',
              }}
            >
              {(p.probability * 100).toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface BlochSphereProps {
  blochData: SingleBlochData[];
  statevector: { re: number; im: number }[];
  numQubits: number;
}

export function BlochSphere({ blochData, statevector, numQubits }: BlochSphereProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
      <BlochSphere3D blochData={blochData} numQubits={numQubits} />
      <StatevectorBars statevector={statevector} />
    </div>
  );
}

export default BlochSphere;
