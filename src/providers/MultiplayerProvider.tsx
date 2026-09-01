// src/providers/MultiplayerProvider.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { GameMode } from '@football/engine';

import { GAME_EVENTS } from '@/constants/network-events';

import {
  network,
  NetworkManager,
} from '@/services/tcp-manager';

import { udpNetwork } from '@/services/udp-manager';

// ============================================================
// TYPES
// ============================================================

export type PlayerRole =
  | 'SHOOTER'
  | 'GOALKEEPER';

export type PlayerId =
  | 'HOST'
  | 'CLIENT';

export type FlowStep =
  | 'IDLE'
  | 'CONNECTING'
  | 'WAITING_FOR_TOSS'
  | 'TOSS_DECISION'
  | 'WAITING_FOR_ROLE'
  | 'READY_CHECK'
  | 'PLAYING';

export interface RoomInfo {
  ip: string;
  hostName?: string;
}

// ============================================================
// CONTEXT TYPE
// ============================================================

interface MultiplayerContextValue {
  // ----------------------------------------------------------
  // FLOW
  // ----------------------------------------------------------

  flowStep: FlowStep;
  setFlowStep: React.Dispatch<
    React.SetStateAction<FlowStep>
  >;

  // ----------------------------------------------------------
  // NETWORK
  // ----------------------------------------------------------

  hostIp: string;
  setHostIp: React.Dispatch<
    React.SetStateAction<string>
  >;

  myIp: string;

  availableRooms: RoomInfo[];
  setAvailableRooms: React.Dispatch<
    React.SetStateAction<RoomInfo[]>
  >;

  status: string;

  isConnected: boolean;
  isHost: boolean;

  // ----------------------------------------------------------
  // TOSS
  // ----------------------------------------------------------

  isTossWinner: boolean;
  tossWinner: PlayerId | null;

  // ----------------------------------------------------------
  // ROLE
  // ----------------------------------------------------------

  selectedRole: PlayerRole | null;

  // ----------------------------------------------------------
  // READY
  // ----------------------------------------------------------

  isMyReady: boolean;
  isOpponentReady: boolean;

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  handleHost: () => Promise<void>;

  handleJoin: () => Promise<void>;

  handleAutoJoin: (
    targetIp: string
  ) => Promise<void>;

  handleToss: () => void;

  handleSelectRole: (
    role: PlayerRole
  ) => void;

  handleReady: () => void;

  cancelRoom: () => Promise<void>;

  // ----------------------------------------------------------
  // GAME
  // ----------------------------------------------------------

  startGameplay: (
    role: PlayerRole
  ) => void;

  // ----------------------------------------------------------
  // NETWORK MESSAGE SUBSCRIBERS
  // ----------------------------------------------------------

  subscribe: (
    callback: (data: any) => void
  ) => () => void;

  // ----------------------------------------------------------
  // UDP
  // ----------------------------------------------------------

  initUDP: () => void;

  startUDPSync: (
    targetIp: string,
    getSnapshot: () => any
  ) => void;

  stopUDPSync: () => void;

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  resetToIdle: (
    message?: string
  ) => void;
}

// ============================================================
// CONTEXT
// ============================================================

const MultiplayerContext =
  createContext<MultiplayerContextValue | null>(
    null
  );

// ============================================================
// PROVIDER
// ============================================================

interface MultiplayerProviderProps {
  children: ReactNode;

  /**
   * Game mode setter lives in index.tsx.
   */
  setGameMode?: (
    mode: GameMode
  ) => void;

  /**
   * Called when both players are ready.
   */
  onMultiplayerReady?: (
    isHost: boolean,
    role: PlayerRole
  ) => void;
}

export function MultiplayerProvider({
  children,
  setGameMode,
  onMultiplayerReady,
}: MultiplayerProviderProps) {
  // ==========================================================
  // BASIC STATE
  // ==========================================================

  const [hostIp, setHostIp] =
    useState('');

  const [myIp, setMyIp] =
    useState('');

  const [status, setStatus] =
    useState('');

  const [flowStep, setFlowStep] =
    useState<FlowStep>('IDLE');

  const [availableRooms, setAvailableRooms] =
    useState<RoomInfo[]>([]);

  // ==========================================================
  // TOSS
  // ==========================================================

  const [isTossWinner, setIsTossWinner] =
    useState(false);

  const isTossWinnerRef =
    useRef(false);

  const [tossWinner, setTossWinner] =
    useState<PlayerId | null>(null);

  const tossWinnerRef =
    useRef<PlayerId | null>(null);

  // ==========================================================
  // ROLE
  // ==========================================================

  const [selectedRole, setSelectedRole] =
    useState<PlayerRole | null>(null);

  const selectedRoleRef =
    useRef<PlayerRole | null>(null);

  // ==========================================================
  // READY
  // ==========================================================

  const [isMyReady, setIsMyReady] =
    useState(false);

  const [isOpponentReady, setIsOpponentReady] =
    useState(false);

  // ==========================================================
  // NETWORK STATUS
  // ==========================================================

  const [connectedState, setConnectedState] =
    useState(
      network.isConnected()
    );

  const [hostState, setHostState] =
    useState(
      network.isRunningAsHost()
    );

  // ==========================================================
  // MESSAGE SUBSCRIBERS
  // ==========================================================

  const subscribersRef =
    useRef<
      Array<(data: any) => void>
    >([]);

  // ==========================================================
  // PLAYER ID
  // ==========================================================

  const getMyPlayerId =
    useCallback((): PlayerId => {
      return network.isRunningAsHost()
        ? 'HOST'
        : 'CLIENT';
    }, []);

  // ==========================================================
  // UPDATE NETWORK STATUS
  // ==========================================================

  const refreshNetworkState =
    useCallback(() => {
      setConnectedState(
        network.isConnected()
      );

      setHostState(
        network.isRunningAsHost()
      );
    }, []);

  // ==========================================================
  // RESET FLOW ONLY
  //
  // IMPORTANT:
  //
  // This does NOT disconnect TCP.
  //
  // ==========================================================

  const resetToIdle =
    useCallback(
      (message = '') => {
        setFlowStep('IDLE');

        setSelectedRole(null);
        selectedRoleRef.current = null;

        setIsTossWinner(false);
        isTossWinnerRef.current = false;

        setTossWinner(null);
        tossWinnerRef.current = null;

        setIsMyReady(false);
        setIsOpponentReady(false);

        setStatus(
          message ||
          'রুম বাতিল করা হয়েছে।'
        );
      },
      []
    );

  // ==========================================================
  // ROLE UPDATE
  // ==========================================================

  const updateRole =
    useCallback(
      (role: PlayerRole) => {
        setSelectedRole(role);
        selectedRoleRef.current = role;
      },
      []
    );

  // ==========================================================
  // INCOMING MESSAGE
  // ==========================================================

  const handleIncomingData =
    useCallback(
      (data: any) => {
        if (
          !data ||
          typeof data !== 'object'
        ) {
          return;
        }

        console.log(
          '📡 Multiplayer message received:',
          data
        );

        // ------------------------------------------------------
        // GLOBAL SUBSCRIBERS
        // ------------------------------------------------------

        [
          ...subscribersRef.current,
        ].forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(
              'Multiplayer subscriber error:',
              error
            );
          }
        });

        // ------------------------------------------------------
        // ROOM CANCELLED
        // ------------------------------------------------------

        if (
          data.type ===
          'ROOM_CANCELLED'
        ) {
          console.log(
            '🚪 Remote player cancelled room'
          );

          udpNetwork.closeUDP();

          network
            .disconnect()
            .catch(() => { });

          refreshNetworkState();

          resetToIdle(
            '⚠️ প্রতিপক্ষ রুম ক্যানসেল করেছে!'
          );

          return;
        }

        // ------------------------------------------------------
        // TOSS RESULT
        // ------------------------------------------------------

        if (
          data.type ===
          GAME_EVENTS.TOSS_RESULT
        ) {
          const winnerId =
            data.winnerId as PlayerId;

          if (
            winnerId !== 'HOST' &&
            winnerId !== 'CLIENT'
          ) {
            console.warn(
              'Invalid toss winner:',
              data
            );

            return;
          }

          const myPlayerId =
            getMyPlayerId();

          const amIWinner =
            winnerId === myPlayerId;

          setTossWinner(
            winnerId
          );

          tossWinnerRef.current =
            winnerId;

          setIsTossWinner(
            amIWinner
          );

          isTossWinnerRef.current =
            amIWinner;

          if (amIWinner) {
            setFlowStep(
              'TOSS_DECISION'
            );

            setStatus(
              '🎉 আপনি টসে জিতেছেন! Shooter অথবা Goalkeeper নির্বাচন করুন।'
            );
          } else {
            setFlowStep(
              'WAITING_FOR_ROLE'
            );

            setStatus(
              '🪙 প্রতিপক্ষ টসে জিতেছে। সে Shooter অথবা Goalkeeper নির্বাচন করছে...'
            );
          }

          return;
        }

        // ------------------------------------------------------
        // ROLE SELECTED
        // ------------------------------------------------------

        if (
          data.type ===
          GAME_EVENTS.ROLE_SELECTED
        ) {
          const winnerId =
            data.winnerId as PlayerId;

          const winnerSelectedRole =
            data.selectedRole as PlayerRole;

          if (
            winnerId !== 'HOST' &&
            winnerId !== 'CLIENT'
          ) {
            console.warn(
              'Invalid ROLE_SELECTED winnerId:',
              data
            );

            return;
          }

          if (
            winnerSelectedRole !==
            'SHOOTER' &&
            winnerSelectedRole !==
            'GOALKEEPER'
          ) {
            console.warn(
              'Invalid selected role:',
              data
            );

            return;
          }

          const myPlayerId =
            getMyPlayerId();

          const opponentRole =
            winnerSelectedRole ===
              'SHOOTER'
              ? 'GOALKEEPER'
              : 'SHOOTER';

          const myAssignedRole =
            myPlayerId === winnerId
              ? winnerSelectedRole
              : opponentRole;

          setTossWinner(
            winnerId
          );

          tossWinnerRef.current =
            winnerId;

          setIsTossWinner(
            myPlayerId === winnerId
          );

          isTossWinnerRef.current =
            myPlayerId === winnerId;

          updateRole(
            myAssignedRole
          );

          setFlowStep(
            'READY_CHECK'
          );

          setStatus(
            myAssignedRole ===
              'SHOOTER'
              ? '🎯 আপনার ভূমিকা: SHOOTER'
              : '🧤 আপনার ভূমিকা: GOALKEEPER'
          );

          return;
        }

        // ------------------------------------------------------
        // PLAYER READY
        // ------------------------------------------------------

        if (
          data.type ===
          GAME_EVENTS.PLAYER_READY
        ) {
          console.log(
            '✅ Opponent is ready'
          );

          setIsOpponentReady(
            true
          );

          return;
        }

        // ------------------------------------------------------
        // GAME START
        // ------------------------------------------------------

        if (
          data.type ===
          GAME_EVENTS.GAME_START
        ) {
          if (
            selectedRoleRef.current
          ) {
            startGameplay(
              selectedRoleRef.current
            );
          }

          return;
        }
      },
      [
        getMyPlayerId,
        refreshNetworkState,
        resetToIdle,
        updateRole,
      ]
    );

  // ==========================================================
  // START GAMEPLAY
  //
  // IMPORTANT:
  //
  // No disconnect here.
  //
  // ==========================================================

  const startGameplay =
    useCallback(
      (role: PlayerRole) => {
        setFlowStep('PLAYING');

        setStatus(
          '🎮 গেম শুরু হচ্ছে!'
        );

        setGameMode?.(
          'VS_PLAYER' as GameMode
        );

        refreshNetworkState();

        if (onMultiplayerReady) {
          onMultiplayerReady(
            network.isRunningAsHost(),
            role
          );
        }
      },
      [
        onMultiplayerReady,
        refreshNetworkState,
        setGameMode,
      ]
    );

  // ==========================================================
  // SUBSCRIBE
  // ==========================================================

  const subscribe =
    useCallback(
      (
        callback: (data: any) => void
      ) => {
        subscribersRef.current.push(
          callback
        );

        return () => {
          subscribersRef.current =
            subscribersRef.current.filter(
              cb => cb !== callback
            );
        };
      },
      []
    );

  // ==========================================================
  // HOST
  // ==========================================================

  const handleHost =
    useCallback(async () => {
      try {
        const ip =
          await NetworkManager.getLocalIP();

        setMyIp(ip);

        setStatus(
          `Hosting...\nIP: ${ip}\nWaiting for Player 2...`
        );

        setFlowStep(
          'CONNECTING'
        );

        await network.startHost(
          () => {
            console.log(
              '🟢 Player 2 connected'
            );

            setConnectedState(
              true
            );

            setHostState(
              true
            );

            // Start UDP receiver.
            udpNetwork.initUDP();

            setStatus(
              '🟢 Player 2 Connected!\n🪙 Toss শুরু করুন...'
            );

            setFlowStep(
              'WAITING_FOR_TOSS'
            );
          },
          handleIncomingData
        );

        refreshNetworkState();
      } catch (error) {
        console.error(
          '❌ Host error:',
          error
        );

        setStatus(
          '❌ Failed to start Host'
        );

        setFlowStep('IDLE');

        refreshNetworkState();
      }
    }, [
      handleIncomingData,
      refreshNetworkState,
    ]);

  // ==========================================================
  // CONNECT TO HOST
  // ==========================================================

  const connectToIp =
    useCallback(
      async (
        targetIp: string
      ) => {
        const cleanIp =
          targetIp.trim();

        if (!cleanIp) {
          setStatus(
            '⚠️ Host IP দিন।'
          );

          return;
        }

        try {
          setStatus(
            '🔄 Connecting to Host...'
          );

          setFlowStep(
            'CONNECTING'
          );

          await network.connectToHost(
            cleanIp,
            () => {
              console.log(
                '🟢 Connected to Host'
              );

              setConnectedState(
                true
              );

              setHostState(
                false
              );

              // Start UDP receiver.
              udpNetwork.initUDP();

              // UDP target is the host.
              udpNetwork.setTargetIp(
                cleanIp
              );

              setStatus(
                '🟢 Host-এর সাথে কানেক্টেড!\n🪙 Toss-এর জন্য অপেক্ষা করুন...'
              );

              setFlowStep(
                'WAITING_FOR_TOSS'
              );
            },
            handleIncomingData
          );

          refreshNetworkState();
        } catch (error) {
          console.error(
            '❌ Join error:',
            error
          );

          setStatus(
            '❌ Host-এর সাথে কানেক্ট করা যায়নি।'
          );

          setFlowStep(
            'IDLE'
          );

          refreshNetworkState();
        }
      },
      [
        handleIncomingData,
        refreshNetworkState,
      ]
    );

  // ==========================================================
  // JOIN
  // ==========================================================

  const handleJoin =
    useCallback(
      async () => {
        await connectToIp(
          hostIp
        );
      },
      [
        connectToIp,
        hostIp,
      ]
    );

  // ==========================================================
  // AUTO JOIN
  // ==========================================================

  const handleAutoJoin =
    useCallback(
      async (
        targetIp: string
      ) => {
        setHostIp(
          targetIp
        );

        await connectToIp(
          targetIp
        );
      },
      [connectToIp]
    );

  // ==========================================================
  // TOSS
  // ==========================================================

  const handleToss =
    useCallback(() => {
      if (
        !network.isRunningAsHost()
      ) {
        console.warn(
          'Only Host can perform toss'
        );

        return;
      }

      if (
        !network.isConnected()
      ) {
        setStatus(
          '⚠️ Player 2 এখনো connected নয়।'
        );

        return;
      }

      const winnerId: PlayerId =
        Math.random() < 0.5
          ? 'HOST'
          : 'CLIENT';

      const sent =
        network.send({
          type:
            GAME_EVENTS.TOSS_RESULT,
          winnerId,
        });

      if (!sent) {
        setStatus(
          '❌ Toss পাঠানো যায়নি। TCP connection নেই।'
        );

        return;
      }

      const amIWinner =
        winnerId === 'HOST';

      setTossWinner(
        winnerId
      );

      tossWinnerRef.current =
        winnerId;

      setIsTossWinner(
        amIWinner
      );

      isTossWinnerRef.current =
        amIWinner;

      if (amIWinner) {
        setFlowStep(
          'TOSS_DECISION'
        );

        setStatus(
          '🎉 আপনি টসে জিতেছেন! Shooter অথবা Goalkeeper নির্বাচন করুন।'
        );
      } else {
        setFlowStep(
          'WAITING_FOR_ROLE'
        );

        setStatus(
          '🪙 Player 2 টসে জিতেছে। তার role selection-এর জন্য অপেক্ষা করুন...'
        );
      }
    }, []);

  // ==========================================================
  // ROLE SELECT
  // ==========================================================

  const handleSelectRole =
    useCallback(
      (role: PlayerRole) => {
        const myPlayerId =
          getMyPlayerId();

        const currentWinner =
          tossWinnerRef.current;

        if (!currentWinner) {
          setStatus(
            '⚠️ আগে Toss সম্পন্ন করুন।'
          );

          return;
        }

        if (
          currentWinner !==
          myPlayerId
        ) {
          setStatus(
            '⚠️ শুধুমাত্র টসে বিজয়ী Player role নির্বাচন করতে পারবে।'
          );

          return;
        }

        if (
          !network.isConnected()
        ) {
          setStatus(
            '❌ TCP connection নেই।'
          );

          return;
        }

        const winnerRole =
          role;

        const opponentRole =
          role === 'SHOOTER'
            ? 'GOALKEEPER'
            : 'SHOOTER';

        updateRole(
          winnerRole
        );

        setIsTossWinner(
          true
        );

        isTossWinnerRef.current =
          true;

        const message = {
          type:
            GAME_EVENTS.ROLE_SELECTED,

          winnerId:
            myPlayerId,

          selectedRole:
            winnerRole,

          hostRole:
            myPlayerId === 'HOST'
              ? winnerRole
              : opponentRole,

          clientRole:
            myPlayerId === 'CLIENT'
              ? winnerRole
              : opponentRole,
        };

        const sent =
          network.send(
            message as any
          );

        if (!sent) {
          setStatus('❌ Role পাঠানো যায়নি। TCP connection নেই।');

          return;
        }

        setFlowStep('READY_CHECK');

        setStatus(
          winnerRole === 'SHOOTER'
            ? '🎯 আপনি SHOOTER। Ready চাপুন।'
            : '🧤 আপনি GOALKEEPER। Ready চাপুন।'
        );
      },
      [
        getMyPlayerId,
        updateRole,
      ]
    );

  // ==========================================================
  // READY
  // ==========================================================

  const handleReady =
    useCallback(() => {
      const role =
        selectedRoleRef.current;

      if (!role) {
        setStatus('⚠️ Role এখনো সেট হয়নি।');

        return;
      }

      if (isMyReady) {
        return;
      }

      if (!network.isConnected() ) {
        setStatus('❌ TCP connection নেই। Ready পাঠানো যাচ্ছে না।');

        return;
      }

      setIsMyReady(true);

      const sent =
        network.send({
          type:
            GAME_EVENTS.PLAYER_READY,
        } as any);

      if (!sent) {
        setIsMyReady(false);

        setStatus('❌ Ready পাঠানো যায়নি। TCP connection নেই।');

        return;
      }

      console.log('✅ Local player ready');

      if (
        isOpponentReady
      ) {
        startGameplay(
          role
        );
      }
    }, [
      isMyReady,
      isOpponentReady,
      startGameplay,
    ]);

  // ==========================================================
  // BOTH READY WATCHER
  // ==========================================================

  useEffect(() => {
    if (
      isMyReady &&
      isOpponentReady &&
      selectedRoleRef.current &&
      flowStep ==='READY_CHECK'
    ) {
      startGameplay(selectedRoleRef.current);
    }
  }, [
    isMyReady,
    isOpponentReady,
    flowStep,
    startGameplay,
  ]);

  // ==========================================================
  // TCP DISCONNECT LISTENER
  //
  // IMPORTANT:
  //
  // Provider unmount হলে disconnect নয়।
  //
  // ==========================================================

  useEffect(() => {
    network.setOnDisconnect(
      () => {
        console.log('🔴 Multiplayer disconnected');

        setConnectedState(false);
        setHostState(false);
        udpNetwork.closeUDP();
        resetToIdle('⚠️ প্রতিপক্ষ ডিসকানেক্ট করেছে! রুম বাতিল করা হলো।');
      }
    );

    return () => {
      // DO NOT disconnect here.
      network.setOnDisconnect(
        null
      );
    };
  }, [
    resetToIdle,
  ]);

  // ==========================================================
  // UDP INIT
  // ==========================================================

  const initUDP =
    useCallback(() => {
      udpNetwork.initUDP();
    }, []);

  // ==========================================================
  // UDP SYNC
  // ==========================================================

  const startUDPSync =
    useCallback(
      (
        targetIp: string,
        getSnapshot: () => any
      ) => {
        if (!targetIp) {
          return;
        }

        udpNetwork.initUDP();

        udpNetwork.startSyncLoop(
          targetIp,
          getSnapshot,
          20
        );
      },
      []
    );

  // ==========================================================
  // STOP UDP
  // ==========================================================

  const stopUDPSync =
    useCallback(() => {
      udpNetwork.stopSyncLoop();
    }, []);

  // ==========================================================
  // CANCEL ROOM
  //
  // Explicit disconnect is allowed here.
  //
  // ==========================================================

  const cancelRoom =
    useCallback(async () => {
      try {
        if (
          network.isConnected()
        ) {
          try {
            network.send({
              type:
                'ROOM_CANCELLED',
            } as any);
          } catch (error) {
            console.warn('Failed to send ROOM_CANCELLED:',error);
          }

          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                100
              )
          );
        }
      } finally {
        try {
          udpNetwork.closeUDP();
        } catch { }

        try {
          await network.disconnect();
        } catch (error) {
          console.warn('Disconnect error:', error);
        }

        setConnectedState(false);
        setHostState(false);

        resetToIdle('রুম বাতিল করা হয়েছে।');
      }
    }, [
      resetToIdle,
    ]);

  // ==========================================================
  // PROVIDER VALUE
  // ==========================================================

  const value =
    useMemo<MultiplayerContextValue>(
      () => ({
        flowStep,
        setFlowStep,

        hostIp,
        setHostIp,

        myIp,

        availableRooms,
        setAvailableRooms,

        status,

        isConnected:
          connectedState,

        isHost:
          hostState,

        isTossWinner,

        tossWinner,

        selectedRole,

        isMyReady,

        isOpponentReady,

        handleHost,
        handleJoin,
        handleAutoJoin,

        handleToss,
        handleSelectRole,
        handleReady,

        cancelRoom,

        startGameplay,

        subscribe,

        initUDP,
        startUDPSync,
        stopUDPSync,

        resetToIdle,
      }),
      [
        flowStep,
        hostIp,
        myIp,
        availableRooms,
        status,
        connectedState,
        hostState,
        isTossWinner,
        tossWinner,
        selectedRole,
        isMyReady,
        isOpponentReady,
        handleHost,
        handleJoin,
        handleAutoJoin,
        handleToss,
        handleSelectRole,
        handleReady,
        cancelRoom,
        startGameplay,
        subscribe,
        initUDP,
        startUDPSync,
        stopUDPSync,
        resetToIdle,
      ]
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <MultiplayerContext.Provider
      value={value}
    >
      {children}
    </MultiplayerContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useMultiplayerContext() {
  const context =
    useContext(
      MultiplayerContext
    );

  if (!context) {
    throw new Error(
      'useMultiplayerContext must be used inside MultiplayerProvider'
    );
  }

  return context;
}