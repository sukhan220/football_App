import React from 'react';
import * as THREE from 'three';
import { FieldLineRect, FieldBoxLines } from '@/utils/fieldHelpers';

// 🏟️ Full Realistic 3D Pitch with Accurate D-Box & Midfield
export function FootballPitch() {
  const pitchWidth = 36;
  const pitchLength = 84;
  const startZ = -10; // Near Goal Line
  const endZ = startZ + pitchLength; // Far Goal Line (74)
  const midZ = (startZ + endZ) / 2; // Midfield Line (32)

  return (
    <group position={[0, 0, 0]}>
      {/* 🌿 Main Grass Field Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, midZ]}>
        <planeGeometry args={[pitchWidth + 10, pitchLength + 20]} />
        <meshStandardMaterial color="#1b5e20" roughness={0.9} />
      </mesh>

      {/* Grass Mowed Stripes */}
      {Array.from({ length: 16 }).map((_, i) => {
        const stripeLength = pitchLength / 16;
        const stripeZ = startZ + i * stripeLength + stripeLength / 2;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, stripeZ]}>
            <planeGeometry args={[pitchWidth + 2, stripeLength]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#2e7d32" : "#216a30"} roughness={0.85} />
          </mesh>
        );
      })}

      {/* ⚪ Outer Boundary Lines */}
      <FieldBoxLines minX={-pitchWidth / 2} maxX={pitchWidth / 2} minZ={startZ} maxZ={endZ} lineWidth={0.15} />

      {/* ⚽ Halfway / Midfield Line & Center Circle */}
      <FieldLineRect x={0} z={midZ} width={pitchWidth} length={0.15} />
      <mesh position={[0, 0.012, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.8, 5.95, 64]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.013, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* 🔲 Near Goal D-Box (18-Yard Box) */}
      <FieldBoxLines minX={-10.5} maxX={10.5} minZ={startZ} maxZ={startZ + 14.5} lineWidth={0.12} />

      {/* 🔲 Near 6-Yard Box */}
      <FieldBoxLines minX={-5.0} maxX={5.0} minZ={startZ} maxZ={startZ + 5.5} lineWidth={0.12} />

      {/* 🎯 Near Penalty Spot (Z = 0) */}
      <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* 🔲 Far Goal D-Box (Opposite Side) */}
      <FieldBoxLines minX={-10.5} maxX={10.5} minZ={endZ - 14.5} maxZ={endZ} lineWidth={0.12} />
      <FieldBoxLines minX={-5.0} maxX={5.0} minZ={endZ - 5.5} maxZ={endZ} lineWidth={0.12} />
      <mesh position={[0, 0.012, endZ - 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.4, 4.52, 32, 1, -Math.PI * 0.72, Math.PI * 0.44]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* 🚩 Corner Flags */}
      {[
        [-pitchWidth / 2, startZ],
        [pitchWidth / 2, startZ],
        [-pitchWidth / 2, endZ],
        [pitchWidth / 2, endZ],
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.5, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.2, 1.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.2, 0.4, 3]} />
            <meshStandardMaterial color="#ff1744" />
          </mesh>
        </group>
      ))}
    </group>
  );
}