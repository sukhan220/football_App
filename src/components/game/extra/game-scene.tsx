
// import { Ball, CameraManager, CameraMode, FieldPlayer, GameMode, Goalkeeper, MatchManager } from '@football/engine';
// import { useFrame, useThree } from '@react-three/fiber/native';
// import { useCallback, useEffect, useRef, useState } from 'react';
// import * as THREE from 'three';

// import { GOAL_HEIGHT, GOAL_WIDTH, GOAL_Z, NET_DEPTH, POST_RADIUS } from '@/constants/football';
// import { GAME_EVENTS } from '@/constants/network-events';
// import { network } from '@/services/multiplayer';
// import { FootballMesh } from './football-mesh';
// import { FootballPitch } from './football-pitch';
// import { GoalPost } from './goal-post';
// import { GoalkeeperMesh } from './goalKeeper-mesh';
// import { PlayerMesh } from './player-mesh';

// export function GameScene({
//   setDebugInfo,
//   matchControlRef,
//   gameMode,
//   activeCameraMode,
//   userRole: initialUserRole,
// }: {
//   setDebugInfo: any;
//   matchControlRef: any;
//   gameMode: GameMode;
//   activeCameraMode: CameraMode;
//   userRole?: 'SHOOTER' | 'GOALKEEPER';
// }) {
//   const { camera } = useThree();
//   const ballMeshRef = useRef<THREE.Mesh>(null!);

//   const ballEngineRef = useRef(new Ball({ x: 0, y: 0.2, z: 0 }, 0.2));
//   const keeperEngineRef = useRef(new Goalkeeper());
//   const matchManagerRef = useRef(new MatchManager(gameMode, 5));
//   const aiShooterRef = useRef(new FieldPlayer('ai_shooter', { x: -0.9, y: 0, z: 2.8 }));

//   const pendingFlickData = useRef<any>(null);
//   const isApproachingRef = useRef(false);
//   const [isApproaching, setIsApproachingState] = useState(false);

//   // 🎭 ডিভাইসের হোস্ট/ক্লায়েন্ট অবস্থান অথবা প্রপস অনুযায়ী প্রাথমিক রোল নির্ধারণ
//   const getInitialRole = (): 'SHOOTER' | 'GOALKEEPER' => {
//     if (initialUserRole) return initialUserRole;
//     if ((gameMode as string) === 'VS_PLAYER') {
//       // network.isHost একটি boolean প্রপার্টি
//       const isHostDevice = (network as any)?.isHost ?? false;
//       return isHostDevice ? 'SHOOTER' : 'GOALKEEPER';
//     }
//     return 'SHOOTER';
//   };

//   const [currentRole, setCurrentRole] = useState<'SHOOTER' | 'GOALKEEPER'>(getInitialRole);

//   // 🎥 ক্যামেরা ম্যানেজার রেফারেন্স
//   const cameraManagerRef = useRef<CameraManager>(new CameraManager('SHOOTER'));

//   useEffect(() => {
//     if (initialUserRole) {
//       setCurrentRole(initialUserRole);
//     } else if ((gameMode as string) === 'VS_PLAYER') {
//       const isHostDevice = (network as any)?.isHost ?? false;
//       setCurrentRole(isHostDevice ? 'SHOOTER' : 'GOALKEEPER');
//     }
//   }, [initialUserRole, gameMode]);

//   const setIsApproaching = (val: boolean) => {
//     isApproachingRef.current = val;
//     setIsApproachingState(val);
//   };

//   const aiShotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

//   // 🎯 UI ও স্কোরবোর্ড সিঙ্ক
//   const syncScoreboard = useCallback(() => {
//     const isUserKeeper = currentRole === 'GOALKEEPER';

//     setDebugInfo({
//       isKicked: stateRef.current.isKicked,
//       currentShooter: matchManager.currentShooter,
//       currentKeeper: matchManager.currentKeeper,
//       currentRound: matchManager.currentRound,
//       p1Shots: [...(matchManager.p1History || [])],
//       p2Shots: [...(matchManager.p2History || [])],
//       isGameOver: matchManager.isGameOver,
//       winner: matchManager.winner,
//       isSuddenDeath: matchManager.isSuddenDeath,
//       isUserKeeper,
//       currentRole,
//     });
//   }, [currentRole, matchManager, setDebugInfo]);

//   // 🎥 ক্যামেরা মোড পরিবর্তন (রোল পরিবর্তন হলে ক্যামেরা পরিবর্তন হবে)
//   useEffect(() => {
//     let targetCameraMode: CameraMode = activeCameraMode;

//     if (currentRole === 'GOALKEEPER') {
//       targetCameraMode = 'KEEPER';
//     } else if (currentRole === 'SHOOTER') {
//       targetCameraMode = activeCameraMode === ('KEEPER_VIEW' as CameraMode) ? 'SHOOTER' : activeCameraMode;
//     }

//     cameraManagerRef.current.setMode(targetCameraMode);
//   }, [activeCameraMode, currentRole]);

//   const sceneObjects = {
//     posts: [
//       { start: { x: -GOAL_WIDTH / 2, y: 0, z: GOAL_Z }, end: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//       { start: { x: GOAL_WIDTH / 2, y: 0, z: GOAL_Z }, end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//       { start: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z }, radius: POST_RADIUS },
//     ],
//     net: { minX: -GOAL_WIDTH / 2, maxX: GOAL_WIDTH / 2, minY: 0, maxY: GOAL_HEIGHT, minZ: GOAL_Z - NET_DEPTH, maxZ: GOAL_Z - 0.05 },
//   };

//   // 🔄 রিসেট ও টার্ন পরিবর্তন লজিক
//   const resetNextTurn = useCallback(() => {
//     if (stateRef.current.autoResetTimer) {
//       clearTimeout(stateRef.current.autoResetTimer);
//       stateRef.current.autoResetTimer = null;
//     }
//     if (aiShotTimer.current) {
//       clearTimeout(aiShotTimer.current);
//       aiShotTimer.current = null;
//     }

//     ball.reset();
//     goalkeeperEngine.reset();
//     goalkeeperEngine.position.z = GOAL_Z + 0.2;

//     stateRef.current.isKicked = false;
//     stateRef.current.isSaved = false;
//     stateRef.current.isGoal = false;
//     stateRef.current.shotFinished = false;

//     setIsApproaching(false);
//     pendingFlickData.current = null;

//     if (ballMeshRef.current) {
//       ballMeshRef.current.position.set(ball.position.x, ball.position.y, ball.position.z);
//       ballMeshRef.current.rotation.set(0, 0, 0);
//     }

//     // 🔄 মাল্টিপ্লেয়ার টার্ন অদল-বদল করা
//     if ((gameMode as string) === 'VS_PLAYER') {
//       setCurrentRole((prevRole) => (prevRole === 'SHOOTER' ? 'GOALKEEPER' : 'SHOOTER'));
//     }

//     syncScoreboard();
//   }, [ball, gameMode, goalkeeperEngine, syncScoreboard]);

//   // 🤖 AI Shooter Trigger (Vs AI মোডের জন্য)
//   const triggerAIShotIfNeeded = useCallback(() => {
//     if (matchManager.isGameOver || (gameMode as string) === 'VS_PLAYER') return;

//     const currentMode = gameMode as string;
//     const isAIShooter = matchManager.currentShooter === 'AI' || currentMode === 'GOALKEEPER';

//     if (isAIShooter && !stateRef.current.isKicked && !isApproachingRef.current) {
//       if (aiShotTimer.current) clearTimeout(aiShotTimer.current);

//       aiShotTimer.current = setTimeout(() => {
//         if (stateRef.current.isKicked) return;

//         const aiShot = aiShooterRef.current.generateAIShot();
//         if (aiShot) {
//           pendingFlickData.current = aiShot;
//           setIsApproaching(true);
//         }
//       }, 2500);
//     }
//   }, [gameMode, matchManager]);

//   useEffect(() => {
//     matchManager.setGameMode(gameMode, 5);
//     resetNextTurn();
//     triggerAIShotIfNeeded();
//   }, [gameMode]);

//   // ⚽ কিক হিট হ্যান্ডলার
//   const handleKickHit = () => {
//     if (!pendingFlickData.current) return;

//     const raw = pendingFlickData.current;

//     // ১. সোয়াইপ ডাটা
//     if (raw.deltaX !== undefined && raw.deltaY !== undefined) {
//       ball.kickFromSwipe(raw);
//     } 
//     // ২. AI / Direct Velocity ডাটা
//     else if (raw.velocity) {
//       let velZ = raw.velocity.z;
//       if (velZ > 0) velZ = -velZ;

//       ball.applyKick(
//         { x: raw.velocity.x, y: raw.velocity.y, z: velZ },
//         raw.spin || { x: 0, y: 0, z: 0 }
//       );
//     }

//     // 🧤 AI কিপার প্রেডিকশন (একমাত্র VS_AI মোডে চলবে)
//     if ((gameMode as string) !== 'VS_PLAYER' && currentRole !== 'GOALKEEPER') {
//       goalkeeperEngine.predictShot({
//         ballPos: ball.position,
//         ballVel: ball.velocity,
//         ballSpin: ball.spin,
//       });
//     }

//     stateRef.current.isKicked = true;
//     setIsApproaching(false);
//     syncScoreboard();
//   };

//   // 🎛️ Controls & Network Remote Action Receiver
//   useEffect(() => {
//     matchControlRef.current = {
//       // 🎯 স্থানীয় ডিভাইস থেকে কিক
//       kick: (flickData: any) => {
//         if (currentRole !== 'SHOOTER' || stateRef.current.isKicked || isApproachingRef.current) return;

//         if (stateRef.current.autoResetTimer) {
//           clearTimeout(stateRef.current.autoResetTimer);
//           stateRef.current.autoResetTimer = null;
//         }

//         // 📡 প্রতিপক্ষ মোবাইলে কিক ডাটা পাঠানো
//         if ((gameMode as string) === 'VS_PLAYER') {
//           network.send({ type: 'REMOTE_ACTION', action: 'KICK', flickData });
//         }

//         pendingFlickData.current = flickData;
//         setIsApproaching(true);
//       },

//       // 🧤 স্থানীয় ডিভাইস থেকে ডাইভ
//       triggerKeeperDive: (direction: 'left' | 'right' | 'center') => {
//         if (currentRole !== 'GOALKEEPER') return;

//         // 📡 প্রতিপক্ষ মোবাইলে ডাইভ ডাটা পাঠানো
//         if ((gameMode as string) === 'VS_PLAYER') {
//           network.send({ type: 'REMOTE_ACTION', action: 'DIVE', direction });
//         }

//         goalkeeperEngine.manualDive(direction);
//       },

//       // 📡 রিমোট ডিভাইস (Network) থেকে ডাটা রিসিভ করা
//       handleRemoteAction: (data: any) => {
//         if (data.action === 'KICK') {
//           if (stateRef.current.isKicked || isApproachingRef.current) return;
//           pendingFlickData.current = data.flickData;
//           setIsApproaching(true);
//         } else if (data.action === 'DIVE') {
//           goalkeeperEngine.manualDive(data.direction);
//         }
//       },

//       reset: () => {
//         resetNextTurn();
//         triggerAIShotIfNeeded();
//       },
//       restartMatch: () => {
//         matchManager.reset(gameMode, 5);
//         resetNextTurn();
//         triggerAIShotIfNeeded();
//       },
//       isKicked: () => stateRef.current.isKicked || isApproachingRef.current,
//     };
//   }, [currentRole, gameMode, goalkeeperEngine, resetNextTurn, triggerAIShotIfNeeded]);

//   // 🔄 Frame Loop
//   useFrame((_, delta) => {
//     const dt = Math.min(delta, 0.05);

//     // 🎥 প্রতি ফ্রেমে ক্যামেরা আপডেট
//     const cameraState = cameraManagerRef.current.update(dt, ball.position);

//     if (currentRole === 'GOALKEEPER') {
//       // 🧤 গোলকিপারের নিজস্ব ক্যামেরা পজিশন ও টার্গেট সেটআপ
//       camera.position.set(0, 2.2, GOAL_Z - 3.5);
//       camera.lookAt(ball.position.x * 0.5, ball.position.y + 0.5, ball.position.z);
//     } else {
//       camera.position.set(cameraState.position.x, cameraState.position.y, cameraState.position.z);
//       camera.lookAt(cameraState.target.x, cameraState.target.y, cameraState.target.z);
//     }

//     if ('fov' in camera && cameraState.fov) {
//       (camera as THREE.PerspectiveCamera).fov = cameraState.fov;
//       (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
//     }

//     if (stateRef.current.isKicked) {
//       ball.update(dt, sceneObjects);

//       // 🧤 কিপার আপডেট
//       if ((gameMode as string) === 'VS_PLAYER' || currentRole === 'GOALKEEPER') {
//         goalkeeperEngine.update(dt);
//       } else {
//         goalkeeperEngine.updateAI(ball.position, ball.velocity, dt);
//       }

//       // 🧤 সেভ চেক লজিক
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

//         syncScoreboard();

//         if (!stateRef.current.autoResetTimer && !matchManager.isGameOver) {
//           stateRef.current.autoResetTimer = setTimeout(() => {
//             resetNextTurn();
//             triggerAIShotIfNeeded();
//           }, 3500);
//         }
//       }

//       if (ballMeshRef.current) {
//         ballMeshRef.current.position.set(ball.position.x, ball.position.y, ball.position.z);
//         ballMeshRef.current.rotation.y += (ball.spin.y || 0) * dt;
//         ballMeshRef.current.rotation.x += ((ball.spin.x || 0) + ball.velocity.z) * dt * 0.1;
//       }
//     }
//   });

//   return (
//     <>
//       <ambientLight intensity={0.8} />
//       <directionalLight position={[10, 25, 15]} intensity={1.5} castShadow />

//       <FootballPitch />
//       <GoalPost positionZ={GOAL_Z} isGoalHit={stateRef.current.isGoal} />
//       <GoalPost positionZ={74} />

//       <GoalkeeperMesh keeperRef={stateRef} goalkeeperEngine={goalkeeperEngine} />
//       <PlayerMesh isRunning={isApproaching} isKicked={stateRef.current.isKicked} onKickHit={handleKickHit} />
//       <FootballMesh ballMeshRef={ballMeshRef} radius={ball.radius} />
//     </>
//   );
// }