

// src/hooks/useMultiplayerFlow.ts

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { GAME_EVENTS } from '@/constants/network-events';
import {
  network,
  NetworkManager,
} from '@/services/';

import { GameMode } from '@football/engine';

export type PlayerRole = 'SHOOTER' | 'GOALKEEPER';

export type PlayerId = 'HOST' | 'CLIENT';

export type FlowStep =
  | 'IDLE'
  | 'CONNECTING'
  | 'WAITING_FOR_TOSS'
  | 'TOSS_DECISION'
  | 'WAITING_FOR_ROLE'
  | 'READY_CHECK'
  | 'PLAYING';

interface UseMultiplayerFlowProps {
  setGameMode: (mode: GameMode) => void;

  onMultiplayerReady?: (
    isHost: boolean,
    role: PlayerRole,
  ) => void;

  onNetworkDataReceived?: (data: any) => void;
}

/**
 * Multiplayer setup flow
 *
 * HOST
 *  ↓
 * Create Room
 *  ↓
 * Player 2 Connected
 *  ↓
 * Toss
 *  ↓
 * Toss Winner selects role
 *  ↓
 * Both players receive exact role assignment
 *  ↓
 * Both Ready
 *  ↓
 * Game Start
 */
export function useMultiplayerFlow({
  setGameMode,
  onMultiplayerReady,
  onNetworkDataReceived,
}: UseMultiplayerFlowProps) {
  // =========================================================
  // BASIC STATE
  // =========================================================

  const [hostIp, setHostIp] = useState('');
  const [myIp, setMyIp] = useState('');

  const [status, setStatus] = useState('');

  const [flowStep, setFlowStep] =
    useState<FlowStep>('IDLE');

  // =========================================================
  // TOSS STATE
  // =========================================================

  const [isTossWinner, setIsTossWinner] =
    useState(false);

  const isTossWinnerRef =
    useRef(false);

  const [tossWinner, setTossWinner] =
    useState<PlayerId | null>(null);

  const tossWinnerRef =
    useRef<PlayerId | null>(null);

  // =========================================================
  // ROLE STATE
  // =========================================================

  const [selectedRole, setSelectedRole] =
    useState<PlayerRole | null>(null);

  const selectedRoleRef =
    useRef<PlayerRole | null>(null);

  // =========================================================
  // READY STATE
  // =========================================================

  const [isMyReady, setIsMyReady] =
    useState(false);

  const [isOpponentReady, setIsOpponentReady] =
    useState(false);

  // =========================================================
  // HELPER
  // =========================================================

  const getMyPlayerId = useCallback((): PlayerId => {
    return network.isRunningAsHost()
      ? 'HOST'
      : 'CLIENT';
  }, []);

  // =========================================================
  // ROLE UPDATE
  // =========================================================

  const updateRole = useCallback(
    (role: PlayerRole) => {
      setSelectedRole(role);
      selectedRoleRef.current = role;
    },
    [],
  );

  // =========================================================
  // RESET
  // =========================================================

  const resetToIdle = useCallback(
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
        message || 'রুম বাতিল করা হয়েছে।',
      );
    },
    [],
  );

  // =========================================================
  // CANCEL ROOM
  // =========================================================

  const cancelRoom = useCallback(async () => {
    try {
      /*
       * অন্য player connected থাকলে আগে cancellation
       * message পাঠানো হবে।
       */
      if (network.isConnected()) {
        try {
          network.send({
            type: 'ROOM_CANCELLED',
          });
        } catch (error) {
          console.warn(
            'Failed to send ROOM_CANCELLED:',
            error,
          );
        }

        // ছোট delay যাতে remote side message পায়
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 100);
        });
      }
    } catch (error) {
      console.warn(
        'Cancel room send error:',
        error,
      );
    } finally {
      try {
        await network.disconnect();
      } catch (error) {
        console.warn(
          'Disconnect error:',
          error,
        );
      }

      resetToIdle(
        'রুম বাতিল করা হয়েছে।',
      );
    }
  }, [resetToIdle]);

  // =========================================================
  // START GAMEPLAY
  // =========================================================

  const startGameplay = useCallback(
    (role: PlayerRole) => {
      /*
       * Duplicate GAME_START prevent
       */
      if (flowStep === 'PLAYING') {
        return;
      }

      setFlowStep('PLAYING');

      setStatus(
        '🎮 গেম শুরু হচ্ছে!',
      );

      setGameMode(
        'VS_PLAYER' as GameMode,
      );

      if (onMultiplayerReady) {
        onMultiplayerReady(
          network.isRunningAsHost(),
          role,
        );
      }
    },
    [
      flowStep,
      setGameMode,
      onMultiplayerReady,
    ],
  );

  // =========================================================
  // INCOMING NETWORK DATA
  // =========================================================

  const handleIncomingData = useCallback(
    (data: any) => {
      if (!data || typeof data !== 'object') {
        return;
      }

      console.log(
        '📡 Multiplayer message received:',
        data,
      );

      /*
       * Gameplay data parent component-এ পাঠানো হবে।
       *
       * IMPORTANT:
       * Setup event-ও পাঠানো হবে।
       * Parent চাইলে এগুলো ignore করতে পারবে।
       */
      if (onNetworkDataReceived) {
        onNetworkDataReceived(data);
      }

      switch (data.type) {
        // =====================================================
        // ROOM CANCELLED
        // =====================================================

        case 'ROOM_CANCELLED': {
          console.log(
            '🚪 Remote player cancelled room',
          );

          network
            .disconnect()
            .catch(() => {});

          resetToIdle(
            '⚠️ প্রতিপক্ষ রুম ক্যানসেল করেছে!',
          );

          break;
        }

        // =====================================================
        // TOSS RESULT
        // =====================================================

        case GAME_EVENTS.TOSS_RESULT: {
          const winnerId =
            data.winnerId as PlayerId;

          if (
            winnerId !== 'HOST' &&
            winnerId !== 'CLIENT'
          ) {
            console.warn(
              'Invalid toss winner:',
              data,
            );
            return;
          }

          const myPlayerId =
            getMyPlayerId();

          const amIWinner =
            winnerId === myPlayerId;

          // -----------------------------
          // Save toss winner globally
          // -----------------------------

          setTossWinner(winnerId);
          tossWinnerRef.current = winnerId;

          setIsTossWinner(amIWinner);
          isTossWinnerRef.current = amIWinner;

          console.log(
            '🪙 Toss Result:',
            {
              winnerId,
              myPlayerId,
              amIWinner,
            },
          );

          // -----------------------------
          // Winner chooses role
          // -----------------------------

          if (amIWinner) {
            setFlowStep(
              'TOSS_DECISION',
            );

            setStatus(
              '🎉 আপনি টসে জিতেছেন! Shooter অথবা Goalkeeper নির্বাচন করুন।',
            );
          } else {
            setFlowStep(
              'WAITING_FOR_ROLE',
            );

            setStatus(
              '🪙 প্রতিপক্ষ টসে জিতেছে। সে Shooter অথবা Goalkeeper নির্বাচন করছে...',
            );
          }

          break;
        }

        // =====================================================
        // ROLE SELECTED
        // =====================================================

        case GAME_EVENTS.ROLE_SELECTED: {
          const winnerId =
            data.winnerId as PlayerId;

          const winnerSelectedRole =
            data.selectedRole as PlayerRole;

          /*
           * Validation
           */

          if (
            winnerId !== 'HOST' &&
            winnerId !== 'CLIENT'
          ) {
            console.warn(
              'Invalid ROLE_SELECTED winnerId:',
              data,
            );
            return;
          }

          if (
            winnerSelectedRole !== 'SHOOTER' &&
            winnerSelectedRole !== 'GOALKEEPER'
          ) {
            console.warn(
              'Invalid selected role:',
              data,
            );
            return;
          }

          /*
           * IMPORTANT:
           *
           * Role assignment এখন local guess-এর ওপর
           * নির্ভর করছে না।
           *
           * winnerId + selectedRole থেকে দুই ফোনেই
           * একই result তৈরি হবে।
           */

          const myPlayerId =
            getMyPlayerId();

          const opponentRole: PlayerRole =
            winnerSelectedRole === 'SHOOTER'
              ? 'GOALKEEPER'
              : 'SHOOTER';

          const myAssignedRole: PlayerRole =
            myPlayerId === winnerId
              ? winnerSelectedRole
              : opponentRole;

          // -----------------------------
          // Save toss winner
          // -----------------------------

          setTossWinner(winnerId);
          tossWinnerRef.current = winnerId;

          setIsTossWinner(
            myPlayerId === winnerId,
          );

          isTossWinnerRef.current =
            myPlayerId === winnerId;

          // -----------------------------
          // Save role
          // -----------------------------

          updateRole(
            myAssignedRole,
          );

          setFlowStep(
            'READY_CHECK',
          );

          setStatus(
            myAssignedRole === 'SHOOTER'
              ? '🎯 আপনার ভূমিকা: SHOOTER'
              : '🧤 আপনার ভূমিকা: GOALKEEPER',
          );

          console.log(
            '🎯 ROLE ASSIGNMENT',
            {
              winnerId,
              winnerSelectedRole,
              myPlayerId,
              myAssignedRole,
              opponentRole,
            },
          );

          break;
        }

        // =====================================================
        // PLAYER READY
        // =====================================================

        case GAME_EVENTS.PLAYER_READY: {
          console.log(
            '✅ Opponent is ready',
          );

          setIsOpponentReady(true);

          break;
        }

        // =====================================================
        // OPTIONAL GAME START EVENT
        // =====================================================

        case GAME_EVENTS.GAME_START: {
          /*
           * যদি পরে GAME_START network event ব্যবহার করো,
           * এখান থেকে game start করা যাবে।
           */

          if (
            selectedRoleRef.current
          ) {
            startGameplay(
              selectedRoleRef.current,
            );
          }

          break;
        }

        default: {
          /*
           * Gameplay events এখানেই handle করার দরকার নেই।
           *
           * onNetworkDataReceived(data)-এর মাধ্যমে
           * parent/game controller-এ চলে গেছে।
           */

          break;
        }
      }
    },
    [
      getMyPlayerId,
      onNetworkDataReceived,
      resetToIdle,
      startGameplay,
      updateRole,
    ],
  );

  // =========================================================
  // HOST
  // =========================================================

  const handleHost = useCallback(
    async () => {
      try {
        const ip =
          await NetworkManager.getLocalIP();

        setMyIp(ip);

        setStatus(
          `Hosting...\nIP: ${ip}\nWaiting for Player 2...`,
        );

        setFlowStep(
          'CONNECTING',
        );

        await network.startHost(
          () => {
            console.log(
              '🟢 Player 2 connected',
            );

            setStatus(
              '🟢 Player 2 Connected!\n🪙 Toss শুরু করুন...',
            );

            setFlowStep(
              'WAITING_FOR_TOSS',
            );
          },
          handleIncomingData,
        );
      } catch (error) {
        console.error(
          '❌ Host error:',
          error,
        );

        setStatus(
          '❌ Failed to start Host',
        );

        setFlowStep(
          'IDLE',
        );
      }
    },
    [handleIncomingData],
  );

  // =========================================================
  // JOIN
  // =========================================================

  const handleJoin = useCallback(
    async () => {
      const cleanIp =
        hostIp.trim();

      if (!cleanIp) {
        setStatus(
          '⚠️ Host IP দিন।',
        );
        return;
      }

      try {
        setStatus(
          '🔄 Connecting to Host...',
        );

        setFlowStep(
          'CONNECTING',
        );

        await network.connectToHost(
          cleanIp,
          () => {
            console.log(
              '🟢 Connected to Host',
            );

            setStatus(
              '🟢 Host-এর সাথে কানেক্টেড!\n🪙 Toss-এর জন্য অপেক্ষা করুন...',
            );

            /*
             * IMPORTANT:
             *
             * Client নিজে Toss করবে না।
             * শুধু Host-এর Toss result-এর জন্য অপেক্ষা করবে।
             */

            setFlowStep(
              'WAITING_FOR_TOSS',
            );
          },
          handleIncomingData,
        );
      } catch (error) {
        console.error(
          '❌ Join error:',
          error,
        );

        setStatus(
          '❌ Host-এর সাথে কানেক্ট করা যায়নি।',
        );

        setFlowStep(
          'IDLE',
        );
      }
    },
    [
      hostIp,
      handleIncomingData,
    ],
  );

  // =========================================================
  // TOSS
  // =========================================================

  const handleToss = useCallback(
    () => {
      /*
       * শুধুমাত্র Host Toss করতে পারবে।
       */

      if (
        !network.isRunningAsHost()
      ) {
        console.warn(
          'Only Host can perform toss',
        );
        return;
      }

      if (!network.isConnected()) {
        setStatus(
          '⚠️ Player 2 এখনো connected নয়।',
        );
        return;
      }

      /*
       * Random toss
       */

      const winnerId: PlayerId =
        Math.random() < 0.5
          ? 'HOST'
          : 'CLIENT';

      console.log(
        '🪙 TOSS RESULT:',
        winnerId,
      );

      /*
       * IMPORTANT:
       *
       * winnerId network-এর মাধ্যমে Client-এ যাবে।
       */

      network.send({
        type: GAME_EVENTS.TOSS_RESULT,
        winnerId,
      });

      /*
       * Host-এর নিজের state-ও immediately update করতে হবে।
       */

      const amIWinner =
        winnerId === 'HOST';

      setTossWinner(
        winnerId,
      );

      tossWinnerRef.current =
        winnerId;

      setIsTossWinner(
        amIWinner,
      );

      isTossWinnerRef.current =
        amIWinner;

      if (amIWinner) {
        setFlowStep(
          'TOSS_DECISION',
        );

        setStatus(
          '🎉 আপনি টসে জিতেছেন! Shooter অথবা Goalkeeper নির্বাচন করুন।',
        );
      } else {
        setFlowStep(
          'WAITING_FOR_ROLE',
        );

        setStatus(
          '🪙 Player 2 টসে জিতেছে। তার role selection-এর জন্য অপেক্ষা করুন...',
        );
      }
    },
    [],
  );

  // =========================================================
  // SELECT ROLE
  // =========================================================

  const handleSelectRole = useCallback(
    (role: PlayerRole) => {
      /*
       * শুধুমাত্র Toss Winner role নির্বাচন করতে পারবে।
       */

      const myPlayerId =
        getMyPlayerId();

      const currentWinner =
        tossWinnerRef.current;

      if (!currentWinner) {
        console.warn(
          'Cannot select role: toss winner is unknown',
        );

        setStatus(
          '⚠️ আগে Toss সম্পন্ন করুন।',
        );

        return;
      }

      if (
        currentWinner !== myPlayerId
      ) {
        console.warn(
          'Only toss winner can select role',
          {
            currentWinner,
            myPlayerId,
          },
        );

        setStatus(
          '⚠️ শুধুমাত্র টসে বিজয়ী Player role নির্বাচন করতে পারবে।',
        );

        return;
      }

      /*
       * Winner-এর role
       */

      const winnerRole = role;

      /*
       * Opponent automatically opposite role পাবে।
       */

      const opponentRole: PlayerRole =
        role === 'SHOOTER'
          ? 'GOALKEEPER'
          : 'SHOOTER';

      /*
       * নিজের role immediately set করা
       */

      updateRole(
        winnerRole,
      );

      setIsTossWinner(true);
      isTossWinnerRef.current = true;

      /*
       * IMPORTANT:
       *
       * এখন message-এর সাথে winnerId পাঠানো হচ্ছে।
       *
       * তাই receiver আর অনুমান করবে না কে role select করেছে।
       */

      const message = {
        type: GAME_EVENTS.ROLE_SELECTED,

        winnerId: myPlayerId,

        selectedRole: winnerRole,

        /*
         * Explicit assignment
         * দুই ফোনে একই state রাখার জন্য।
         */

        hostRole:
          myPlayerId === 'HOST'
            ? winnerRole
            : opponentRole,

        clientRole:
          myPlayerId === 'CLIENT'
            ? winnerRole
            : opponentRole,
      };

      console.log(
        '📤 Sending ROLE_SELECTED:',
        message,
      );

      network.send(message);

      /*
       * Winner নিজেও Ready Check-এ যাবে।
       */

      setFlowStep(
        'READY_CHECK',
      );

      setStatus(
        winnerRole === 'SHOOTER'
          ? '🎯 আপনি SHOOTER। Ready চাপুন।'
          : '🧤 আপনি GOALKEEPER। Ready চাপুন।',
      );
    },
    [
      getMyPlayerId,
      updateRole,
    ],
  );

  // =========================================================
  // READY
  // =========================================================

  const handleReady = useCallback(
    () => {
      if (
        !selectedRoleRef.current
      ) {
        setStatus(
          '⚠️ Role এখনো সেট হয়নি।',
        );
        return;
      }

      /*
       * Duplicate ready prevent
       */

      if (isMyReady) {
        return;
      }

      console.log(
        '✅ I AM READY',
      );

      setIsMyReady(true);

      /*
       * Opponent-কে ready message
       */

      network.send({
        type: GAME_EVENTS.PLAYER_READY,
      });

      /*
       * যদি opponent আগেই ready থাকে,
       * তাহলে game start।
       */

      if (
        isOpponentReady &&
        selectedRoleRef.current
      ) {
        startGameplay(
          selectedRoleRef.current,
        );
      }
    },
    [
      isMyReady,
      isOpponentReady,
      startGameplay,
    ],
  );

  // =========================================================
  // BOTH READY WATCHER
  // =========================================================

  useEffect(() => {
    if (
      isMyReady &&
      isOpponentReady &&
      selectedRoleRef.current &&
      flowStep === 'READY_CHECK'
    ) {
      console.log(
        '🚀 BOTH PLAYERS READY — START GAME',
      );

      startGameplay(
        selectedRoleRef.current,
      );
    }
  }, [
    isMyReady,
    isOpponentReady,
    flowStep,
    startGameplay,
  ]);

  // =========================================================
  // DISCONNECT HANDLER
  // =========================================================

  useEffect(() => {
    network.setOnDisconnect(() => {
      console.log(
        '🔴 Multiplayer disconnected',
      );

      resetToIdle(
        '⚠️ প্রতিপক্ষ ডিসকানেক্ট করেছে! রুম বাতিল করা হলো।',
      );
    });

    return () => {
      network
        .disconnect()
        .catch(() => {});
    };
  }, [resetToIdle]);

  // =========================================================
  // RETURN
  // =========================================================

  return {
    // Flow
    flowStep,
    setFlowStep,

    // Network
    hostIp,
    setHostIp,
    myIp,

    // Status
    status,

    // Toss
    isTossWinner,
    tossWinner,

    // Role
    selectedRole,

    // Ready
    isMyReady,
    isOpponentReady,

    // Actions
    handleHost,
    handleJoin,
    handleToss,
    handleSelectRole,
    handleReady,
    cancelRoom,
  };
}