// src/components/game/start-modal.tsx

import React from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

import { GameMode } from '@football/engine';

interface StartModalProps {
  show: boolean;
  onSelectMode: (mode: GameMode) => void;
}

export const StartModal: React.FC<StartModalProps> = ({
  show,
  onSelectMode,
}) => {
  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <Text style={styles.logo}>⚽</Text>

          <Text style={styles.title}>
            FOOTBALL PENALTY
          </Text>

          <Text style={styles.subtitle}>
            SELECT GAME MODE
          </Text>

          {/* VS AI */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.btn, styles.btnAi]}
            onPress={() => onSelectMode('VS_AI')}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🤖</Text>
            </View>

            <View style={styles.btnContent}>
              <Text style={styles.btnTitle}>
                VS AI
              </Text>

              <Text style={styles.btnSubtitle}>
                Play against Artificial Intelligence
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          {/* VS PLAYER */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.btn, styles.btnPvP]}
            onPress={() => onSelectMode('VS_PLAYER')}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>👥</Text>
            </View>

            <View style={styles.btnContent}>
              <Text style={styles.btnTitle}>
                VS PLAYER
              </Text>

              <Text style={styles.btnSubtitle}>
                Local Network / Hotspot
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Choose your opponent to continue
          </Text>

        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: Math.min(width - 40, 430),
    backgroundColor: '#07111f',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 28,

    alignItems: 'center',

    borderWidth: 1.5,
    borderColor: '#00ffcc',

    shadowColor: '#00ffcc',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,

    elevation: 15,
  },

  logo: {
    fontSize: 48,
    marginBottom: 8,
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#00ffcc',
    letterSpacing: 2,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 25,

    fontSize: 14,
    fontWeight: '600',
    color: '#8ea3b7',

    letterSpacing: 1.5,
  },

  btn: {
    width: '100%',
    minHeight: 82,

    borderRadius: 16,

    marginVertical: 7,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,

    borderWidth: 1,
  },

  btnAi: {
    backgroundColor: '#261126',
    borderColor: '#ff2a6d',
  },

  btnPvP: {
    backgroundColor: '#08232a',
    borderColor: '#05d9e8',
  },

  iconCircle: {
    width: 52,
    height: 52,

    borderRadius: 26,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.08)',

    marginRight: 13,
  },

  icon: {
    fontSize: 28,
  },

  btnContent: {
    flex: 1,
  },

  btnTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1,
  },

  btnSubtitle: {
    color: '#9eacb8',
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '300',
    marginLeft: 5,
  },

  footer: {
    marginTop: 18,

    color: '#596b7a',
    fontSize: 11,

    textAlign: 'center',
  },
});