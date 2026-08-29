

// import React from 'react';
// import * as THREE from 'three';
// import { GOAL_WIDTH, GOAL_HEIGHT, POST_RADIUS, NET_DEPTH } from '@/constants/football';

// // 🥅 Goal Post & Detailed Net Mesh Component
// export function GoalPost({ positionZ }: { positionZ: number }) {
//   const postMat = <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} />;
  
//   // জাল বা নেটের জন্য ম্যাটেরিয়াল (Wireframe + Transparency)
//   const netMat = (
//     <meshBasicMaterial 
//       color="#ffffff" 
//       wireframe 
//       transparent 
//       opacity={0.3} 
//       side={THREE.DoubleSide} 
//     />
//   );

//   // পেছনের গোলপোস্টের নেটের ডিরেকশন সামলানোর জন্য
//   const isNearGoal = positionZ <= 0;
//   const netDirection = isNearGoal ? -1 : 1;
//   const depthOffset = (NET_DEPTH / 2) * netDirection;

//   return (
//     <group position={[0, 0, positionZ]}>
//       {/* ⚪ বাম পোস্ট */}
//       <mesh position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
//         {postMat}
//       </mesh>

//       {/* ⚪ ডান পোস্ট */}
//       <mesh position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
//         {postMat}
//       </mesh>

//       {/* ⚪ ওপরের ক্রসবার */}
//       <mesh position={[0, GOAL_HEIGHT, 0]} rotation={[0, 0, Math.PI / 2]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_WIDTH, 16]} />
//         {postMat}
//       </mesh>

//       {/* 🕸️ 3D Goal Net Panels */}
//       <group>
//         {/* ১. নেটের পেছনের অংশ (Back Wall) */}
//         <mesh position={[0, GOAL_HEIGHT / 2, netDirection * NET_DEPTH]}>
//           <planeGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, 30, 15]} />
//           {netMat}
//         </mesh>

//         {/* ২. নেটের ওপরের অংশ (Top Roof) */}
//         <mesh 
//           position={[0, GOAL_HEIGHT, depthOffset]} 
//           rotation={[Math.PI / 2, 0, 0]}
//         >
//           <planeGeometry args={[GOAL_WIDTH, NET_DEPTH, 30, 10]} />
//           {netMat}
//         </mesh>

//         {/* ৩. নেটের বাম পাশ (Left Side) */}
//         <mesh 
//           position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, depthOffset]} 
//           rotation={[0, Math.PI / 2, 0]}
//         >
//           <planeGeometry args={[NET_DEPTH, GOAL_HEIGHT, 10, 15]} />
//           {netMat}
//         </mesh>

//         {/* ৪. নেটের ডান পাশ (Right Side) */}
//         <mesh 
//           position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, depthOffset]} 
//           rotation={[0, Math.PI / 2, 0]}
//         >
//           <planeGeometry args={[NET_DEPTH, GOAL_HEIGHT, 10, 15]} />
//           {netMat}
//         </mesh>
//       </group>
//     </group>
//   );
// }

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GOAL_WIDTH, GOAL_HEIGHT, POST_RADIUS, NET_DEPTH } from '@/constants/football';
import { useNetTexture } from '@/hooks/useNetTexture';

interface GoalPostProps {
  positionZ: number;
  isGoalHit?: boolean; // বল জালে লাগলে true পাঠাবেন
}

export function GoalPost({ positionZ, isGoalHit = false }: GoalPostProps) {
  const netGroupRef = useRef<THREE.Group>(null!);
  const backNetMeshRef = useRef<THREE.Mesh>(null!);

  // Native procedural texture hook
  const netTexture = useNetTexture();

  const waveIntensity = useRef(0);
  const isNearGoal = positionZ <= 0;
  const netDirection = isNearGoal ? -1 : 1;
  const depthOffset = (NET_DEPTH / 2) * netDirection;

  // 🌀 R3F Native Ripple Animation
  useFrame((_, delta) => {
    if (isGoalHit) {
      waveIntensity.current = Math.min(waveIntensity.current + delta * 8, 1.2);
    } else {
      waveIntensity.current = THREE.MathUtils.lerp(waveIntensity.current, 0, delta * 3.5);
    }

    if (backNetMeshRef.current && waveIntensity.current > 0.01) {
      const geometry = backNetMeshRef.current.geometry as THREE.PlaneGeometry;
      const positionAttr = geometry.attributes.position;
      const time = Date.now() * 0.015;

      for (let i = 0; i < positionAttr.count; i++) {
        const x = positionAttr.getX(i);
        const y = positionAttr.getY(i);

        // বল জালে পড়ার সময়ের ওয়েভ তৈরি
        const zWave = Math.sin(x * 2.5 + time) * Math.cos(y * 2.5 + time) * 0.12 * waveIntensity.current;
        positionAttr.setZ(i, zWave * netDirection);
      }
      positionAttr.needsUpdate = true;
    }

    if (netGroupRef.current && waveIntensity.current > 0.01) {
      netGroupRef.current.position.z = Math.sin(Date.now() * 0.03) * 0.02 * waveIntensity.current;
    }
  });

  const postMat = <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.3} />;

  const netMaterial = (
    <meshStandardMaterial
      map={netTexture}
      transparent
      opacity={0.7}
      roughness={0.8}
      side={THREE.DoubleSide}
      alphaTest={0.05}
    />
  );

  return (
    <group position={[0, 0, positionZ]}>
      {/* ⚪ গোলপোস্ট কাঠামো */}
      <mesh position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
        {postMat}
      </mesh>
      <mesh position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
        {postMat}
      </mesh>
      <mesh position={[0, GOAL_HEIGHT, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_WIDTH, 16]} />
        {postMat}
      </mesh>

      {/* 🕸️ Dynamic Animated Net */}
      <group ref={netGroupRef}>
        {/* ১. পেছনের অংশ (নড়াচড়া করবে) */}
        <mesh
          ref={backNetMeshRef}
          position={[0, GOAL_HEIGHT / 2, netDirection * NET_DEPTH]}
        >
          <planeGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, 32, 16]} />
          {netMaterial}
        </mesh>

        {/* ২. ছাদ / ওপরের অংশ */}
        <mesh
          position={[0, GOAL_HEIGHT, depthOffset]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[GOAL_WIDTH, NET_DEPTH, 16, 8]} />
          {netMaterial}
        </mesh>

        {/* ৩. বাম পাশ */}
        <mesh
          position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, depthOffset]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[NET_DEPTH, GOAL_HEIGHT, 8, 16]} />
          {netMaterial}
        </mesh>

        {/* ৪. ডান পাশ */}
        <mesh
          position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, depthOffset]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[NET_DEPTH, GOAL_HEIGHT, 8, 16]} />
          {netMaterial}
        </mesh>
      </group>
    </group>
  );
}