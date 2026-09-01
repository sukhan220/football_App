
// // src/components/game/GameScene.tsx

// import {
//   Ball,
//   CameraManager,
//   CameraMode,
//   FieldPlayer,
//   GameMode,
//   Goalkeeper,
//   MatchManager,
// } from '@football/engine';

// import { useFrame, useThree } from '@react-three/fiber/native';

// import {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from 'react';

// import * as THREE from 'three';

// import {
//   GOAL_HEIGHT,
//   GOAL_WIDTH,
//   GOAL_Z,
//   NET_DEPTH,
//   POST_RADIUS,
// } from '@/constants/football';

// import { tcpNetwork } from '@/services/tcp-manager';
// import { udpNetwork } from '@/services/udp-manager';

// import { FootballMesh } from './football-mesh';
// import { FootballPitch } from './football-pitch';
// import { GoalPost } from './goal-post';
// import { GoalkeeperMesh } from './goalKeeper-mesh';
// import { PlayerMesh } from './player-mesh';
// import { network } from '@/services/tcp-manager';

// type PlayerRole = 'SHOOTER' | 'GOALKEEPER';

// interface GameSceneProps {
//   setDebugInfo: any;
//   matchControlRef: any;
//   gameMode: GameMode;
//   activeCameraMode: CameraMode;
//   userRole?: PlayerRole;
//   clientIp?: string;
// }

// export function GameScene({
//   setDebugInfo,
//   matchControlRef,
//   gameMode,
//   activeCameraMode,
//   userRole: initialUserRole,
//   clientIp = '',
// }: GameSceneProps) {
//   const { camera } = useThree();

//   const ballMeshRef = useRef<THREE.Mesh>(null!);

//   const ballEngineRef = useRef(
//     new Ball(
//       {
//         x: 0,
//         y: 0.2,
//         z: 0,
//       },
//       0.2
//     )
//   );

//   const keeperEngineRef = useRef(new Goalkeeper());
//   const matchManagerRef = useRef(new MatchManager(gameMode, 5));

//   const aiShooterRef = useRef(
//     new FieldPlayer('ai_shooter', {
//       x: -0.9,
//       y: 0,
//       z: 2.8,
//     })
//   );

//   const lastUdpSendTime = useRef<number>(0);
//   const currentTick = useRef<number>(0);

//   const [currentRole, setCurrentRole] = useState<PlayerRole>(
//     initialUserRole || 'SHOOTER'
//   );

//   const currentRoleRef = useRef<PlayerRole>(
//     initialUserRole || 'SHOOTER'
//   );

//   const updateRole = useCallback((newRole: PlayerRole) => {
//     currentRoleRef.current = newRole;
//     setCurrentRole(newRole);
//   }, []);

//   useEffect(() => {
//     if (initialUserRole) {
//       updateRole(initialUserRole);
//     }
//   }, [initialUserRole, updateRole]);

//   const pendingFlickData = useRef<any>(null);

//   const isApproachingRef = useRef(false);
//   const [isApproaching, setIsApproachingState] = useState(false);

//   const setIsApproaching = useCallback((value: boolean) => {
//     isApproachingRef.current = value;
//     setIsApproachingState(value);
//   }, []);

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

//   const cameraManagerRef = useRef<CameraManager>(
//     new CameraManager('SHOOTER')
//   );

//   const syncScoreboard = useCallback(() => {
//     const isUserKeeper = currentRoleRef.current === 'GOALKEEPER';

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
//       currentRole: currentRoleRef.current,
//     });
//   }, [matchManager, setDebugInfo]);

//   useEffect(() => {
//     let targetCameraMode = activeCameraMode;

//     if (currentRole === 'GOALKEEPER') {
//       targetCameraMode = 'KEEPER';
//     } else {
//       if (activeCameraMode === ('KEEPER_VIEW' as CameraMode)) {
//         targetCameraMode = 'SHOOTER';
//       } else {
//         targetCameraMode = activeCameraMode;
//       }
//     }

//     cameraManagerRef.current.setMode(targetCameraMode);
//   }, [activeCameraMode, currentRole]);

//   const sceneObjects = {
//     posts: [
//       {
//         start: { x: -GOAL_WIDTH / 2, y: 0, z: GOAL_Z },
//         end: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z },
//         radius: POST_RADIUS,
//       },
//       {
//         start: { x: GOAL_WIDTH / 2, y: 0, z: GOAL_Z },
//         end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z },
//         radius: POST_RADIUS,
//       },
//       {
//         start: { x: -GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z },
//         end: { x: GOAL_WIDTH / 2, y: GOAL_HEIGHT, z: GOAL_Z },
//         radius: POST_RADIUS,
//       },
//     ],
//     net: {
//       minX: -GOAL_WIDTH / 2,
//       maxX: GOAL_WIDTH / 2,
//       minY: 0,
//       maxY: GOAL_HEIGHT,
//       minZ: GOAL_Z - NET_DEPTH,
//       maxZ: GOAL_Z - 0.05,
//     },
//   };

//   const triggerAIShotIfNeeded = useCallback(() => {
//     if ((gameMode as string) === 'VS_PLAYER' || matchManager.isGameOver) {
//       return;
//     }

//     const isAIShooter =
//       matchManager.currentShooter === 'AI' ||
//       (gameMode as string) === 'GOALKEEPER';

//     if (
//       !isAIShooter ||
//       stateRef.current.isKicked ||
//       isApproachingRef.current
//     ) {
//       return;
//     }

//     if (aiShotTimer.current) clearTimeout(aiShotTimer.current);

//     aiShotTimer.current = setTimeout(() => {
//       if (stateRef.current.isKicked || isApproachingRef.current) return;

//       const aiShot = aiShooterRef.current.generateAIShot();
//       if (!aiShot) return;

//       pendingFlickData.current = aiShot;
//       setIsApproaching(true);
//     }, 2500);
//   }, [gameMode, matchManager, setIsApproaching]);

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
//     currentTick.current = 0;

//     if (ballMeshRef.current) {
//       ballMeshRef.current.position.set(
//         ball.position.x,
//         ball.position.y,
//         ball.position.z
//       );
//       ballMeshRef.current.rotation.set(0, 0, 0);
//     }

//     if ((gameMode as string) === 'VS_PLAYER') {
//       const nextRole =
//         currentRoleRef.current === 'SHOOTER' ? 'GOALKEEPER' : 'SHOOTER';
//       updateRole(nextRole);
//     }

//     syncScoreboard();
//   }, [ball, gameMode, goalkeeperEngine, setIsApproaching, syncScoreboard, updateRole]);

//   useEffect(() => {
//     matchManager.setGameMode(gameMode, 5);
//     resetNextTurn();
//     triggerAIShotIfNeeded();
//   }, [gameMode, matchManager, resetNextTurn, triggerAIShotIfNeeded]);

//   const handleKickHit = useCallback(() => {
//     if (!pendingFlickData.current) return;

//     const raw = pendingFlickData.current;

//     if (raw.deltaX !== undefined && raw.deltaY !== undefined) {
//       ball.kickFromSwipe(raw);
//     } else if (raw.velocity) {
//       let velZ = raw.velocity.z;
//       if (velZ > 0) velZ = -velZ;

//       ball.applyKick(
//         { x: raw.velocity.x, y: raw.velocity.y, z: velZ },
//         raw.spin || { x: 0, y: 0, z: 0 }
//       );
//     }

//     if (
//       (gameMode as string) !== 'VS_PLAYER' &&
//       currentRoleRef.current !== 'GOALKEEPER'
//     ) {
//       goalkeeperEngine.predictShot({
//         ballPos: ball.position,
//         ballVel: ball.velocity,
//         ballSpin: ball.spin,
//       });
//     }

//     stateRef.current.isKicked = true;
//     setIsApproaching(false);
//     syncScoreboard();
//   }, [ball, gameMode, goalkeeperEngine, setIsApproaching, syncScoreboard]);

//   const handleRemoteAction = useCallback(
//     (data: any) => {
//       if (!data || !data.action) return;

//       if (data.action === 'KICK') {
//         if (stateRef.current.isKicked || isApproachingRef.current) return;
//         pendingFlickData.current = data.flickData;
//         setIsApproaching(true);
//       } else if (data.action === 'DIVE') {
//         if (data.direction) {
//           goalkeeperEngine.manualDive(data.direction);
//         }
//       }
//     },
//     [goalkeeperEngine, setIsApproaching]
//   );

//   useEffect(() => {
//     matchControlRef.current = {
//       kick: (flickData: any) => {
//         if (
//           currentRoleRef.current !== 'SHOOTER' ||
//           stateRef.current.isKicked ||
//           isApproachingRef.current
//         ) {
//           return;
//         }

//         if (stateRef.current.autoResetTimer) {
//           clearTimeout(stateRef.current.autoResetTimer);
//           stateRef.current.autoResetTimer = null;
//         }

//         if ((gameMode as string) === 'VS_PLAYER') {
//           tcpNetwork.send({
//             type: 'REMOTE_ACTION',
//             action: 'KICK',
//             flickData,
//           });
//         }

//         pendingFlickData.current = flickData;
//         setIsApproaching(true);
//       },

//       triggerKeeperDive: (direction: 'left' | 'right' | 'center') => {
//         if (currentRoleRef.current !== 'GOALKEEPER') {
//           return;
//         }

//         if ((gameMode as string) === 'VS_PLAYER') {
//           tcpNetwork.send({
//             type: 'REMOTE_ACTION',
//             action: 'DIVE',
//             direction,
//           });
//         }

//         goalkeeperEngine.manualDive(direction);
//       },

//       handleRemoteAction,

//       reset: () => {
//         resetNextTurn();
//         triggerAIShotIfNeeded();
//       },

//       restartMatch: () => {
//         matchManager.reset(gameMode, 5);
//         if ((gameMode as string) === 'VS_PLAYER' && initialUserRole) {
//           updateRole(initialUserRole);
//         }
//         resetNextTurn();
//         triggerAIShotIfNeeded();
//       },

//       isKicked: () => {
//         return stateRef.current.isKicked || isApproachingRef.current;
//       },
//     };
//   }, [
//     gameMode,
//     goalkeeperEngine,
//     handleRemoteAction,
//     initialUserRole,
//     matchControlRef,
//     matchManager,
//     resetNextTurn,
//     setIsApproaching,
//     triggerAIShotIfNeeded,
//     updateRole,
//   ]);

//   /*
//    * 📡 SUBSCRIBE TO TCP & UDP MESSAGES
//    */
// // SUBSCRIBE TO TCP & UDP MESSAGES
// // SUBSCRIBE TO TCP & UDP MESSAGES
// useEffect(() => {
//   if ((gameMode as string) !== 'VS_PLAYER') return;

//   const unsubscribeTcp: () => void = network.onMessage((rawData: any) => {
//     try {
//       const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
//       const data = parsed?.payload || parsed?.data || parsed;

//       if (data?.type === 'REMOTE ACTION') {
//         handleRemoteAction(data);
//       }
//     } catch (error) {
//       console.warn('TCP Payload parse error:', error);
//     }
//   });

//   return () => {
//     if (typeof unsubscribeTcp === 'function') {
//       unsubscribeTcp();
//     }
//   };
// }, [gameMode, handleRemoteAction]);
  

//   useEffect(() => {
//     return () => {
//       if (aiShotTimer.current) clearTimeout(aiShotTimer.current);
//       if (stateRef.current.autoResetTimer) clearTimeout(stateRef.current.autoResetTimer);
//     };
//   }, []);

//   /*
//    * 🔄 GAME LOOP (R3F)
//    */
//   useFrame((_, delta) => {
//     const dt = Math.min(delta, 0.05);

//     // Camera updates
//     if (currentRoleRef.current === 'GOALKEEPER') {
//       camera.position.set(0, 1.8, GOAL_Z - 2.8);
//       camera.lookAt(
//         ball.position.x * 0.5,
//         ball.position.y + 0.5,
//         ball.position.z
//       );
//     } else {
//       const cameraState = cameraManagerRef.current.update(dt, ball.position);
//       camera.position.set(
//         cameraState.position.x,
//         cameraState.position.y,
//         cameraState.position.z
//       );
//       camera.lookAt(
//         cameraState.target.x,
//         cameraState.target.y,
//         cameraState.target.z
//       );
//     }

//     if ('fov' in camera) {
//       (camera as THREE.PerspectiveCamera).fov = 60;
//       (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
//     }

//     // Physics Update Logic
//     if ((gameMode as string) !== 'VS_PLAYER' || tcpNetwork.isHost) {
//       if (stateRef.current.isKicked) {
//         ball.update(dt, sceneObjects);
//       }

//       if (
//         (gameMode as string) === 'VS_PLAYER' ||
//         currentRoleRef.current === 'GOALKEEPER'
//       ) {
//         goalkeeperEngine.update(dt);
//       } else {
//         goalkeeperEngine.updateAI(ball.position, ball.velocity, dt);
//       }

//       // UDP Snapshot Sender
//       if ((gameMode as string) === 'VS_PLAYER' && clientIp) {
//         const now = Date.now();
//         if (now - lastUdpSendTime.current >= 50) {
//           lastUdpSendTime.current = now;
//           currentTick.current += 1;

//           udpNetwork.sendEngineSnapshot(
//             clientIp,
//             {
//               ball: { pos: { x: ball.position.x, y: ball.position.y, z: ball.position.z } },
//               keeper: { pos: { x: goalkeeperEngine.position.x, y: goalkeeperEngine.position.y, z: goalkeeperEngine.position.z } }
//             },
//             currentTick.current
//           );
//         }
//       }
//     }

//     // Collision Check
//     if (stateRef.current.isKicked) {
//       if (
//         !stateRef.current.isSaved &&
//         goalkeeperEngine.checkSave(ball.position, ball.radius)
//       ) {
//         stateRef.current.isSaved = true;
//         ball.velocity.x = (ball.position.x - goalkeeperEngine.position.x) * 3.5;
//         ball.velocity.z = Math.abs(ball.velocity.z) * 0.5;
//         ball.velocity.y = Math.abs(ball.velocity.y) * 0.3 + 2.0;
//       }

//       const isBallPassedGoal = ball.position.z <= GOAL_Z - (NET_DEPTH - 0.2);
//       const isBallHitGroundAfterSaved =
//         stateRef.current.isSaved && ball.position.y < 0.25;
//       const isBallStopped =
//         Math.abs(ball.velocity.z) < 0.05 && Math.abs(ball.velocity.x) < 0.05;

//       if (
//         (isBallPassedGoal || isBallHitGroundAfterSaved || isBallStopped) &&
//         !stateRef.current.shotFinished
//       ) {
//         stateRef.current.shotFinished = true;

//         const result = matchManager.evaluateShot(
//           ball.position,
//           stateRef.current.isSaved
//         );
//         stateRef.current.isGoal = result.isGoal;

//         syncScoreboard();

//         if (
//           !stateRef.current.autoResetTimer &&
//           !matchManager.isGameOver
//         ) {
//           stateRef.current.autoResetTimer = setTimeout(() => {
//             resetNextTurn();
//             triggerAIShotIfNeeded();
//           }, 3500);
//         }
//       }
//     }

//     // Render Mesh position update
//     if (ballMeshRef.current) {
//       ballMeshRef.current.position.set(
//         ball.position.x,
//         ball.position.y,
//         ball.position.z
//       );
//       if (stateRef.current.isKicked) {
//         ballMeshRef.current.rotation.y += (ball.spin.y || 0) * dt;
//         ballMeshRef.current.rotation.x +=
//           ((ball.spin.x || 0) + ball.velocity.z) * dt * 0.1;
//       }
//     }
//   });

//   return (
//     <>
//       <ambientLight intensity={0.8} />
//       <directionalLight
//         position={[10, 25, 15]}
//         intensity={1.5}
//         castShadow
//       />

//       <FootballPitch />

//       <GoalPost positionZ={GOAL_Z} isGoalHit={stateRef.current.isGoal} />
//       <GoalPost positionZ={74} />

//       <GoalkeeperMesh
//         keeperRef={stateRef}
//         goalkeeperEngine={goalkeeperEngine}
//       />

//       <PlayerMesh
//         isRunning={isApproaching}
//         isKicked={stateRef.current.isKicked}
//         onKickHit={handleKickHit}
//       />

//       <FootballMesh ballMeshRef={ballMeshRef} radius={ball.radius} />
//     </>
//   );
// }