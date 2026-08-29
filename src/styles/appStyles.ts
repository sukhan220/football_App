import {  StyleSheet,Dimensions} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
 export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a100d',
  },
  glView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  bannerOverlayTextContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.36,
    alignSelf: 'center',
  },
  modeContainer: {
    position: 'absolute',
    top: 45,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeMode: {
    backgroundColor: '#ff007f',
  },
  modeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  networkSetupWrapper: {
  width: '100%',
  marginTop: 10,
  paddingHorizontal: 10,
},
  scoreboard: {
    position: 'absolute',
    top: 95,
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 12,
    borderRadius: 12,
    borderColor: '#00ffcc',
    borderWidth: 1,
    alignItems: 'center',
  },
  brandTitle: {
    color: '#00ffcc',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  roundText: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  bannerLogo: {
    width: 180,
    height: 60,
  },
  playerBox: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDot: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  greenDot: {
    backgroundColor: '#2e7d32',
  },
  redDot: {
    backgroundColor: '#c62828',
  },
  dotIcon: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vsText: {
    color: '#ff007f',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  turnBadge: {
    marginTop: 8,
    backgroundColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  turnBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 3,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.92)',
    paddingHorizontal: 30,
    paddingVertical: 25,
    borderRadius: 16,
    borderColor: '#00ffcc',
    borderWidth: 2,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#00ffcc',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  gameOverTitle: {
    color: '#ffcc00',
    fontSize: 20,
    fontWeight: 'bold',
  },
  winnerText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 12,
    fontWeight: '600',
  },
  restartBtn: {
    backgroundColor: '#ff007f',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  restartBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});