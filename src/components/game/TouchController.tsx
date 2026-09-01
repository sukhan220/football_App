import React, { useRef } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';

interface TouchControllerProps {
  currentRole: 'SHOOTER' | 'GOALKEEPER';
  matchControlRef: React.MutableRefObject<any>;
  children?: React.ReactNode;
}

export function TouchController({ currentRole, matchControlRef, children }: TouchControllerProps) {
  const touchStart = useRef({ x: 0, y: 0, time: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        touchStart.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          time: Date.now(),
        };
      },

      onPanResponderRelease: (evt, gestureState) => {
        if (!matchControlRef.current) return;

        const timeDiff = Date.now() - touchStart.current.time;
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const vx = gestureState.vx;
        const vy = gestureState.vy;

        // 🧤 ১. GOALKEEPER Action
        if (currentRole === 'GOALKEEPER') {
          let direction: 'left' | 'right' | 'center' = 'center';

          if (dx < -40 || vx < -0.5) {
            direction = 'left';
          } else if (dx > 40 || vx > 0.5) {
            direction = 'right';
          }

          console.log(`🧤 Keeper Swipe Triggered: ${direction}`);
          
          // GameScene-এর মাধ্যমে ডাইভ অ্যাকশন রান হবে (যা ভেতরেই TCP-তে সেন্ড করে)
          matchControlRef.current.triggerKeeperDive(direction);
          return;
        }

        // ⚽ ২. SHOOTER Action
        if (currentRole === 'SHOOTER') {
          if (dy < -30) {
            const speedScale = Math.min(Math.abs(vy) * 12 + 10, 28);

            const flickData = {
              deltaX: dx,
              deltaY: dy,
              deltaTime: timeDiff,
              velocity: {
                x: (dx / (timeDiff || 1)) * 1.5,
                y: Math.max(Math.abs(vy) * 8, 3.5),
                z: -speedScale,
              },
              spin: {
                x: 0,
                y: (dx / 100) * 2,
                z: 0,
              },
            };

            console.log('⚽ Shooter Kick Triggered:', flickData);
            
            // GameScene-এর মাধ্যমে কিক রান হবে (যা ভেতরেই TCP-তে সেন্ড করে)
            matchControlRef.current.kick(flickData);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});