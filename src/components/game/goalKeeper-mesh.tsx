

// football-test/src/components/game/goalKeeper-mesh.tsx

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GOAL_Z } from '@/constants/football';

// 🧤 Goalkeeper Mesh Component
export function GoalkeeperMesh({ keeperRef, goalkeeperEngine }: { keeperRef: any; goalkeeperEngine: any }) {
  const keeperGroup = useRef<THREE.Group>(null!);
  const leftArmGroup = useRef<THREE.Group>(null!);
  const rightArmGroup = useRef<THREE.Group>(null!);

  const skinMat = <meshStandardMaterial color="#ffcc99" roughness={0.4} />;
  const shirtMat = <meshStandardMaterial color="#d41c9d" roughness={0.3} />;
  const shortsMat = <meshStandardMaterial color="#222222" roughness={0.5} />;
  const gloveMat = <meshStandardMaterial color="#1eadba" roughness={0.2} />;

  useFrame((_, delta) => {
    if (!keeperGroup.current || !goalkeeperEngine) return;

    const goalkeeper = goalkeeperEngine;
    const shotFinished = keeperRef.current?.shotFinished;
    const isGoal = keeperRef.current?.isGoal;
    const isKicked = keeperRef.current?.isKicked;

    // 🎯 ১. লাফের উচ্চতা ও পজিশন গণনা
    const rawY = goalkeeper.isDiving ? goalkeeper.position.y : 0;
    const targetKeeperY = Math.min(0.6, Math.max(0.1, rawY)); 

    if (goalkeeper.isDiving && !shotFinished) {
      // 🧤 ২. ডাইভিং অ্যানিমেশন (চলমান অবস্থায়)
      const dir = goalkeeper.diveDirection; // 'left' | 'right' | 'center'

      if (dir === 'center') {
        // 🛑 সোজা বলের ক্ষেত্রে
        keeperGroup.current.position.set(goalkeeper.position.x, targetKeeperY, goalkeeper.position.z);
        keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 8.0);

        if (leftArmGroup.current) {
          leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 0.4, delta * 10.0);
          leftArmGroup.current.rotation.x = THREE.MathUtils.lerp(leftArmGroup.current.rotation.x, -1.2, delta * 10.0);
        }
        if (rightArmGroup.current) {
          rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -0.4, delta * 10.0);
          rightArmGroup.current.rotation.x = THREE.MathUtils.lerp(rightArmGroup.current.rotation.x, -1.2, delta * 10.0);
        }
      } else {
        // 👈👉 ডানে/বামে ডাইভ দেওয়ার ক্ষেত্রে
        const isRight = dir === 'right';

        const tiltAngle = isRight ? -1.35 : 1.35;
        keeperGroup.current.position.set(goalkeeper.position.x, targetKeeperY, goalkeeper.position.z);
        keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, tiltAngle, delta * 8.0);

        const armAngleLeft = isRight ? 0.2 : 3.4;
        const armAngleRight = isRight ? -3.4 : -0.2;

        if (leftArmGroup.current) {
          leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, armAngleLeft, delta * 10.0);
          leftArmGroup.current.rotation.x = THREE.MathUtils.lerp(leftArmGroup.current.rotation.x, 0, delta * 8.0);
        }

        if (rightArmGroup.current) {
          rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, armAngleRight, delta * 10.0);
          rightArmGroup.current.rotation.x = THREE.MathUtils.lerp(rightArmGroup.current.rotation.x, 0, delta * 8.0);
        }
      }

    } else if (shotFinished && !isGoal) {
      // 🎉 ৩. সেভ হলে বা শট মিস হলে সেলিব্রেশন
      keeperGroup.current.position.x = THREE.MathUtils.lerp(keeperGroup.current.position.x, goalkeeper.position.x, delta * 5.0);
      keeperGroup.current.position.z = THREE.MathUtils.lerp(keeperGroup.current.position.z, goalkeeper.position.z, delta * 5.0);
      keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 6.0);

      const celebrateJump = Math.abs(Math.sin(Date.now() * 0.012)) * 0.15;
      keeperGroup.current.position.y = THREE.MathUtils.lerp(keeperGroup.current.position.y, celebrateJump, delta * 6.0);

      if (leftArmGroup.current) {
        leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 2.5, delta * 6.0);
        leftArmGroup.current.rotation.x = THREE.MathUtils.lerp(leftArmGroup.current.rotation.x, 0, delta * 6.0);
      }
      if (rightArmGroup.current) {
        rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -2.5, delta * 6.0);
        rightArmGroup.current.rotation.x = THREE.MathUtils.lerp(rightArmGroup.current.rotation.x, 0, delta * 6.0);
      }

    } else if ((shotFinished && isGoal) || goalkeeper.state === 'lying_down') {
      // 🛌 ৪. গোল হলে শুয়ে পড়া
      const isRight = goalkeeper.diveDirection === 'right';
      const lieAngle = isRight ? -1.57 : 1.57;

      keeperGroup.current.position.set(goalkeeper.position.x, 0.25, goalkeeper.position.z);
      keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, lieAngle, delta * 8.0);

      if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 0, delta * 6.0);
      if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, 0, delta * 6.0);

    } else {
      // 🧍 ৫. শটের আগের আইডল অবস্থা
      keeperGroup.current.position.set(goalkeeper.position.x, 0, goalkeeper.position.z);
      keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 6.0);

      if (!isKicked) {
        const vibrateY = Math.sin(Date.now() * 0.025) * 0.02;
        const vibrateX = Math.cos(Date.now() * 0.03) * 0.01;

        keeperGroup.current.position.y = vibrateY;
        keeperGroup.current.position.x = goalkeeper.position.x + vibrateX;

        if (leftArmGroup.current) {
          leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, -1.2, delta * 8.0);
          leftArmGroup.current.rotation.x = THREE.MathUtils.lerp(leftArmGroup.current.rotation.x, 0, delta * 8.0);
        }
        if (rightArmGroup.current) {
          rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, 1.2, delta * 8.0);
          rightArmGroup.current.rotation.x = THREE.MathUtils.lerp(rightArmGroup.current.rotation.x, 0, delta * 8.0);
        }
      } else {
        if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 0.2, delta * 6.0);
        if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -0.2, delta * 6.0);
      }
    }
  });

  return (
    <group ref={keeperGroup} position={[0, 0, GOAL_Z + 0.2]}>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.28, 0.22, 0.7, 16]} />
        {shirtMat}
      </mesh>
      <mesh position={[0, 1.52, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.23, 0.24, 0.25, 16]} />
        {shortsMat}
      </mesh>
      <mesh position={[-0.14, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.6, 12]} />
        {skinMat}
      </mesh>
      <mesh position={[0.14, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.6, 12]} />
        {skinMat}
      </mesh>
      <group ref={leftArmGroup} position={[-0.32, 1.3, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
          {shirtMat}
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          {gloveMat}
        </mesh>
      </group>
      <group ref={rightArmGroup} position={[0.32, 1.3, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
          {shirtMat}
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          {gloveMat}
        </mesh>
      </group>
    </group>
  );
}