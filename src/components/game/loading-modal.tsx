// src/components/game/loading-modal.tsx

import React from 'react';
import { View, Modal, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingModalProps {
  show: boolean;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ show, message = "Loading Match..." }) => {
  return (
    <Modal visible={show} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#00ffcc" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 30,
    backgroundColor: '#16213e',
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
});