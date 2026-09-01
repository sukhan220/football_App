


// src/hooks/useMultiplayerFlow.ts

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { GAME_EVENTS } from '@/constants/network-events';
import { network, NetworkManager } from '@/services/tcp-manager';
import { GameMode } from '@football/engine';

// ============================================================
// TYPES
// ============================================================

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

export interface RoomInfo {
  ip: string;
  hostName?: string;
}

interface UseMultiplayerFlowProps {
  setGameMode: (mode: GameMode) => void;
  onMultiplayerReady?: (isHost: boolean, role: PlayerRole) => void;
  onNetworkDataReceived?: (data: any) => void;
}

// ============================================================
// HOOK
// ============================================================

export function useMultiplayerFlow({
  setGameMode,
  onMultiplayerReady,
  onNetworkDataReceived,
}: UseMultiplayerFlowProps) {
  // ==========================================================
  // BASIC STATE
  // ==========================================================

  const [hostIp, setHostIp] = useState('');
  const [myIp, setMyIp] = useState('');
  const [status, setStatus] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>('IDLE');
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);

  // ==========================================================
  // TOSS
  // ==========================================================

  const [isTossWinner, setIsTossWinner] = useState(false);
  const isTossWinnerRef = useRef(false);
  const [tossWinner, setTossWinner] = useState<PlayerId | null>(null);
  const tossWinnerRef = useRef<PlayerId | null>(null);

  // ==========================================================
  // ROLE
  // ==========================================================

  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  const selectedRoleRef = useRef<PlayerRole | null>(null);

  // ==========================================================
  // READY
  // ==========================================================

  const [isMyReady, setIsMyReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);

  // ==========================================================
  // PLAYER ID
  // ==========================================================

  const getMyPlayerId = useCallback((): PlayerId => {
    return network.isRunningAsHost() ? 'HOST' : 'CLIENT';
  }, []);

  // ==========================================================
  // ROLE UPDATE
  // ==========================================================

  const updateRole = useCallback((role: PlayerRole) => {
    setSelectedRole(role);
    selectedRoleRef.current = role;
    console.log('🎭 My role:', role);
  }, []);

  // ==========================================================
  // RESET & CANCEL
  // ==========================================================

  const resetToIdle = useCallback((message = '') => {
    setFlowStep('IDLE');
    setSelectedRole(null);
    selectedRoleRef.current = null;
    setIsTossWinner(false);
    isTossWinnerRef.current = false;
    setTossWinner(null);
    tossWinnerRef.current = null;
    setIsMyReady(false);
    setIsOpponentReady(false);
    setStatus(message || 'রুম বাতিল করা হয়েছে।');
  }, []);

  const cancelRoom = useCallback(async () => {
    try {
      if (network.isConnected()) {
        network.send({ type: 'ROOM_CANCELLED' } as any);
        await network.disconnect();
      }
    } catch (e) {
      console.warn('Cancel room error:', e);
    } finally {
      resetToIdle('রুম বাতিল করা হয়েছে।');
    }
  }, [resetToIdle]);

  // ==========================================================
  // START GAMEPLAY
  // ==========================================================

  const startGameplay = useCallback(
    (role: PlayerRole) => {
      if (flowStep === 'PLAYING') return;

      console.log('🎮 START MULTIPLAYER GAME:', {
        role,
        isHost: network.isRunningAsHost(),
      });

      setFlowStep('PLAYING');
      setStatus('🎮 গেম শুরু হচ্ছে!');
      setGameMode('VS_PLAYER' as GameMode);

      if (onMultiplayerReady) {
        onMultiplayerReady(network.isRunningAsHost(), role);
      }
    },
    [flowStep, setGameMode, onMultiplayerReady]
  );

  // ==========================================================
  // INCOMING DATA
  // ==========================================================

  const handleIncomingData = useCallback(
    (data: any) => {
      if (!data || typeof data !== 'object') return;

      console.log('📡 Multiplayer message received:', data);

      if (onNetworkDataReceived) {
        onNetworkDataReceived(data);
      }

      // ROOM CANCELLED
      if (data.type === 'ROOM_CANCELLED') {
        console.log('🚪 Remote player cancelled room');
        network.disconnect().catch(() => {});
        resetToIdle('⚠️ প্রতিপক্ষ রুম ক্যানসেল করেছে!');
        return;
      }

      // TOSS RESULT
      if (data.type === GAME_EVENTS.TOSS_RESULT) {
        const winnerId = data.winnerId as PlayerId;

        if (winnerId !== 'HOST' && winnerId !== 'CLIENT') {
          console.warn('Invalid toss winner:', data);
          return;
        }

        const myPlayerId = getMyPlayerId();
        const amIWinner = winnerId === myPlayerId;

        setTossWinner(winnerId);
        tossWinnerRef.current = winnerId;
        setIsTossWinner(amIWinner);
        isTossWinnerRef.current = amIWinner;

        if (amIWinner) {
          setFlowStep('TOSS_DECISION');
          setStatus('🎉 আপনি টসে জিতেছেন! Shooter অথবা Goalkeeper নির্বাচন করুন।');
        } else {
          setFlowStep('WAITING_FOR_ROLE');
          setStatus('🪙 প্রতিপক্ষ টসে জিতেছে। সে Shooter অথবা Goalkeeper নির্বাচন করছে...');
        }

        return;
      }

      // ROLE SELECTED
      if (data.type === GAME_EVENTS.ROLE_SELECTED) {
        const winnerId = data.winnerId as PlayerId;
        const winnerSelectedRole = data.selectedRole as PlayerRole;

        if (winnerId !== 'HOST' && winnerId !== 'CLIENT') return;
        if (winnerSelectedRole !== 'SHOOTER' && winnerSelectedRole !== 'GOALKEEPER') return;

        const myPlayerId = getMyPlayerId();
        const opponentRole: PlayerRole =
          winnerSelectedRole === 'SHOOTER' ? 'GOALKEEPER' : 'SHOOTER';

        const myAssignedRole: PlayerRole =
          myPlayerId === winnerId ? winnerSelectedRole : opponentRole;

        setTossWinner(winnerId);
        tossWinnerRef.current = winnerId;
        const amIWinner = myPlayerId === winnerId;
        setIsTossWinner(amIWinner);
        isTossWinnerRef.current = amIWinner;

        updateRole(myAssignedRole);

        setIsMyReady(false);
        setIsOpponentReady(false);
        setFlowStep('READY_CHECK');

        setStatus(
          myAssignedRole === 'SHOOTER'
            ? '🎯 আপনার ভূমিকা: SHOOTER'
            : '🧤 আপনার ভূমিকা: GOALKEEPER'
        );

        return;
      }

      // PLAYER READY
      if (data.type === GAME_EVENTS.PLAYER_READY) {
        console.log('✅ Opponent is ready');
        setIsOpponentReady(true);
        return;
      }

      // GAME START
      if (data.type === GAME_EVENTS.GAME_START) {
        console.log('🎮 GAME_START received');
        if (selectedRoleRef.current) {
          startGameplay(selectedRoleRef.current);
        }
        return;
      }
    },
    [getMyPlayerId, onNetworkDataReceived, resetToIdle, startGameplay, updateRole]
  );

  // ==========================================================
  // HOST
  // ==========================================================

  const handleHost = useCallback(async () => {
    try {
      console.log('🟡 Starting TCP host...');

      // NetworkManager দিয়ে সরাসরি static method কল
      const ip = await NetworkManager.getLocalIP();

      setMyIp(ip);
      setStatus(`Hosting...\nIP: ${ip}\nWaiting for Player 2...`);
      setFlowStep('CONNECTING');

      await network.startHost(() => {
        console.log('🟢 Player 2 connected');
        setStatus('🟢 Player 2 Connected!\n🪙 Toss শুরু করুন...');
        setFlowStep('WAITING_FOR_TOSS');
      }, handleIncomingData);

      console.log('🟢 TCP HOST STARTED');
    } catch (error) {
      console.error('❌ Host error:', error);
      setStatus('❌ Failed to start Host');
      setFlowStep('IDLE');
    }
  }, [handleIncomingData]);

  // ==========================================================
  // CONNECT TO IP
  // ==========================================================

  const connectToIp = useCallback(
    async (targetIp: string) => {
      const cleanIp = targetIp.trim();

      if (!cleanIp) {
        setStatus('⚠️ Host IP দিন।');
        return;
      }

      try {
        console.log('🟡 Connecting to:', cleanIp);
        setStatus('🔄 Connecting to Host...');
        setFlowStep('CONNECTING');

        await network.connectToHost(
          cleanIp,
          () => {
            console.log('🟢 Connected to Host');
            setStatus('🟢 Host-এর সাথে কানেক্টেড!\n🪙 Toss-এর জন্য অপেক্ষা করুন...');
            setFlowStep('WAITING_FOR_TOSS');
          },
          handleIncomingData
        );

        console.log('🟢 TCP CLIENT CONNECTED');
      } catch (error) {
        console.error('❌ Join error:', error);
        setStatus('❌ Host-এর সাথে কানেক্ট করা যায়নি।');
        setFlowStep('IDLE');
      }
    },
    [handleIncomingData]
  );

  // ==========================================================
  // JOIN & AUTO JOIN
  // ==========================================================

  const handleJoin = useCallback(() => {
    return connectToIp(hostIp);
  }, [connectToIp, hostIp]);

  const handleAutoJoin = useCallback(
    (targetIp: string) => {
      setHostIp(targetIp);
      return connectToIp(targetIp);
    },
    [connectToIp]
  );

  // ==========================================================
  // TOSS
  // ==========================================================

  const handleToss = useCallback(() => {
    if (!network.isRunningAsHost()) {
      console.warn('Only Host can perform toss');
      return;
    }

    if (!network.isConnected()) {
      console.warn('TOSS FAILED: Player 2 not connected');
      setStatus('⚠️ Player 2 এখনো connected নয়।');
      return;
    }

    const winnerId: PlayerId = Math.random() < 0.5 ? 'HOST' : 'CLIENT';
    console.log('🪙 TOSS RESULT:', winnerId);

    network.send({
      type: GAME_EVENTS.TOSS_RESULT,
      winnerId,
    } as any);

    const amIWinner = winnerId === 'HOST';

    setTossWinner(winnerId);
    tossWinnerRef.current = winnerId;
    setIsTossWinner(amIWinner);
    isTossWinnerRef.current = amIWinner;

    if (amIWinner) {
      setFlowStep('TOSS_DECISION');
      setStatus('🎉 আপনি টসে জিতেছেন! Shooter অথবা Goalkeeper নির্বাচন করুন।');
    } else {
      setFlowStep('WAITING_FOR_ROLE');
      setStatus('🪙 Player 2 টসে জিতেছে। তার role selection-এর জন্য অপেক্ষা করুন...');
    }
  }, []);

  // ==========================================================
  // SELECT ROLE
  // ==========================================================

  const handleSelectRole = useCallback(
    (role: PlayerRole) => {
      const myPlayerId = getMyPlayerId();
      const currentWinner = tossWinnerRef.current;

      if (!currentWinner) {
        setStatus('⚠️ আগে Toss সম্পন্ন করুন।');
        return;
      }

      if (currentWinner !== myPlayerId) {
        setStatus('⚠️ শুধুমাত্র টসে বিজয়ী Player role নির্বাচন করতে পারবে।');
        return;
      }

      const winnerRole = role;
      const opponentRole: PlayerRole = role === 'SHOOTER' ? 'GOALKEEPER' : 'SHOOTER';

      updateRole(winnerRole);
      setIsTossWinner(true);
      isTossWinnerRef.current = true;

      const message = {
        type: GAME_EVENTS.ROLE_SELECTED,
        winnerId: myPlayerId,
        selectedRole: winnerRole,
        hostRole: myPlayerId === 'HOST' ? winnerRole : opponentRole,
        clientRole: myPlayerId === 'CLIENT' ? winnerRole : opponentRole,
      };

      network.send(message as any);

      setFlowStep('READY_CHECK');
      setIsMyReady(false);
      setIsOpponentReady(false);

      setStatus(
        winnerRole === 'SHOOTER'
          ? '🎯 আপনি SHOOTER। Ready চাপুন।'
          : '🧤 আপনি GOALKEEPER। Ready চাপুন।'
      );
    },
    [getMyPlayerId, updateRole]
  );

  // ==========================================================
  // READY
  // ==========================================================

  const handleReady = useCallback(() => {
    if (!selectedRoleRef.current) {
      setStatus('⚠️ Role এখনো সেট হয়নি।');
      return;
    }

    if (isMyReady) return;

    if (!network.isConnected()) {
      setStatus('⚠️ Multiplayer connection নেই।');
      return;
    }

    setIsMyReady(true);
    console.log('✅ I AM READY');

    network.send({
      type: GAME_EVENTS.PLAYER_READY,
    } as any);

    if (isOpponentReady && selectedRoleRef.current) {
      startGameplay(selectedRoleRef.current);
    }
  }, [isMyReady, isOpponentReady, startGameplay]);

  // ==========================================================
  // BOTH READY WATCHER
  // ==========================================================

  useEffect(() => {
    if (
      isMyReady &&
      isOpponentReady &&
      selectedRoleRef.current &&
      flowStep === 'READY_CHECK'
    ) {
      console.log('🚀 BOTH PLAYERS READY');

      if (network.isRunningAsHost()) {
        network.send({
          type: GAME_EVENTS.GAME_START,
        } as any);
      }

      startGameplay(selectedRoleRef.current);
    }
  }, [isMyReady, isOpponentReady, flowStep, startGameplay]);

  // ==========================================================
  // DISCONNECT LISTENER
  // ==========================================================

  useEffect(() => {
    network.setOnDisconnect(() => {
      console.log('🔴 Multiplayer disconnected');
      resetToIdle('⚠️ প্রতিপক্ষ ডিসকানেক্ট করেছে! রুম বাতিল করা হলো।');
    });
  }, [resetToIdle]);

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    flowStep,
    setFlowStep,
    hostIp,
    setHostIp,
    myIp,
    availableRooms,
    setAvailableRooms,
    status,
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
    isConnected: network.isConnected(),
    isHost: network.isRunningAsHost(),
    connected: network.isConnected(),
    ready: isMyReady && isOpponentReady,
    send: (data: any) => network.send(data),
    disconnect: async () => {
      await network.disconnect();
    },
  };
}