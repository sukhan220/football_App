// src/app/index.tsx


import {
  CameraMode,
  GameMode,
} from '@football/engine';

import { Canvas } from '@react-three/fiber/native';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { GameOverModal } from '@/components/game/game-over-modal';

import { GameScene } from '@/components/game/game-scene';

import { ModeSwitcher } from '@/components/game/mode-switcher';

import { Scoreboard } from '@/components/game/scoreboard';

import { StartModal } from '@/components/game/start-modal';

import {
  MultiplayerProvider,
  useMultiplayerContext,
} from '@/providers/MultiplayerProvider';

import { network } from '@/services/tcp-manager';

import { styles } from '@/styles/appStyles';

// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  // ==========================================================
  // MULTIPLAYER CONTEXT
  // ==========================================================

  const {
    flowStep,
    selectedRole,
    subscribe,
  } =
    useMultiplayerContext();

  // ==========================================================
  // GAME MODE
  // ==========================================================

  const [gameMode, setGameMode] =
    useState<GameMode>(
      'VS_AI'
    );

  // ==========================================================
  // START MODAL
  // ==========================================================

  const [
    showStartModal,
    setShowStartModal,
  ] =
    useState(true);

  // ==========================================================
  // GAME START
  // ==========================================================

  const [
    gameStarted,
    setGameStarted,
  ] =
    useState(false);

  // ==========================================================
  // USER ROLE
  // ==========================================================

  const [
    userRole,
    setUserRole,
  ] =
    useState<
      'SHOOTER' |
      'GOALKEEPER'
    >(
      'SHOOTER'
    );

  // ==========================================================
  // GAME OVER
  // ==========================================================

  const [
    showGameOverModal,
    setShowGameOverModal,
  ] =
    useState(false);

  const fadeAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  // ==========================================================
  // DEBUG
  // ==========================================================

  const [
    debugInfo,
    setDebugInfo,
  ] =
    useState<any>({
      posX: '0.00',

      posY: '0.00',

      posZ: '0.00',

      isKicked: false,

      currentShooter:
        'PLAYER_1',

      currentKeeper:
        'AI',

      currentRound: 1,

      p1Shots: [],

      p2Shots: [],

      isGameOver: false,

      winner: null,

      isSuddenDeath:
        false,

      isUserKeeper:
        false,

      currentRole:
        'SHOOTER',
    });

  const debugInfoRef =
    useRef(
      debugInfo
    );

  useEffect(() => {
    debugInfoRef.current =
      debugInfo;
  }, [
    debugInfo,
  ]);

  // ==========================================================
  // MATCH CONTROL
  // ==========================================================

  const matchControlRef =
    useRef<any>(null);

  // ==========================================================
  // TOUCH
  // ==========================================================

  const touchStartPos =
    useRef({
      x: 0,
      y: 0,
      time: 0,
    });

  // ==========================================================
  // START MODE
  // ==========================================================

  const handleStartMode =
    useCallback(
      (
        mode: GameMode
      ) => {
        console.log(
          '[START MENU] Selected mode:',
          mode
        );

        // ----------------------------------------------------
        // VS AI
        // ----------------------------------------------------

        if (
          mode ===
          'VS_AI'
        ) {
          if (
            network.isConnected()
          ) {
            network
              .disconnect()
              .catch(
                () => {}
              );
          }

          setGameMode(
            'VS_AI'
          );

          setUserRole(
            'SHOOTER'
          );

          setGameStarted(
            true
          );

          setShowStartModal(
            false
          );

          return;
        }

        // ----------------------------------------------------
        // VS PLAYER
        // ----------------------------------------------------

        if (
          mode ===
          'VS_PLAYER'
        ) {
          setGameMode(
            'VS_PLAYER'
          );

          setGameStarted(
            false
          );

          setShowStartModal(
            false
          );

          return;
        }
      },
      []
    );

  // ==========================================================
  // MULTIPLAYER READY
  // ==========================================================

  const handleMultiplayerReady =
    useCallback(
      (
        isHost: boolean,
        role:
          | 'SHOOTER'
          | 'GOALKEEPER'
      ) => {
        console.log(
          '[MULTIPLAYER] Ready:',
          {
            isHost,
            role,
          }
        );

        setGameMode(
          'VS_PLAYER'
        );

        setUserRole(
          role
        );

        setGameStarted(
          true
        );
      },
      []
    );

  // ==========================================================
  // NETWORK DATA
  // ==========================================================

  const handleNetworkDataReceived =
    useCallback(
      (
        data: any
      ) => {
        console.log(
          '[NETWORK DATA]',
          data
        );
      },
      []
    );

  // ==========================================================
  // SINGLE NETWORK SUBSCRIBER
  //
  // Provider already owns TCP listener.
  //
  // index শুধু GameScene-এ gameplay messages forward করবে।
  // ==========================================================

  useEffect(() => {
    if (
      gameMode !==
      'VS_PLAYER'
    ) {
      return;
    }

    const unsubscribe =
      subscribe(
        (
          rawData: any
        ) => {
          const data =
            rawData?.payload ||
            rawData?.data ||
            rawData;

          if (
            data?.type ===
            'REMOTE_ACTION'
          ) {
            if (
              matchControlRef.current &&
              typeof matchControlRef
                .current
                .handleRemoteAction ===
                'function'
            ) {
              matchControlRef.current
                .handleRemoteAction(
                  data
                );
            }

            return;
          }

          if (
            data?.type ===
            'TURN_CHANGE'
          ) {
            if (
              matchControlRef.current &&
              typeof matchControlRef
                .current
                .handleRemoteAction ===
                'function'
            ) {
              // GameScene-এর subscriber
              // already TURN_CHANGE নেয়।
              // এখানে আবার পাঠানো হবে না।
            }

            return;
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    gameMode,
    subscribe,
  ]);

  // ==========================================================
  // IMPORTANT:
  //
  // ModeSwitcher-এর existing useMultiplayerFlow
  // নিজে network listener রাখে।
  //
  // তাই Game শুরু হলে ModeSwitcher UNMOUNT করা যাবে না।
  //
  // Hidden থাকবে, mounted থাকবে।
  // ==========================================================

  // ==========================================================
  // CURRENT ROLE
  // ==========================================================

  const currentUserRole =
    debugInfo?.currentRole ===
    'GOALKEEPER'
      ? 'GOALKEEPER'
      : userRole;

  // ==========================================================
  // CAMERA
  // ==========================================================

  const activeCameraMode =
    useMemo<CameraMode>(
      () => {
        if (
          currentUserRole ===
          'GOALKEEPER'
        ) {
          return 'KEEPER_FROM_SHOOTER';
        }

        return 'SHOOTER';
      },
      [
        currentUserRole,
      ]
    );

  // ==========================================================
  // GAME OVER
  // ==========================================================

  useEffect(() => {
    if (
      debugInfo.isGameOver
    ) {
      const timer =
        setTimeout(
          () => {
            setShowGameOverModal(
              true
            );

            Animated.timing(
              fadeAnim,
              {
                toValue: 1,

                duration: 800,

                useNativeDriver:
                  true,
              }
            ).start();
          },
          2000
        );

      return () => {
        clearTimeout(
          timer
        );
      };
    }

    setShowGameOverModal(
      false
    );

    fadeAnim.setValue(
      0
    );
  }, [
    debugInfo.isGameOver,
    fadeAnim,
  ]);

  // ==========================================================
  // BACK TO MENU
  // ==========================================================

  const handleBackToMenu =
    useCallback(
      () => {
        console.log(
          '[GAME] Returning to Main Menu'
        );

        if (
          network.isConnected()
        ) {
          network
            .disconnect()
            .catch(
              () => {}
            );
        }

        setGameStarted(
          false
        );

        setShowGameOverModal(
          false
        );

        setShowStartModal(
          true
        );

        setGameMode(
          'VS_AI'
        );

        setUserRole(
          'SHOOTER'
        );

        fadeAnim.setValue(
          0
        );
      },
      [
        fadeAnim,
      ]
    );

  // ==========================================================
  // PAN RESPONDER
  // ==========================================================

  const panResponder =
    useRef(
      PanResponder.create({
        // ----------------------------------------------------
        // START
        // ----------------------------------------------------

        onStartShouldSetPanResponder:
          () => true,

        onMoveShouldSetPanResponder:
          () => true,

        // ----------------------------------------------------
        // GRANT
        // ----------------------------------------------------

        onPanResponderGrant:
          evt => {
            if (
              debugInfoRef.current
                .isGameOver
            ) {
              return;
            }

            touchStartPos.current = {
              x:
                evt.nativeEvent
                  .pageX,

              y:
                evt.nativeEvent
                  .pageY,

              time:
                Date.now(),
            };
          },

        // ----------------------------------------------------
        // RELEASE
        // ----------------------------------------------------

        onPanResponderRelease:
          evt => {
            if (
              !matchControlRef.current
            ) {
              return;
            }

            if (
              debugInfoRef.current
                .isGameOver
            ) {
              return;
            }

            const deltaX =
              evt.nativeEvent
                .pageX -
              touchStartPos.current
                .x;

            const deltaY =
              touchStartPos.current
                .y -
              evt.nativeEvent
                .pageY;

            const duration =
              Math.max(
                (
                  Date.now() -
                  touchStartPos.current
                    .time
                ) /
                  1000,

                0.05
              );

            const role =
              debugInfoRef.current
                .currentRole ||
              userRole;

            // ==================================================
            // GOALKEEPER
            // ==================================================

            if (
              role ===
              'GOALKEEPER'
            ) {
              if (
                Math.abs(
                  deltaX
                ) < 20 &&
                Math.abs(
                  deltaY
                ) < 20
              ) {
                return;
              }

              let direction:
                | 'left'
                | 'right'
                | 'center'
                | null =
                null;

              // ------------------------------------------------
              // CENTER
              // ------------------------------------------------

              if (
                deltaY <
                  -30 &&
                Math.abs(
                  deltaX
                ) < 40
              ) {
                direction =
                  'center';
              }

              // ------------------------------------------------
              // LEFT
              // ------------------------------------------------

              else if (
                deltaX <
                -30
              ) {
                direction =
                  'left';
              }

              // ------------------------------------------------
              // RIGHT
              // ------------------------------------------------

              else if (
                deltaX >
                30
              ) {
                direction =
                  'right';
              }

              if (
                direction
              ) {
                console.log(
                  '🧤 Keeper Swipe:',
                  direction
                );

                // ONLY path.
                // GameScene will validate role,
                // run local dive and send remote action.
                matchControlRef.current
                  .triggerKeeperDive(
                    direction
                  );
              }

              return;
            }

            // ==================================================
            // SHOOTER
            // ==================================================

            if (
              role !==
              'SHOOTER'
            ) {
              return;
            }

            // --------------------------------------------------
            // Already kicked
            // --------------------------------------------------

            if (
              typeof matchControlRef
                .current
                .isKicked ===
                'function' &&
              matchControlRef.current
                .isKicked()
            ) {
              return;
            }

            // --------------------------------------------------
            // Tiny movement
            // --------------------------------------------------

            if (
              deltaY <
                15 &&
              Math.abs(
                deltaX
              ) <
                15
            ) {
              return;
            }

            // --------------------------------------------------
            // Only upward flick is a shot
            // --------------------------------------------------

            if (
              deltaY <=
              0
            ) {
              return;
            }

            const flickSpeed =
              deltaY /
              duration;

            const deltaTopspin =
              flickSpeed >
              400
                ? (
                    flickSpeed -
                    400
                  ) *
                  0.05
                : -10;

            const kickData =
              {
                deltaX,

                deltaY,

                duration,

                deltaTopspin,
              };

            console.log(
              '⚽ Shooter Kick:',
              kickData
            );

            // ONLY path.
            // GameScene validates role,
            // sends TCP and starts local animation.
            matchControlRef.current
              .kick(
                kickData
              );
          },
      })
    ).current;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={
        styles.container
      }
    >
      {/* ==================================================== */}
      {/* START MODAL                                          */}
      {/* ==================================================== */}

      <StartModal
        show={
          showStartModal
        }
        onSelectMode={
          handleStartMode
        }
      />

      {/* ==================================================== */}
      {/* MULTIPLAYER SETUP                                    */}
      {/*                                                    */}
      {/* IMPORTANT:                                          */}
      {/* ModeSwitcher stays mounted during gameplay.         */}
      {/* Only hidden.                                        */}
      {/* ==================================================== */}

      {!showStartModal && (
        <View
          pointerEvents={
            gameStarted
              ? 'none'
              : 'auto'
          }
          style={
            gameStarted
              ? {
                  display:
                    'none',
                }
              : {
                  flex: 1,

                  width:
                    '100%',

                  justifyContent:
                    'center',

                  alignItems:
                    'center',

                  paddingHorizontal:
                    20,
                }
          }
        >
          <TouchableOpacity
            onPress={
              handleBackToMenu
            }
            activeOpacity={
              0.7
            }
            style={{
              position:
                'absolute',

              top: 45,

              left: 20,

              zIndex: 99,

              backgroundColor:
                'rgba(0,0,0,0.4)',

              paddingVertical:
                6,

              paddingHorizontal:
                12,

              borderRadius:
                20,

              borderWidth: 1,

              borderColor:
                'rgba(255,255,255,0.2)',
            }}
          >
            <Text
              style={{
                color:
                  '#FFFFFF',

                fontSize:
                  12,

                fontWeight:
                  '600',

                opacity:
                  0.8,
              }}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <ModeSwitcher
            gameMode={
              gameMode
            }

            setGameMode={
              setGameMode
            }

            onMultiplayerReady={
              handleMultiplayerReady
            }

            onNetworkDataReceived={
              handleNetworkDataReceived
            }
          />
        </View>
      )}

      {/* ==================================================== */}
      {/* 3D GAME                                             */}
      {/* ==================================================== */}

      {gameStarted && (
        <>
          <View
            style={
              styles.glView
            }
            {...panResponder.panHandlers}
          >
            <Canvas
              camera={{
                fov: 55,

                near:
                  0.1,

                far:
                  1000,
              }}
            >
              <GameScene
                setDebugInfo={
                  setDebugInfo
                }

                matchControlRef={
                  matchControlRef
                }

                gameMode={
                  gameMode
                }

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
            debugInfo={
              debugInfo
            }

            gameMode={
              gameMode
            }
          />

          {/* ================================================== */}
          {/* BACK BUTTON                                        */}
          {/* ================================================== */}

          <TouchableOpacity
            onPress={
              handleBackToMenu
            }
            activeOpacity={
              0.7
            }
            style={{
              position:
                'absolute',

              top:
                45,

              left:
                20,

              zIndex:
                99,

              backgroundColor:
                'rgba(0,0,0,0.4)',

              paddingVertical:
                6,

              paddingHorizontal:
                12,

              borderRadius:
                20,

              borderWidth:
                1,

              borderColor:
                'rgba(255,255,255,0.2)',
            }}
          >
            <Text
              style={{
                color:
                  '#FFFFFF',

                fontSize:
                  12,

                fontWeight:
                  '600',

                opacity:
                  0.8,
              }}
            >
              ✕ Menu
            </Text>
          </TouchableOpacity>

          {/* ================================================== */}
          {/* GAME OVER                                         */}
          {/* ================================================== */}

          <GameOverModal
            show={
              showGameOverModal
            }

            fadeAnim={
              fadeAnim
            }

            debugInfo={
              debugInfo
            }

            matchControlRef={
              matchControlRef
            }
          />
        </>
      )}
    </View>
  );
}

// ============================================================
// ROOT
// ============================================================

export default function App() {
  return (
    <MultiplayerProvider>
      <AppContent />
    </MultiplayerProvider>
  );
}