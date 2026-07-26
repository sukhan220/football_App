

//Ball.ts

import { Vector3D } from './Vector3';
import { PhysicsEngine } from './Physics';

/**
 * Interface defining environmental objects for collision detection
 */
export interface SceneObjects {
  // Goal posts (Left, Right, Crossbar line segments)
  posts?: Array<{ start: Vector3D; end: Vector3D; radius?: number }>;
  // Players or Goalkeeper positions and collision radius
  players?: Array<{ position: Vector3D; radius?: number }>;
  // Goal Net Bounding Box
  net?: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
}

/**
 * Represents the football entity. It encapsulates its physical dimensions,
 * state properties, and an internal PhysicsEngine to auto-update its trajectory.
 */
export class Ball {
  public position: Vector3D;
  public velocity: Vector3D;
  public spin: Vector3D;
  public radius: number;
  public mass: number;

  private initialPosition: Vector3D;
  private physics: PhysicsEngine; // Internal PhysicsEngine Instance

  /**
   * Initializes Ball instance with integrated Physics Engine support.
   */
  constructor(
    initialPosition: Vector3D = { x: 0, y: 0.35, z: 0 },
    radius: number = 0.35,
    mass: number = 0.45,
    physicsEngine?: PhysicsEngine // Optional: Pass custom engine or use default
  ) {
    this.initialPosition = { ...initialPosition };
    this.position = { ...initialPosition };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.spin = { x: 0, y: 0, z: 0 };
    this.radius = radius;
    this.mass = mass;

    // Default Physics engine setup if not provided explicitly
    this.physics = physicsEngine || new PhysicsEngine();
  }

  /**
   * Advances the ball's physical state (Position, Velocity, Spin) by time step `dt`.
   * Accepts optional `sceneObjects` to handle goal posts, players, and net collisions.
   */
  public update(dt: number, sceneObjects?: SceneObjects): void {
    // 1. Advance linear & rotational physics simulation
    const result = this.physics.step(this.position, this.velocity, dt, this.spin, this.radius);
    
    this.position = result.nextPos;
    this.velocity = result.nextVel;
    this.spin = result.nextSpin;

    // 2. Resolve Collisions if environmental objects are provided
    if (sceneObjects) {
      this.handleCollisions(sceneObjects);
    }

    // 3. Ground clearance constraint according to radius
    if (this.position.y <= this.radius) {
      this.position.y = this.radius;
    }
  }

  /**
   * Internal helper to process collisions against Post, Players, and Net.
   */
  private handleCollisions(objects: SceneObjects): void {
    // A. Goal Posts / Crossbars Collision
    if (objects.posts && objects.posts.length > 0) {
      for (const post of objects.posts) {
        const res = this.physics.checkPostCollision(
          this.position,
          this.velocity,
          this.radius,
          post.start,
          post.end,
          post.radius || 0.08
        );

        if (res.collided) {
          this.position = res.pos;
          this.velocity = res.vel;
          break; // Avoid double resolution in a single frame
        }
      }
    }

    // B. Players / Goalkeeper Collision
    if (objects.players && objects.players.length > 0) {
      for (const player of objects.players) {
        const res = this.physics.checkPlayerCollision(
          this.position,
          this.velocity,
          this.radius,
          player.position,
          player.radius || 0.45
        );

        if (res.collided) {
          this.position = res.pos;
          this.velocity = res.vel;
          break;
        }
      }
    }

    // C. Goal Net Damping Collision
    if (objects.net) {
      const res = this.physics.checkNetCollision(this.position, this.velocity, objects.net);
      if (res.inNet) {
        this.velocity = res.vel;
      }
    }
  }

  /**
   * Calculates and applies kick impulse directly from user swipe data.
   */
  public kickFromSwipe(swipe: { deltaX: number; deltaY: number; duration: number; deltaTopspin?: number }): void {
    const kickData = this.physics.calculateKickForce(swipe);
    this.velocity = kickData.velocity;
    this.spin = kickData.spin;
  }

  /**
   * Dynamic wind update through ball instance
   */
  public setWind(wind: Vector3D): void {
    this.physics.setWind(wind);
  }

  /**
   * Direct manual kick/force setup
   */
  public applyKick(velocity: Vector3D, spin: Vector3D): void {
    this.velocity = { ...velocity };
    this.spin = { ...spin };
  }

  /**
   * Gets magnitude of linear speed (m/s)
   */
  public getSpeed(): number {
    return Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
  }

  /**
   * Gets magnitude of spin intensity
   */
  public getSpinMagnitude(): number {
    return Math.sqrt(
      this.spin.x ** 2 + this.spin.y ** 2 + this.spin.z ** 2
    );
  }

  /**
   * Resets position, linear velocity, and angular spin.
   */
  public reset(newPosition?: Vector3D): void {
    const resetPos = newPosition || this.initialPosition;
    this.position = { ...resetPos };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.spin = { x: 0, y: 0, z: 0 };
  }
}