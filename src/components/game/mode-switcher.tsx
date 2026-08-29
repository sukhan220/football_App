


// // src/components/game/mode-switcher.tsx

// import React, { useEffect, useState } from 'react';

// import {
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   StyleSheet,
// } from 'react-native';

// import { GameMode } from '@football/engine';

// import { network } from '@/services/multiplayer';
// import { useMultiplayerFlow } from '@/hooks/useMultiplayerFlow';

// interface ModeSwitcherProps {
//   gameMode: GameMode;

//   setGameMode: (mode: GameMode) => void;

//   /**
//    * StartModal থেকে VS_PLAYER নির্বাচন হলে
//    * Network UI automatically open হবে।
//    */
//   initialNetworkOpen?: boolean;

//   /**
//    * Multiplayer setup সম্পূর্ণ হলে
//    * এই callback পাওয়া যাবে।
//    */
//   onMultiplayerReady?: (
//     isHost: boolean,
//     role: 'SHOOTER' | 'GOALKEEPER'
//   ) => void;

//   /**
//    * Remote network data
//    */
//   onNetworkDataReceived?: (data: any) => void;
// }

// export function ModeSwitcher({
//   gameMode,
//   setGameMode,
//   initialNetworkOpen = false,
//   onMultiplayerReady,
//   onNetworkDataReceived,
// }: ModeSwitcherProps) {
//   const [showNetworkUI, setShowNetworkUI] =
//     useState(initialNetworkOpen);

//   const {
//     flowStep,
//     hostIp,
//     setHostIp,

//     status,

//     isMyReady,
//     isOpponentReady,

//     handleHost,
//     handleJoin,
//     handleToss,
//     handleSelectRole,
//     handleReady,

//     cancelRoom,
//   } = useMultiplayerFlow({
//     setGameMode,
//     onMultiplayerReady,
//     onNetworkDataReceived,
//   });

//   /**
//    * StartModal থেকে VS_PLAYER এলে
//    * Network UI automatically খুলবে।
//    */
//   useEffect(() => {
//     if (initialNetworkOpen) {
//       setShowNetworkUI(true);
//     }
//   }, [initialNetworkOpen]);

//   /**
//    * 🤖 VS AI নির্বাচন
//    *
//    * যদি কোনো আগের multiplayer connection থাকে,
//    * সেটা cancel করে AI mode চালু করবে।
//    */
//   const handleSelectVsAI = async () => {
//     setShowNetworkUI(false);

//     await cancelRoom();

//     setGameMode('VS_AI' as GameMode);
//   };

//   /**
//    * Network UI বন্ধ করলে room cancel করবে।
//    */
//   const handleToggleNetworkUI = async () => {
//     if (showNetworkUI) {
//       await cancelRoom();
//       setShowNetworkUI(false);
//       return;
//     }

//     setGameMode('VS_PLAYER' as GameMode);
//     setShowNetworkUI(true);
//   };

//   /**
//    * Flow অনুযায়ী title
//    */
//   const getStepTitle = () => {
//     switch (flowStep) {
//       case 'IDLE':
//         return 'LOCAL NETWORK';

//       case 'WAITING_FOR_TOSS':
//         return 'WAITING FOR TOSS';

//       case 'TOSS_DECISION':
//         return 'CHOOSE YOUR ROLE';

//       case 'READY_CHECK':
//         return 'READY CHECK';

//       default:
//         return 'LOCAL NETWORK';
//     }
//   };

//   return (
//     <View style={styles.container}>

//       {/* ================================================= */}
//       {/* MODE BUTTONS                                      */}
//       {/* ================================================= */}

//       <View style={styles.modeRow}>

//         {/* VS AI */}
//         <TouchableOpacity
//           activeOpacity={0.8}
//           style={[
//             styles.modeButton,
//             gameMode === 'VS_AI' && styles.activeAiMode,
//           ]}
//           onPress={handleSelectVsAI}
//         >
//           <Text style={styles.modeIcon}>🤖</Text>

//           <Text style={styles.modeText}>
//             VS AI
//           </Text>
//         </TouchableOpacity>

//         {/* VS PLAYER */}
//         <TouchableOpacity
//           activeOpacity={0.8}
//           style={[
//             styles.modeButton,
//             gameMode === 'VS_PLAYER' &&
//               showNetworkUI &&
//               styles.activePlayerMode,
//           ]}
//           onPress={handleToggleNetworkUI}
//         >
//           <Text style={styles.modeIcon}>👥</Text>

//           <Text style={styles.modeText}>
//             2 PLAYER
//           </Text>
//         </TouchableOpacity>

//       </View>

//       {/* ================================================= */}
//       {/* NETWORK SETUP                                     */}
//       {/* ================================================= */}

//       {showNetworkUI && (
//         <View style={styles.networkCard}>

//           {/* Header */}
//           <View style={styles.networkHeader}>

//             <View>
//               <Text style={styles.networkTitle}>
//                 {getStepTitle()}
//               </Text>

//               <Text style={styles.networkSubtitle}>
//                 Local WiFi / Hotspot
//               </Text>
//             </View>

//             <Text style={styles.networkIcon}>
//               📡
//             </Text>

//           </View>

//           {/* ================================================= */}
//           {/* STEP 1 — CREATE / JOIN                            */}
//           {/* ================================================= */}

//           {flowStep === 'IDLE' && (
//             <View style={styles.stepContainer}>

//               <Text style={styles.instruction}>
//                 Create a room on one device,
//                 then join from the second device.
//               </Text>

//               {/* HOST */}
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 onPress={handleHost}
//                 style={styles.hostButton}
//               >
//                 <Text style={styles.buttonIcon}>
//                   🏠
//                 </Text>

//                 <View style={styles.buttonContent}>
//                   <Text style={styles.primaryButtonText}>
//                     CREATE ROOM
//                   </Text>

//                   <Text style={styles.secondaryButtonText}>
//                     Start as Host
//                   </Text>
//                 </View>
//               </TouchableOpacity>

//               <View style={styles.divider}>
//                 <View style={styles.line} />

//                 <Text style={styles.orText}>
//                   OR
//                 </Text>

//                 <View style={styles.line} />
//               </View>

//               {/* JOIN */}
//               <Text style={styles.joinLabel}>
//                 JOIN HOST
//               </Text>

//               <View style={styles.joinRow}>

//                 <TextInput
//                   placeholder="Host IP Address"
//                   placeholderTextColor="#718096"
//                   value={hostIp}
//                   onChangeText={setHostIp}
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                   keyboardType="numbers-and-punctuation"
//                   style={styles.ipInput}
//                 />

//                 <TouchableOpacity
//                   activeOpacity={0.8}
//                   onPress={handleJoin}
//                   style={styles.joinButton}
//                 >
//                   <Text style={styles.joinButtonText}>
//                     JOIN
//                   </Text>
//                 </TouchableOpacity>

//               </View>

//             </View>
//           )}

//           {/* ================================================= */}
//           {/* STEP 2 — WAITING FOR TOSS                        */}
//           {/* ================================================= */}

//           {flowStep === 'WAITING_FOR_TOSS' && (
//             <View style={styles.stepContainer}>

//               <View style={styles.waitingIconContainer}>
//                 <Text style={styles.waitingIcon}>
//                   🪙
//                 </Text>
//               </View>

//               <Text style={styles.waitingTitle}>
//                 CONNECTED!
//               </Text>

//               <Text style={styles.instruction}>
//                 Both players are connected.
//               </Text>

//               {network.isRunningAsHost() ? (
//                 <TouchableOpacity
//                   activeOpacity={0.8}
//                   onPress={handleToss}
//                   style={styles.tossButton}
//                 >
//                   <Text style={styles.tossIcon}>
//                     🪙
//                   </Text>

//                   <Text style={styles.tossText}>
//                     FLIP TOSS
//                   </Text>
//                 </TouchableOpacity>
//               ) : (
//                 <View style={styles.waitingBox}>
//                   <Text style={styles.waitingBoxIcon}>
//                     ⏳
//                   </Text>

//                   <Text style={styles.waitingBoxText}>
//                     Waiting for host to flip the coin...
//                   </Text>
//                 </View>
//               )}

//             </View>
//           )}

//           {/* ================================================= */}
//           {/* STEP 3 — TOSS DECISION                           */}
//           {/* ================================================= */}

//           {flowStep === 'TOSS_DECISION' && (
//             <View style={styles.stepContainer}>

//               <View style={styles.tossResult}>
//                 <Text style={styles.tossResultIcon}>
//                   🪙
//                 </Text>

//                 <Text style={styles.tossResultTitle}>
//                   TOSS WON!
//                 </Text>

//                 <Text style={styles.instruction}>
//                   Choose your role for this round.
//                 </Text>
//               </View>

//               <View style={styles.roleRow}>

//                 {/* SHOOTER */}
//                 <TouchableOpacity
//                   activeOpacity={0.8}
//                   onPress={() =>
//                     handleSelectRole('SHOOTER')
//                   }
//                   style={[
//                     styles.roleButton,
//                     styles.shooterButton,
//                   ]}
//                 >
//                   <Text style={styles.roleIcon}>
//                     🎯
//                   </Text>

//                   <Text style={styles.roleTitle}>
//                     SHOOTER
//                   </Text>

//                   <Text style={styles.roleDescription}>
//                     Take the penalty
//                   </Text>
//                 </TouchableOpacity>

//                 {/* GOALKEEPER */}
//                 <TouchableOpacity
//                   activeOpacity={0.8}
//                   onPress={() =>
//                     handleSelectRole('GOALKEEPER')
//                   }
//                   style={[
//                     styles.roleButton,
//                     styles.keeperButton,
//                   ]}
//                 >
//                   <Text style={styles.roleIcon}>
//                     🧤
//                   </Text>

//                   <Text style={styles.roleTitle}>
//                     KEEPER
//                   </Text>

//                   <Text style={styles.roleDescription}>
//                     Save the penalty
//                   </Text>
//                 </TouchableOpacity>

//               </View>

//             </View>
//           )}

//           {/* ================================================= */}
//           {/* STEP 4 — READY CHECK                             */}
//           {/* ================================================= */}

//           {flowStep === 'READY_CHECK' && (
//             <View style={styles.stepContainer}>

//               <Text style={styles.readyTitle}>
//                 GET READY!
//               </Text>

//               {/* My Ready */}
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 disabled={isMyReady}
//                 onPress={handleReady}
//                 style={[
//                   styles.readyButton,
//                   isMyReady && styles.readyButtonDisabled,
//                 ]}
//               >
//                 <Text style={styles.readyIcon}>
//                   {isMyReady ? '⏳' : '✅'}
//                 </Text>

//                 <Text style={styles.readyButtonText}>
//                   {isMyReady
//                     ? 'WAITING FOR OPPONENT'
//                     : 'I AM READY'}
//                 </Text>
//               </TouchableOpacity>

//               {/* Opponent */}
//               <View style={styles.playerStatus}>

//                 <View
//                   style={[
//                     styles.statusDot,
//                     isMyReady && styles.statusReady,
//                   ]}
//                 />

//                 <Text style={styles.playerStatusText}>
//                   You
//                 </Text>

//                 <Text style={styles.playerStatusValue}>
//                   {isMyReady ? 'READY' : 'NOT READY'}
//                 </Text>

//               </View>

//               <View style={styles.playerStatus}>

//                 <View
//                   style={[
//                     styles.statusDot,
//                     isOpponentReady && styles.statusReady,
//                   ]}
//                 />

//                 <Text style={styles.playerStatusText}>
//                   Opponent
//                 </Text>

//                 <Text style={styles.playerStatusValue}>
//                   {isOpponentReady
//                     ? 'READY'
//                     : 'WAITING'}
//                 </Text>

//               </View>

//             </View>
//           )}

//           {/* ================================================= */}
//           {/* STATUS                                           */}
//           {/* ================================================= */}

//           {!!status && (
//             <View style={styles.statusContainer}>
//               <Text style={styles.statusText}>
//                 {status}
//               </Text>
//             </View>
//           )}

//           {/* ================================================= */}
//           {/* CANCEL                                           */}
//           {/* ================================================= */}

//           {flowStep !== 'IDLE' && (
//             <TouchableOpacity
//               activeOpacity={0.8}
//               onPress={cancelRoom}
//               style={styles.cancelButton}
//             >
//               <Text style={styles.cancelText}>
//                 ✕  CANCEL / LEAVE ROOM
//               </Text>
//             </TouchableOpacity>
//           )}

//         </View>
//       )}

//     </View>
//   );
// }

// const styles = StyleSheet.create({

//   container: {
//     width: '100%',
//     alignItems: 'center',
//   },

//   modeRow: {
//     width: '100%',
//     flexDirection: 'row',
//     gap: 10,
//     paddingHorizontal: 10,
//     paddingTop: 8,
//   },

//   modeButton: {
//     flex: 1,

//     minHeight: 48,

//     borderRadius: 12,

//     backgroundColor: '#101827',

//     borderWidth: 1,
//     borderColor: '#26364a',

//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',

//     paddingHorizontal: 10,
//   },

//   activeAiMode: {
//     backgroundColor: '#30152a',
//     borderColor: '#ff2a6d',
//   },

//   activePlayerMode: {
//     backgroundColor: '#082a31',
//     borderColor: '#05d9e8',
//   },

//   modeIcon: {
//     fontSize: 19,
//     marginRight: 7,
//   },

//   modeText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '800',
//     letterSpacing: 0.5,
//   },

//   networkCard: {
//     width: '94%',

//     marginTop: 10,

//     padding: 14,

//     backgroundColor: '#07111f',

//     borderRadius: 16,

//     borderWidth: 1,
//     borderColor: '#174158',

//     elevation: 8,
//   },

//   networkHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',

//     marginBottom: 14,

//     paddingBottom: 12,

//     borderBottomWidth: 1,
//     borderBottomColor: '#1c3345',
//   },

//   networkTitle: {
//     color: '#05d9e8',

//     fontSize: 17,
//     fontWeight: '900',

//     letterSpacing: 1,
//   },

//   networkSubtitle: {
//     color: '#70869a',

//     fontSize: 11,

//     marginTop: 3,
//   },

//   networkIcon: {
//     fontSize: 28,
//   },

//   stepContainer: {
//     width: '100%',
//   },

//   instruction: {
//     color: '#8da0b0',

//     fontSize: 12,
//     lineHeight: 18,

//     textAlign: 'center',

//     marginBottom: 14,
//   },

//   hostButton: {
//     width: '100%',

//     minHeight: 62,

//     borderRadius: 12,

//     backgroundColor: '#1266a8',

//     flexDirection: 'row',
//     alignItems: 'center',

//     paddingHorizontal: 15,
//   },

//   buttonIcon: {
//     fontSize: 25,
//     marginRight: 12,
//   },

//   buttonContent: {
//     flex: 1,
//   },

//   primaryButtonText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '900',
//   },

//   secondaryButtonText: {
//     color: '#c7e5ff',
//     fontSize: 10,
//     marginTop: 3,
//   },

//   divider: {
//     flexDirection: 'row',
//     alignItems: 'center',

//     marginVertical: 14,
//   },

//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#26394a',
//   },

//   orText: {
//     color: '#617587',
//     fontSize: 10,
//     fontWeight: '800',
//     marginHorizontal: 10,
//   },

//   joinLabel: {
//     color: '#8da0b0',
//     fontSize: 10,
//     fontWeight: '800',

//     marginBottom: 6,
//   },

//   joinRow: {
//     flexDirection: 'row',
//     gap: 8,
//   },

//   ipInput: {
//     flex: 1,

//     minHeight: 46,

//     backgroundColor: '#101b28',

//     borderRadius: 10,

//     borderWidth: 1,
//     borderColor: '#294254',

//     paddingHorizontal: 12,

//     color: '#fff',

//     fontSize: 13,
//   },

//   joinButton: {
//     minWidth: 72,

//     minHeight: 46,

//     borderRadius: 10,

//     backgroundColor: '#159447',

//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   joinButtonText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '900',
//   },

//   waitingIconContainer: {
//     width: 70,
//     height: 70,

//     borderRadius: 35,

//     alignSelf: 'center',

//     backgroundColor: '#10283b',

//     justifyContent: 'center',
//     alignItems: 'center',

//     marginBottom: 10,
//   },

//   waitingIcon: {
//     fontSize: 35,
//   },

//   waitingTitle: {
//     color: '#05d9e8',

//     fontSize: 18,
//     fontWeight: '900',

//     textAlign: 'center',

//     marginBottom: 5,
//   },

//   waitingBox: {
//     backgroundColor: '#0c1926',

//     borderRadius: 10,

//     borderWidth: 1,
//     borderColor: '#263d50',

//     padding: 14,

//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   waitingBoxIcon: {
//     fontSize: 20,
//     marginRight: 8,
//   },

//   waitingBoxText: {
//     flex: 1,

//     color: '#9aabba',

//     fontSize: 12,

//     textAlign: 'center',
//   },

//   tossButton: {
//     width: '100%',

//     minHeight: 58,

//     backgroundColor: '#e77d00',

//     borderRadius: 12,

//     flexDirection: 'row',

//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   tossIcon: {
//     fontSize: 24,
//     marginRight: 9,
//   },

//   tossText: {
//     color: '#fff',

//     fontSize: 16,
//     fontWeight: '900',

//     letterSpacing: 1,
//   },

//   tossResult: {
//     alignItems: 'center',
//     marginBottom: 15,
//   },

//   tossResultIcon: {
//     fontSize: 35,
//     marginBottom: 5,
//   },

//   tossResultTitle: {
//     color: '#ffd166',

//     fontSize: 19,
//     fontWeight: '900',

//     marginBottom: 5,
//   },

//   roleRow: {
//     flexDirection: 'row',
//     gap: 10,
//   },

//   roleButton: {
//     flex: 1,

//     minHeight: 125,

//     borderRadius: 13,

//     alignItems: 'center',
//     justifyContent: 'center',

//     borderWidth: 1,
//   },

//   shooterButton: {
//     backgroundColor: '#34152a',
//     borderColor: '#e91e63',
//   },

//   keeperButton: {
//     backgroundColor: '#261638',
//     borderColor: '#9c27b0',
//   },

//   roleIcon: {
//     fontSize: 31,
//     marginBottom: 6,
//   },

//   roleTitle: {
//     color: '#fff',

//     fontSize: 14,
//     fontWeight: '900',

//     letterSpacing: 0.5,
//   },

//   roleDescription: {
//     color: '#9eabb8',

//     fontSize: 9,

//     marginTop: 4,

//     textAlign: 'center',
//   },

//   readyTitle: {
//     color: '#00ffcc',

//     fontSize: 21,
//     fontWeight: '900',

//     textAlign: 'center',

//     marginBottom: 15,
//   },

//   readyButton: {
//     width: '100%',

//     minHeight: 58,

//     backgroundColor: '#159447',

//     borderRadius: 12,

//     flexDirection: 'row',

//     alignItems: 'center',
//     justifyContent: 'center',

//     marginBottom: 13,
//   },

//   readyButtonDisabled: {
//     backgroundColor: '#374151',
//   },

//   readyIcon: {
//     fontSize: 20,
//     marginRight: 8,
//   },

//   readyButtonText: {
//     color: '#fff',

//     fontSize: 14,
//     fontWeight: '900',
//   },

//   playerStatus: {
//     width: '100%',

//     minHeight: 38,

//     backgroundColor: '#0d1824',

//     borderRadius: 8,

//     marginTop: 5,

//     paddingHorizontal: 10,

//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   statusDot: {
//     width: 8,
//     height: 8,

//     borderRadius: 4,

//     backgroundColor: '#596675',

//     marginRight: 8,
//   },

//   statusReady: {
//     backgroundColor: '#00e676',
//   },

//   playerStatusText: {
//     flex: 1,

//     color: '#b9c6d2',

//     fontSize: 11,
//   },

//   playerStatusValue: {
//     color: '#8295a6',

//     fontSize: 10,
//     fontWeight: '800',
//   },

//   statusContainer: {
//     marginTop: 10,

//     paddingVertical: 8,
//     paddingHorizontal: 10,

//     backgroundColor: '#0b1723',

//     borderRadius: 8,
//   },

//   statusText: {
//     color: '#9db0c0',

//     fontSize: 11,

//     textAlign: 'center',
//   },

//   cancelButton: {
//     marginTop: 10,

//     minHeight: 34,

//     borderRadius: 8,

//     backgroundColor: '#3a1518',

//     borderWidth: 1,
//     borderColor: '#702328',

//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   cancelText: {
//     color: '#ff6b6b',

//     fontSize: 10,
//     fontWeight: '800',
//   },
// });

// src/components/game/mode-switcher.tsx

import React, { useState } from 'react';

import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { GameMode } from '@football/engine';

import { network } from '@/services/tcp-manager';

import {
  PlayerRole,
  useMultiplayerFlow,
} from '@/hooks/useMultiplayerFlow';

import { styles } from '../../styles/appStyles';

interface ModeSwitcherProps {
  gameMode: GameMode;

  setGameMode: (mode: GameMode) => void;

  onMultiplayerReady?: (
    isHost: boolean,
    role: PlayerRole,
  ) => void;

  onNetworkDataReceived?: (
    data: any,
  ) => void;
}

export function ModeSwitcher({
  gameMode,
  setGameMode,
  onMultiplayerReady,
  onNetworkDataReceived,
}: ModeSwitcherProps) {
  // =========================================================
  // NETWORK UI
  // =========================================================

  const [
    showNetworkUI,
    setShowNetworkUI,
  ] = useState(false);

  // =========================================================
  // MULTIPLAYER FLOW
  // =========================================================

  const {
    flowStep,

    hostIp,
    setHostIp,

    myIp,

    status,

    isTossWinner,
    tossWinner,

    selectedRole,

    isMyReady,
    isOpponentReady,

    handleHost,
    handleJoin,
    handleToss,
    handleSelectRole,
    handleReady,
    cancelRoom,
  } = useMultiplayerFlow({
    setGameMode,
    onMultiplayerReady,
    onNetworkDataReceived,
  });

  // =========================================================
  // VS AI
  // =========================================================

  const handleSelectVsAI = async () => {
    try {
      /*
       * যদি Multiplayer room/connection থাকে,
       * আগে cleanly cancel করব।
       */
      await cancelRoom();
    } catch (error) {
      console.warn(
        'Failed to cancel multiplayer room:',
        error,
      );
    }

    setShowNetworkUI(false);

    setGameMode(
      'VS_AI' as GameMode,
    );
  };

  // =========================================================
  // HOTSPOT BUTTON
  // =========================================================

  const handleToggleNetworkUI = async () => {
    /*
     * Network UI বন্ধ করলে active room থাকলে
     * সেটাও cancel হবে।
     */
    if (showNetworkUI) {
      await cancelRoom();
    }

    setShowNetworkUI(
      !showNetworkUI,
    );
  };

  // =========================================================
  // CANCEL / LEAVE
  // =========================================================

  const handleCancelRoom = async () => {
    await cancelRoom();

    /*
     * Multiplayer menu-ও close করে দিচ্ছি।
     */
    setShowNetworkUI(false);

    /*
     * AI mode-এ switch করছি না।
     * শুধু room cancel করে menu state-এ থাকব।
     */
  };

  // =========================================================
  // MODE CHECK
  // =========================================================

  const isAI =
    (gameMode as string) === 'VS_AI';

  const isMultiplayer =
    showNetworkUI ||
    (gameMode as string) === 'VS_PLAYER';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <View style={styles.modeContainer}>

      {/* =====================================================
          VS AI
          ===================================================== */}

      <TouchableOpacity
        style={[
          styles.modeButton,
          isAI &&
            styles.activeMode,
        ]}
        onPress={handleSelectVsAI}
        activeOpacity={0.8}
      >
        <Text style={styles.modeText}>
          🤖 Vs AI
        </Text>
      </TouchableOpacity>

      {/* =====================================================
          HOTSPOT 2 PLAYER
          ===================================================== */}

      <TouchableOpacity
        style={[
          styles.modeButton,
          showNetworkUI &&
            styles.activeMode,
        ]}
        onPress={
          handleToggleNetworkUI
        }
        activeOpacity={0.8}
      >
        <Text style={styles.modeText}>
          📡 Hotspot 2P
        </Text>
      </TouchableOpacity>

      {/* =====================================================
          MULTIPLAYER PANEL
          ===================================================== */}

      {showNetworkUI && (
        <View
          style={{
            width: '100%',
            padding: 12,
            backgroundColor:
              '#000000aa',
            borderRadius: 10,
            marginTop: 8,
          }}
        >

          {/* =================================================
              IDLE
              ================================================= */}

          {flowStep === 'IDLE' && (
            <View>

              <Text
                style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                📡 Local Multiplayer
              </Text>

              {/* HOST */}

              <TouchableOpacity
                onPress={handleHost}
                activeOpacity={0.8}
                style={{
                  backgroundColor:
                    '#2196F3',
                  paddingVertical: 10,
                  borderRadius: 7,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: '700',
                  }}
                >
                  🏠 Create Room
                </Text>
              </TouchableOpacity>

              {/* JOIN */}

              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <TextInput
                  placeholder="Enter Host IP"
                  placeholderTextColor="#777"
                  value={hostIp}
                  onChangeText={
                    setHostIp
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    backgroundColor:
                      '#fff',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 7,
                    color: '#000',
                  }}
                />

                <TouchableOpacity
                  onPress={handleJoin}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor:
                      '#4CAF50',
                    paddingHorizontal: 14,
                    justifyContent:
                      'center',
                    borderRadius: 7,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: '700',
                    }}
                  >
                    Join
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          )}

          {/* =================================================
              CONNECTING
              ================================================= */}

          {flowStep ===
            'CONNECTING' && (
            <View>

              <Text
                style={{
                  color: '#05d9e8',
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                🔄 Connecting...
              </Text>

              {!!status && (
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {status}
                </Text>
              )}

              <TouchableOpacity
                onPress={
                  handleCancelRoom
                }
                style={{
                  backgroundColor:
                    '#f44336',
                  paddingVertical: 7,
                  borderRadius: 6,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {/* =================================================
              WAITING FOR TOSS
              ================================================= */}

          {flowStep ===
            'WAITING_FOR_TOSS' && (
            <View>

              {!!myIp && (
                <View
                  style={{
                    backgroundColor:
                      '#111827',
                    borderRadius: 7,
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: '#9ca3af',
                      textAlign: 'center',
                      fontSize: 11,
                    }}
                  >
                    Your IP
                  </Text>

                  <Text
                    style={{
                      color: '#00ffcc',
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: '900',
                      marginTop: 2,
                    }}
                  >
                    {myIp}
                  </Text>
                </View>
              )}

              {/* HOST CAN TOSS */}

              {network.isRunningAsHost() && (
                <TouchableOpacity
                  onPress={handleToss}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor:
                      '#FF9800',
                    paddingVertical: 11,
                    borderRadius: 7,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: '900',
                      fontSize: 15,
                    }}
                  >
                    🪙 Flip Toss Coin
                  </Text>
                </TouchableOpacity>
              )}

              {/* CLIENT WAITING */}

              {!network.isRunningAsHost() && (
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 13,
                  }}
                >
                  🪙 Host টস করছে...
                </Text>
              )}

              {!!status && (
                <Text
                  style={{
                    color: '#d1d5db',
                    textAlign: 'center',
                    fontSize: 11,
                    marginTop: 8,
                  }}
                >
                  {status}
                </Text>
              )}

              <TouchableOpacity
                onPress={
                  handleCancelRoom
                }
                style={{
                  backgroundColor:
                    '#f44336',
                  paddingVertical: 7,
                  borderRadius: 6,
                  marginTop: 9,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                >
                  ❌ Cancel / Leave Room
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {/* =================================================
              TOSS DECISION
              ================================================= */}

          {flowStep ===
            'TOSS_DECISION' && (
            <View>

              <Text
                style={{
                  color: '#00ffcc',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '900',
                  marginBottom: 4,
                }}
              >
                🎉 You Won the Toss!
              </Text>

              <Text
                style={{
                  color: '#aaa',
                  textAlign: 'center',
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                Choose your role
              </Text>

              {/* ROLE BUTTONS */}

              <View
                style={{
                  flexDirection:
                    'row',
                  gap: 7,
                }}
              >

                {/* SHOOTER */}

                <TouchableOpacity
                  onPress={() =>
                    handleSelectRole(
                      'SHOOTER',
                    )
                  }
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor:
                      selectedRole ===
                      'SHOOTER'
                        ? '#c2185b'
                        : '#E91E63',
                    paddingVertical: 10,
                    borderRadius: 7,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: '900',
                    }}
                  >
                    🎯 Shooter
                  </Text>
                </TouchableOpacity>

                {/* GOALKEEPER */}

                <TouchableOpacity
                  onPress={() =>
                    handleSelectRole(
                      'GOALKEEPER',
                    )
                  }
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor:
                      selectedRole ===
                      'GOALKEEPER'
                        ? '#7B1FA2'
                        : '#9C27B0',
                    paddingVertical: 10,
                    borderRadius: 7,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: '900',
                    }}
                  >
                    🧤 Keeper
                  </Text>
                </TouchableOpacity>

              </View>

              {!!status && (
                <Text
                  style={{
                    color: '#d1d5db',
                    textAlign: 'center',
                    fontSize: 11,
                    marginTop: 8,
                  }}
                >
                  {status}
                </Text>
              )}

              <TouchableOpacity
                onPress={
                  handleCancelRoom
                }
                style={{
                  backgroundColor:
                    '#f44336',
                  paddingVertical: 7,
                  borderRadius: 6,
                  marginTop: 9,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                >
                  ❌ Cancel / Leave
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {/* =================================================
              WAITING FOR ROLE
              ================================================= */}

          {flowStep ===
            'WAITING_FOR_ROLE' && (
            <View>

              <Text
                style={{
                  color: '#FF9800',
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: '900',
                }}
              >
                🪙 Toss Winner is choosing...
              </Text>

              <Text
                style={{
                  color: '#aaa',
                  textAlign: 'center',
                  fontSize: 11,
                  marginTop: 5,
                }}
              >
                Role নির্বাচন শেষ হলে
                আপনাকে automatically
                বিপরীত role দেওয়া হবে।
              </Text>

              {!!tossWinner && (
                <Text
                  style={{
                    color: '#00ffcc',
                    textAlign: 'center',
                    fontSize: 12,
                    marginTop: 7,
                  }}
                >
                  Winner: {tossWinner}
                </Text>
              )}

              {!!status && (
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 11,
                    marginTop: 7,
                  }}
                >
                  {status}
                </Text>
              )}

              <TouchableOpacity
                onPress={
                  handleCancelRoom
                }
                style={{
                  backgroundColor:
                    '#f44336',
                  paddingVertical: 7,
                  borderRadius: 6,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                >
                  ❌ Cancel / Leave
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {/* =================================================
              READY CHECK
              ================================================= */}

          {flowStep ===
            'READY_CHECK' && (
            <View>

              {/* ROLE */}

              <View
                style={{
                  backgroundColor:
                    '#111827',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: '#9ca3af',
                    textAlign: 'center',
                    fontSize: 11,
                  }}
                >
                  YOUR ROLE
                </Text>

                <Text
                  style={{
                    color:
                      selectedRole ===
                      'SHOOTER'
                        ? '#ff2a6d'
                        : '#05d9e8',
                    textAlign: 'center',
                    fontSize: 21,
                    fontWeight: '900',
                    marginTop: 2,
                  }}
                >
                  {selectedRole ===
                  'SHOOTER'
                    ? '🎯 SHOOTER'
                    : '🧤 GOALKEEPER'}
                </Text>
              </View>

              {/* READY BUTTON */}

              <TouchableOpacity
                disabled={isMyReady}
                onPress={handleReady}
                activeOpacity={
                  isMyReady
                    ? 1
                    : 0.8
                }
                style={{
                  backgroundColor:
                    isMyReady
                      ? '#555'
                      : '#4CAF50',
                  paddingVertical: 11,
                  borderRadius: 7,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: '900',
                  }}
                >
                  {isMyReady
                    ? '✅ YOU ARE READY'
                    : '✅ I AM READY'}
                </Text>
              </TouchableOpacity>

              {/* OPPONENT STATUS */}

              <Text
                style={{
                  color:
                    isOpponentReady
                      ? '#4CAF50'
                      : '#aaa',
                  textAlign: 'center',
                  fontSize: 11,
                  marginTop: 7,
                }}
              >
                {isOpponentReady
                  ? '🟢 Opponent is READY!'
                  : '🟡 Waiting for opponent...'}
              </Text>

              {!!status && (
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 11,
                    marginTop: 6,
                  }}
                >
                  {status}
                </Text>
              )}

              {/* EXIT */}

              <TouchableOpacity
                onPress={
                  handleCancelRoom
                }
                activeOpacity={0.8}
                style={{
                  backgroundColor:
                    '#f44336',
                  paddingVertical: 7,
                  borderRadius: 6,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                >
                  ❌ Leave Match
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {/* =================================================
              PLAYING
              ================================================= */}

          {flowStep ===
            'PLAYING' && (
            <View>

              <Text
                style={{
                  color: '#00ffcc',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '900',
                }}
              >
                🎮 MATCH STARTED
              </Text>

              {!!selectedRole && (
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  You are{' '}
                  {selectedRole ===
                  'SHOOTER'
                    ? '🎯 SHOOTER'
                    : '🧤 GOALKEEPER'}
                </Text>
              )}

              <TouchableOpacity
                onPress={
                  handleCancelRoom
                }
                activeOpacity={0.8}
                style={{
                  backgroundColor:
                    '#f44336',
                  paddingVertical: 8,
                  borderRadius: 6,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  🚪 Exit Match
                </Text>
              </TouchableOpacity>

            </View>
          )}

        </View>
      )}
    </View>
  );
}