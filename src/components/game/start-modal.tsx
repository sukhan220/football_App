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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

          {/* Logo / Title */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoBall}>⚽</Text>
          </View>

          <Text style={styles.title}>
            FOOTBALL
          </Text>

          <Text style={styles.titleAccent}>
            PENALTY
          </Text>

          <Text style={styles.subtitle}>
            SELECT GAME MODE
          </Text>

          {/* VS AI */}
          <TouchableOpacity
            activeOpacity={0.82}
            style={[styles.btn, styles.btnAi]}
            onPress={() => onSelectMode('VS_AI')}
          >
            <View style={styles.btnIconBox}>
              <Text style={styles.btnIcon}>🤖</Text>
            </View>

            <View style={styles.btnContent}>
              <Text style={styles.btnTitle}>
                VS AI
              </Text>

              <Text style={styles.btnSubTitle}>
                Play against Computer
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          {/* VS PLAYER */}
          <TouchableOpacity
            activeOpacity={0.82}
            style={[styles.btn, styles.btnPlayer]}
            onPress={() => onSelectMode('VS_PLAYER')}
          >
            <View style={styles.btnIconBox}>
              <Text style={styles.btnIcon}>👥</Text>
            </View>

            <View style={styles.btnContent}>
              <Text style={styles.btnTitle}>
                VS PLAYER
              </Text>

              <Text style={styles.btnSubTitle}>
                Local Network / Hotspot
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            LOCAL FOOTBALL PENALTY
          </Text>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: Math.min(SCREEN_WIDTH - 40, 430),
    backgroundColor: '#08111d',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#00ffcc',

    shadowColor: '#00ffcc',
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 15,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#102738',

    borderWidth: 2,
    borderColor: '#00ffcc',

    marginBottom: 14,
  },

  logoBall: {
    fontSize: 38,
  },

  title: {
    color: '#ffffff',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 3,
  },

  titleAccent: {
    color: '#00ffcc',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: -3,
  },

  subtitle: {
    color: '#778899',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 8,
    marginBottom: 25,
  },

  btn: {
    width: '100%',
    minHeight: 78,

    borderRadius: 16,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
    marginBottom: 12,

    borderWidth: 1,
  },

  btnAi: {
    backgroundColor: '#241022',
    borderColor: '#ff2a6d',
  },

  btnPlayer: {
    backgroundColor: '#08242a',
    borderColor: '#05d9e8',
  },

  btnIconBox: {
    width: 50,
    height: 50,
    borderRadius: 13,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.07)',

    marginRight: 13,
  },

  btnIcon: {
    fontSize: 27,
  },

  btnContent: {
    flex: 1,
  },

  btnTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },

  btnSubTitle: {
    color: '#8999a8',
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
    marginLeft: 8,
  },

  footer: {
    color: '#40505d',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 8,
  },
});