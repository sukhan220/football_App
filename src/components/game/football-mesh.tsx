import React from 'react';
import { useFootballTexture } from '@/hooks/useFootballTexture';

// ⚽ Stylized Football Mesh with Flat Shading & Procedural Texture
export function FootballMesh({ ballMeshRef, radius }: { ballMeshRef: any; radius: number }) {
  const ballTexture = useFootballTexture();
  return (
    <group ref={ballMeshRef} position={[0, 0.2, 0]}>
      <mesh>
        <icosahedronGeometry args={[radius, 2]} />
        <meshStandardMaterial map={ballTexture} roughness={0.3} metalness={0.1} flatShading />
      </mesh>
    </group>
  );
}