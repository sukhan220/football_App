
// football-test/src/components/game/player-mesh.tsx

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// 🏃 Shooter Player Mesh Component
export function PlayerMesh({
  isRunning,
  isKicked,
  onKickHit,
}: {
  isRunning: boolean;
  isKicked: boolean;
  onKickHit: () => void;
}) {
  const playerGroup = useRef<THREE.Group>(null!);
  const leftLeg = useRef<THREE.Group>(null!);
  const rightLeg = useRef<THREE.Group>(null!);
  const leftArm = useRef<THREE.Group>(null!);
  const rightArm = useRef<THREE.Group>(null!);

  const hasHitBall = useRef(false);
  const startPos = useRef(new THREE.Vector3(-0.9, 0, 2.8)).current;
  const targetPos = useRef(new THREE.Vector3(-0.2, 0, 0.45)).current;

  useEffect(() => {
    if (!isRunning && !isKicked) {
      hasHitBall.current = false;
      if (playerGroup.current) {
        playerGroup.current.position.copy(startPos);
        playerGroup.current.rotation.set(0, 0, 0);
      }
    }
  }, [isRunning, isKicked, startPos]);

  useFrame((_, delta) => {
    if (!playerGroup.current) return;

    if (isRunning && !hasHitBall.current) {
      // 🏃 প্লেয়ার বলের দিকে দৌড়াবে
      playerGroup.current.position.lerp(targetPos, delta * 8.5);
      const runCycle = Math.sin(Date.now() * 0.02) * 0.85;

      if (leftLeg.current) leftLeg.current.rotation.x = runCycle;
      if (rightLeg.current) rightLeg.current.rotation.x = -runCycle;
      if (leftArm.current) leftArm.current.rotation.x = -runCycle * 0.8;
      if (rightArm.current) rightArm.current.rotation.x = runCycle * 0.8;

      // 🎯 বলের কাছাকাছি পৌঁছালে কিক হিট ট্র্রিগার হবে (Distance Threshold বাড়িয়ে ০.৩৫ করা হয়েছে)
      if (playerGroup.current.position.distanceTo(targetPos) < 0.35) {
        hasHitBall.current = true;
        onKickHit();
      }
    } else if (hasHitBall.current || isKicked) {
      // ⚽ কিক মারার পর ফলো-থ্রু অ্যানিমেশন
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, -0.6, delta * 12);
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0.2, delta * 12);
      if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0.3, delta * 8);
      if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, -0.3, delta * 8);
    } else {
      // 🛑 আইডেল পজিশন
      playerGroup.current.position.copy(startPos);
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, delta * 10);
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, delta * 10);
      if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, delta * 10);
      if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, delta * 10);
    }
  });

  const skinMat = <meshStandardMaterial color="#ffcc99" roughness={0.4} />;
  const jerseyMat = <meshStandardMaterial color="#00e5ff" roughness={0.3} />;
  const shortsMat = <meshStandardMaterial color="#111111" roughness={0.5} />;
  const socksMat = <meshStandardMaterial color="#ffffff" roughness={0.4} />; 
  const bootMat = <meshStandardMaterial color="#ff3300" roughness={0.2} />; 

  return (
    <group ref={playerGroup} position={[-0.9, 0, 2.8]}>
      {/* 👕 Torso / Jersey */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.26, 0.2, 0.7, 16]} />
        {jerseyMat}
      </mesh>

      {/* 👤 Head */}
      <mesh position={[0, 1.52, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        {skinMat}
      </mesh>

      {/* 🩳 Shorts */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.25, 16]} />
        {shortsMat}
      </mesh>

      {/* 🦾 Left Arm */}
      <group ref={leftArm} position={[-0.32, 1.3, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
          {jerseyMat}
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          {skinMat}
        </mesh>
      </group>

      {/* 🦾 Right Arm */}
      <group ref={rightArm} position={[0.32, 1.3, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
          {jerseyMat}
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          {skinMat}
        </mesh>
      </group>

      {/* 🦿 Left Leg & Boot */}
      <group ref={leftLeg} position={[-0.12, 0.5, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.065, 0.3, 12]} />
          {skinMat}
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.065, 0.06, 0.25, 12]} />
          {socksMat}
        </mesh>
        <group position={[0, -0.48, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[0.09, 0.09, 0.2]} />
            {bootMat}
          </mesh>
          <mesh position={[0, -0.01, -0.14]}>
            <sphereGeometry args={[0.048, 12, 12]} />
            {bootMat}
          </mesh>
        </group>
      </group>

      {/* 🦿 Right Leg & Boot */}
      <group ref={rightLeg} position={[0.12, 0.5, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.065, 0.3, 12]} />
          {skinMat}
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.065, 0.06, 0.25, 12]} />
          {socksMat}
        </mesh>
        <group position={[0, -0.48, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[0.09, 0.09, 0.2]} />
            {bootMat}
          </mesh>
          <mesh position={[0, -0.01, -0.14]}>
            <sphereGeometry args={[0.048, 12, 12]} />
            {bootMat}
          </mesh>
        </group>
      </group>
    </group>
  );
}