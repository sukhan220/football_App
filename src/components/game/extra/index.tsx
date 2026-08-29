
// // // football-test/src/app/index.tsx

// // import { CameraMode, GameMode } from '@football/engine';
// // import { Canvas } from '@react-three/fiber/native';
// // import { useEffect, useMemo, useRef, useState } from 'react';
// // import { Animated, PanResponder, View } from 'react-native';

// // import { GameOverModal } from '@/components/game/game-over-modal';
// // import { GameScene } from '@/components/game/game-scene';
// // import { ModeSwitcher } from '@/components/game/mode-switcher';
// // import { Scoreboard } from '@/components/game/scoreboard';
// // import { network } from '@/services/multiplayer';
// // import { styles } from '@/styles/appStyles';

// // export default function App() {
// //   const [gameMode, setGameMode] = useState<GameMode>('VS_AI');
// //   const [showGameOverModal, setShowGameOverModal] = useState(false);
// //   const fadeAnim = useRef(new Animated.Value(0)).current;

// //   const [debugInfo, setDebugInfo] = useState<any>({
// //     posX: '0.00',
// //     posY: '0.00',
// //     posZ: '0.00',
// //     isKicked: false,
// //     currentShooter: 'PLAYER_1',
// //     currentKeeper: 'AI',
// //     currentRound: 1,
// //     p1Shots: [],
// //     p2Shots: [],
// //     isGameOver: false,
// //     winner: null,
// //     isSuddenDeath: false,
// //     isUserKeeper: false,
// //   });

// //   const matchControlRef = useRef<any>(null);
// //   const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

// //   const debugInfoRef = useRef(debugInfo);
// //   useEffect(() => {
// //     debugInfoRef.current = debugInfo;
// //   }, [debugInfo]);

// //   // 🎥 动态/ডাইনামিক ক্যামেরা মোড ডিসিশন লজিক
// //   const activeCameraMode = useMemo<CameraMode>(() => {
// //     // ১. সোজা কথা: যদি গেমমোড সরাসরি 'GOALKEEPER' হয় অথবা বর্তমান রাউন্ডে ইউজার কিপার রোল প্লে করে
// //     if (gameMode === 'GOALKEEPER' || debugInfo.isUserKeeper) {
// //       return 'KEEPER_FROM_SHOOTER'; // অথবা আপনার ইঞ্জিনে কিপার ভিউ ক্যামেরার যে নাম আছে
// //     }

// //     // ২. যদি VS_AI হয় বা ইউজার শ্যুটার হয়
// //     if (gameMode === 'VS_AI' || !debugInfo.isUserKeeper) {
// //       return 'SHOOTER';
// //     }

// //     // ডিফোল্ট
// //     return 'SHOOTER';
// //   }, [gameMode, debugInfo.isUserKeeper]);

// //   // 🏆 Game Over Modal Handler
// //   useEffect(() => {
// //     if (debugInfo.isGameOver) {
// //       const timer = setTimeout(() => {
// //         setShowGameOverModal(true);
// //         Animated.timing(fadeAnim, {
// //           toValue: 1,
// //           duration: 800,
// //           useNativeDriver: true,
// //         }).start();
// //       }, 2000);

// //       return () => clearTimeout(timer);
// //     } else {
// //       setShowGameOverModal(false);
// //       fadeAnim.setValue(0);
// //     }
// //   }, [debugInfo.isGameOver, fadeAnim]);

// //   // 🖐️ Gesture Controller
// //   const panResponder = useRef(
// //     PanResponder.create({
// //       onStartShouldSetPanResponder: () => true,
// //       onMoveShouldSetPanResponder: () => true,
// //       onPanResponderGrant: (evt) => {
// //         if (debugInfoRef.current.isGameOver) return;

// //         touchStartPos.current = {
// //           x: evt.nativeEvent.pageX,
// //           y: evt.nativeEvent.pageY,
// //           time: Date.now(),
// //         };
// //       },
// //       // onPanResponderRelease: (evt) => {
// //       //   if (!matchControlRef.current || debugInfoRef.current.isGameOver) return;

// //       //   const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
// //       //   const deltaY = touchStartPos.current.y - evt.nativeEvent.pageY;
// //       //   const duration = Math.max((Date.now() - touchStartPos.current.time) / 1000, 0.05);

// //       //   const isUserKeeper = debugInfoRef.current.isUserKeeper;

// //       //   // 🧤 ১. ইউজার কিপার হলে
// //       //   if (isUserKeeper) {
// //       //     if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) return;

// //       //     if (deltaY < -30 && Math.abs(deltaX) < 40) {
// //       //       matchControlRef.current.triggerKeeperDive('center');
// //       //     } else if (deltaX < -30) {
// //       //       matchControlRef.current.triggerKeeperDive('left');
// //       //     } else if (deltaX > 30) {
// //       //       matchControlRef.current.triggerKeeperDive('right');
// //       //     }
// //       //     return;
// //       //   }

// //       //   // ⚽ ২. ইউজার শ্যুটার হলে
// //       //   if (matchControlRef.current.isKicked()) return;

// //       //   if (deltaY < 15 && Math.abs(deltaX) < 15) return;

// //       //   const flickSpeed = deltaY / duration;
// //       //   const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

// //       //   matchControlRef.current.kick({
// //       //     deltaX,
// //       //     deltaY,
// //       //     duration,
// //       //     deltaTopspin,
// //       //   });
// //       // },

// //       onPanResponderRelease: (evt) => {
// //         if (!matchControlRef.current || debugInfoRef.current.isGameOver) return;

// //         const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
// //         const deltaY = touchStartPos.current.y - evt.nativeEvent.pageY;
// //         const duration = Math.max((Date.now() - touchStartPos.current.time) / 1000, 0.05);

// //         const isUserKeeper = debugInfoRef.current.isUserKeeper;

// //         // 🧤 ১. ইউজার কিপার হলে
// //         if (isUserKeeper) {
// //           if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) return;

// //           let dir: 'left' | 'right' | 'center' | null = null;
// //           if (deltaY < -30 && Math.abs(deltaX) < 40) dir = 'center';
// //           else if (deltaX < -30) dir = 'left';
// //           else if (deltaX > 30) dir = 'right';

// //           if (dir) {
// //             matchControlRef.current.triggerKeeperDive(dir);
// //             // 📡 ২-প্লেয়ার মোড হলে ডাটা অন্য ডিভাইসে পাঠান
// //             if (gameMode === ('VS_PLAYER' as GameMode)) {
// //               network.send({ type: 'DIVE', direction: dir });
// //             }
// //           }
// //           return;
// //         }

// //         // ⚽ ২. ইউজার শ্যুটার হলে
// //         if (matchControlRef.current.isKicked()) return;
// //         if (deltaY < 15 && Math.abs(deltaX) < 15) return;

// //         const flickSpeed = deltaY / duration;
// //         const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

// //         const kickData = { deltaX, deltaY, duration, deltaTopspin };

// //         matchControlRef.current.kick(kickData);

// //         // 📡 ২-প্লেয়ার মোড হলে ডাটা অন্য ডিভাইসে পাঠান
// //         if (gameMode === ('VS_PLAYER' as GameMode)) {
// //           network.send({ type: 'KICK', flickData: kickData });
// //         }
// //       },
// //     })
// //   ).current;

// //   return (
// //     <View style={styles.container}>
// //       {/* 🎨 1. 3D Canvas Layer with Swipe Gesture */}
// //       <View style={styles.glView} {...panResponder.panHandlers}>
// //         <Canvas camera={{ fov: 55, near: 0.1, far: 1000 }}>
// //           <GameScene
// //             setDebugInfo={setDebugInfo}
// //             matchControlRef={matchControlRef}
// //             gameMode={gameMode}
// //             activeCameraMode={activeCameraMode} // ⚡ ডাইনামিক ক্যামেরা পাস করা হলো
// //           />
// //         </Canvas>
// //       </View>

// //       {/* 🏆 Scoreboard */}
// //       <Scoreboard debugInfo={debugInfo} gameMode={gameMode} />

// //       {/* 🎮 Mode Switcher */}
// //       <ModeSwitcher gameMode={gameMode} setGameMode={setGameMode} />

// //       {/* 🎉 Game Over Modal */}
// //       <GameOverModal
// //         show={showGameOverModal}
// //         fadeAnim={fadeAnim}
// //         debugInfo={debugInfo}
// //         matchControlRef={matchControlRef}
// //       />
// //     </View>
// //   );
// // }

// // football-test/src/app/index.tsx

// import { CameraMode, GameMode } from '@football/engine';
// import { Canvas } from '@react-three/fiber/native';
// import { useEffect, useMemo, useRef, useState } from 'react';
// import { Animated, PanResponder, View } from 'react-native';

// import { GameOverModal } from '@/components/game/game-over-modal';
// import { GameScene } from '@/components/game/game-scene';
// import { ModeSwitcher } from '@/components/game/mode-switcher';
// import { Scoreboard } from '@/components/game/scoreboard';
// import { network } from '@/services/multiplayer';
// import { styles } from '@/styles/appStyles';

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
//     isUserKeeper: false,
//   });

//   const matchControlRef = useRef<any>(null);
//   const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

//   const debugInfoRef = useRef(debugInfo);
//   useEffect(() => {
//     debugInfoRef.current = debugInfo;
//   }, [debugInfo]);

//   // 📡 নেটওয়ার্ক রিমোট ইভেন্ট লিসেনার (অন্য ডিভাইস থেকে কিক বা ডাইভ রিসিভ করার জন্য)
//   useEffect(() => {
//     const unsubscribe = network.onMessage((data: any) => {
//       if (matchControlRef.current && matchControlRef.current.handleRemoteAction) {
//         matchControlRef.current.handleRemoteAction(data);
//       }
//     });

//     return () => {
//       if (unsubscribe) unsubscribe();
//     };
//   }, []);

//   // 🎥 动态/ডাইনামিক ক্যামেরা মোড ডিসিশন লজিক
//   const activeCameraMode = useMemo<CameraMode>(() => {
//     // ১. সোজা কথা: যদি গেমমোড সরাসরি 'GOALKEEPER' হয় অথবা বর্তমান রাউন্ডে ইউজার কিপার রোল প্লে করে
//     if (gameMode === 'GOALKEEPER' || debugInfo.isUserKeeper) {
//       return 'KEEPER_FROM_SHOOTER'; // অথবা আপনার ইঞ্জিনে কিপার ভিউ ক্যামেরার যে নাম আছে
//     }

//     // ২. যদি VS_AI হয় বা ইউজার শ্যুটার হয়
//     if (gameMode === 'VS_AI' || !debugInfo.isUserKeeper) {
//       return 'SHOOTER';
//     }

//     // ডিফোল্ট
//     return 'SHOOTER';
//   }, [gameMode, debugInfo.isUserKeeper]);

//   // 🏆 Game Over Modal Handler
//   useEffect(() => {
//     if (debugInfo.isGameOver) {
//       const timer = setTimeout(() => {
//         setShowGameOverModal(true);
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }).start();
//       }, 2000);

//       return () => clearTimeout(timer);
//     } else {
//       setShowGameOverModal(false);
//       fadeAnim.setValue(0);
//     }
//   }, [debugInfo.isGameOver, fadeAnim]);

//   // 🖐️ Gesture Controller
//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderGrant: (evt) => {
//         if (debugInfoRef.current.isGameOver) return;

//         touchStartPos.current = {
//           x: evt.nativeEvent.pageX,
//           y: evt.nativeEvent.pageY,
//           time: Date.now(),
//         };
//       },
//       // onPanResponderRelease: (evt) => {
//       //   if (!matchControlRef.current || debugInfoRef.current.isGameOver) return;

//       //   const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
//       //   const deltaY = touchStartPos.current.y - evt.nativeEvent.pageY;
//       //   const duration = Math.max((Date.now() - touchStartPos.current.time) / 1000, 0.05);

//       //   const isUserKeeper = debugInfoRef.current.isUserKeeper;

//       //   // 🧤 ১. ইউজার কিপার হলে
//       //   if (isUserKeeper) {
//       //     if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) return;

//       //     if (deltaY < -30 && Math.abs(deltaX) < 40) {
//       //       matchControlRef.current.triggerKeeperDive('center');
//       //     } else if (deltaX < -30) {
//       //       matchControlRef.current.triggerKeeperDive('left');
//       //     } else if (deltaX > 30) {
//       //       matchControlRef.current.triggerKeeperDive('right');
//       //     }
//       //     return;
//       //   }

//       //   // ⚽ ২. ইউজার শ্যুটার হলে
//       //   if (matchControlRef.current.isKicked()) return;

//       //   if (deltaY < 15 && Math.abs(deltaX) < 15) return;

//       //   const flickSpeed = deltaY / duration;
//       //   const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

//       //   matchControlRef.current.kick({
//       //     deltaX,
//       //     deltaY,
//       //     duration,
//       //     deltaTopspin,
//       //   });
//       // },

//       onPanResponderRelease: (evt) => {
//         if (!matchControlRef.current || debugInfoRef.current.isGameOver) return;

//         const deltaX = evt.nativeEvent.pageX - touchStartPos.current.x;
//         const deltaY = touchStartPos.current.y - evt.nativeEvent.pageY;
//         const duration = Math.max((Date.now() - touchStartPos.current.time) / 1000, 0.05);

//         const isUserKeeper = debugInfoRef.current.isUserKeeper;

//         // 🧤 ১. ইউজার কিপার হলে
//         if (isUserKeeper) {
//           if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) return;

//           let dir: 'left' | 'right' | 'center' | null = null;
//           if (deltaY < -30 && Math.abs(deltaX) < 40) dir = 'center';
//           else if (deltaX < -30) dir = 'left';
//           else if (deltaX > 30) dir = 'right';

//           if (dir) {
//             matchControlRef.current.triggerKeeperDive(dir);
//             // 📡 ২-প্লেয়ার মোড হলে ডাটা অন্য ডিভাইসে পাঠান
//             if (gameMode === ('VS_PLAYER' as GameMode)) {
//               network.send({ type: 'DIVE', direction: dir });
//             }
//           }
//           return;
//         }

//         // ⚽ ২. ইউজার শ্যুটার হলে
//         if (matchControlRef.current.isKicked()) return;
//         if (deltaY < 15 && Math.abs(deltaX) < 15) return;

//         const flickSpeed = deltaY / duration;
//         const deltaTopspin = flickSpeed > 400 ? (flickSpeed - 400) * 0.05 : -10;

//         const kickData = { deltaX, deltaY, duration, deltaTopspin };

//         matchControlRef.current.kick(kickData);

//         // 📡 ২-প্লেয়ার মোড হলে ডাটা অন্য ডিভাইসে পাঠান
//         if (gameMode === ('VS_PLAYER' as GameMode)) {
//           network.send({ type: 'KICK', flickData: kickData });
//         }
//       },
//     })
//   ).current;

//   // 🎭 প্লেয়ারের বর্তমান রোল নির্ধারণ (SHOOTER বা GOALKEEPER)
//   const userRole = debugInfo.isUserKeeper ? 'GOALKEEPER' : 'SHOOTER';

//   return (
//     <View style={styles.container}>
//       {/* 🎨 1. 3D Canvas Layer with Swipe Gesture */}
//       <View style={styles.glView} {...panResponder.panHandlers}>
//         <Canvas camera={{ fov: 55, near: 0.1, far: 1000 }}>
//           <GameScene
//             setDebugInfo={setDebugInfo}
//             matchControlRef={matchControlRef}
//             gameMode={gameMode}
//             activeCameraMode={activeCameraMode} // ⚡ ডাইনামিক ক্যামেরা পাস করা হলো
//             userRole={userRole} // ⚡ ডাইনামিক ইউজার রোল পাস করা হলো
//           />
//         </Canvas>
//       </View>

//       {/* 🏆 Scoreboard */}
//       <Scoreboard debugInfo={debugInfo} gameMode={gameMode} />

//       {/* 🎮 Mode Switcher */}
//       <ModeSwitcher gameMode={gameMode} setGameMode={setGameMode} />

//       {/* 🎉 Game Over Modal */}
//       <GameOverModal
//         show={showGameOverModal}
//         fadeAnim={fadeAnim}
//         debugInfo={debugInfo}
//         matchControlRef={matchControlRef}
//       />
//     </View>
//   );
// }

// src/app/index.tsx

import { CameraMode, GameMode } from '@football/engine';
import { Canvas } from '@react-three/fiber/native';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Animated,
  PanResponder,
  View,
} from 'react-native';

import { GameOverModal } from '@/components/game/game-over-modal';
import { GameScene } from '@/components/game/game-scene';
import { ModeSwitcher } from '@/components/game/mode-switcher';
import { Scoreboard } from '@/components/game/scoreboard';
import { StartModal } from '@/components/game/start-modal';

import { network } from '@/services/';

import { styles } from '@/styles/appStyles';

export default function App() {

  // ============================================================
  // GAME MODE
  // ============================================================

  /**
   * Start screen খোলা থাকা অবস্থায় actual game শুরু হবে না।
   *
   * VS_AI:
   * StartModal থেকে AI নির্বাচন করলে gameStarted = true
   *
   * VS_PLAYER:
   * Network + Toss + Role + Ready complete হলে gameStarted = true
   */
  const [gameMode, setGameMode] =
    useState<GameMode>('VS_AI');

  // ============================================================
  // START MODAL
  // ============================================================

  const [showStartModal, setShowStartModal] =
    useState(true);

  // ============================================================
  // GAME START STATE
  // ============================================================

  const [gameStarted, setGameStarted] =
    useState(false);

  // ============================================================
  // MULTIPLAYER ROLE
  // ============================================================

  const [userRole, setUserRole] =
    useState<'SHOOTER' | 'GOALKEEPER'>('SHOOTER');

  // ============================================================
  // GAME OVER
  // ============================================================

  const [showGameOverModal, setShowGameOverModal] =
    useState(false);

  const fadeAnim =
    useRef(new Animated.Value(0)).current;

  // ============================================================
  // DEBUG / GAME STATE
  // ============================================================

  const [debugInfo, setDebugInfo] =
    useState<any>({
      posX: '0.00',
      posY: '0.00',
      posZ: '0.00',

      isKicked: false,
      currentShooter: 'PLAYER_1',
      currentKeeper: 'AI',

      currentRound: 1,

      p1Shots: [],
      p2Shots: [],

      isGameOver: false,
      winner: null,

      isSuddenDeath: false,

      isUserKeeper: false,
    });

  // ============================================================
  // MATCH CONTROL
  // ============================================================

  const matchControlRef =
    useRef<any>(null);

  // ============================================================
  // TOUCH
  // ============================================================

  const touchStartPos =
    useRef({
      x: 0,
      y: 0,
      time: 0,
    });

  // ============================================================
  // DEBUG REF
  // ============================================================

  const debugInfoRef =
    useRef(debugInfo);

  useEffect(() => {
    debugInfoRef.current = debugInfo;
  }, [debugInfo]);

  // ============================================================
  // START MENU HANDLER
  // ============================================================

  const handleStartMode = (
    mode: GameMode
  ) => {

    // ----------------------------------------------------------
    // VS AI
    // ----------------------------------------------------------

    if (mode === 'VS_AI') {

      setGameMode('VS_AI');

      setUserRole('SHOOTER');

      /**
       * AI mode-এ কোনো network setup দরকার নেই।
       * তাই সরাসরি game শুরু।
       */
      setGameStarted(true);

      setShowStartModal(false);

      return;
    }

    // ----------------------------------------------------------
    // VS PLAYER
    // ----------------------------------------------------------

    if (mode === 'VS_PLAYER') {

      setGameMode('VS_PLAYER');

      /**
       * এখনো game শুরু হবে না।
       *
       * ModeSwitcher network setup দেখাবে।
       */
      setGameStarted(false);

      setShowStartModal(false);

      return;
    }
  };

  // ============================================================
  // MULTIPLAYER READY
  // ============================================================

  const handleMultiplayerReady = (
    isHost: boolean,
    role: 'SHOOTER' | 'GOALKEEPER'
  ) => {

    console.log(
      '[MULTIPLAYER] Ready',
      {
        isHost,
        role,
      }
    );

    setGameMode('VS_PLAYER');

    setUserRole(role);

    /**
     * Network flow complete।
     *
     * দুই player ready হওয়ার পরে
     * actual 3D game শুরু হবে।
     */
    setGameStarted(true);
  };

  // ============================================================
  // NETWORK DATA
  // ============================================================

  const handleNetworkDataReceived = (
    data: any
  ) => {

    /**
     * বর্তমানে network listener নিচেই
     * matchControlRef-এর মাধ্যমে remote action
     * handle করছে।
     *
     * ভবিষ্যতে Start/Ready/Toss সম্পর্কিত
     * additional data এখানে ব্যবহার করা যাবে।
     */
    console.log(
      '[NETWORK DATA]',
      data
    );
  };

  // ============================================================
  // NETWORK REMOTE EVENT LISTENER
  // ============================================================

  useEffect(() => {

    const unsubscribe =
      network.onMessage((data: any) => {

        /**
         * GameScene / match controller তৈরি হওয়ার
         * পরে remote KICK / DIVE এখানে যাবে।
         */
        if (
          matchControlRef.current &&
          matchControlRef.current.handleRemoteAction
        ) {
          matchControlRef.current.handleRemoteAction(
            data
          );
        }

      });

    return () => {

      if (unsubscribe) {
        unsubscribe();
      }

    };

  }, []);

  // ============================================================
  // DYNAMIC CAMERA MODE
  // ============================================================

  const activeCameraMode =
    useMemo<CameraMode>(() => {

      /**
       * Goalkeeper হলে goalkeeper camera।
       */
      if (
        gameMode === 'GOALKEEPER' ||
        debugInfo.isUserKeeper
      ) {
        return 'KEEPER_FROM_SHOOTER';
      }

      /**
       * VS AI বা Shooter হলে shooter camera।
       */
      if (
        gameMode === 'VS_AI' ||
        !debugInfo.isUserKeeper
      ) {
        return 'SHOOTER';
      }

      return 'SHOOTER';

    }, [
      gameMode,
      debugInfo.isUserKeeper,
    ]);

  // ============================================================
  // GAME OVER MODAL
  // ============================================================

  useEffect(() => {

    if (debugInfo.isGameOver) {

      const timer =
        setTimeout(() => {

          setShowGameOverModal(true);

          Animated.timing(
            fadeAnim,
            {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }
          ).start();

        }, 2000);

      return () =>
        clearTimeout(timer);

    } else {

      setShowGameOverModal(false);

      fadeAnim.setValue(0);

    }

  }, [
    debugInfo.isGameOver,
    fadeAnim,
  ]);

  // ============================================================
  // GESTURE CONTROLLER
  // ============================================================

  const panResponder =
    useRef(

      PanResponder.create({

        onStartShouldSetPanResponder:
          () => true,

        onMoveShouldSetPanResponder:
          () => true,

        onPanResponderGrant:
          (evt) => {

            if (
              debugInfoRef.current.isGameOver
            ) {
              return;
            }

            touchStartPos.current = {
              x: evt.nativeEvent.pageX,
              y: evt.nativeEvent.pageY,
              time: Date.now(),
            };

          },

        onPanResponderRelease:
          (evt) => {

            if (
              !matchControlRef.current ||
              debugInfoRef.current.isGameOver
            ) {
              return;
            }

            const deltaX =
              evt.nativeEvent.pageX -
              touchStartPos.current.x;

            const deltaY =
              touchStartPos.current.y -
              evt.nativeEvent.pageY;

            const duration =
              Math.max(
                (
                  Date.now() -
                  touchStartPos.current.time
                ) / 1000,
                0.05
              );

            const isUserKeeper =
              debugInfoRef.current.isUserKeeper;

            // ==================================================
            // GOALKEEPER
            // ==================================================

            if (isUserKeeper) {

              if (
                Math.abs(deltaX) < 20 &&
                Math.abs(deltaY) < 20
              ) {
                return;
              }

              let dir:
                | 'left'
                | 'right'
                | 'center'
                | null = null;

              // Center dive
              if (
                deltaY < -30 &&
                Math.abs(deltaX) < 40
              ) {
                dir = 'center';
              }

              // Left
              else if (deltaX < -30) {
                dir = 'left';
              }

              // Right
              else if (deltaX > 30) {
                dir = 'right';
              }

              if (dir) {

                matchControlRef.current
                  .triggerKeeperDive(dir);

                // ------------------------------------------------
                // VS PLAYER
                // ------------------------------------------------

                if (
                  gameMode ===
                  ('VS_PLAYER' as GameMode)
                ) {

                  network.send({
                    type: 'DIVE',
                    direction: dir,
                  });

                }

              }

              return;
            }

            // ==================================================
            // SHOOTER
            // ==================================================

            if (
              matchControlRef.current.isKicked()
            ) {
              return;
            }

            if (
              deltaY < 15 &&
              Math.abs(deltaX) < 15
            ) {
              return;
            }

            const flickSpeed =
              deltaY / duration;

            const deltaTopspin =
              flickSpeed > 400
                ? (flickSpeed - 400) * 0.05
                : -10;

            const kickData = {
              deltaX,
              deltaY,
              duration,
              deltaTopspin,
            };

            // Local kick
            matchControlRef.current.kick(
              kickData
            );

            // ------------------------------------------------
            // VS PLAYER
            // ------------------------------------------------

            if (
              gameMode ===
              ('VS_PLAYER' as GameMode)
            ) {

              network.send({
                type: 'KICK',
                flickData: kickData,
              });

            }

          },

      })

    ).current;

  // ============================================================
  // PLAYER ROLE
  // ============================================================

  /**
   * Multiplayer role initially comes from StartModal flow.
   *
   * GameScene-এর existing logic debugInfo.isUserKeeper
   * update করলে সেটাও কাজ করবে।
   */
  const currentUserRole =
    debugInfo.isUserKeeper
      ? 'GOALKEEPER'
      : userRole;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View style={styles.container}>

      {/* ====================================================== */}
      {/* START MENU                                            */}
      {/* ====================================================== */}

      <StartModal
        show={showStartModal}
        onSelectMode={handleStartMode}
      />

      {/* ====================================================== */}
      {/* GAME AREA                                             */}
      {/* ====================================================== */}

      {gameStarted && (
        <>
          {/* ================================================== */}
          {/* 3D CANVAS                                          */}
          {/* ================================================== */}

          <View
            style={styles.glView}
            {...panResponder.panHandlers}
          >

            <Canvas
              camera={{
                fov: 55,
                near: 0.1,
                far: 1000,
              }}
            >

              <GameScene
                setDebugInfo={setDebugInfo}
                matchControlRef={matchControlRef}
                gameMode={gameMode}
                activeCameraMode={
                  activeCameraMode
                }
                userRole={
                  currentUserRole
                }
              />

            </Canvas>

          </View>

          {/* ================================================== */}
          {/* SCOREBOARD                                         */}
          {/* ================================================== */}

          <Scoreboard
            debugInfo={debugInfo}
            gameMode={gameMode}
          />

          {/* ================================================== */}
          {/* GAME OVER                                          */}
          {/* ================================================== */}

          <GameOverModal
            show={showGameOverModal}
            fadeAnim={fadeAnim}
            debugInfo={debugInfo}
            matchControlRef={
              matchControlRef
            }
          />

        </>
      )}

      {/* ====================================================== */}
      {/* MULTIPLAYER SETUP                                      */}
      {/* ====================================================== */}

      {!showStartModal &&
        !gameStarted &&
        gameMode === 'VS_PLAYER' && (

          <View
            style={styles.networkSetupWrapper}
          >

            <ModeSwitcher
              gameMode={gameMode}
              setGameMode={setGameMode}

              initialNetworkOpen={true}

              onMultiplayerReady={
                handleMultiplayerReady
              }

              onNetworkDataReceived={
                handleNetworkDataReceived
              }
            />

          </View>

        )}

    </View>
  );
}