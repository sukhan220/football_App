



// src/app/index.tsx

import { CameraMode, GameMode } from '@football/engine';
import { Canvas } from '@react-three/fiber/native';
import { Buffer } from 'buffer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { network } from '@/services/tcp-manager';
import { styles } from '@/styles/appStyles';

export default function App() {
  // ============================================================
  // GAME MODE
  // ============================================================

  const [gameMode, setGameMode] = useState<GameMode>('VS_AI');

  // ============================================================
  // START MODAL
  // ============================================================

  const [showStartModal, setShowStartModal] = useState(true);

  // ============================================================
  // GAME START
  // ============================================================

  const [gameStarted, setGameStarted] = useState(false);

  // ============================================================
  // MULTIPLAYER ROLE
  // ============================================================

  const [userRole, setUserRole] =
    useState<'SHOOTER' | 'GOALKEEPER'>('SHOOTER');

  // ============================================================
  // GAME OVER
  // ============================================================

  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  // ============================================================
  // DEBUG / GAME STATE
  // ============================================================

  const [debugInfo, setDebugInfo] = useState<any>({
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
  // MATCH CONTROL REF
  // ============================================================

  const matchControlRef = useRef<any>(null);

  // ============================================================
  // TOUCH START
  // ============================================================

  const touchStartPos = useRef({
    x: 0,
    y: 0,
    time: 0,
  });

  // ============================================================
  // DEBUG REF
  // ============================================================

  const debugInfoRef = useRef(debugInfo);

  useEffect(() => {
    debugInfoRef.current = debugInfo;
  }, [debugInfo]);

  // ============================================================
  // START MENU
  // ============================================================

  const handleStartMode = useCallback(
    (mode: GameMode) => {
      console.log('[START MENU] Selected mode:', mode);

      // --------------------------------------------------------
      // VS AI
      // --------------------------------------------------------

      if (mode === 'VS_AI') {
        console.log('[GAME] Starting VS AI');

        // নিশ্চিতভাবে পুরোনো multiplayer connection বন্ধ
        if (network.isConnected()) {
          network.disconnect().catch(() => {});
        }

        setGameMode('VS_AI');

        setUserRole('SHOOTER');

        // AI game সরাসরি শুরু
        setGameStarted(true);

        // Start menu বন্ধ
        setShowStartModal(false);

        return;
      }

      // --------------------------------------------------------
      // VS PLAYER
      // --------------------------------------------------------

      if (mode === 'VS_PLAYER') {
        console.log('[GAME] Opening VS PLAYER setup');

        setGameMode('VS_PLAYER');

        // এখনো 3D game শুরু হবে না
        setGameStarted(false);

        // Start menu বন্ধ
        setShowStartModal(false);

        return;
      }
    },
    []
  );

  // ============================================================
  // MULTIPLAYER READY
  // ============================================================

  const handleMultiplayerReady = useCallback(
    (
      isHost: boolean,
      role: 'SHOOTER' | 'GOALKEEPER'
    ) => {
      console.log('[MULTIPLAYER] Ready:', {
        isHost,
        role,
      });

      // Multiplayer mode
      setGameMode('VS_PLAYER');

      // Toss থেকে পাওয়া final role
      setUserRole(role);

      // দুই player ready
      // এখন actual 3D game শুরু হবে
      setGameStarted(true);
    },
    []
  );

  // ============================================================
  // NETWORK DATA
  // ============================================================

  const handleNetworkDataReceived = useCallback(
    (data: any) => {
      console.log('[NETWORK DATA]', data);
    },
    []
  );

  // ============================================================
  // NETWORK REMOTE EVENT LISTENER
  // ============================================================

  useEffect(() => {
    const unsubscribe = network.onMessage(
      (data: any) => {
        console.log('[REMOTE MESSAGE]', data);

        // GameScene / Match Controller তৈরি হওয়ার পরে
        // remote game action এখানে যাবে।

        if (
          matchControlRef.current &&
          typeof matchControlRef.current.handleRemoteAction ===
            'function'
        ) {
          matchControlRef.current.handleRemoteAction(data);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // ============================================================
  // FINAL USER ROLE
  // ============================================================

  /*
   * Multiplayer-এর role প্রথমে userRole থেকে আসে।
   *
   * GameScene যদি debugInfo.isUserKeeper update করে,
   * সেটাকেও priority দেওয়া হচ্ছে।
   */

  const currentUserRole =
    debugInfo.isUserKeeper
      ? 'GOALKEEPER'
      : userRole;

  // ============================================================
  // CAMERA MODE
  // ============================================================

  const activeCameraMode = useMemo<CameraMode>(() => {
    if (currentUserRole === 'GOALKEEPER') {
      return 'KEEPER_FROM_SHOOTER';
    }

    return 'SHOOTER';
  }, [currentUserRole]);

  // ============================================================
  // GAME OVER MODAL
  // ============================================================

  useEffect(() => {
    if (debugInfo.isGameOver) {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }

    setShowGameOverModal(false);
    fadeAnim.setValue(0);
  }, [
    debugInfo.isGameOver,
    fadeAnim,
  ]);

  // ============================================================
  // GESTURE CONTROLLER
  // ============================================================

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      // --------------------------------------------------------
      // TOUCH START
      // --------------------------------------------------------

      onPanResponderGrant: (evt) => {
        if (debugInfoRef.current.isGameOver) {
          return;
        }

        touchStartPos.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          time: Date.now(),
        };
      },

      // --------------------------------------------------------
      // TOUCH RELEASE
      // --------------------------------------------------------

      onPanResponderRelease: (evt) => {
        if (
          !matchControlRef.current ||
          debugInfoRef.current.isGameOver
        ) {
          return;
        }

        // ------------------------------------------------------
        // SWIPE DATA
        // ------------------------------------------------------

        const deltaX =
          evt.nativeEvent.pageX -
          touchStartPos.current.x;

        const deltaY =
          touchStartPos.current.y -
          evt.nativeEvent.pageY;

        const duration = Math.max(
          (
            Date.now() -
            touchStartPos.current.time
          ) / 1000,
          0.05
        );

        const isUserKeeper =
          debugInfoRef.current.isUserKeeper ||
          currentUserRole === 'GOALKEEPER';

        // ======================================================
        // GOALKEEPER
        // ======================================================

        if (isUserKeeper) {
          if (
            Math.abs(deltaX) < 20 &&
            Math.abs(deltaY) < 20
          ) {
            return;
          }

          let direction:
            | 'left'
            | 'right'
            | 'center'
            | null = null;

          // ----------------------------------------------------
          // CENTER
          // ----------------------------------------------------

          if (
            deltaY < -30 &&
            Math.abs(deltaX) < 40
          ) {
            direction = 'center';
          }

          // ----------------------------------------------------
          // LEFT
          // ----------------------------------------------------

          else if (deltaX < -30) {
            direction = 'left';
          }

          // ----------------------------------------------------
          // RIGHT
          // ----------------------------------------------------

          else if (deltaX > 30) {
            direction = 'right';
          }

          // ----------------------------------------------------
          // PERFORM DIVE
          // ----------------------------------------------------

          if (direction) {
            matchControlRef.current.triggerKeeperDive(
              direction
            );

            // --------------------------------------------------
            // SEND TO OTHER PLAYER
            // --------------------------------------------------

            if (gameMode === 'VS_PLAYER') {
              network.send({
                type: 'DIVE',
                direction,
              });
            }
          }

          return;
        }

        // ======================================================
        // SHOOTER
        // ======================================================

        if (
          typeof matchControlRef.current.isKicked ===
            'function' &&
          matchControlRef.current.isKicked()
        ) {
          return;
        }

        // Ignore tiny movement
        if (
          deltaY < 15 &&
          Math.abs(deltaX) < 15
        ) {
          return;
        }

        // ------------------------------------------------------
        // FLICK SPEED
        // ------------------------------------------------------

        const flickSpeed =
          deltaY / duration;

        // ------------------------------------------------------
        // TOPSPIN
        // ------------------------------------------------------

        const deltaTopspin =
          flickSpeed > 400
            ? (flickSpeed - 400) * 0.05
            : -10;

        // ------------------------------------------------------
        // KICK DATA
        // ------------------------------------------------------

        const kickData = {
          deltaX,
          deltaY,
          duration,
          deltaTopspin,
        };

        // ------------------------------------------------------
        // LOCAL KICK
        // ------------------------------------------------------

        matchControlRef.current.kick(
          kickData
        );

        // ------------------------------------------------------
        // SEND KICK TO OPPONENT
        // ------------------------------------------------------

        if (gameMode === 'VS_PLAYER') {
          network.send({
            type: 'KICK',
            flickData: kickData,
          });
        }
      },
    })
  ).current;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View style={styles.container}>

      {/* ======================================================
          START MENU
          ====================================================== */}

      <StartModal
        show={showStartModal}
        onSelectMode={handleStartMode}
      />

      {/* ======================================================
          3D GAME
          ====================================================== */}

      {gameStarted && (
        <>
          {/* --------------------------------------------------
              3D CANVAS
              -------------------------------------------------- */}

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
                activeCameraMode={activeCameraMode}
                userRole={currentUserRole}
              />
            </Canvas>
          </View>

          {/* --------------------------------------------------
              SCOREBOARD
              -------------------------------------------------- */}

          <Scoreboard
            debugInfo={debugInfo}
            gameMode={gameMode}
          />

          {/* --------------------------------------------------
              GAME OVER
              -------------------------------------------------- */}

          <GameOverModal
            show={showGameOverModal}
            fadeAnim={fadeAnim}
            debugInfo={debugInfo}
            matchControlRef={matchControlRef}
          />
        </>
      )}

      {/* ======================================================
          MULTIPLAYER SETUP
          ====================================================== */}

      {!showStartModal &&
        !gameStarted &&
        gameMode === 'VS_PLAYER' && (
          <View
            style={{
              flex: 1,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            <ModeSwitcher
              gameMode={gameMode}
              setGameMode={setGameMode}
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