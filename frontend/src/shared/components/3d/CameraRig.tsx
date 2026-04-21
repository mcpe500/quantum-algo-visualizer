import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export interface CameraRigProps {
  mode: 'fixed' | 'orbit';
  distance: number;
  fixedOffset?: { x: number; y: number };
  orbitOffset?: { x: number; y: number; z: number };
  lookAtY?: number;
}

export function CameraRig({
  mode,
  distance,
  fixedOffset = { x: 0, y: -0.1 },
  orbitOffset = { x: 1.8, y: 1.2, z: 1.5 },
  lookAtY = -0.1,
}: CameraRigProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (mode === 'fixed') {
      camera.position.set(fixedOffset.x, fixedOffset.y, distance);
      camera.lookAt(fixedOffset.x, lookAtY, 0);
    } else {
      camera.position.set(orbitOffset.x, orbitOffset.y, distance - orbitOffset.z);
      camera.lookAt(0, lookAtY, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, distance, mode, fixedOffset, orbitOffset, lookAtY]);

  return null;
}