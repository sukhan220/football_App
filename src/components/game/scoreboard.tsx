//src/components/game/scoreboard.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { GameMode } from '@football/engine';
import { styles } from '@/styles/appStyles';

export function Scoreboard({ debugInfo, gameMode }: { debugInfo: any; gameMode: GameMode }) {
  // 🎯 প্লেয়ার কিপার কি না তা নির্ধারণ
  const isPlayerKeeper =
    gameMode === 'GOALKEEPER' ||
    debugInfo?.isUserKeeper ||
    debugInfo?.userRole === 'keeper';

  const renderShotDots = (shotsList: any[], isKeeperSide: boolean = false) => {
    const dots = [];
    const safeShots = Array.isArray(shotsList) ? shotsList : [];

    for (let i = 0; i < 5; i++) {
      const shot = safeShots[i];

      if (shot === 'GOAL' || shot === true) {
        // 🧤 কিপারের দৃষ্টিকোণ থেকে গোল খেয়ে যাওয়া মানে মিস/ব্যর্থতা (Red Cross)
        // ⚽ শুটারের দৃষ্টিকোণ থেকে গোল হওয়া মানে সাফল্য (Green Tick)
        const isSuccess = isKeeperSide ? false : true;

        dots.push(
          <View key={i} style={[styles.dot, isSuccess ? styles.greenDot : styles.redDot]}>
            <Text style={styles.dotIcon}>{isSuccess ? '✓' : '✕'}</Text>
          </View>
        );
      } else if (shot === 'MISS' || shot === 'SAVED' || shot === 'POST_HIT' || shot === false) {
        // 🧤 কিপারের দৃষ্টিকোণ থেকে সেভ করতে পারা বা গোল না হওয়া মানে সাফল্য (Green Tick)
        // ⚽ শুটারের দৃষ্টিকোণ থেকে সেভ হওয়া মানে ব্যর্থতা (Red Cross)
        const isSuccess = isKeeperSide ? true : false;

        dots.push(
          <View key={i} style={[styles.dot, isSuccess ? styles.greenDot : styles.redDot]}>
            <Text style={styles.dotIcon}>{isSuccess ? '✓' : '✕'}</Text>
          </View>
        );
      } else {
        dots.push(<View key={i} style={[styles.dot, styles.emptyDot]} />);
      }
    }
    return dots;
  };

  const p1Name = gameMode === 'GOALKEEPER'
    ? 'P1 (Keeper)'
    : gameMode === 'VS_AI'
    ? (isPlayerKeeper ? 'AI Kicker' : 'P1 (Shooter)')
    : 'P1';

  const p2Name = gameMode === 'GOALKEEPER'
    ? 'AI Kicker'
    : gameMode === 'VS_AI'
    ? (isPlayerKeeper ? 'P1 (Keeper)' : 'AI Keeper')
    : 'P2';

  return (
    <View style={styles.scoreboard}>
      <Text style={styles.brandTitle}> Dugout ADDA </Text>
      <Text style={styles.roundText}>
        {debugInfo?.isSuddenDeath ? 'SUDDEN DEATH' : `ROUND ${debugInfo?.currentRound ?? 1} / 5`}
      </Text>

      <View style={styles.scoreRow}>
        <View style={styles.playerBox}>
          <Text style={styles.playerName}>{p1Name}</Text>
          {/* P1 যদি কিপার হয় তবে তার কিপার সাইড ট্রু হবে */}
          <View style={styles.dotsRow}>
            {renderShotDots(debugInfo?.p1Shots, gameMode === 'GOALKEEPER' || isPlayerKeeper)}
          </View>
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.playerBox}>
          <Text style={styles.playerName}>{p2Name}</Text>
          <View style={styles.dotsRow}>
            {renderShotDots(debugInfo?.p2Shots, false)}
          </View>
        </View>
      </View>

      <View style={styles.turnBadge}>
        <Text style={styles.turnBadgeText}>
          🎯 Turn: <Text style={{ color: '#00ffcc' }}>{debugInfo?.currentShooter || (isPlayerKeeper ? 'AI Kicker' : 'P1')}</Text> | 🧤 Keeper:{' '}
          <Text style={{ color: '#ff007f' }}>{debugInfo?.currentKeeper || (isPlayerKeeper ? 'P1' : 'AI Keeper')}</Text>
        </Text>
      </View>
    </View>
  );
}