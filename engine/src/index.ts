

// engine/src/index.ts

// 🚀 Core Engine Entry Point
export { GameEngine, type EngineCallback } from './GameEngine';

// 📸 Camera System (New Addition)
export { CameraManager } from './core/CameraManager';
export type { CameraMode, CameraState } from './core/CameraManager';

// 📐 Vector Utilities
export type { Vector3D } from './core/Vector3';
export { Vector3Utils } from './core/Vector3';

// 👆 Input Parser & Swipe Controls
export { InputParser } from './core/InputParser';
export type { SwipeData } from './core/InputParser';

// 🔔 Event System
export { EventSystem } from './core/EventSystem';
export type { GameEventType, EventCallback } from './core/EventSystem';

// ⚽ Core Physics & Entities
export { PhysicsEngine } from './core/Physics';
export { Ball } from './core/Ball';
export { Goalkeeper, FieldPlayer, type AIShotResult } from './core/Player'; // 👈 'FieldPlayer' ও 'AIShotResult' যুক্ত করা হয়েছে
export { ReplaySystem } from './core/Replay';

// 🏆 Match Logic & Types
export * from './core/Match';
export * from './core/types';