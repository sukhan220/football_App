
// import React, { useRef, useState, useEffect } from 'react';
// import { View, Image, Text, StyleSheet, PanResponder, Dimensions, TouchableOpacity, Animated } from 'react-native';
// import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
// import * as THREE from 'three';
// import { Ball, Goalkeeper, MatchManager, GameMode, CameraManager, CameraMode, CameraState } from '@football/engine';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const GOAL_WIDTH = 7.32;
// const GOAL_HEIGHT = 2.44;
// const GOAL_Z = -10;
// const POST_RADIUS = 0.08;
// const NET_DEPTH = 1.5;

// // ⚽ Stylized Football Mesh
// function FootballMesh({ ballMeshRef, radius }: { ballMeshRef: any; radius: number }) {
//   return (
//     <group ref={ballMeshRef} position={[0, 0.2, 0]}>
//       <mesh>
//         <sphereGeometry args={[radius, 32, 32]} />
//         <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
//       </mesh>
//     </group>
//   );
// }

// // 🏟️ Field Component matching Image layout (6-Yard Goal Box Layout)
// function FootballPitch() {
//   return (
//     <group position={[0, 0, -5]}>
//       {/* Green Grass Field */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
//         <planeGeometry args={[30, 40]} />
//         <meshStandardMaterial color="#2e8b57" roughness={0.8} />
//       </mesh>

//       {/* ⚪ Goal Line (Goal Area Main Line) */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]}>
//         <planeGeometry args={[26, 0.12]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>

//       {/* 🔲 Rectangular D-Box */}
//       {/* Front Line */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
//         <planeGeometry args={[14, 0.12]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>
//       {/* Left Line */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0.01, -2.5]}>
//         <planeGeometry args={[0.12, 5]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>
//       {/* Right Line */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0.01, -2.5]}>
//         <planeGeometry args={[0.12, 5]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>

//       {/* ⚪ Penalty Spot */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 5]}>
//         <circleGeometry args={[0.15, 32]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>
//     </group>
//   );
// }

// function DigitalAdBanner() {
//   const BANNER_WIDTH = 3.66;
//   const BANNER_HEIGHT = 1.2;

//   return (
//     <group position={[0, BANNER_HEIGHT / 2, GOAL_Z - 2.8]}>
//       <mesh position={[0, 0, 0]}>
//         <boxGeometry args={[BANNER_WIDTH + 0.15, BANNER_HEIGHT + 0.15, 0.08]} />
//         <meshStandardMaterial color="#0c1017" roughness={0.3} metalness={0.8} />
//       </mesh>

//       <mesh position={[0, 0, 0.041]}>
//         <planeGeometry args={[BANNER_WIDTH + 0.05, BANNER_HEIGHT + 0.05]} />
//         <meshBasicMaterial color="#00e5ff" />
//       </mesh>
//     </group>
//   );
// }

// // 🥅 Goal Post Mesh
// function GoalPost() {
//   const postMat = <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} />;

//   return (
//     <group position={[0, 0, GOAL_Z]}>
//       {/* Left Post */}
//       <mesh position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
//         {postMat}
//       </mesh>

//       {/* Right Post */}
//       <mesh position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
//         {postMat}
//       </mesh>

//       {/* Crossbar */}
//       <mesh position={[0, GOAL_HEIGHT, 0]} rotation={[0, 0, Math.PI / 2]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_WIDTH, 16]} />
//         {postMat}
//       </mesh>

//       {/* Net Mesh */}
//       <mesh position={[0, GOAL_HEIGHT / 2, -NET_DEPTH / 2]}>
//         <boxGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, NET_DEPTH]} />
//         <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.35} />
//       </mesh>
//     </group>
//   );
// }

// // 🏃 Shooter Player Mesh Component (Fixed Reset Logic)
// function PlayerMesh({ isRunning, isKicked, onKickHit }: { isRunning: boolean; isKicked: boolean; onKickHit: () => void }) {
//   const playerGroup = useRef<THREE.Group>(null!);
//   const leftLeg = useRef<THREE.Group>(null!);
//   const rightLeg = useRef<THREE.Group>(null!);
//   const leftArm = useRef<THREE.Group>(null!);
//   const rightArm = useRef<THREE.Group>(null!);
  
//   const hasHitBall = useRef(false);

//   const startPos = new THREE.Vector3(-0.9, 0, 2.8);
//   const targetPos = new THREE.Vector3(-0.2, 0, 0.45);

//   // রিসেট স্টেট হ্যান্ডেল করা
//   useEffect(() => {
//     if (!isRunning && !isKicked) {
//       hasHitBall.current = false;
//       if (playerGroup.current) {
//         playerGroup.current.position.copy(startPos);
//         playerGroup.current.rotation.set(0, 0, 0);
//       }
//     }
//   }, [isRunning, isKicked]);

//   useFrame((_, delta) => {
//     if (!playerGroup.current) return;

//     // ১. দৌড়ে এসে শট নেওয়া
//     if (isRunning && !hasHitBall.current) {
//       playerGroup.current.position.lerp(targetPos, delta * 7.5);

//       const runCycle = Math.sin(Date.now() * 0.02) * 0.85;
      
//       if (leftLeg.current) leftLeg.current.rotation.x = runCycle;
//       if (rightLeg.current) rightLeg.current.rotation.x = -runCycle;
//       if (leftArm.current) leftArm.current.rotation.x = -runCycle * 0.8;
//       if (rightArm.current) rightArm.current.rotation.x = runCycle * 0.8;

//       if (playerGroup.current.position.distanceTo(targetPos) < 0.28) {
//         hasHitBall.current = true;
//         onKickHit();
//       }
//     } 
//     // ২. শট দেওয়ার পর ফলো-থ্রু ও দাঁড়ানো
//     else if (hasHitBall.current || isKicked) {
//       if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, -0.4, delta * 10);
//       if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0.1, delta * 10);
//       if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0.3, delta * 8);
//       if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, -0.3, delta * 8);
//     } 
//     // ৩. স্বাভাবিক রিসেট পজিশন
//     else {
//       playerGroup.current.position.copy(startPos);
//       if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, delta * 10);
//       if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, delta * 10);
//       if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, delta * 10);
//       if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, delta * 10);
//     }
//   });

//   const skinMat = <meshStandardMaterial color="#ffcc99" roughness={0.4} />;
//   const jerseyMat = <meshStandardMaterial color="#00e5ff" roughness={0.3} />;
//   const shortsMat = <meshStandardMaterial color="#111111" roughness={0.5} />;

//   return (
//     <group ref={playerGroup} position={[-0.9, 0, 2.8]}>
//       {/* Torso / Body */}
//       <mesh position={[0, 1.05, 0]}>
//         <cylinderGeometry args={[0.26, 0.2, 0.7, 16]} />
//         {jerseyMat}
//       </mesh>

//       {/* Head */}
//       <mesh position={[0, 1.52, 0]}>
//         <sphereGeometry args={[0.18, 16, 16]} />
//         {skinMat}
//       </mesh>

//       {/* Shorts */}
//       <mesh position={[0, 0.62, 0]}>
//         <cylinderGeometry args={[0.22, 0.22, 0.25, 16]} />
//         {shortsMat}
//       </mesh>

//       {/* 🦾 Left Arm */}
//       <group ref={leftArm} position={[-0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {jerseyMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.07, 12, 12]} />
//           {skinMat}
//         </mesh>
//       </group>

//       {/* 🦾 Right Arm */}
//       <group ref={rightArm} position={[0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {jerseyMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.07, 12, 12]} />
//           {skinMat}
//         </mesh>
//       </group>

//       {/* 🦵 Left Leg */}
//       <group ref={leftLeg} position={[-0.12, 0.5, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.07, 0.06, 0.55, 12]} />
//           {skinMat}
//         </mesh>
//       </group>

//       {/* 🦵 Right Leg */}
//       <group ref={rightLeg} position={[0.12, 0.5, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.07, 0.06, 0.55, 12]} />
//           {skinMat}
//         </mesh>
//       </group>
//     </group>
//   );
// }

// // 🧤 Goalkeeper Mesh Component
// function GoalkeeperMesh({ keeperRef, goalkeeperEngine }: { keeperRef: any; goalkeeperEngine: any }) {
//   const keeperGroup = useRef<THREE.Group>(null!);
//   const leftArmGroup = useRef<THREE.Group>(null!);
//   const rightArmGroup = useRef<THREE.Group>(null!);

//   const skinMat = <meshStandardMaterial color="#ffcc99" roughness={0.4} />;
//   const shirtMat = <meshStandardMaterial color="#d41c9d" roughness={0.3} />;
//   const shortsMat = <meshStandardMaterial color="#222222" roughness={0.5} />;
//   const gloveMat = <meshStandardMaterial color="#1eadba" roughness={0.2} />;

//   useFrame((_, delta) => {
//     if (!keeperGroup.current || !goalkeeperEngine) return;

//     const goalkeeper = goalkeeperEngine;
//     const shotFinished = keeperRef.current.shotFinished;
//     const isGoal = keeperRef.current.isGoal;

//     const targetKeeperY = goalkeeper.isDiving ? Math.max(0, goalkeeper.position.y) : 0;
//     keeperGroup.current.position.set(goalkeeper.position.x, targetKeeperY, goalkeeper.position.z);

//     if (goalkeeper.isDiving && !shotFinished) {
//       const tiltAngle = goalkeeper.diveDirection === 'right' ? -0.85 : 0.85;
//       const armAngleLeft = goalkeeper.diveDirection === 'right' ? -2.2 : 1.8;
//       const armAngleRight = goalkeeper.diveDirection === 'right' ? -1.8 : 2.2;

//       keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, tiltAngle, delta * 8.0);
//       if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, armAngleLeft, delta * 8.0);
//       if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, armAngleRight, delta * 8.0);
//     } else if (shotFinished && !isGoal) {
//       keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 6.0);
//       const jumpY = Math.sin(Date.now() * 0.012) * 0.3;
//       keeperGroup.current.position.y = Math.max(0, jumpY);

//       if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 2.8, delta * 8.0);
//       if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -2.8, delta * 8.0);
//     } else {
//       keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 6.0);
//       if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 0.2, delta * 6.0);
//       if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -0.2, delta * 6.0);
//     }
//   });

//   return (
//     <group ref={keeperGroup} position={[0, 0, GOAL_Z + 0.2]}>
//       <mesh position={[0, 1.05, 0]}>
//         <cylinderGeometry args={[0.28, 0.22, 0.7, 16]} />
//         {shirtMat}
//       </mesh>
//       <mesh position={[0, 1.52, 0]}>
//         <sphereGeometry args={[0.18, 16, 16]} />
//         {skinMat}
//       </mesh>
//       <mesh position={[0, 0.62, 0]}>
//         <cylinderGeometry args={[0.23, 0.24, 0.25, 16]} />
//         {shortsMat}
//       </mesh>
//       <mesh position={[-0.14, 0.3, 0]}>
//         <cylinderGeometry args={[0.08, 0.07, 0.6, 12]} />
//         {skinMat}
//       </mesh>
//       <mesh position={[0.14, 0.3, 0]}>
//         <cylinderGeometry args={[0.08, 0.07, 0.6, 12]} />
//         {skinMat}
//       </mesh>
//       <group ref={leftArmGroup} position={[-0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {shirtMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.1, 12, 12]} />
//           {gloveMat}
//         </mesh>
//       </group>
//       <group ref={rightArmGroup} position={[0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {shirtMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.1, 12, 12]} />
//           {gloveMat}
//         </mesh>
//       </group>
//     </group>
//   );
// }

// // ⚽ Main Game Scene
// function GameScene({ setDebugInfo, matchControlRef, gameMode, activeCameraMode }: any) {
//   const { camera } = useThree();
//   const ballMeshRef = useRef<THREE.Mesh>(null!);

//   const ballEngineRef = useRef(new Ball({ x: 0, y: 0.2, z: 0 }, 0.2));
//   const keeperEngineRef = useRef(new Goalkeeper());
//   const matchManagerRef = useRef(new MatchManager(gameMode, 5));

//   const pendingFlickData = useRef<any>(null);
//   const [isApproaching, setIsApproaching] = useState(false);

//   const stateRef = useRef<{
//     isKicked: boolean;
//     isSaved: boolean;
//     isGoal: boolean;
//     shotFinished: boolean;
//     autoResetTimer: ReturnType<typeof setTimeout> | null;
//   }>({
//     isKicked: false,
//     isSaved: false,
//     isGoal: false,
//     shotFinished: false,
//     autoResetTimer: null,
//   });

//   const goalkeeperEngine = keeperEngineRef.current;
//   const ball = ballEngineRef.current;
//   const matchManager = matchManagerRef.current;

//   // 🎥 ক্যামেরা মোডের নাম পরিবর্তিত হলে CameraManager দিয়ে পজিশন ও টার্গেট আপডেট হবে
//   useEffect(() => {
//     const cameraManager = new CameraManager(activeCameraMode);
//     const state = cameraManager.update(1.0);

//     camera.position.set(state.position.x, state.position.y, state.position.z);
//     camera.lookAt(state.target.x, state.target.y, state.target.z);

//     if ('fov' in camera) {
//       (camera as THREE.PerspectiveCamera).fov = state.fov;
//       (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
//     }
//   }, [activeCameraMode, camera]);

//   useEffect(() => {
//     matchManager.setGameMode(gameMode, 5);
//   }, [gameMode]);

//   const sceneObjects = {
//     posts: [
//       { start: { x: -GOAL_WIDTH / 2, y: 0, z: GOAL_Z }, end: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//       { start: { x: GOAL_WIDTH / 2, y: 0, z: GOAL_Z }, end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//       { start: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//     ],
//     net: { minX: -GOAL_WIDTH / 2, maxX: GOAL_WIDTH / 2, minY: 0, maxY: GOAL_HEIGHT, minZ: GOAL_Z - NET_DEPTH, maxZ: GOAL_Z - 0.05 },
//   };

//   const resetNextTurn = () => {
//     if (stateRef.current.autoResetTimer) {
//       clearTimeout(stateRef.current.autoResetTimer);
//       stateRef.current.autoResetTimer = null;
//     }

//     ball.reset();
//     goalkeeperEngine.reset();
//     goalkeeperEngine.position.z = GOAL_Z + 0.2;

//     stateRef.current.isKicked = false;
//     stateRef.current.isSaved = false;
//     stateRef.current.isGoal = false;
//     stateRef.current.shotFinished = false;

//     // 🔄 প্লেয়ার ও স্টেট পুরোপুরি রিসেট
//     setIsApproaching(false);
//     pendingFlickData.current = null;

//     if (ballMeshRef.current) {
//       ballMeshRef.current.position.set(ball.position.x, ball.position.y, ball.position.z);
//       ballMeshRef.current.rotation.set(0, 0, 0);
//     }
//   };

//   const handleKickHit = () => {
//     if (!pendingFlickData.current) return;

//     ball.kickFromSwipe(pendingFlickData.current);

//     goalkeeperEngine.predictShot({
//       ballPos: ball.position,
//       ballVel: ball.velocity,
//       ballSpin: ball.spin,
//     });

//     stateRef.current.isKicked = true;
//   };

//   useEffect(() => {
//     matchControlRef.current = {
//       kick: (flickData: any) => {
//         if (stateRef.current.autoResetTimer) {
//           clearTimeout(stateRef.current.autoResetTimer);
//           stateRef.current.autoResetTimer = null;
//         }

//         pendingFlickData.current = flickData;
//         setIsApproaching(true);
//       },
//       reset: resetNextTurn,
//       restartMatch: () => {
//         matchManager.reset(gameMode, 5);
//         resetNextTurn();
//       },
//       isKicked: () => stateRef.current.isKicked || isApproaching,
//     };
//   }, [gameMode, isApproaching]);

//   useFrame((_, delta) => {
//     const dt = Math.min(delta, 0.05);

//     if (stateRef.current.isKicked) {
//       ball.update(dt, sceneObjects);
//       goalkeeperEngine.updateAI(ball.position, ball.velocity, dt);

//       if (!stateRef.current.isSaved && goalkeeperEngine.checkSave(ball.position, ball.radius)) {
//         stateRef.current.isSaved = true;
//         ball.velocity.x = (ball.position.x - goalkeeperEngine.position.x) * 3.5;
//         ball.velocity.z = Math.abs(ball.velocity.z) * 0.5;
//         ball.velocity.y = Math.abs(ball.velocity.y) * 0.3 + 2.0;
//       }

//       const isBallPassedGoal = ball.position.z <= GOAL_Z - (NET_DEPTH - 0.2);
//       const isBallHitGroundAfterSaved = stateRef.current.isSaved && ball.position.y < 0.25;
//       const isBallStopped = Math.abs(ball.velocity.z) < 0.05 && Math.abs(ball.velocity.x) < 0.05;

//       if ((isBallPassedGoal || isBallHitGroundAfterSaved || isBallStopped) && !stateRef.current.shotFinished) {
//         stateRef.current.shotFinished = true;

//         const result = matchManager.evaluateShot(ball.position, stateRef.current.isSaved);
//         stateRef.current.isGoal = result.isGoal;

//         if (!stateRef.current.autoResetTimer && !matchManager.isGameOver) {
//           stateRef.current.autoResetTimer = setTimeout(() => {
//             resetNextTurn();
//           }, 3000);
//         }
//       }

//       if (ballMeshRef.current) {
//         ballMeshRef.current.position.set(ball.position.x, ball.position.y, ball.position.z);
//         ballMeshRef.current.rotation.y += (ball.spin.y || 0) * dt;
//         ballMeshRef.current.rotation.x += ((ball.spin.x || 0) + ball.velocity.z) * dt * 0.1;
//       }
//     }

//     setDebugInfo((prev: any) => ({
//       ...prev,
//       posX: ball.position.x.toFixed(2),
//       posY: ball.position.y.toFixed(2),
//       posZ: ball.position.z.toFixed(2),
//       isKicked: stateRef.current.isKicked,
//       currentShooter: matchManager.currentShooter,
//       currentKeeper: matchManager.currentKeeper,
//       currentRound: matchManager.currentRound,
//       p1Shots: matchManager.p1History || [],
//       p2Shots: matchManager.p2History || [],
//       isGameOver: matchManager.isGameOver,
//       winner: matchManager.winner,
//       isSuddenDeath: matchManager.isSuddenDeath,
//     }));
//   });

//   return (
//     <>
//       <ambientLight intensity={0.7} />
//       <directionalLight position={[5, 12, 8]} intensity={1.5} />

//       <FootballPitch />
//       {/* <DigitalAdBanner /> */}
//       <GoalPost />
//       <GoalkeeperMesh keeperRef={stateRef} goalkeeperEngine={goalkeeperEngine} />
//       <PlayerMesh isRunning={isApproaching} isKicked={stateRef.current.isKicked} onKickHit={handleKickHit} />
//       <FootballMesh ballMeshRef={ballMeshRef} radius={ball.radius} />
//     </>
//   );
// }

// // 📱 Main App Component
// export default function App() {
//   const [gameMode, setGameMode] = useState<GameMode>('VS_AI');
  
//   // 🎥 ক্যামেরা টেস্ট করার জন্য স্টেট (যে নামটি এখানে থাকবে ক্যামেরা সরাসরি সেই পজিশনে চলে যাবে)
//   const [cameraMode, setCameraMode] = useState<CameraMode>('SHOOTER');

//   const [showGameOverModal, setShowGameOverModal] = useState(false);
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   const [debugInfo, setDebugInfo] = useState<any>({
//     posX: '0.00',
//     posY: '0.00',
//     posZ: '0.00',
//     isKicked: false,
//     currentShooter: 'PLAYER_1',
//     currentKeeper: 'AI',
//     currentRound: 1,
//     p1Shots: [],
//     p2Shots: [],
//     isGameOver: false,
//     winner: null,
//     isSuddenDeath: false,
//   });

//   const matchControlRef = useRef<any>(null);
//   const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

//   useEffect(() => {
//     if (debugInfo.isGameOver) {
//       const timer = setTimeout(() => {
//         setShowGameOverModal(true);
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }).start();
//       }, 2500);

//       return () => clearTimeout(timer);
//     } else {
//       setShowGameOverModal(false);
//       fadeAnim.setValue(0);
//     }
//   }, [debugInfo.isGameOver]);

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderGrant: (evt) => {
//         if (debugInfo.isGameOver) return;

//         if (matchControlRef.current?.isKicked()) {
//           matchControlRef.current?.reset();
//           return;
//         }

//         touchStartPos.current = {
//           x: evt.nativeEvent.pageX,
//           y: evt.nativeEvent.pageY,
//           time: Date.now(),
//         };
//       },
//       onPanResponderRelease: (evt) => {
//         if (!matchControlRef.current || matchControlRef.current.isKicked() || debugInfo.isGameOver) return;

//         const duration = Math.max((Date.now() - touchStartPos.current.time) / 1000, 0.05);
//         const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
//         const deltaY = touchStartPos.current.y - evt.nativeEvent.pageY;

//         if (deltaY < 10 && Math.abs(deltaX) < 10) return;

//         const flickSpeed = deltaY / duration;
//         const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

//         matchControlRef.current.kick({
//           deltaX,
//           deltaY,
//           duration,
//           deltaTopspin,
//         });
//       },
//     })
//   ).current;

//   const renderShotDots = (shotsList: any[]) => {
//     const dots = [];
//     for (let i = 0; i < 5; i++) {
//       const shot = shotsList ? shotsList[i] : undefined;
//       if (shot === 'GOAL' || shot === true) {
//         dots.push(<View key={i} style={[styles.dot, styles.greenDot]}><Text style={styles.dotIcon}>✓</Text></View>);
//       } else if (shot === 'MISS' || shot === 'SAVED' || shot === 'POST_HIT' || shot === false) {
//         dots.push(<View key={i} style={[styles.dot, styles.redDot]}><Text style={styles.dotIcon}>✕</Text></View>);
//       } else {
//         dots.push(<View key={i} style={[styles.dot, styles.emptyDot]} />);
//       }
//     }
//     return dots;
//   };

//   return (
//     <View style={styles.container} {...panResponder.panHandlers}>
//       {/* 🎨 Canvas */}
//       <View style={styles.glView} pointerEvents="none">
//         <Canvas camera={{ fov: 55, near: 0.1, far: 1000 }}>
//           <GameScene 
//             setDebugInfo={setDebugInfo} 
//             matchControlRef={matchControlRef} 
//             gameMode={gameMode} 
//             activeCameraMode={cameraMode} 
//           />
//         </Canvas>
//       </View>

//       <View style={styles.bannerOverlayTextContainer} pointerEvents="none">
//         <Image
//           source={require("../../assets/images/dugoutADDA.png")}
//           style={styles.bannerLogo}
//           resizeMode="contain"
//         />
//       </View>

//       {/* 🎮 Game Mode Switcher */}
//       <View style={styles.modeContainer}>
//         <TouchableOpacity
//           style={[styles.modeButton, gameMode === 'VS_AI' && styles.activeMode]}
//           onPress={() => setGameMode('VS_AI')}
//         >
//           <Text style={styles.modeText}>🤖 Vs AI</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.modeButton, gameMode === 'VS_PLAYER' && styles.activeMode]}
//           onPress={() => setGameMode('VS_PLAYER')}
//         >
//           <Text style={styles.modeText}>👥 2-Player Local</Text>
//         </TouchableOpacity>
//       </View>

//       {/* 📷 Camera Testing Switcher (পজিশন চেক করার বাটন) */}
//       <View style={styles.cameraTesterContainer}>
//         {(['SHOOTER', 'KEEPER', 'PENALTY_PREVIEW', 'REPLAY'] as CameraMode[]).map((mode) => (
//           <TouchableOpacity
//             key={mode}
//             onPress={() => setCameraMode(mode)}
//             style={[styles.cameraModeBtn, cameraMode === mode && styles.activeCameraBtn]}
//           >
//             <Text style={styles.cameraModeText}>{mode}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* 🏆 Scoreboard */}
//       <View style={styles.scoreboard}>
//         <Text style={styles.brandTitle}> Dugout ADDA </Text>
//         <Text style={styles.roundText}>
//           {debugInfo.isSuddenDeath ? 'SUDDEN DEATH' : `ROUND ${debugInfo.currentRound} / 5`}
//         </Text>

//         <View style={styles.scoreRow}>
//           <View style={styles.playerBox}>
//             <Text style={styles.playerName}>P1 (Shooter)</Text>
//             <View style={styles.dotsRow}>
//               {renderShotDots(debugInfo.p1Shots)}
//             </View>
//           </View>

//           <Text style={styles.vsText}>VS</Text>

//           <View style={styles.playerBox}>
//             <Text style={styles.playerName}>{gameMode === 'VS_AI' ? 'AI Keeper' : 'P2'}</Text>
//             <View style={styles.dotsRow}>
//               {renderShotDots(debugInfo.p2Shots)}
//             </View>
//           </View>
//         </View>

//         <View style={styles.turnBadge}>
//           <Text style={styles.turnBadgeText}>
//             🎯 Turn: <Text style={{ color: '#00ffcc' }}>{debugInfo.currentShooter}</Text> | 🧤 Keeper:{' '}
//             <Text style={{ color: '#ff007f' }}>{debugInfo.currentKeeper}</Text>
//           </Text>
//         </View>
//       </View>

//       {/* 🎉 Game Over Rematch Modal */}
//       {showGameOverModal && (
//         <Animated.View style={[styles.gameOverOverlay, { opacity: fadeAnim }]}>
//           <Text style={styles.gameOverTitle}>🏆 MATCH FINISHED</Text>
//           <Text style={styles.winnerText}>
//             {debugInfo.winner === 'DRAW' ? '🤝 MATCH DRAW!' : `🎉 WINNER: ${debugInfo.winner}`}
//           </Text>

//           <TouchableOpacity
//             style={styles.restartBtn}
//             onPress={() => matchControlRef.current?.restartMatch()}
//           >
//             <Text style={styles.restartBtnText}>🔄 REMATCH</Text>
//           </TouchableOpacity>
//         </Animated.View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#111',
//   },
//   glView: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//   },
//   bannerOverlayTextContainer: {
//     position: 'absolute',
//     top: SCREEN_HEIGHT * 0.36,
//     alignSelf: 'center',
//   },
//   bannerOverlayText: {
//     color: '#ffffff',
//     fontSize: 26,
//     fontWeight: '900',
//     letterSpacing: 4,
//     textShadowColor: '#00ccff',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   modeContainer: {
//     position: 'absolute',
//     top: 45,
//     alignSelf: 'center',
//     flexDirection: 'row',
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     borderRadius: 20,
//     padding: 4,
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   modeButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 16,
//   },
//   activeMode: {
//     backgroundColor: '#ff007f',
//   },
//   modeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   cameraTesterContainer: {
//     position: 'absolute',
//     bottom: 30,
//     alignSelf: 'center',
//     flexDirection: 'row',
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     borderRadius: 12,
//     padding: 6,
//     gap: 6,
//     borderWidth: 1,
//     borderColor: '#444',
//   },
//   cameraModeBtn: {
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 6,
//     backgroundColor: '#222',
//   },
//   activeCameraBtn: {
//     backgroundColor: '#00e5ff',
//   },
//   cameraModeText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   scoreboard: {
//     position: 'absolute',
//     top: 95,
//     alignSelf: 'center',
//     width: '90%',
//     backgroundColor: 'rgba(0,0,0,0.85)',
//     padding: 12,
//     borderRadius: 12,
//     borderColor: '#00ffcc',
//     borderWidth: 1,
//     alignItems: 'center',
//   },
//   brandTitle: {
//     color: '#00ffcc',
//     fontSize: 15,
//     fontWeight: '900',
//     letterSpacing: 1,
//     marginBottom: 2,
//   },
//   roundText: {
//     color: '#ffcc00',
//     fontSize: 11,
//     fontWeight: 'bold',
//     marginBottom: 6,
//   },
//   scoreRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     width: '100%',
//   },
//   bannerLogo: {
//     width: 180,
//     height: 60,
//   },
//   playerBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   playerName: {
//     color: '#aaa',
//     fontSize: 12,
//     marginBottom: 4,
//   },
//   dotsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   dot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyDot: {
//     backgroundColor: '#333',
//     borderWidth: 1,
//     borderColor: '#555',
//   },
//   greenDot: {
//     backgroundColor: '#2e7d32',
//   },
//   redDot: {
//     backgroundColor: '#c62828',
//   },
//   dotIcon: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   vsText: {
//     color: '#ff007f',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginHorizontal: 10,
//   },
//   turnBadge: {
//     marginTop: 8,
//     backgroundColor: '#222',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   turnBadgeText: {
//     color: '#fff',
//     fontSize: 11,
//   },
//   gameOverOverlay: {
//     position: 'absolute',
//     top: SCREEN_HEIGHT / 3,
//     alignSelf: 'center',
//     backgroundColor: 'rgba(0,0,0,0.92)',
//     paddingHorizontal: 30,
//     paddingVertical: 25,
//     borderRadius: 16,
//     borderColor: '#00ffcc',
//     borderWidth: 2,
//     alignItems: 'center',
//     elevation: 10,
//     shadowColor: '#00ffcc',
//     shadowOpacity: 0.5,
//     shadowRadius: 10,
//   },
//   gameOverTitle: {
//     color: '#ffcc00',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   winnerText: {
//     color: '#fff',
//     fontSize: 16,
//     marginVertical: 12,
//     fontWeight: '600',
//   },
//   restartBtn: {
//     backgroundColor: '#ff007f',
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     borderRadius: 8,
//     marginTop: 5,
//   },
//   restartBtnText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
// });




// import React, { useRef, useState, useEffect } from 'react';
// import { View, Image, Text, StyleSheet, PanResponder, Dimensions, TouchableOpacity, Animated } from 'react-native';
// import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
// import * as THREE from 'three';
// import { Ball, Goalkeeper, MatchManager, GameMode, CameraManager, CameraMode, CameraState  } from '@football/engine';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const GOAL_WIDTH = 7.32;
// const GOAL_HEIGHT = 2.44;
// const GOAL_Z = -10;
// const POST_RADIUS = 0.08;
// const NET_DEPTH = 1.5;

// // ⚽ Stylized Football Mesh
// function FootballMesh({ ballMeshRef, radius }: { ballMeshRef: any; radius: number }) {
//   return (
//     <group ref={ballMeshRef} position={[0, 0.2, 0]}>
//       <mesh>
//         <sphereGeometry args={[radius, 32, 32]} />
//         <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
//       </mesh>
//     </group>
//   );
// }

// // 🏟️ Field Component matching Image layout (6-Yard Goal Box Layout)
// function FootballPitch() {
//   return (
//     <group position={[0, 0, -5]}>
//       {/* Green Grass Field */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
//         <planeGeometry args={[30, 40]} />
//         <meshStandardMaterial color="#2e8b57" roughness={0.8} />
//       </mesh>

//       {/* ⚪ Goal Line (Goal Area Main Line) */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]}>
//         <planeGeometry args={[26, 0.12]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>

//       {/* 🔲 Rectangular D-Box */}
//       {/* Front Line */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
//         <planeGeometry args={[14, 0.12]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>
//       {/* Left Line */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0.01, -2.5]}>
//         <planeGeometry args={[0.12, 5]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>
//       {/* Right Line */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0.01, -2.5]}>
//         <planeGeometry args={[0.12, 5]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>

//       {/* ⚪ Penalty Spot */}
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 5]}>
//         <circleGeometry args={[0.15, 32]} />
//         <meshBasicMaterial color="#ffffff" />
//       </mesh>
//     </group>
//   );
// }

// function DigitalAdBanner() {
//   const BANNER_WIDTH = 3.66;
//   const BANNER_HEIGHT = 1.2;

//   return (
//     <group position={[0, BANNER_HEIGHT / 2, GOAL_Z - 2.8]}>
//       <mesh position={[0, 0, 0]}>
//         <boxGeometry args={[BANNER_WIDTH + 0.15, BANNER_HEIGHT + 0.15, 0.08]} />
//         <meshStandardMaterial color="#0c1017" roughness={0.3} metalness={0.8} />
//       </mesh>

//       <mesh position={[0, 0, 0.041]}>
//         <planeGeometry args={[BANNER_WIDTH + 0.05, BANNER_HEIGHT + 0.05]} />
//         <meshBasicMaterial color="#00e5ff" />
//       </mesh>
//     </group>
//   );
// }

// // 🥅 Goal Post Mesh
// function GoalPost() {
//   const postMat = <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} />;

//   return (
//     <group position={[0, 0, GOAL_Z]}>
//       {/* Left Post */}
//       <mesh position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
//         {postMat}
//       </mesh>

//       {/* Right Post */}
//       <mesh position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 16]} />
//         {postMat}
//       </mesh>

//       {/* Crossbar */}
//       <mesh position={[0, GOAL_HEIGHT, 0]} rotation={[0, 0, Math.PI / 2]}>
//         <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_WIDTH, 16]} />
//         {postMat}
//       </mesh>

//       {/* Net Mesh */}
//       <mesh position={[0, GOAL_HEIGHT / 2, -NET_DEPTH / 2]}>
//         <boxGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, NET_DEPTH]} />
//         <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.35} />
//       </mesh>
//     </group>
//   );
// }

// // 🏃 Shooter Player Mesh Component (Fixed Reset Logic)
// function PlayerMesh({ isRunning, isKicked, onKickHit }: { isRunning: boolean; isKicked: boolean; onKickHit: () => void }) {
//   const playerGroup = useRef<THREE.Group>(null!);
//   const leftLeg = useRef<THREE.Group>(null!);
//   const rightLeg = useRef<THREE.Group>(null!);
//   const leftArm = useRef<THREE.Group>(null!);
//   const rightArm = useRef<THREE.Group>(null!);
  
//   const hasHitBall = useRef(false);

//   const startPos = new THREE.Vector3(-0.9, 0, 2.8);
//   const targetPos = new THREE.Vector3(-0.2, 0, 0.45);

//   // রিসেট স্টেট হ্যান্ডেল করা
//   useEffect(() => {
//     if (!isRunning && !isKicked) {
//       hasHitBall.current = false;
//       if (playerGroup.current) {
//         playerGroup.current.position.copy(startPos);
//         playerGroup.current.rotation.set(0, 0, 0);
//       }
//     }
//   }, [isRunning, isKicked]);

//   useFrame((_, delta) => {
//     if (!playerGroup.current) return;

//     // ১. দৌড়ে এসে শট নেওয়া
//     if (isRunning && !hasHitBall.current) {
//       playerGroup.current.position.lerp(targetPos, delta * 7.5);

//       const runCycle = Math.sin(Date.now() * 0.02) * 0.85;
      
//       if (leftLeg.current) leftLeg.current.rotation.x = runCycle;
//       if (rightLeg.current) rightLeg.current.rotation.x = -runCycle;
//       if (leftArm.current) leftArm.current.rotation.x = -runCycle * 0.8;
//       if (rightArm.current) rightArm.current.rotation.x = runCycle * 0.8;

//       if (playerGroup.current.position.distanceTo(targetPos) < 0.28) {
//         hasHitBall.current = true;
//         onKickHit();
//       }
//     } 
//     // ২. শট দেওয়ার পর ফলো-থ্রু ও দাঁড়ানো
//     else if (hasHitBall.current || isKicked) {
//       if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, -0.4, delta * 10);
//       if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0.1, delta * 10);
//       if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0.3, delta * 8);
//       if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, -0.3, delta * 8);
//     } 
//     // ৩. স্বাভাবিক রিসেট পজিশন
//     else {
//       playerGroup.current.position.copy(startPos);
//       if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, delta * 10);
//       if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, delta * 10);
//       if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, delta * 10);
//       if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, delta * 10);
//     }
//   });

//   const skinMat = <meshStandardMaterial color="#ffcc99" roughness={0.4} />;
//   const jerseyMat = <meshStandardMaterial color="#00e5ff" roughness={0.3} />;
//   const shortsMat = <meshStandardMaterial color="#111111" roughness={0.5} />;

//   return (
//     <group ref={playerGroup} position={[-0.9, 0, 2.8]}>
//       {/* Torso / Body */}
//       <mesh position={[0, 1.05, 0]}>
//         <cylinderGeometry args={[0.26, 0.2, 0.7, 16]} />
//         {jerseyMat}
//       </mesh>

//       {/* Head */}
//       <mesh position={[0, 1.52, 0]}>
//         <sphereGeometry args={[0.18, 16, 16]} />
//         {skinMat}
//       </mesh>

//       {/* Shorts */}
//       <mesh position={[0, 0.62, 0]}>
//         <cylinderGeometry args={[0.22, 0.22, 0.25, 16]} />
//         {shortsMat}
//       </mesh>

//       {/* 🦾 Left Arm */}
//       <group ref={leftArm} position={[-0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {jerseyMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.07, 12, 12]} />
//           {skinMat}
//         </mesh>
//       </group>

//       {/* 🦾 Right Arm */}
//       <group ref={rightArm} position={[0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {jerseyMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.07, 12, 12]} />
//           {skinMat}
//         </mesh>
//       </group>

//       {/* 🦵 Left Leg */}
//       <group ref={leftLeg} position={[-0.12, 0.5, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.07, 0.06, 0.55, 12]} />
//           {skinMat}
//         </mesh>
//       </group>

//       {/* 🦵 Right Leg */}
//       <group ref={rightLeg} position={[0.12, 0.5, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.07, 0.06, 0.55, 12]} />
//           {skinMat}
//         </mesh>
//       </group>
//     </group>
//   );
// }

// // 🧤 Goalkeeper Mesh Component
// function GoalkeeperMesh({ keeperRef, goalkeeperEngine }: { keeperRef: any; goalkeeperEngine: any }) {
//   const keeperGroup = useRef<THREE.Group>(null!);
//   const leftArmGroup = useRef<THREE.Group>(null!);
//   const rightArmGroup = useRef<THREE.Group>(null!);

//   const skinMat = <meshStandardMaterial color="#ffcc99" roughness={0.4} />;
//   const shirtMat = <meshStandardMaterial color="#d41c9d" roughness={0.3} />;
//   const shortsMat = <meshStandardMaterial color="#222222" roughness={0.5} />;
//   const gloveMat = <meshStandardMaterial color="#1eadba" roughness={0.2} />;

//   useFrame((_, delta) => {
//     if (!keeperGroup.current || !goalkeeperEngine) return;

//     const goalkeeper = goalkeeperEngine;
//     const shotFinished = keeperRef.current.shotFinished;
//     const isGoal = keeperRef.current.isGoal;

//     const targetKeeperY = goalkeeper.isDiving ? Math.max(0, goalkeeper.position.y) : 0;
//     keeperGroup.current.position.set(goalkeeper.position.x, targetKeeperY, goalkeeper.position.z);

//     if (goalkeeper.isDiving && !shotFinished) {
//       const tiltAngle = goalkeeper.diveDirection === 'right' ? -0.85 : 0.85;
//       const armAngleLeft = goalkeeper.diveDirection === 'right' ? -2.2 : 1.8;
//       const armAngleRight = goalkeeper.diveDirection === 'right' ? -1.8 : 2.2;

//       keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, tiltAngle, delta * 8.0);
//       if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, armAngleLeft, delta * 8.0);
//       if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, armAngleRight, delta * 8.0);
//     } else if (shotFinished && !isGoal) {
//       keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 6.0);
//       const jumpY = Math.sin(Date.now() * 0.012) * 0.3;
//       keeperGroup.current.position.y = Math.max(0, jumpY);

//       if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 2.8, delta * 8.0);
//       if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -2.8, delta * 8.0);
//     } else {
//       keeperGroup.current.rotation.z = THREE.MathUtils.lerp(keeperGroup.current.rotation.z, 0, delta * 6.0);
//       if (leftArmGroup.current) leftArmGroup.current.rotation.z = THREE.MathUtils.lerp(leftArmGroup.current.rotation.z, 0.2, delta * 6.0);
//       if (rightArmGroup.current) rightArmGroup.current.rotation.z = THREE.MathUtils.lerp(rightArmGroup.current.rotation.z, -0.2, delta * 6.0);
//     }
//   });

//   return (
//     <group ref={keeperGroup} position={[0, 0, GOAL_Z + 0.2]}>
//       <mesh position={[0, 1.05, 0]}>
//         <cylinderGeometry args={[0.28, 0.22, 0.7, 16]} />
//         {shirtMat}
//       </mesh>
//       <mesh position={[0, 1.52, 0]}>
//         <sphereGeometry args={[0.18, 16, 16]} />
//         {skinMat}
//       </mesh>
//       <mesh position={[0, 0.62, 0]}>
//         <cylinderGeometry args={[0.23, 0.24, 0.25, 16]} />
//         {shortsMat}
//       </mesh>
//       <mesh position={[-0.14, 0.3, 0]}>
//         <cylinderGeometry args={[0.08, 0.07, 0.6, 12]} />
//         {skinMat}
//       </mesh>
//       <mesh position={[0.14, 0.3, 0]}>
//         <cylinderGeometry args={[0.08, 0.07, 0.6, 12]} />
//         {skinMat}
//       </mesh>
//       <group ref={leftArmGroup} position={[-0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {shirtMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.1, 12, 12]} />
//           {gloveMat}
//         </mesh>
//       </group>
//       <group ref={rightArmGroup} position={[0.32, 1.3, 0]}>
//         <mesh position={[0, -0.25, 0]}>
//           <cylinderGeometry args={[0.06, 0.05, 0.55, 12]} />
//           {shirtMat}
//         </mesh>
//         <mesh position={[0, -0.55, 0]}>
//           <sphereGeometry args={[0.1, 12, 12]} />
//           {gloveMat}
//         </mesh>
//       </group>
//     </group>
//   );
// }

// // ⚽ Main Game Scene
// function GameScene({ setDebugInfo, matchControlRef, gameMode }: any) {
//   const { camera } = useThree();
//   const ballMeshRef = useRef<THREE.Mesh>(null!);

//   const ballEngineRef = useRef(new Ball({ x: 0, y: 0.2, z: 0 }, 0.2));
//   const keeperEngineRef = useRef(new Goalkeeper());
//   const matchManagerRef = useRef(new MatchManager(gameMode, 5));

//   const pendingFlickData = useRef<any>(null);
//   const [isApproaching, setIsApproaching] = useState(false);

//   // 🎥 CameraManager এর instance তৈরি
//   const cameraManagerRef = useRef(new CameraManager('REPLAY'));

//   const stateRef = useRef<{
//     isKicked: boolean;
//     isSaved: boolean;
//     isGoal: boolean;
//     shotFinished: boolean;
//     autoResetTimer: ReturnType<typeof setTimeout> | null;
//   }>({
//     isKicked: false,
//     isSaved: false,
//     isGoal: false,
//     shotFinished: false,
//     autoResetTimer: null,
//   });

//   const goalkeeperEngine = keeperEngineRef.current;
//   const ball = ballEngineRef.current;
//   const matchManager = matchManagerRef.current;

//   useEffect(() => {
//     matchManager.setGameMode(gameMode, 5);
//   }, [gameMode]);

//   const sceneObjects = {
//     posts: [
//       { start: { x: -GOAL_WIDTH / 2, y: 0, z: GOAL_Z }, end: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//       { start: { x: GOAL_WIDTH / 2, y: 0, z: GOAL_Z }, end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//       { start: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//     ],
//     net: { minX: -GOAL_WIDTH / 2, maxX: GOAL_WIDTH / 2, minY: 0, maxY: GOAL_HEIGHT, minZ: GOAL_Z - NET_DEPTH, maxZ: GOAL_Z - 0.05 },
//   };

//   const resetNextTurn = () => {
//     if (stateRef.current.autoResetTimer) {
//       clearTimeout(stateRef.current.autoResetTimer);
//       stateRef.current.autoResetTimer = null;
//     }

//     ball.reset();
//     goalkeeperEngine.reset();
//     goalkeeperEngine.position.z = GOAL_Z + 0.2;

//     stateRef.current.isKicked = false;
//     stateRef.current.isSaved = false;
//     stateRef.current.isGoal = false;
//     stateRef.current.shotFinished = false;
    

//     // 🔄 প্লেয়ার ও স্টেট পুরোপুরি রিসেট
//     setIsApproaching(false);
//     pendingFlickData.current = null;

//     if (ballMeshRef.current) {
//       ballMeshRef.current.position.set(ball.position.x, ball.position.y, ball.position.z);
//       ballMeshRef.current.rotation.set(0, 0, 0);
//     }
//   };

//   const handleKickHit = () => {
//     if (!pendingFlickData.current) return;

//     ball.kickFromSwipe(pendingFlickData.current);

//     goalkeeperEngine.predictShot({
//       ballPos: ball.position,
//       ballVel: ball.velocity,
//       ballSpin: ball.spin,
//     });

//     stateRef.current.isKicked = true;
//   };

//   useEffect(() => {
//     matchControlRef.current = {
//       kick: (flickData: any) => {
//         if (stateRef.current.autoResetTimer) {
//           clearTimeout(stateRef.current.autoResetTimer);
//           stateRef.current.autoResetTimer = null;
//         }

//         pendingFlickData.current = flickData;
//         setIsApproaching(true);
//       },
//       reset: resetNextTurn,
//       restartMatch: () => {
//         matchManager.reset(gameMode, 5);
//         resetNextTurn();
//       },
//       isKicked: () => stateRef.current.isKicked || isApproaching,
//     };
//   }, [gameMode, isApproaching]);

// useEffect(() => {
//   const cameraState =
//     cameraManagerRef.current.update(1, undefined);

//   const perspectiveCamera =
//     camera as THREE.PerspectiveCamera;

//   perspectiveCamera.position.set(
//     cameraState.position.x,
//     cameraState.position.y,
//     cameraState.position.z
//   );

//   perspectiveCamera.lookAt(
//     cameraState.target.x,
//     cameraState.target.y,
//     cameraState.target.z
//   );

//   perspectiveCamera.fov = cameraState.fov;

//   perspectiveCamera.updateProjectionMatrix();

// }, [camera]);

//   useFrame((_, delta) => {
//     const dt = Math.min(delta, 0.05);

//     if (stateRef.current.isKicked) {
//       ball.update(dt, sceneObjects);
//       goalkeeperEngine.updateAI(ball.position, ball.velocity, dt);

//       if (!stateRef.current.isSaved && goalkeeperEngine.checkSave(ball.position, ball.radius)) {
//         stateRef.current.isSaved = true;
//         ball.velocity.x = (ball.position.x - goalkeeperEngine.position.x) * 3.5;
//         ball.velocity.z = Math.abs(ball.velocity.z) * 0.5;
//         ball.velocity.y = Math.abs(ball.velocity.y) * 0.3 + 2.0;
//       }

//       const isBallPassedGoal = ball.position.z <= GOAL_Z - (NET_DEPTH - 0.2);
//       const isBallHitGroundAfterSaved = stateRef.current.isSaved && ball.position.y < 0.25;
//       const isBallStopped = Math.abs(ball.velocity.z) < 0.05 && Math.abs(ball.velocity.x) < 0.05;

//       if ((isBallPassedGoal || isBallHitGroundAfterSaved || isBallStopped) && !stateRef.current.shotFinished) {
//         stateRef.current.shotFinished = true;

//         const result = matchManager.evaluateShot(ball.position, stateRef.current.isSaved);
//         stateRef.current.isGoal = result.isGoal;

//         if (!stateRef.current.autoResetTimer && !matchManager.isGameOver) {
//           stateRef.current.autoResetTimer = setTimeout(() => {
//             resetNextTurn();
//           }, 3000);
//         }
//       }

//       if (ballMeshRef.current) {
//         ballMeshRef.current.position.set(ball.position.x, ball.position.y, ball.position.z);
//         ballMeshRef.current.rotation.y += (ball.spin.y || 0) * dt;
//         ballMeshRef.current.rotation.x += ((ball.spin.x || 0) + ball.velocity.z) * dt * 0.1;
//       }
//     }

//     setDebugInfo((prev: any) => ({
//       ...prev,
//       posX: ball.position.x.toFixed(2),
//       posY: ball.position.y.toFixed(2),
//       posZ: ball.position.z.toFixed(2),
//       isKicked: stateRef.current.isKicked,
//       currentShooter: matchManager.currentShooter,
//       currentKeeper: matchManager.currentKeeper,
//       currentRound: matchManager.currentRound,
//       p1Shots: matchManager.p1History || [],
//       p2Shots: matchManager.p2History || [],
//       isGameOver: matchManager.isGameOver,
//       winner: matchManager.winner,
//       isSuddenDeath: matchManager.isSuddenDeath,
//     }));
//   });

//   return (
//     <>
//       <ambientLight intensity={0.7} />
//       <directionalLight position={[5, 12, 8]} intensity={1.5} />

//       <FootballPitch />
//       {/* <DigitalAdBanner /> */}
//       <GoalPost />
//       <GoalkeeperMesh keeperRef={stateRef} goalkeeperEngine={goalkeeperEngine} />
//       <PlayerMesh isRunning={isApproaching} isKicked={stateRef.current.isKicked} onKickHit={handleKickHit} />
//       <FootballMesh ballMeshRef={ballMeshRef} radius={ball.radius} />
//     </>
//   );
// }

// // 📱 Main App Component
// export default function App() {
//   const [gameMode, setGameMode] = useState<GameMode>('VS_AI');
//   const [showGameOverModal, setShowGameOverModal] = useState(false);
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   const [debugInfo, setDebugInfo] = useState<any>({
//     posX: '0.00',
//     posY: '0.00',
//     posZ: '0.00',
//     isKicked: false,
//     currentShooter: 'PLAYER_1',
//     currentKeeper: 'AI',
//     currentRound: 1,
//     p1Shots: [],
//     p2Shots: [],
//     isGameOver: false,
//     winner: null,
//     isSuddenDeath: false,
//   });

//   const matchControlRef = useRef<any>(null);
//   const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

//   useEffect(() => {
//     if (debugInfo.isGameOver) {
//       const timer = setTimeout(() => {
//         setShowGameOverModal(true);
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }).start();
//       }, 2500);

//       return () => clearTimeout(timer);
//     } else {
//       setShowGameOverModal(false);
//       fadeAnim.setValue(0);
//     }
//   }, [debugInfo.isGameOver]);

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderGrant: (evt) => {
//         if (debugInfo.isGameOver) return;

//         if (matchControlRef.current?.isKicked()) {
//           matchControlRef.current?.reset();
//           return;
//         }

//         touchStartPos.current = {
//           x: evt.nativeEvent.pageX,
//           y: evt.nativeEvent.pageY,
//           time: Date.now(),
//         };
//       },
//       onPanResponderRelease: (evt) => {
//         if (!matchControlRef.current || matchControlRef.current.isKicked() || debugInfo.isGameOver) return;

//         const duration = Math.max((Date.now() - touchStartPos.current.time) / 1000, 0.05);
//         const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
//         const deltaY = touchStartPos.current.y - evt.nativeEvent.pageY;

//         if (deltaY < 10 && Math.abs(deltaX) < 10) return;

//         const flickSpeed = deltaY / duration;
//         const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

//         matchControlRef.current.kick({
//           deltaX,
//           deltaY,
//           duration,
//           deltaTopspin,
//         });
//       },
//     })
//   ).current;

//   const renderShotDots = (shotsList: any[]) => {
//     const dots = [];
//     for (let i = 0; i < 5; i++) {
//       const shot = shotsList ? shotsList[i] : undefined;
//       if (shot === 'GOAL' || shot === true) {
//         dots.push(<View key={i} style={[styles.dot, styles.greenDot]}><Text style={styles.dotIcon}>✓</Text></View>);
//       } else if (shot === 'MISS' || shot === 'SAVED' || shot === 'POST_HIT' || shot === false) {
//         dots.push(<View key={i} style={[styles.dot, styles.redDot]}><Text style={styles.dotIcon}>✕</Text></View>);
//       } else {
//         dots.push(<View key={i} style={[styles.dot, styles.emptyDot]} />);
//       }
//     }
//     return dots;
//   };

//   return (
//     <View style={styles.container} {...panResponder.panHandlers}>
//       {/* 🎨 Canvas */}
//       <View style={styles.glView} pointerEvents="none">
//         <Canvas camera={{ fov: 55, near: 0.1, far: 1000 }}>
//           <GameScene setDebugInfo={setDebugInfo} matchControlRef={matchControlRef} gameMode={gameMode} />
//         </Canvas>
//       </View>

//       <View style={styles.bannerOverlayTextContainer} pointerEvents="none">
//         <Image
//           source={require("../../assets/images/dugoutADDA.png")}
//           style={styles.bannerLogo}
//           resizeMode="contain"
//         />
//       </View>

//       {/* 🎮 Game Mode Switcher */}
//       <View style={styles.modeContainer}>
//         <TouchableOpacity
//           style={[styles.modeButton, gameMode === 'VS_AI' && styles.activeMode]}
//           onPress={() => setGameMode('VS_AI')}
//         >
//           <Text style={styles.modeText}>🤖 Vs AI</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.modeButton, gameMode === 'VS_PLAYER' && styles.activeMode]}
//           onPress={() => setGameMode('VS_PLAYER')}
//         >
//           <Text style={styles.modeText}>👥 2-Player Local</Text>
//         </TouchableOpacity>
//       </View>

//       {/* 🏆 Scoreboard */}
//       <View style={styles.scoreboard}>
//         <Text style={styles.brandTitle}> Dugout ADDA </Text>
//         <Text style={styles.roundText}>
//           {debugInfo.isSuddenDeath ? 'SUDDEN DEATH' : `ROUND ${debugInfo.currentRound} / 5`}
//         </Text>

//         <View style={styles.scoreRow}>
//           <View style={styles.playerBox}>
//             <Text style={styles.playerName}>P1 (Shooter)</Text>
//             <View style={styles.dotsRow}>
//               {renderShotDots(debugInfo.p1Shots)}
//             </View>
//           </View>

//           <Text style={styles.vsText}>VS</Text>

//           <View style={styles.playerBox}>
//             <Text style={styles.playerName}>{gameMode === 'VS_AI' ? 'AI Keeper' : 'P2'}</Text>
//             <View style={styles.dotsRow}>
//               {renderShotDots(debugInfo.p2Shots)}
//             </View>
//           </View>
//         </View>

//         <View style={styles.turnBadge}>
//           <Text style={styles.turnBadgeText}>
//             🎯 Turn: <Text style={{ color: '#00ffcc' }}>{debugInfo.currentShooter}</Text> | 🧤 Keeper:{' '}
//             <Text style={{ color: '#ff007f' }}>{debugInfo.currentKeeper}</Text>
//           </Text>
//         </View>
//       </View>

//       {/* 🎉 Game Over Rematch Modal */}
//       {showGameOverModal && (
//         <Animated.View style={[styles.gameOverOverlay, { opacity: fadeAnim }]}>
//           <Text style={styles.gameOverTitle}>🏆 MATCH FINISHED</Text>
//           <Text style={styles.winnerText}>
//             {debugInfo.winner === 'DRAW' ? '🤝 MATCH DRAW!' : `🎉 WINNER: ${debugInfo.winner}`}
//           </Text>

//           <TouchableOpacity
//             style={styles.restartBtn}
//             onPress={() => matchControlRef.current?.restartMatch()}
//           >
//             <Text style={styles.restartBtnText}>🔄 REMATCH</Text>
//           </TouchableOpacity>
//         </Animated.View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#111',
//   },
//   glView: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//   },
//   bannerOverlayTextContainer: {
//     position: 'absolute',
//     top: SCREEN_HEIGHT * 0.36,
//     alignSelf: 'center',
//   },
//   bannerOverlayText: {
//     color: '#ffffff',
//     fontSize: 26,
//     fontWeight: '900',
//     letterSpacing: 4,
//     textShadowColor: '#00ccff',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   modeContainer: {
//     position: 'absolute',
//     top: 45,
//     alignSelf: 'center',
//     flexDirection: 'row',
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     borderRadius: 20,
//     padding: 4,
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   modeButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 16,
//   },
//   activeMode: {
//     backgroundColor: '#ff007f',
//   },
//   modeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   scoreboard: {
//     position: 'absolute',
//     top: 95,
//     alignSelf: 'center',
//     width: '90%',
//     backgroundColor: 'rgba(0,0,0,0.85)',
//     padding: 12,
//     borderRadius: 12,
//     borderColor: '#00ffcc',
//     borderWidth: 1,
//     alignItems: 'center',
//   },
//   brandTitle: {
//     color: '#00ffcc',
//     fontSize: 15,
//     fontWeight: '900',
//     letterSpacing: 1,
//     marginBottom: 2,
//   },
//   roundText: {
//     color: '#ffcc00',
//     fontSize: 11,
//     fontWeight: 'bold',
//     marginBottom: 6,
//   },
//   scoreRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     width: '100%',
//   },
//   bannerLogo: {
//     width: 180,
//     height: 60,
//   },
//   playerBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   playerName: {
//     color: '#aaa',
//     fontSize: 12,
//     marginBottom: 4,
//   },
//   dotsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   dot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyDot: {
//     backgroundColor: '#333',
//     borderWidth: 1,
//     borderColor: '#555',
//   },
//   greenDot: {
//     backgroundColor: '#2e7d32',
//   },
//   redDot: {
//     backgroundColor: '#c62828',
//   },
//   dotIcon: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   vsText: {
//     color: '#ff007f',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginHorizontal: 10,
//   },
//   turnBadge: {
//     marginTop: 8,
//     backgroundColor: '#222',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   turnBadgeText: {
//     color: '#fff',
//     fontSize: 11,
//   },
//   gameOverOverlay: {
//     position: 'absolute',
//     top: SCREEN_HEIGHT / 3,
//     alignSelf: 'center',
//     backgroundColor: 'rgba(0,0,0,0.92)',
//     paddingHorizontal: 30,
//     paddingVertical: 25,
//     borderRadius: 16,
//     borderColor: '#00ffcc',
//     borderWidth: 2,
//     alignItems: 'center',
//     elevation: 10,
//     shadowColor: '#00ffcc',
//     shadowOpacity: 0.5,
//     shadowRadius: 10,
//   },
//   gameOverTitle: {
//     color: '#ffcc00',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   winnerText: {
//     color: '#fff',
//     fontSize: 16,
//     marginVertical: 12,
//     fontWeight: '600',
//   },
//   restartBtn: {
//     backgroundColor: '#ff007f',
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     borderRadius: 8,
//     marginTop: 5,
//   },
//   restartBtnText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
// });