// //useMultiplayerFlow.ts

// import { useEffect, useState, useCallback, useRef } from 'react';
// import { GAME_EVENTS } from '@/constants/network-events';
// import { network, NetworkManager } from '@/services/multiplayer';
// import { GameMode } from '@football/engine';

// export type FlowStep = 
//   | 'IDLE' 
//   | 'CONNECTING' 
//   | 'WAITING_FOR_TOSS' 
//   | 'TOSS_DECISION' 
//   | 'WAITING_FOR_ROLE' 
//   | 'READY_CHECK' 
//   | 'PLAYING';

// interface UseMultiplayerFlowProps {
//   setGameMode: (mode: GameMode) => void;
//   onMultiplayerReady?: (isHost: boolean, role: 'SHOOTER' | 'GOALKEEPER') => void;
//   onNetworkDataReceived?: (data: any) => void;
// }

// export function useMultiplayerFlow({ 
//   setGameMode, 
//   onMultiplayerReady, 
//   onNetworkDataReceived 
// }: UseMultiplayerFlowProps) {
//   const [hostIp, setHostIp] = useState('');
//   const [myIp, setMyIp] = useState('');
//   const [status, setStatus] = useState('');
  
//   const [flowStep, setFlowStep] = useState<FlowStep>('IDLE');
//   const [isTossWinner, setIsTossWinner] = useState(false);
//   const isTossWinnerRef = useRef(false);

//   const [selectedRole, setSelectedRole] = useState<'SHOOTER' | 'GOALKEEPER' | null>(null);
//   const selectedRoleRef = useRef<'SHOOTER' | 'GOALKEEPER' | null>(null);

//   const [isMyReady, setIsMyReady] = useState(false);
//   const [isOpponentReady, setIsOpponentReady] = useState(false);

//   const updateRole = useCallback((role: 'SHOOTER' | 'GOALKEEPER') => {
//     setSelectedRole(role);
//     selectedRoleRef.current = role;
//   }, []);

//   const resetToIdle = useCallback((message = '') => {
//     setFlowStep('IDLE');
//     setSelectedRole(null);
//     selectedRoleRef.current = null;
//     setIsTossWinner(false);
//     isTossWinnerRef.current = false;
//     setIsMyReady(false);
//     setIsOpponentReady(false);
//     setStatus(message || 'রুম বাতিল করা হয়েছে।');
//   }, []);

//   const cancelRoom = async () => {
//     if (network.isConnected()) {
//       network.send({ type: 'ROOM_CANCELLED' });
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }
//     await network.disconnect();
//     resetToIdle('রুম বাতিল করা হয়েছে।');
//   };

//   useEffect(() => {
//     network.setOnDisconnect(() => {
//       resetToIdle('⚠️ প্রতিপক্ষ ডিসকানেক্ট করেছে! রুম বাতিল করা হলো।');
//     });

//     return () => {
//       network.disconnect().catch(() => {});
//     };
//   }, [resetToIdle]);

//   const startGameplay = useCallback((role: 'SHOOTER' | 'GOALKEEPER') => {
//     setFlowStep('PLAYING');
//     setStatus('🎮 গেম শুরু হচ্ছে!');
//     setGameMode('VS_PLAYER' as GameMode);
//     if (onMultiplayerReady) {
//       onMultiplayerReady(network.isRunningAsHost(), role);
//     }
//   }, [setGameMode, onMultiplayerReady]);

//   // 📡 ইনকামিং মেসেজ হ্যান্ডলিং
//   const handleIncomingData = useCallback((data: any) => {
//     if (onNetworkDataReceived) onNetworkDataReceived(data);

//     switch (data.type) {
//       case 'ROOM_CANCELLED': {
//         network.disconnect();
//         resetToIdle('⚠️ প্রতিপক্ষ রুম ক্যানসেল করেছে!');
//         break;
//       }

//       case GAME_EVENTS.TOSS_RESULT: {
//         const amIWinner = data.winnerId === (network.isRunningAsHost() ? 'HOST' : 'CLIENT');
//         setIsTossWinner(amIWinner);
//         isTossWinnerRef.current = amIWinner;

//         setFlowStep(amIWinner ? 'TOSS_DECISION' : 'WAITING_FOR_ROLE');
//         setStatus(amIWinner ? '🎉 আপনি টসে জিতেছেন! আপনার ভূমিকা বেছে নিন।' : 'প্রতিপক্ষ টস জিতেছে, সিদ্ধান্ত নিচ্ছে...');
//         break;
//       }

//       case GAME_EVENTS.ROLE_SELECTED: {
//         const winnerChosenRole: 'SHOOTER' | 'GOALKEEPER' = data.selectedRole;
//         const amITossWinner = isTossWinnerRef.current;

//         // 🔥 আসল ফিক্স: টস বিজয়ী যা সিলেক্ট করবে, অন্যজন তার ঠিক বিপরীত ভূমিকা পাবে
//         let myAssignedRole: 'SHOOTER' | 'GOALKEEPER';
//         if (amITossWinner) {
//           myAssignedRole = winnerChosenRole;
//         } else {
//           myAssignedRole = winnerChosenRole === 'SHOOTER' ? 'GOALKEEPER' : 'SHOOTER';
//         }

//         console.log(`🎯 Assigned Role for this device (TossWinner: ${amITossWinner}): ${myAssignedRole}`);
//         updateRole(myAssignedRole);
//         setFlowStep('READY_CHECK');
//         setStatus(`আপনার ভূমিকা: ${myAssignedRole}`);
//         break;
//       }

//       case GAME_EVENTS.PLAYER_READY: {
//         setIsOpponentReady(true);
//         break;
//       }
//     }
//   }, [onNetworkDataReceived, resetToIdle, updateRole]);

//   const handleHost = async () => {
//     try {
//       const ip = await NetworkManager.getLocalIP();
//       setMyIp(ip);
//       setStatus(`Hosting... IP: ${ip}\nWaiting for Player 2...`);
//       setFlowStep('CONNECTING');

//       await network.startHost(
//         () => {
//           setStatus('Player 2 Connected! টস শুরু করুন...');
//           setFlowStep('WAITING_FOR_TOSS');
//         },
//         handleIncomingData
//       );
//     } catch {
//       setStatus('Failed to start Host');
//       setFlowStep('IDLE');
//     }
//   };

//   const handleJoin = async () => {
//     if (!hostIp) return;
//     setStatus('Connecting to Host...');
//     setFlowStep('CONNECTING');

//     await network.connectToHost(
//       hostIp,
//       () => {
//         setStatus('Host-এর সাথে কানেক্টেড! টসের জন্য অপেক্ষা করুন...');
//         setFlowStep('WAITING_FOR_TOSS');
//       },
//       handleIncomingData
//     );
//   };

//   const handleToss = () => {
//     if (!network.isRunningAsHost()) return;
//     const winnerId = Math.random() < 0.5 ? 'HOST' : 'CLIENT';
    
//     network.send({ type: GAME_EVENTS.TOSS_RESULT, winnerId });

//     const amIWinner = winnerId === 'HOST';
//     setIsTossWinner(amIWinner);
//     isTossWinnerRef.current = amIWinner;

//     setFlowStep(amIWinner ? 'TOSS_DECISION' : 'WAITING_FOR_ROLE');
//     setStatus(amIWinner ? '🎉 আপনি টসে জিতেছেন! আপনার ভূমিকা বেছে নিন।' : 'প্রতিপক্ষ টস জিতেছে, সিদ্ধান্ত নিচ্ছে...');
//   };

//   const handleSelectRole = (role: 'SHOOTER' | 'GOALKEEPER') => {
//     // নিজে টস উইনার নিশ্চিত করা
//     isTossWinnerRef.current = true;
//     setIsTossWinner(true);

//     updateRole(role);
    
//     // ব্রডকাস্ট মেসেজ পাঠানো যাতে অপোনেন্ট বিপরীত রোল সেট করতে পারে
//     network.send({ type: GAME_EVENTS.ROLE_SELECTED, selectedRole: role });
    
//     setFlowStep('READY_CHECK');
//     setStatus(`আপনি সিলেক্ট করেছেন: ${role}`);
//   };

//   const handleReady = () => {
//     setIsMyReady(true);
//     network.send({ type: GAME_EVENTS.PLAYER_READY });

//     if (isOpponentReady && selectedRoleRef.current) {
//       startGameplay(selectedRoleRef.current);
//     }
//   };

//   useEffect(() => {
//     if (isMyReady && isOpponentReady && selectedRoleRef.current && flowStep === 'READY_CHECK') {
//       startGameplay(selectedRoleRef.current);
//     }
//   }, [isMyReady, isOpponentReady, flowStep, startGameplay]);

//   return {
//     flowStep,
//     setFlowStep,
//     hostIp,
//     setHostIp,
//     myIp,
//     status,
//     isMyReady,
//     isOpponentReady,
//     selectedRole,
//     handleHost,
//     handleJoin,
//     handleToss,
//     handleSelectRole,
//     handleReady,
//     cancelRoom,
//   };
// }