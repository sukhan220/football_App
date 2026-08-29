import React from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { styles } from '../../styles/appStyles';

export function GameOverModal({ show, fadeAnim, debugInfo, matchControlRef }: { show: boolean; fadeAnim: any; debugInfo: any; matchControlRef: any }) {
  if (!show) return null;

  return (
    <Animated.View style={[styles.gameOverOverlay, { opacity: fadeAnim }]}>
      <Text style={styles.gameOverTitle}>🏆 MATCH FINISHED</Text>
      <Text style={styles.winnerText}>
        {debugInfo.winner === 'DRAW' ? '🤝 MATCH DRAW!' : `🎉 WINNER: ${debugInfo.winner}`}
      </Text>

      <TouchableOpacity
        style={styles.restartBtn}
        onPress={() => matchControlRef.current?.restartMatch()}
      >
        <Text style={styles.restartBtnText}>🔄 REMATCH</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}