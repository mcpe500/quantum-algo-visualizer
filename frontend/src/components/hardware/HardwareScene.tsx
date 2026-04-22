import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Cylinder, Torus } from '@react-three/drei';
import { useState } from 'react';

interface HardwareSceneProps {
  hardwareId: string;
}

function PhotonicScene() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <group>
      {/* Light beam */}
      <Cylinder
        args={[0.05, 0.05, 4, 16]}
        rotation={[0, 0, Math.PI / 4]}
        position={[-1, 0, 0]}
      >
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.6} />
      </Cylinder>

      {/* Beam splitter */}
      <Box
        args={[0.3, 0.3, 0.05]}
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 4]}
      >
        <meshPhysicalMaterial
          color="#60A5FA"
          transparent
          opacity={0.8}
          transmission={0.9}
        />
      </Box>

      {/* Output beams */}
      <Cylinder
        args={[0.03, 0.03, 2, 8]}
        rotation={[0, 0, -Math.PI / 4]}
        position={[1, 1, 0]}
      >
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.5} />
      </Cylinder>

      <Cylinder
        args={[0.03, 0.03, 2, 8]}
        rotation={[0, 0, -Math.PI / 4]}
        position={[1, -1, 0]}
      >
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.5} />
      </Cylinder>

      {/* Photons */}
      {[0, 1, 2].map((i) => (
        <Sphere
          key={i}
          args={[0.08, 16, 16]}
          position={[-1.5 + i * 1.2, 0.2 * Math.sin(i), 0]}
          onPointerOver={() => setHovered(i)}
          onPointerOut={() => setHovered(null)}
        >
          <meshStandardMaterial
            color={hovered === i ? '#FCD34D' : '#F59E0B'}
            emissive={hovered === i ? '#FCD34D' : '#000000'}
            emissiveIntensity={hovered === i ? 0.5 : 0}
          />
        </Sphere>
      ))}

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        Photon + Beam Splitter
      </Text>
    </group>
  );
}

function SuperconductingScene() {
  const [active] = useState(false);

  return (
    <group>
      {/* Josephson Junction - two superconducting islands */}
      <Box args={[1, 0.3, 0.3]} position={[-0.8, 0, 0]}>
        <meshStandardMaterial color="#3B82F6" metalness={0.8} roughness={0.2} />
      </Box>
      <Box args={[1, 0.3, 0.3]} position={[0.8, 0, 0]}>
        <meshStandardMaterial color="#3B82F6" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Junction barrier */}
      <Cylinder args={[0.05, 0.05, 0.4, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial
          color={active ? '#EF4444' : '#6B7280'}
          emissive={active ? '#EF4444' : '#000000'}
          emissiveIntensity={active ? 0.8 : 0}
        />
      </Cylinder>

      {/* Cooper pairs */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.3 + i * 0.2, 0]}>
          <Sphere args={[0.06, 12, 12]} position={[-0.1, 0, 0]}>
            <meshBasicMaterial color="#60A5FA" />
          </Sphere>
          <Sphere args={[0.06, 12, 12]} position={[0.1, 0, 0]}>
            <meshBasicMaterial color="#60A5FA" />
          </Sphere>
          <Cylinder
            args={[0.02, 0.02, 0.2, 8]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <meshBasicMaterial color="#93C5FD" transparent opacity={0.5} />
          </Cylinder>
        </group>
      ))}

      {/* Microwave pulse visualization */}
      {active && (
        <Torus args={[1.5, 0.02, 8, 50]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#EF4444" transparent opacity={0.3} />
        </Torus>
      )}

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        Josephson Junction + Cooper Pairs
      </Text>
    </group>
  );
}

function TrappedIonScene() {
  return (
    <group>
      {/* RF Trap electrodes */}
      <Cylinder args={[0.05, 0.05, 3, 8]} position={[-0.8, 0, 0]}>
        <meshStandardMaterial color="#6B7280" metalness={0.9} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 3, 8]} position={[0.8, 0, 0]}>
        <meshStandardMaterial color="#6B7280" metalness={0.9} />
      </Cylinder>

      {/* Ions */}
      {[-0.5, 0, 0.5].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <Sphere args={[0.15, 24, 24]}>
            <meshStandardMaterial
              color="#8B5CF6"
              emissive="#8B5CF6"
              emissiveIntensity={0.3}
            />
          </Sphere>
          {/* Electron orbit */}
          <Torus args={[0.25, 0.01, 8, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#A78BFA" transparent opacity={0.5} />
          </Torus>
        </group>
      ))}

      {/* Laser beams */}
      <Cylinder
        args={[0.02, 0.02, 2, 8]}
        position={[1.2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshBasicMaterial color="#EC4899" transparent opacity={0.4} />
      </Cylinder>

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        RF Trap + Laser Cooled Ions
      </Text>
    </group>
  );
}

function NeutralAtomScene() {
  return (
    <group>
      {/* Array of atoms */}
      {[-1, 0, 1].map((x) =>
        [-1, 0, 1].map((y) => (
          <group key={`${x}-${y}`} position={[x * 0.6, y * 0.6, 0]}>
            {/* Optical tweezer trap */}
            <Torus args={[0.15, 0.02, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#10B981" transparent opacity={0.3} />
            </Torus>
            {/* Atom */}
            <Sphere args={[0.08, 16, 16]}>
              <meshStandardMaterial
                color="#10B981"
                emissive="#10B981"
                emissiveIntensity={0.3}
              />
            </Sphere>
          </group>
        ))
      )}

      {/* Rydberg excitation - expanded atom */}
      <Sphere args={[0.3, 16, 16]} position={[0.6, 0.6, 0]}>
        <meshBasicMaterial
          color="#F59E0B"
          transparent
          opacity={0.3}
          wireframe
        />
      </Sphere>

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        Optical Tweezer Array + Rydberg Blockade
      </Text>
    </group>
  );
}

function SiliconSpinScene() {
  return (
    <group>
      {/* Silicon substrate */}
      <Box args={[3, 0.2, 2]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#64748B" metalness={0.3} roughness={0.7} />
      </Box>

      {/* Quantum dots */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Gate electrodes */}
          <Box args={[0.4, 0.05, 0.4]} position={[0, 0.4, 0]}>
            <meshStandardMaterial color="#F59E0B" metalness={0.9} />
          </Box>

          {/* Quantum dot */}
          <Sphere args={[0.1, 16, 16]}>
            <meshStandardMaterial
              color="#EC4899"
              emissive="#EC4899"
              emissiveIntensity={0.4}
            />
          </Sphere>

          {/* Spin arrow */}
          <Cylinder args={[0.02, 0.02, 0.3, 8]} position={[0, 0.2, 0]}>
            <meshBasicMaterial
              color={i % 2 === 0 ? '#EF4444' : '#3B82F6'}
            />
          </Cylinder>
        </group>
      ))}

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        Silicon Quantum Dots + Spin Qubits
      </Text>
    </group>
  );
}

function TopologicalScene() {
  return (
    <group>
      {/* Nanowire */}
      <Cylinder args={[0.1, 0.1, 3, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#6366F1" metalness={0.5} />
      </Cylinder>

      {/* Majorana zero modes at ends */}
      <Sphere args={[0.2, 24, 24]} position={[-1.5, 0, 0]}>
        <meshStandardMaterial
          color="#6366F1"
          emissive="#6366F1"
          emissiveIntensity={0.5}
        />
      </Sphere>
      <Sphere args={[0.2, 24, 24]} position={[1.5, 0, 0]}>
        <meshStandardMaterial
          color="#6366F1"
          emissive="#6366F1"
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Braiding path */}
      <Torus args={[0.8, 0.02, 8, 50]} position={[0, 0.5, 0]}>
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.4} />
      </Torus>

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        Majorana Zero Modes + Braiding
      </Text>
    </group>
  );
}

function NVCenterScene() {
  return (
    <group>
      {/* Diamond lattice representation */}
      <Box args={[2, 2, 2]}>
        <meshPhysicalMaterial
          color="#E0F2FE"
          transparent
          opacity={0.3}
          transmission={0.9}
        />
      </Box>

      {/* Carbon atoms */}
      {[
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [0.5, 0.5, -0.5],
      ].map((pos, i) => (
        <Sphere key={i} args={[0.1, 12, 12]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#94A3B8" />
        </Sphere>
      ))}

      {/* Nitrogen atom */}
      <Sphere args={[0.12, 16, 16]} position={[-0.2, 0, 0]}>
        <meshStandardMaterial color="#EF4444" />
      </Sphere>

      {/* Vacancy */}
      <Sphere args={[0.08, 16, 16]} position={[0.2, 0, 0]}>
        <meshBasicMaterial color="#1E293B" />
      </Sphere>

      {/* Spin */}
      <Sphere args={[0.15, 16, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#14B8A6"
          emissive="#14B8A6"
          emissiveIntensity={0.5}
        />
      </Sphere>

      <Text position={[0, -2, 0]} fontSize={0.3} color="#374151">
        Nitrogen-Vacancy Center in Diamond
      </Text>
    </group>
  );
}

const sceneMap: Record<string, React.FC> = {
  photonic: PhotonicScene,
  superconducting: SuperconductingScene,
  'trapped-ions': TrappedIonScene,
  'neutral-atoms': NeutralAtomScene,
  'silicon-spin': SiliconSpinScene,
  topological: TopologicalScene,
  'nv-centers': NVCenterScene,
};

export default function HardwareScene({ hardwareId }: HardwareSceneProps) {
  const SceneComponent = sceneMap[hardwareId] || PhotonicScene;

  return (
    <div className="w-full h-96 bg-gray-50 rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <SceneComponent />
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
}
