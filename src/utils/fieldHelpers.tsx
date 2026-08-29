import React from 'react';
import * as THREE from 'three';
import { ThreeElement } from '@react-three/fiber/native'; // 👈 R3F টাইপ সাপোর্ট

// 📐 Type Definitions
interface FieldLineRectProps {
  x: number;
  z: number;
  width: number;
  length: number;
}

interface FieldBoxLinesProps {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  lineWidth?: number;
}

// 📐 Field Line Components for Clean Rendering
export function FieldLineRect({ x, z, width, length }: FieldLineRectProps) {
  return (
    <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, length]} />
      {/* THREE.DoubleSide ব্যবহার করে ম্যাটেরিয়ালটির দুই পাশেই রেন্ডার নিশ্চিত করা হচ্ছে */}
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
    </mesh>
  );
}

export function FieldBoxLines({ minX, maxX, minZ, maxZ, lineWidth = 0.12 }: FieldBoxLinesProps) {
  const width = maxX - minX;
  const length = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <group>
      <FieldLineRect x={centerX} z={maxZ} width={width + lineWidth} length={lineWidth} />
      <FieldLineRect x={centerX} z={minZ} width={width + lineWidth} length={lineWidth} />
      <FieldLineRect x={minX} z={centerZ} width={lineWidth} length={length} />
      <FieldLineRect x={maxX} z={centerZ} width={lineWidth} length={length} />
    </group>
  );
}