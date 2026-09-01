


// src/components/game/mode-switcher.tsx

import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
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
  const {
    flowStep,
    hostIp,
    setHostIp,
    myIp,
    status,
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

  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [discoveredHosts, setDiscoveredHosts] = useState<string[]>([]);

  // =========================================================
  // AUTO SEARCH & DISCOVERY ON MOUNT
  // =========================================================
  useEffect(() => {
    let isMounted = true;

    const startDiscovery = async () => {
      if (flowStep === 'IDLE') {
        setIsAutoSearching(true);
        try {
          // UDP / TCP Discovery কল করা
          if (typeof (network as any).discoverHosts === 'function') {
            const hosts = await (network as any).discoverHosts();
            if (isMounted && hosts && hosts.length > 0) {
              setDiscoveredHosts(hosts);
              // প্রথম ডিসকাভার হওয়া IP টি দিয়েই অটো কানেক্ট করবে
              setHostIp(hosts[0]);
              await handleJoin();
            }
          } else if (typeof (network as any).autoConnect === 'function') {
            const foundIp = await (network as any).autoConnect();
            if (isMounted && foundIp) {
              setHostIp(foundIp);
            }
          }
        } catch (error) {
          console.warn('Auto discovery scan finished or failed:', error);
        } finally {
          if (isMounted) setIsAutoSearching(false);
        }
      }
    };

    startDiscovery();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualAutoConnect = async () => {
    setIsAutoSearching(true);
    setDiscoveredHosts([]);
    try {
      if (typeof (network as any).discoverHosts === 'function') {
        const hosts = await (network as any).discoverHosts();
        setDiscoveredHosts(hosts);
        if (hosts.length > 0) {
          setHostIp(hosts[0]);
          await handleJoin();
        }
      } else if (typeof (network as any).autoConnect === 'function') {
        const foundIp = await (network as any).autoConnect();
        if (foundIp) setHostIp(foundIp);
      }
    } catch (error) {
      console.warn('Auto connection failed:', error);
    } finally {
      setIsAutoSearching(false);
    }
  };

  const handleCancelRoom = async () => {
    setIsAutoSearching(false);
    setDiscoveredHosts([]);
    await cancelRoom();
  };

  return (
    <View style={styles.modeContainer}>
      <View
        style={{
          width: '100%',
          padding: 12,
          backgroundColor: '#000000aa',
          borderRadius: 10,
        }}
      >
        {/* IDLE STATE */}
        {flowStep === 'IDLE' && (
          <View>
            <Text
              style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: '700',
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              📡 Searching Nearby Rooms (Wi-Fi/Hotspot)...
            </Text>

            {/* AUTO SEARCHING STATUS */}
            <TouchableOpacity
              onPress={handleManualAutoConnect}
              disabled={isAutoSearching}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#9C27B0',
                paddingVertical: 10,
                borderRadius: 7,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isAutoSearching ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Scanning Network...
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: '900',
                  }}
                >
                  ⚡ Scan Nearby Rooms
                </Text>
              )}
            </TouchableOpacity>

            {/* DISCOVERED HOSTS LIST */}
            {discoveredHosts.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#00ffcc', fontSize: 12, marginBottom: 4 }}>
                  Found Rooms:
                </Text>
                {discoveredHosts.map((ip) => (
                  <TouchableOpacity
                    key={ip}
                    onPress={() => {
                      setHostIp(ip);
                      handleJoin();
                    }}
                    style={{
                      backgroundColor: '#1E293B',
                      padding: 8,
                      borderRadius: 6,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                      🌐 Host IP: {ip}
                    </Text>
                    <Text style={{ color: '#4CAF50', fontWeight: '900', fontSize: 12 }}>
                      Connect ➔
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* CREATE ROOM BUTTON */}
            <TouchableOpacity
              onPress={handleHost}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#2196F3',
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
                🏠 Create Room (Host)
              </Text>
            </TouchableOpacity>

            {/* MANUAL IP FALLBACK */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                placeholder="Selected IP Address"
                placeholderTextColor="#777"
                value={hostIp}
                onChangeText={setHostIp}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 7,
                  color: '#000',
                  fontSize: 12,
                }}
              />

              <TouchableOpacity
                onPress={handleJoin}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#4CAF50',
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                  borderRadius: 7,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  Join
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CONNECTING */}
        {flowStep === 'CONNECTING' && (
          <View>
            <Text
              style={{
                color: '#05d9e8',
                textAlign: 'center',
                fontSize: 15,
                fontWeight: '700',
              }}
            >
              🔄 Connecting to {hostIp || 'Host'}...
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
              onPress={handleCancelRoom}
              style={{
                backgroundColor: '#f44336',
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

        {/* WAITING FOR TOSS */}
        {flowStep === 'WAITING_FOR_TOSS' && (
          <View>
            {!!myIp && (
              <View
                style={{
                  backgroundColor: '#111827',
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
                  Your IP (Share with opponent)
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

            {network.isRunningAsHost() ? (
              <TouchableOpacity
                onPress={handleToss}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#FF9800',
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
            ) : (
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
              onPress={handleCancelRoom}
              style={{
                backgroundColor: '#f44336',
                paddingVertical: 7,
                borderRadius: 6,
                marginTop: 9,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>
                ❌ Cancel / Leave Room
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TOSS DECISION */}
        {flowStep === 'TOSS_DECISION' && (
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

            <View style={{ flexDirection: 'row', gap: 7 }}>
              <TouchableOpacity
                onPress={() => handleSelectRole('SHOOTER')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor:
                    selectedRole === 'SHOOTER' ? '#c2185b' : '#E91E63',
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

              <TouchableOpacity
                onPress={() => handleSelectRole('GOALKEEPER')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor:
                    selectedRole === 'GOALKEEPER' ? '#7B1FA2' : '#9C27B0',
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
              onPress={handleCancelRoom}
              style={{
                backgroundColor: '#f44336',
                paddingVertical: 7,
                borderRadius: 6,
                marginTop: 9,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>
                ❌ Cancel / Leave
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WAITING FOR ROLE */}
        {flowStep === 'WAITING_FOR_ROLE' && (
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

            <TouchableOpacity
              onPress={handleCancelRoom}
              style={{
                backgroundColor: '#f44336',
                paddingVertical: 7,
                borderRadius: 6,
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>
                ❌ Cancel / Leave
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* READY CHECK */}
        {flowStep === 'READY_CHECK' && (
          <View>
            <View
              style={{
                backgroundColor: '#111827',
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
                  color: selectedRole === 'SHOOTER' ? '#ff2a6d' : '#05d9e8',
                  textAlign: 'center',
                  fontSize: 21,
                  fontWeight: '900',
                  marginTop: 2,
                }}
              >
                {selectedRole === 'SHOOTER'
                  ? '🎯 SHOOTER'
                  : '🧤 GOALKEEPER'}
              </Text>
            </View>

            <TouchableOpacity
              disabled={isMyReady}
              onPress={handleReady}
              activeOpacity={isMyReady ? 1 : 0.8}
              style={{
                backgroundColor: isMyReady ? '#555' : '#4CAF50',
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
                {isMyReady ? '✅ YOU ARE READY' : '✅ I AM READY'}
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                color: isOpponentReady ? '#4CAF50' : '#aaa',
                textAlign: 'center',
                fontSize: 11,
                marginTop: 7,
              }}
            >
              {isOpponentReady
                ? '🟢 Opponent is READY!'
                : '🟡 Waiting for opponent...'}
            </Text>

            <TouchableOpacity
              onPress={handleCancelRoom}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#f44336',
                paddingVertical: 7,
                borderRadius: 6,
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>
                ❌ Leave Match
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PLAYING */}
        {flowStep === 'PLAYING' && (
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
                {selectedRole === 'SHOOTER'
                  ? '🎯 SHOOTER'
                  : '🧤 GOALKEEPER'}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleCancelRoom}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#f44336',
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
    </View>
  );
}