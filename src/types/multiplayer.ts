// src/types/multiplayer.ts
import { Vector3D } from '../../engine/src/core/Vector3';
import { CameraState, CameraMode } from '../../engine/src/core/CameraManager';

export type PlayerRole = 'SHOOTER' | 'KEEPER';

// 🚀 ইঞ্জিনের সাথে মিলিয়ে UDP Sync Packet
export interface SyncPacketData {
  tick: number;
  ball: {
    pos: Vector3D;
    vel: Vector3D;
  };
  keeper: {
    pos: Vector3D;
  };
  cameraState?: CameraState;
  matchInfo: {
    score: number;
    shotsLeft: number;
    isGameOver: boolean;
  };
}

// 🚀 TCP এর জন্য ইভেন্ট এবং শট ডাটা
export interface ShotInputAction {
  type: 'KICK';
  swipe: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration: number;
  };
}

export interface CameraChangeAction {
  type: 'CAMERA_CHANGE';
  mode: CameraMode;
}