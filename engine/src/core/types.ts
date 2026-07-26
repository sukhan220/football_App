export type MatchState = 'IDLE' | 'AIMING' | 'BALL_IN_MOTION' | 'GOAL' | 'SAVED' | 'OUT' | 'GAME_OVER';

export interface KeeperState {
  position: { x: number; y: number; z: number };
  state: 'IDLE' | 'DIVING_LEFT' | 'DIVING_RIGHT' | 'JUMPING';
}

export interface MatchScore {
  goals: number;
  misses: number;
  attemptsLeft: number;
  score: number;
  streak: number;
}