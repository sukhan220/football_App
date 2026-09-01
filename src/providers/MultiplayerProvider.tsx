

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

type NetworkSubscriber =
  (data: any) => void;

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
  // NETWORK BUS
  // ----------------------------------------------------------

  subscribe: (
    callback: NetworkSubscriber
  ) => () => void;

  send: (
    data: any
  ) => boolean;

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
}

export function MultiplayerProvider({
  children,
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
  // NETWORK SUBSCRIBERS
  //
  // One central bus.
  //
  // GameScene, index etc. subscribe এখানে।
  // ==========================================================

  const subscribersRef =
    useRef<NetworkSubscriber[]>([]);

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
  // NETWORK STATE
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
  // RESET FLOW
  //
  // IMPORTANT:
  // এখানে TCP disconnect করা হবে না।
  //
  // কারণ PLAYING অবস্থায় flow reset হলে
  // socket কাটা যাবে না।
  // ==========================================================

  const resetToIdle =
    useCallback(
      (
        message = ''
      ) => {
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
      (
        role: PlayerRole
      ) => {
        setSelectedRole(role);

        selectedRoleRef.current =
          role;

        console.log(
          '🎭 My role:',
          role
        );
      },
      []
    );

  // ==========================================================
  // NETWORK MESSAGE HANDLER
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

        // ----------------------------------------------------
        // SEND TO ALL SUBSCRIBERS
        // ----------------------------------------------------

        const listeners =
          [
            ...subscribersRef.current,
          ];

        listeners.forEach(
          listener => {
            try {
              listener(data);
            } catch (error) {
              console.error(
                '❌ Multiplayer subscriber error:',
                error
              );
            }
          }
        );

        // ----------------------------------------------------
        // ROOM CANCELLED
        // ----------------------------------------------------

        if (
          data.type ===
          'ROOM_CANCELLED'
        ) {
          console.log(
            '🚪 Remote player cancelled room'
          );

          try {
            udpNetwork.closeUDP();
          } catch {}

          network
            .disconnect()
            .catch(() => {});

          refreshNetworkState();

          resetToIdle(
            '⚠️ প্রতিপক্ষ রুম ক্যানসেল করেছে!'
          );

          return;
        }

        // ----------------------------------------------------
        // TOSS RESULT
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // ROLE SELECTED
        // ----------------------------------------------------

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
            return;
          }

          if (
            winnerSelectedRole !==
              'SHOOTER' &&
            winnerSelectedRole !==
              'GOALKEEPER'
          ) {
            return;
          }

          const myPlayerId =
            getMyPlayerId();

          const opponentRole: PlayerRole =
            winnerSelectedRole ===
            'SHOOTER'
              ? 'GOALKEEPER'
              : 'SHOOTER';

          const myAssignedRole: PlayerRole =
            myPlayerId === winnerId
              ? winnerSelectedRole
              : opponentRole;

          const amIWinner =
            myPlayerId === winnerId;

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

          updateRole(
            myAssignedRole
          );

          setIsMyReady(false);
          setIsOpponentReady(false);

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

        // ----------------------------------------------------
        // PLAYER READY
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // GAME START
        // ----------------------------------------------------

        if (
          data.type ===
          GAME_EVENTS.GAME_START
        ) {
          console.log(
            '🎮 GAME_START received'
          );

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
  // GLOBAL TCP LISTENER
  //
  // Provider mounted থাকা পর্যন্ত listener থাকবে।
  // ==========================================================

  useEffect(() => {
    const unsubscribe =
      network.onMessage(
        handleIncomingData
      );

    return () => {
      if (
        typeof unsubscribe ===
        'function'
      ) {
        unsubscribe();
      }

      // IMPORTANT:
      // এখানে network.disconnect()
      // করা যাবে না।
      //
      // Provider unmount না হওয়া পর্যন্ত
      // network alive থাকবে।
    };
  }, [
    handleIncomingData,
  ]);

  // ==========================================================
  // DISCONNECT CALLBACK
  // ==========================================================

  useEffect(() => {
    network.setOnDisconnect(
      () => {
        console.log(
          '🔴 Multiplayer disconnected'
        );

        refreshNetworkState();

        resetToIdle(
          '⚠️ প্রতিপক্ষ ডিসকানেক্ট করেছে!'
        );
      }
    );

    return () => {
      // Do NOT disconnect here.
      network.setOnDisconnect(
        null
      );
    };
  }, [
    refreshNetworkState,
    resetToIdle,
  ]);

  // ==========================================================
  // HOST
  // ==========================================================

  const handleHost =
    useCallback(
      async () => {
        try {
          console.log(
            '🟡 Starting TCP host...'
          );

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

              refreshNetworkState();

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

          console.log(
            '🟢 TCP HOST STARTED'
          );
        } catch (error) {
          console.error(
            '❌ Host error:',
            error
          );

          setStatus(
            '❌ Failed to start Host'
          );

          setFlowStep(
            'IDLE'
          );
        }
      },
      [
        handleIncomingData,
        refreshNetworkState,
      ]
    );

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
          console.log(
            '🟡 Connecting to:',
            cleanIp
          );

          setHostIp(
            cleanIp
          );

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

              refreshNetworkState();

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

          console.log(
            '🟢 TCP CLIENT CONNECTED'
          );
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
      () => {
        return connectToIp(
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
      [
        connectToIp,
      ]
    );

  // ==========================================================
  // TOSS
  // ==========================================================

  const handleToss =
    useCallback(() => {
      if (
        !network.isRunningAsHost()
      ) {
        return;
      }

      if (
        !network.isConnected()
      ) {
        setStatus(
          '⚠️ Player 2 এখনো connected নয়।'
        );

        return;
      }

      const winnerId: PlayerId =
        Math.random() < 0.5
          ? 'HOST'
          : 'CLIENT';

      setTossWinner(
        winnerId
      );

      tossWinnerRef.current =
        winnerId;

      const amIWinner =
        winnerId ===
        getMyPlayerId();

      setIsTossWinner(
        amIWinner
      );

      isTossWinnerRef.current =
        amIWinner;

      network.send({
        type:
          GAME_EVENTS.TOSS_RESULT,
        winnerId,
      } as any);

      // Local host-এর জন্যও একই event process
      handleIncomingData({
        type:
          GAME_EVENTS.TOSS_RESULT,
        winnerId,
      });
    }, [
      getMyPlayerId,
      handleIncomingData,
    ]);

  // ==========================================================
  // ROLE SELECT
  // ==========================================================

  const handleSelectRole =
    useCallback(
      (
        role: PlayerRole
      ) => {
        if (
          !isTossWinnerRef.current
        ) {
          return;
        }

        if (
          !network.isConnected()
        ) {
          return;
        }

        const myPlayerId =
          getMyPlayerId();

        const opponentRole: PlayerRole =
          role === 'SHOOTER'
            ? 'GOALKEEPER'
            : 'SHOOTER';

        updateRole(
          role
        );

        const message = {
          type:
            GAME_EVENTS.ROLE_SELECTED,

          winnerId:
            myPlayerId,

          selectedRole:
            role,

          hostRole:
            myPlayerId === 'HOST'
              ? role
              : opponentRole,

          clientRole:
            myPlayerId === 'CLIENT'
              ? role
              : opponentRole,
        };

        network.send(
          message as any
        );

        // Local state
        handleIncomingData(
          message
        );
      },
      [
        getMyPlayerId,
        handleIncomingData,
        updateRole,
      ]
    );

  // ==========================================================
  // START GAMEPLAY
  // ==========================================================

  const startGameplay =
    useCallback(
      (
        role: PlayerRole
      ) => {
        updateRole(
          role
        );

        setFlowStep(
          'PLAYING'
        );

        setStatus(
          '🎮 গেম শুরু হচ্ছে!'
        );

        refreshNetworkState();
      },
      [
        refreshNetworkState,
        updateRole,
      ]
    );

  // ==========================================================
  // READY
  // ==========================================================

  const handleReady =
    useCallback(() => {
      if (
        !selectedRoleRef.current
      ) {
        setStatus(
          '⚠️ Role এখনো সেট হয়নি।'
        );

        return;
      }

      if (isMyReady) {
        return;
      }

      if (
        !network.isConnected()
      ) {
        setStatus(
          '⚠️ Multiplayer connection নেই।'
        );

        return;
      }

      setIsMyReady(
        true
      );

      network.send({
        type:
          GAME_EVENTS.PLAYER_READY,
      } as any);

      if (
        isOpponentReady &&
        selectedRoleRef.current
      ) {
        if (
          network.isRunningAsHost()
        ) {
          network.send({
            type:
              GAME_EVENTS.GAME_START,
          } as any);
        }

        startGameplay(
          selectedRoleRef.current
        );
      }
    }, [
      isMyReady,
      isOpponentReady,
      startGameplay,
    ]);

  // ==========================================================
  // BOTH READY
  // ==========================================================

  useEffect(() => {
    if (
      !isMyReady ||
      !isOpponentReady ||
      !selectedRoleRef.current ||
      flowStep !== 'READY_CHECK'
    ) {
      return;
    }

    console.log(
      '🚀 BOTH PLAYERS READY'
    );

    if (
      network.isRunningAsHost()
    ) {
      network.send({
        type:
          GAME_EVENTS.GAME_START,
      } as any);
    }

    startGameplay(
      selectedRoleRef.current
    );
  }, [
    isMyReady,
    isOpponentReady,
    flowStep,
    startGameplay,
  ]);

  // ==========================================================
  // SUBSCRIBE
  // ==========================================================

  const subscribe =
    useCallback(
      (
        callback: NetworkSubscriber
      ) => {
        subscribersRef.current.push(
          callback
        );

        return () => {
          subscribersRef.current =
            subscribersRef.current.filter(
              item =>
                item !== callback
            );
        };
      },
      []
    );

  // ==========================================================
  // SEND
  // ==========================================================

  const send =
    useCallback(
      (
        data: any
      ) => {
        return network.send(
          data
        );
      },
      []
    );

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
  // ==========================================================

  const cancelRoom =
    useCallback(
      async () => {
        try {
          if (
            network.isConnected()
          ) {
            try {
              network.send({
                type:
                  'ROOM_CANCELLED',
              } as any);
            } catch {}
          }

          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                100
              )
          );
        } finally {
          try {
            udpNetwork.closeUDP();
          } catch {}

          try {
            await network.disconnect();
          } catch {}

          refreshNetworkState();

          resetToIdle(
            'রুম বাতিল করা হয়েছে।'
          );
        }
      },
      [
        refreshNetworkState,
        resetToIdle,
      ]
    );

  // ==========================================================
  // CONTEXT VALUE
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
        send,

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
        send,
        initUDP,
        startUDPSync,
        stopUDPSync,
        resetToIdle,
      ]
    );

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