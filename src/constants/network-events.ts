// src/constants/network-events.ts

export const GAME_EVENTS = {
  // =========================================
  // ROOM / CONNECTION
  // =========================================

  ROOM_CANCELLED: 'ROOM_CANCELLED',

  // =========================================
  // TOSS
  // =========================================

  START_TOSS: 'START_TOSS',

  TOSS_RESULT: 'TOSS_RESULT',

  // =========================================
  // ROLE
  // =========================================

  ROLE_SELECTED: 'ROLE_SELECTED',

  // =========================================
  // READY / GAME START
  // =========================================

  PLAYER_READY: 'PLAYER_READY',

  GAME_START: 'GAME_START',

  START_ROUND: 'START_ROUND',
} as const;

export type GameEventType =
  (typeof GAME_EVENTS)[keyof typeof GAME_EVENTS];