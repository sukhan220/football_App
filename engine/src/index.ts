// Core Engine Entry Point
export { GameEngine, type EngineCallback } from './GameEngine';

// Core Modules & Utilities
// Core Modules & Utilities
export type { Vector3D } from './core/Vector3';
export { Vector3Utils } from './core/Vector3';

export { InputParser } from './core/InputParser';
export type { SwipeData, ShotResult } from './core/InputParser';

export { EventSystem } from './core/EventSystem';
export type { GameEventType, EventCallback } from './core/EventSystem';

export { PhysicsEngine } from './core/Physics';
export { Ball } from './core/Ball';
export { Goalkeeper } from './core/Player';
export { MatchManager } from './core/Match';
export { ReplaySystem } from './core/Replay';
export * from './core/types';