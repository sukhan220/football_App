


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

// import { network } from '@/services/multiplayer';

// import { FootballMesh } from './football-mesh';
// import { FootballPitch } from './football-pitch';
// import { GoalPost } from './goal-post';
// import { GoalkeeperMesh } from './goalKeeper-mesh';
// import { PlayerMesh } from './player-mesh';

// type PlayerRole =
//   | 'SHOOTER'
//   | 'GOALKEEPER';

// interface GameSceneProps {
//   setDebugInfo: any;
//   matchControlRef: any;

//   gameMode: GameMode;

//   activeCameraMode: CameraMode;

//   userRole?: PlayerRole;
// }

// export function GameScene({
//   setDebugInfo,
//   matchControlRef,
//   gameMode,
//   activeCameraMode,
//   userRole: initialUserRole,
// }: GameSceneProps) {
//   const { camera } = useThree();

//   /*
//    * ---------------------------------------------------------
//    * ENGINE
//    * ---------------------------------------------------------
//    */

//   const ballMeshRef =
//     useRef<THREE.Mesh>(null!);

//   const ballEngineRef =
//     useRef(
//       new Ball(
//         {
//           x: 0,
//           y: 0.2,
//           z: 0,
//         },
//         0.2
//       )
//     );

//   const keeperEngineRef =
//     useRef(new Goalkeeper());

//   const matchManagerRef =
//     useRef(
//       new MatchManager(
//         gameMode,
//         5
//       )
//     );

//   const aiShooterRef =
//     useRef(
//       new FieldPlayer(
//         'ai_shooter',
//         {
//           x: -0.9,
//           y: 0,
//           z: 2.8,
//         }
//       )
//     );

//   /*
//    * ---------------------------------------------------------
//    * ROLE
//    * ---------------------------------------------------------
//    */

//   const [currentRole, setCurrentRole] =
//     useState<PlayerRole>(
//       initialUserRole || 'SHOOTER'
//     );

//   const currentRoleRef =
//     useRef<PlayerRole>(
//       initialUserRole || 'SHOOTER'
//     );

//   /*
//    * Initial role changes from multiplayer flow
//    */
//   useEffect(() => {
//     if (!initialUserRole) {
//       return;
//     }

//     console.log(initialUserRole);

//     setCurrentRole(initialUserRole);

//     currentRoleRef.current =
//       initialUserRole;
//   }, [initialUserRole]);

//   /*
//    * Keep ref synced
//    */
//   useEffect(() => {
//     currentRoleRef.current =
//       currentRole;
//   }, [currentRole]);

//   /*
//    * ---------------------------------------------------------
//    * BALL / SHOT STATE
//    * ---------------------------------------------------------
//    */

//   const pendingFlickData =
//     useRef<any>(null);

//   const isApproachingRef =
//     useRef(false);

//   const [isApproaching, setIsApproachingState] =
//     useState(false);

//   const setIsApproaching =
//     useCallback((value: boolean) => {
//       isApproachingRef.current =
//         value;

//       setIsApproachingState(value);
//     }, []);

//   /*
//    * ---------------------------------------------------------
//    * TIMERS
//    * ---------------------------------------------------------
//    */

//   const aiShotTimer =
//     useRef<ReturnType<typeof setTimeout> | null>(
//       null
//     );

//   /*
//    * ---------------------------------------------------------
//    * SHOT STATE
//    * ---------------------------------------------------------
//    */

//   const stateRef =
//     useRef<{
//       isKicked: boolean;
//       isSaved: boolean;
//       isGoal: boolean;
//       shotFinished: boolean;
//       autoResetTimer:
//         ReturnType<typeof setTimeout> | null;
//     }>({
//       isKicked: false,
//       isSaved: false,
//       isGoal: false,
//       shotFinished: false,
//       autoResetTimer: null,
//     });

//   /*
//    * ---------------------------------------------------------
//    * ENGINE REFERENCES
//    * ---------------------------------------------------------
//    */

//   const goalkeeperEngine =
//     keeperEngineRef.current;

//   const ball =
//     ballEngineRef.current;

//   const matchManager =
//     matchManagerRef.current;

//   /*
//    * ---------------------------------------------------------
//    * CAMERA
//    * ---------------------------------------------------------
//    */

//   const cameraManagerRef =
//     useRef<CameraManager>(
//       new CameraManager('SHOOTER')
//     );

//   /*
//    * ---------------------------------------------------------
//    * SCOREBOARD SYNC
//    * ---------------------------------------------------------
//    */

//   const syncScoreboard =
//     useCallback(() => {
//       const isUserKeeper =
//         currentRoleRef.current ===
//         'GOALKEEPER';

//       setDebugInfo({
//         isKicked:
//           stateRef.current.isKicked,

//         currentShooter:
//           matchManager.currentShooter,

//         currentKeeper:
//           matchManager.currentKeeper,

//         currentRound:
//           matchManager.currentRound,

//         p1Shots: [
//           ...(matchManager.p1History || []),
//         ],

//         p2Shots: [
//           ...(matchManager.p2History || []),
//         ],

//         isGameOver:
//           matchManager.isGameOver,

//         winner:
//           matchManager.winner,

//         isSuddenDeath:
//           matchManager.isSuddenDeath,

//         isUserKeeper,

//         currentRole:
//           currentRoleRef.current,
//       });
//     }, [
//       matchManager,
//       setDebugInfo,
//     ]);

//   /*
//    * ---------------------------------------------------------
//    * CAMERA ROLE
//    * ---------------------------------------------------------
//    */

//   useEffect(() => {
//     let targetCameraMode =
//       activeCameraMode;

//     if (
//       currentRole ===
//       'GOALKEEPER'
//     ) {
//       targetCameraMode =
//         'KEEPER';
//     } else {
//       if (
//         activeCameraMode ===
//         ('KEEPER_VIEW' as CameraMode)
//       ) {
//         targetCameraMode =
//           'SHOOTER';
//       } else {
//         targetCameraMode =
//           activeCameraMode;
//       }
//     }

//     cameraManagerRef.current.setMode(
//       targetCameraMode
//     );
//   }, [
//     activeCameraMode,
//     currentRole,
//   ]);

//   /*
//    * ---------------------------------------------------------
//    * FIELD COLLISION OBJECTS
//    * ---------------------------------------------------------
//    */

//   const sceneObjects = {
//     posts: [
//       {
//         start: {
//           x: -GOAL_WIDTH / 2,
//           y: 0,
//           z: GOAL_Z,
//         },

//         end: {
//           x: -GOAL_WIDTH / 2,
//           y: GOAL_HEIGHT,
//           z: GOAL_Z,
//         },

//         radius: POST_RADIUS,
//       },

//       {
//         start: {
//           x: GOAL_WIDTH / 2,
//           y: 0,
//           z: GOAL_Z,
//         },

//         end: {
//           x: GOAL_WIDTH / 2,
//           y: GOAL_HEIGHT,
//           z: GOAL_Z,
//         },

//         radius: POST_RADIUS,
//       },

//       {
//         start: {
//           x: -GOAL_WIDTH / 2,
//           y: GOAL_HEIGHT,
//           z: GOAL_Z,
//         },

//         end: {
//           x: GOAL_WIDTH / 2,
//           y: GOAL_HEIGHT,
//           z: GOAL_Z,
//         },

//         radius: POST_RADIUS,
//       },
//     ],

//     net: {
//       minX: -GOAL_WIDTH / 2,
//       maxX: GOAL_WIDTH / 2,

//       minY: 0,
//       maxY: GOAL_HEIGHT,

//       minZ:
//         GOAL_Z - NET_DEPTH,

//       maxZ:
//         GOAL_Z - 0.05,
//     },
//   };

//   /*
//    * ---------------------------------------------------------
//    * AI SHOT
//    * ---------------------------------------------------------
//    */

//   const triggerAIShotIfNeeded =
//     useCallback(() => {
//       /*
//        * Local multiplayer কখনো AI shot করবে না।
//        */
//       if (
//         (gameMode as string) ===
//         'VS_PLAYER'
//       ) {
//         return;
//       }

//       /*
//        * Match শেষ হলে AI shot বন্ধ।
//        */
//       if (
//         matchManager.isGameOver
//       ) {
//         return;
//       }

//       /*
//        * VS_AI:
//        *
//        * MatchManager যদি AI-কে shooter করে,
//        * অথবা current user goalkeeper হয়,
//        * তাহলে AI shot করবে।
//        */
//       const isAIShooter =
//         matchManager.currentShooter ===
//           'AI' ||
//         (gameMode as string) ===
//           'GOALKEEPER';

//       if (
//         !isAIShooter ||
//         stateRef.current.isKicked ||
//         isApproachingRef.current
//       ) {
//         return;
//       }

//       if (aiShotTimer.current) {
//         clearTimeout(
//           aiShotTimer.current
//         );
//       }

//       aiShotTimer.current =
//         setTimeout(() => {
//           if (
//             stateRef.current.isKicked ||
//             isApproachingRef.current
//           ) {
//             return;
//           }

//           const aiShot =
//             aiShooterRef.current.generateAIShot();

//           if (!aiShot) {
//             return;
//           }

//           pendingFlickData.current =
//             aiShot;

//           setIsApproaching(true);
//         }, 2500);
//     }, [
//       gameMode,
//       matchManager,
//       setIsApproaching,
//     ]);

//   /*
//    * ---------------------------------------------------------
//    * RESET TURN
//    * ---------------------------------------------------------
//    */

//   const resetNextTurn =
//     useCallback(() => {
//       /*
//        * Clear reset timer
//        */
//       if (
//         stateRef.current
//           .autoResetTimer
//       ) {
//         clearTimeout(
//           stateRef.current.autoResetTimer
//         );

//         stateRef.current
//           .autoResetTimer = null;
//       }

//       /*
//        * Clear AI timer
//        */
//       if (aiShotTimer.current) {
//         clearTimeout(
//           aiShotTimer.current
//         );

//         aiShotTimer.current =
//           null;
//       }

//       /*
//        * Reset ball
//        */
//       ball.reset();

//       /*
//        * Reset goalkeeper
//        */
//       goalkeeperEngine.reset();

//       goalkeeperEngine.position.z =
//         GOAL_Z + 0.2;

//       /*
//        * Reset shot state
//        */
//       stateRef.current.isKicked =
//         false;

//       stateRef.current.isSaved =
//         false;

//       stateRef.current.isGoal =
//         false;

//       stateRef.current.shotFinished =
//         false;

//       /*
//        * Reset approaching player
//        */
//       setIsApproaching(false);

//       pendingFlickData.current =
//         null;

//       /*
//        * Reset visual ball
//        */
//       if (
//         ballMeshRef.current
//       ) {
//         ballMeshRef.current.position.set(
//           ball.position.x,
//           ball.position.y,
//           ball.position.z
//         );

//         ballMeshRef.current.rotation.set(
//           0,
//           0,
//           0
//         );
//       }

//       /*
//        * -----------------------------------------------------
//        * LOCAL 2 PLAYER
//        *
//        * প্রতি shot শেষে role swap:
//        *
//        * SHOOTER -> GOALKEEPER
//        * GOALKEEPER -> SHOOTER
//        * -----------------------------------------------------
//        */
//       if (
//         (gameMode as string) ===
//         'VS_PLAYER'
//       ) {
//         setCurrentRole(
//           previous =>
//             previous ===
//             'SHOOTER'
//               ? 'GOALKEEPER'
//               : 'SHOOTER'
//         );
//       }

//       syncScoreboard();
//     }, [
//       ball,
//       gameMode,
//       goalkeeperEngine,
//       setIsApproaching,
//       syncScoreboard,
//     ]);

//   /*
//    * ---------------------------------------------------------
//    * GAME MODE CHANGE
//    * ---------------------------------------------------------
//    */

//   useEffect(() => {
//     matchManager.setGameMode(
//       gameMode,
//       5
//     );

//     resetNextTurn();

//     triggerAIShotIfNeeded();
//   }, [
//     gameMode,
//     matchManager,
//     resetNextTurn,
//     triggerAIShotIfNeeded,
//   ]);

//   /*
//    * ---------------------------------------------------------
//    * ACTUAL KICK
//    * ---------------------------------------------------------
//    */

//   const handleKickHit =
//     useCallback(() => {
//       if (
//         !pendingFlickData.current
//       ) {
//         return;
//       }

//       const raw =
//         pendingFlickData.current;

//       /*
//        * Swipe data
//        */
//       if (
//         raw.deltaX !== undefined &&
//         raw.deltaY !== undefined
//       ) {
//         ball.kickFromSwipe(raw);
//       }

//       /*
//        * Velocity data
//        */
//       else if (raw.velocity) {
//         let velZ =
//           raw.velocity.z;

//         /*
//          * Ball must travel toward goal.
//          */
//         if (velZ > 0) {
//           velZ = -velZ;
//         }

//         ball.applyKick(
//           {
//             x: raw.velocity.x,
//             y: raw.velocity.y,
//             z: velZ,
//           },

//           raw.spin || {
//             x: 0,
//             y: 0,
//             z: 0,
//           }
//         );
//       }

//       /*
//        * AI goalkeeper prediction
//        *
//        * Local player mode-এ prediction নেই।
//        */
//       if (
//         (gameMode as string) !==
//           'VS_PLAYER' &&
//         currentRoleRef.current !==
//           'GOALKEEPER'
//       ) {
//         goalkeeperEngine.predictShot({
//           ballPos:
//             ball.position,

//           ballVel:
//             ball.velocity,

//           ballSpin:
//             ball.spin,
//         });
//       }

//       stateRef.current.isKicked =
//         true;

//       setIsApproaching(false);

//       syncScoreboard();
//     }, [
//       ball,
//       gameMode,
//       goalkeeperEngine,
//       setIsApproaching,
//       syncScoreboard,
//     ]);

//   /*
//    * ---------------------------------------------------------
//    * MATCH CONTROL
//    * ---------------------------------------------------------
//    */

//   useEffect(() => {
//     matchControlRef.current = {

//       /*
//        * Shooter kick
//        */
//       kick: (flickData: any) => {
//         /*
//          * Only shooter can kick.
//          */
//         if (
//           currentRoleRef.current !==
//             'SHOOTER' ||
//           stateRef.current.isKicked ||
//           isApproachingRef.current
//         ) {
//           console.warn(
//             'Kick blocked. Current role:',
//             currentRoleRef.current
//           );

//           return;
//         }

//         /*
//          * Cancel pending auto reset.
//          */
//         if (
//           stateRef.current
//             .autoResetTimer
//         ) {
//           clearTimeout(
//             stateRef.current
//               .autoResetTimer
//           );

//           stateRef.current
//             .autoResetTimer = null;
//         }

//         /*
//          * Local multiplayer:
//          * send kick to opponent.
//          */
//         if (
//           (gameMode as string) ===
//           'VS_PLAYER'
//         ) {
//           network.send({
//             type: 'REMOTE_ACTION',

//             action: 'KICK',

//             flickData,
//           });
//         }

//         /*
//          * Play kick locally.
//          */
//         pendingFlickData.current =
//           flickData;

//         setIsApproaching(true);
//       },

//       /*
//        * Goalkeeper dive
//        */
//       triggerKeeperDive: (
//         direction:
//           | 'left'
//           | 'right'
//           | 'center'
//       ) => {
//         /*
//          * Only goalkeeper can dive.
//          */
//         if (
//           currentRoleRef.current !==
//           'GOALKEEPER'
//         ) {
//           return;
//         }

//         /*
//          * Send dive to opponent.
//          */
//         if (
//           (gameMode as string) ===
//           'VS_PLAYER'
//         ) {
//           network.send({
//             type: 'REMOTE_ACTION',

//             action: 'DIVE',

//             direction,
//           });
//         }

//         /*
//          * Apply locally.
//          */
//         goalkeeperEngine.manualDive(
//           direction
//         );
//       },

//       /*
//        * -----------------------------------------------------
//        * REMOTE ACTION
//        * -----------------------------------------------------
//        */

//       handleRemoteAction: (
//         data: any
//       ) => {
//         if (!data) {
//           return;
//         }

//         /*
//          * Remote KICK
//          */
//         if (
//           data.action === 'KICK'
//         ) {
//           if (
//             stateRef.current.isKicked ||
//             isApproachingRef.current
//           ) {
//             return;
//           }

//           pendingFlickData.current =
//             data.flickData;

//           setIsApproaching(true);

//           return;
//         }

//         /*
//          * Remote DIVE
//          */
//         if (
//           data.action === 'DIVE'
//         ) {
//           goalkeeperEngine.manualDive(
//             data.direction
//           );

//           return;
//         }
//       },

//       /*
//        * Reset current turn
//        */
//       reset: () => {
//         resetNextTurn();

//         triggerAIShotIfNeeded();
//       },

//       /*
//        * Restart whole match
//        */
//       restartMatch: () => {
//         matchManager.reset(
//           gameMode,
//           5
//         );

//         /*
//          * Restart multiplayer role
//          * from initial role.
//          */
//         if (
//           (gameMode as string) ===
//           'VS_PLAYER' &&
//           initialUserRole
//         ) {
//           setCurrentRole(
//             initialUserRole
//           );

//           currentRoleRef.current =
//             initialUserRole;
//         }

//         resetNextTurn();

//         triggerAIShotIfNeeded();
//       },

//       /*
//        * Is shot currently active?
//        */
//       isKicked: () => {
//         return (
//           stateRef.current
//             .isKicked ||
//           isApproachingRef.current
//         );
//       },
//     };
//   }, [
//     gameMode,
//     goalkeeperEngine,
//     initialUserRole,
//     matchControlRef,
//     matchManager,
//     resetNextTurn,
//     setIsApproaching,
//     triggerAIShotIfNeeded,
//   ]);

//   /*
//    * ---------------------------------------------------------
//    * CLEANUP
//    * ---------------------------------------------------------
//    */

//   useEffect(() => {
//     return () => {
//       if (aiShotTimer.current) {
//         clearTimeout(
//           aiShotTimer.current
//         );

//         aiShotTimer.current =
//           null;
//       }

//       if (
//         stateRef.current
//           .autoResetTimer
//       ) {
//         clearTimeout(
//           stateRef.current
//             .autoResetTimer
//         );

//         stateRef.current
//           .autoResetTimer = null;
//       }
//     };
//   }, []);

//   /*
//    * ---------------------------------------------------------
//    * GAME LOOP
//    * ---------------------------------------------------------
//    */

//   useFrame((_, delta) => {
//     const dt =
//       Math.min(delta, 0.05);

//     /*
//      * -----------------------------------------------------
//      * CAMERA
//      * -----------------------------------------------------
//      */

//     if (
//       currentRoleRef.current ===
//       'GOALKEEPER'
//     ) {
//       camera.position.set(
//         0,
//         1.8,
//         GOAL_Z - 2.8
//       );

//       camera.lookAt(
//         ball.position.x * 0.5,
//         ball.position.y + 0.5,
//         ball.position.z
//       );
//     } else {
//       const cameraState =
//         cameraManagerRef.current.update(
//           dt,
//           ball.position
//         );

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

//     /*
//      * Camera FOV
//      */
//     if ('fov' in camera) {
//       (
//         camera as THREE.PerspectiveCamera
//       ).fov = 60;

//       (
//         camera as THREE.PerspectiveCamera
//       ).updateProjectionMatrix();
//     }

//     /*
//      * -----------------------------------------------------
//      * BALL
//      * -----------------------------------------------------
//      */

//     if (
//       stateRef.current.isKicked
//     ) {
//       ball.update(
//         dt,
//         sceneObjects
//       );

//       /*
//        * Multiplayer:
//        * real goalkeeper physics.
//        *
//        * VS AI:
//        * AI goalkeeper physics.
//        */
//       if (
//         (gameMode as string) ===
//           'VS_PLAYER' ||
//         currentRoleRef.current ===
//           'GOALKEEPER'
//       ) {
//         goalkeeperEngine.update(
//           dt
//         );
//       } else {
//         goalkeeperEngine.updateAI(
//           ball.position,
//           ball.velocity,
//           dt
//         );
//       }

//       /*
//        * ---------------------------------------------------
//        * SAVE CHECK
//        * ---------------------------------------------------
//        */

//       if (
//         !stateRef.current
//           .isSaved &&
//         goalkeeperEngine.checkSave(
//           ball.position,
//           ball.radius
//         )
//       ) {
//         stateRef.current.isSaved =
//           true;

//         ball.velocity.x =
//           (
//             ball.position.x -
//             goalkeeperEngine.position.x
//           ) * 3.5;

//         ball.velocity.z =
//           Math.abs(
//             ball.velocity.z
//           ) * 0.5;

//         ball.velocity.y =
//           Math.abs(
//             ball.velocity.y
//           ) * 0.3 + 2.0;
//       }

//       /*
//        * ---------------------------------------------------
//        * SHOT FINISH
//        * ---------------------------------------------------
//        */

//       const isBallPassedGoal =
//         ball.position.z <=
//         GOAL_Z -
//           (NET_DEPTH - 0.2);

//       const isBallHitGroundAfterSaved =
//         stateRef.current.isSaved &&
//         ball.position.y < 0.25;

//       const isBallStopped =
//         Math.abs(
//           ball.velocity.z
//         ) < 0.05 &&
//         Math.abs(
//           ball.velocity.x
//         ) < 0.05;

//       if (
//         (
//           isBallPassedGoal ||
//           isBallHitGroundAfterSaved ||
//           isBallStopped
//         ) &&
//         !stateRef.current
//           .shotFinished
//       ) {
//         stateRef.current.shotFinished =
//           true;

//         /*
//          * Evaluate match result.
//          */
//         const result =
//           matchManager.evaluateShot(
//             ball.position,
//             stateRef.current.isSaved
//           );

//         stateRef.current.isGoal =
//           result.isGoal;

//         syncScoreboard();

//         /*
//          * -------------------------------------------------
//          * NEXT TURN
//          * -------------------------------------------------
//          *
//          * 3.5 sec পরে:
//          *
//          * Local:
//          * SHOOTER <-> GOALKEEPER
//          *
//          * AI:
//          * MatchManager অনুযায়ী পরের turn
//          * -------------------------------------------------
//          */

//         if (
//           !stateRef.current
//             .autoResetTimer &&
//           !matchManager.isGameOver
//         ) {
//           stateRef.current
//             .autoResetTimer =
//             setTimeout(() => {
//               resetNextTurn();

//               triggerAIShotIfNeeded();
//             }, 3500);
//         }
//       }

//       /*
//        * ---------------------------------------------------
//        * BALL MESH
//        * ---------------------------------------------------
//        */

//       if (
//         ballMeshRef.current
//       ) {
//         ballMeshRef.current.position.set(
//           ball.position.x,
//           ball.position.y,
//           ball.position.z
//         );

//         ballMeshRef.current.rotation.y +=
//           (ball.spin.y || 0) *
//           dt;

//         ballMeshRef.current.rotation.x +=
//           (
//             (ball.spin.x || 0) +
//             ball.velocity.z
//           ) *
//           dt *
//           0.1;
//       }
//     }
//   });

//   /*
//    * ---------------------------------------------------------
//    * SCENE
//    * ---------------------------------------------------------
//    */

//   return (
//     <>
//       <ambientLight
//         intensity={0.8}
//       />

//       <directionalLight
//         position={[
//           10,
//           25,
//           15,
//         ]}
//         intensity={1.5}
//         castShadow
//       />

//       <FootballPitch />

//       <GoalPost
//         positionZ={GOAL_Z}
//         isGoalHit={
//           stateRef.current.isGoal
//         }
//       />

//       <GoalPost
//         positionZ={74}
//       />

//       <GoalkeeperMesh
//         keeperRef={stateRef}
//         goalkeeperEngine={
//           goalkeeperEngine
//         }
//       />

//       <PlayerMesh
//         isRunning={
//           isApproaching
//         }

//         isKicked={
//           stateRef.current
//             .isKicked
//         }

//         onKickHit={
//           handleKickHit
//         }
//       />

//       <FootballMesh
//         ballMeshRef={
//           ballMeshRef
//         }

//         radius={
//           ball.radius
//         }
//       />
//     </>
//   );
// }