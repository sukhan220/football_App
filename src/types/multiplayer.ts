// Multiplayer / Network related types

import type {
  CameraState,
  CameraMode,
} from '../../engine/src/core/CameraManager';

import type {
  Vector3D,
} from '../../engine/src/core/Vector3';

/* =========================================================
 * PLAYER
 * ========================================================= */

export type PlayerRole =
  | 'SHOOTER'
  | 'KEEPER';

export type NetworkRole =
  | 'HOST'
  | 'CLIENT';

/* =========================================================
 * REMOTE ACTION
 * ========================================================= */

export type RemoteActionType =
  | 'KICK'
  | 'DIVE';

/* =========================================================
 * KICK DATA
 * ========================================================= */

export interface KickFlickData {
  deltaX?: number;
  deltaY?: number;

  velocity?: Vector3D;

  spin?: Vector3D;

  [key: string]: unknown;
}

/* =========================================================
 * UDP SYNC PACKET
 *
 * এই data binary packet হিসেবে UDP দিয়ে যাবে।
 * ========================================================= */

export interface SyncPacketData {
  /**
   * Game simulation tick
   *
   * Engine 60 FPS চললেও network
   * 10-20Hz হতে পারে।
   */
  tick: number;

  /**
   * UDP packet sequence.
   */
  sequence?: number;

  /**
   * Current round.
   */
  round?: number;

  /**
   * এই মুহূর্তে কে shooter?
   */
  currentShooter?:
    | 'P1'
    | 'P2'
    | 'AI';

  /* -------------------------------------------------------
   * BALL
   * ------------------------------------------------------- */

  ball: {
    pos: Vector3D;
    vel: Vector3D;
  };

  /* -------------------------------------------------------
   * GOALKEEPER
   * ------------------------------------------------------- */

  keeper: {
    pos: Vector3D;
    vel?: Vector3D;
  };

  /* -------------------------------------------------------
   * MATCH
   * ------------------------------------------------------- */

  matchInfo: {
    score: number;
    shotsLeft: number;
    isGameOver: boolean;
  };

  /* -------------------------------------------------------
   * Optional camera sync
   * ------------------------------------------------------- */

  cameraState?: CameraState;
}

/* =========================================================
 * TCP — KICK
 * ========================================================= */

export interface ShotInputAction {
  type: 'KICK';

  shotId?: number;

  tick?: number;

  flickData?: KickFlickData;

  /**
   * Legacy / alternative input format.
   */
  swipe?: {
    startX: number;
    startY: number;

    endX: number;
    endY: number;

    duration: number;
  };
}

/* =========================================================
 * TCP — DIVE
 * ========================================================= */

export interface DiveInputAction {
  type: 'DIVE';

  tick?: number;

  direction:
    | 'left'
    | 'right'
    | 'center';
}

/* =========================================================
 * CAMERA
 * ========================================================= */

export interface CameraChangeAction {
  type: 'CAMERA_CHANGE';

  mode: CameraMode;
}

/* =========================================================
 * ROOM
 * ========================================================= */

export interface RoomCreateMessage {
  type: 'ROOM_CREATE';

  roomName: string;
}

export interface RoomJoinMessage {
  type: 'ROOM_JOIN';

  roomName: string;
}

/* =========================================================
 * TOSS
 * ========================================================= */

export interface TossMessage {
  type: 'TOSS';

  winner:
    | 'HOST'
    | 'CLIENT';
}

/* =========================================================
 * ROLE
 * ========================================================= */

export interface RoleAssignMessage {
  type: 'ROLE_ASSIGN';

  hostRole: PlayerRole;

  clientRole: PlayerRole;
}

/* =========================================================
 * READY
 * ========================================================= */

export interface ReadyMessage {
  type: 'READY';

  ready: boolean;
}

/* =========================================================
 * MATCH START
 * ========================================================= */

export interface MatchStartMessage {
  type: 'MATCH_START';

  matchId: string;

  /**
   * দুই ডিভাইসে একই random seed.
   */
  seed: number;

  /**
   * কোন tick থেকে match শুরু হবে।
   */
  startTick: number;

  hostRole: PlayerRole;

  clientRole: PlayerRole;
}

/* =========================================================
 * TURN CHANGE
 *
 * প্রতি shot শেষে role/turn change-এর জন্য।
 * ========================================================= */

export interface TurnChangeMessage {
  type: 'TURN_CHANGE';

  round: number;

  hostRole: PlayerRole;

  clientRole: PlayerRole;

  nextShooter:
    | 'P1'
    | 'P2'
    | 'AI';

  tick: number;
}

/* =========================================================
 * SHOT RESULT
 *
 * Host authoritative result.
 * ========================================================= */

export interface ShotResultMessage {
  type: 'SHOT_RESULT';

  shotId: number;

  tick: number;

  isGoal: boolean;

  isSaved: boolean;

  score: number;

  shotsLeft: number;

  isGameOver: boolean;

  winner?:
    | 'P1'
    | 'P2'
    | 'DRAW';
}

/* =========================================================
 * MATCH STATE
 * ========================================================= */

export interface MatchStateMessage {
  type: 'MATCH_STATE';

  tick: number;

  round: number;

  currentShooter:
    | 'P1'
    | 'P2'
    | 'AI';

  score: number;

  shotsLeft: number;

  isGameOver: boolean;

  winner?:
    | 'P1'
    | 'P2'
    | 'DRAW';
}

/* =========================================================
 * REMOTE ACTION
 * ========================================================= */

export interface RemoteActionMessage {
  type: 'REMOTE_ACTION';

  action: RemoteActionType;

  tick?: number;

  shotId?: number;

  flickData?: KickFlickData;

  direction?:
    | 'left'
    | 'right'
    | 'center';
}

/* =========================================================
 * PING / PONG
 * ========================================================= */

export interface PingMessage {
  type: 'PING';

  id: number;

  sentAt: number;
}

export interface PongMessage {
  type: 'PONG';

  id: number;

  sentAt: number;

  receivedAt: number;
}

/* =========================================================
 * ALL TCP MESSAGES
 * ========================================================= */

export type MultiplayerMessage =
  | RoomCreateMessage
  | RoomJoinMessage
  | TossMessage
  | RoleAssignMessage
  | ReadyMessage
  | MatchStartMessage
  | TurnChangeMessage
  | ShotResultMessage
  | MatchStateMessage
  | RemoteActionMessage
  | PingMessage
  | PongMessage
  | ShotInputAction
  | DiveInputAction
  | CameraChangeAction

  /**
   * Future protocol compatibility.
   */
  | {
      type: string;
      [key: string]: unknown;
    };