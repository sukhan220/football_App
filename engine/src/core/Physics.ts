// // //Physics.ts
// import { Vector3D } from './Vector3';

// /**
//  * ============================================================================
//  * ⚽ COMPLETE PHYSICS FORMULAS USED IN THIS ENGINE
//  * ============================================================================
//  * 1. Gravity (Uniform Acceleration):
//  *    v_y(t) = v_y0 + g * dt
//  * 
//  * 2. Linear Displacement (Position Update):
//  *    pos_next = pos_current + velocity * dt
//  * 
//  * 3. Air Drag (Air Resistance Decay):
//  *    v_next = v_current * airDrag_factor
//  * 
//  * 4. Magnus Effect - Side Curve (Y-Axis Spin):
//  *    a_magnus_x = spin_y * magnus_coefficient * |v_z|
//  *    v_x(t) = v_x0 + a_magnus_x * dt
//  * 
//  * 5. Magnus Effect - Topspin / Backspin (X-Axis Spin):
//  *    a_magnus_y = -spin_x * magnus_coefficient * |v_z|
//  *    v_y(t) = v_y0 + a_magnus_y * dt
//  * 
//  * 6. Environmental Wind Force:
//  *    v_next = v_current + wind_vector * dt
//  * 
//  * 7. Ground Collision (Coefficient of Restitution):
//  *    v_y_after = -e * v_y_before  (where e = bounceRestitution)
//  * 
//  * 8. Ground Kinetic Friction (Rolling Resistance):
//  *    v_horizontal_next = v_horizontal_current * groundFriction_factor
//  * 
//  * 9. Angular Drag & Spin Decay (Air & Ground Friction on Rotation):
//  *    spin_air_next = spin_current * airSpinDecay
//  *    spin_ground_next = spin_current * groundSpinDecay
//  * 
//  * 10. Object Collision & Physics Reflection:
//  *    v_reflect = v - (1 + e) * (v · n) * n
//  * ============================================================================
//  */

// export class PhysicsEngine {
//   private gravity: number;
//   private bounceRestitution: number;
//   private groundFriction: number;
//   private airDrag: number;
//   private magnusCoefficient: number;
//   private wind: Vector3D;

//   // Rotational Friction / Spin Decay Factors
//   private airSpinDecay: number;    // Rotational air drag factor (e.g. 0.98)
//   private groundSpinDecay: number; // Rotational ground friction factor upon contact (e.g. 0.82)

//   /**
//    * Initialize Physics Engine with full environmental and spin controls.
//    */
//   constructor(
//     customGravity: number = -9.82,     // Formula 1: Earth Gravity Acceleration (g = -9.82 m/s²)
//     bounceRestitution: number = 0.55,  // Formula 7: Energy Retained After Bounce (e)
//     groundFriction: number = 0.98,     // Formula 8: Ground Rolling Resistance Coefficient
//     airDrag: number = 0.995,           // Formula 3: Air Resistance Decay Factor
//     magnusCoefficient: number = 0.05,  // Formula 4 & 5: Magnus Curve Lift/Side Scaling Factor
//     wind: Vector3D = { x: 0, y: 0, z: 0 }, // Formula 6: Environmental Wind Velocity Vector (m/s)
//     airSpinDecay: number = 0.98,       // Formula 9: Air Angular Friction (Spin Decay in Air)
//     groundSpinDecay: number = 0.82     // Formula 9: Ground Angular Friction (Spin Decay on Bounce)
//   ) {
//     this.gravity = customGravity;
//     this.bounceRestitution = bounceRestitution;
//     this.groundFriction = groundFriction;
//     this.airDrag = airDrag;
//     this.magnusCoefficient = magnusCoefficient;
//     this.wind = wind;
//     this.airSpinDecay = airSpinDecay;
//     this.groundSpinDecay = groundSpinDecay;
//   }

//   /**
//    * Set dynamic wind velocity (e.g., crosswind or headwind)
//    */
//   public setWind(wind: Vector3D): void {
//     this.wind = wind;
//   }

//   // ----------------------------------------------------
//   // 1. Helper Methods (Individual Calculations)
//   // ----------------------------------------------------

//   /**
//    * Calculates initial linear velocity vector from swipe input.
//    * Concept: Impulse & Linear Speed (v = d / t)
//    */
//   public calculateKickVelocity(swipe: { deltaX: number; deltaY: number; duration: number }): Vector3D {
//     const duration = Math.max(swipe.duration, 0.05);
//     const absDeltaY = Math.abs(swipe.deltaY);
//     const speed = Math.min(absDeltaY / duration, 1500);

//     return {
//       x: swipe.deltaX * 0.035,
//       y: Math.min(absDeltaY * 0.035, 12),
//       z: -Math.min(speed * 0.025, 28)
//     };
//   }

//   /**
//    * Calculates rotational spin vector from swipe offsets.
//    * Concept: Angular Velocity Torque Vector (spin_x: Topspin/Backspin, spin_y: Curve)
//    */
//   public calculateSpin(swipe: { deltaX: number; deltaY: number; deltaTopspin?: number }): Vector3D {
//     return {
//       x: (swipe.deltaTopspin || 0) * 0.1, // Spin around X-axis: Topspin (+) / Backspin (-)
//       y: swipe.deltaX * 0.1,               // Spin around Y-axis: Side curve Left (-)/ Right (+)
//       z: 0
//     };
//   }

//   // ----------------------------------------------------
//   // 2. Combined Kick Method
//   // ----------------------------------------------------

//   /**
//    * Returns both initial velocity and rotational spin in a single call.
//    */
//   public calculateKickForce(swipe: { deltaX: number; deltaY: number; duration: number; deltaTopspin?: number }): {
//     velocity: Vector3D;
//     spin: Vector3D;
//   } {
//     return {
//       velocity: this.calculateKickVelocity(swipe),
//       spin: this.calculateSpin(swipe)
//     };
//   }

//   // ----------------------------------------------------
//   // 3. Collision Detection & Response Helpers
//   // ----------------------------------------------------

//   /**
//    * Calculates nearest point on a line segment to a 3D point.
//    */
//   private getClosestPointOnSegment(p: Vector3D, a: Vector3D, b: Vector3D): Vector3D {
//     const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
//     const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };

//     const abLenSq = ab.x ** 2 + ab.y ** 2 + ab.z ** 2;
//     if (abLenSq === 0) return { ...a };

//     let t = (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / abLenSq;
//     t = Math.max(0, Math.min(1, t));

//     return {
//       x: a.x + t * ab.x,
//       y: a.y + t * ab.y,
//       z: a.z + t * ab.z
//     };
//   }

//   /**
//    * Checks collision with a Goal Post or Crossbar (Line Segment) and updates Pos/Vel.
//    */
//   public checkPostCollision(
//     pos: Vector3D,
//     vel: Vector3D,
//     ballRadius: number,
//     postStart: Vector3D,
//     postEnd: Vector3D,
//     postRadius: number = 0.08
//   ): { pos: Vector3D; vel: Vector3D; collided: boolean } {
//     const closestPoint = this.getClosestPointOnSegment(pos, postStart, postEnd);

//     const dx = pos.x - closestPoint.x;
//     const dy = pos.y - closestPoint.y;
//     const dz = pos.z - closestPoint.z;
//     const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

//     const minDistance = ballRadius + postRadius;

//     if (distance < minDistance && distance > 0) {
//       const nx = dx / distance;
//       const ny = dy / distance;
//       const nz = dz / distance;

//       // Resolve Penetration (Overlap)
//       const overlap = minDistance - distance;
//       const resolvedPos = {
//         x: pos.x + nx * overlap,
//         y: pos.y + ny * overlap,
//         z: pos.z + nz * overlap
//       };

//       // Vector Reflection with Restitution
//       const dotProduct = vel.x * nx + vel.y * ny + vel.z * nz;
//       const bounceRestitution = 0.75; // Goal bar bounce factor

//       const resolvedVel = {
//         x: vel.x - (1 + bounceRestitution) * dotProduct * nx,
//         y: vel.y - (1 + bounceRestitution) * dotProduct * ny,
//         z: vel.z - (1 + bounceRestitution) * dotProduct * nz
//       };

//       return { pos: resolvedPos, vel: resolvedVel, collided: true };
//     }

//     return { pos, vel, collided: false };
//   }

//   /**
//    * Checks collision with a Player or Goalkeeper (Sphere) and updates Pos/Vel.
//    */
//   public checkPlayerCollision(
//     pos: Vector3D,
//     vel: Vector3D,
//     ballRadius: number,
//     playerPos: Vector3D,
//     playerRadius: number = 0.45
//   ): { pos: Vector3D; vel: Vector3D; collided: boolean } {
//     const dx = pos.x - playerPos.x;
//     const dy = pos.y - playerPos.y;
//     const dz = pos.z - playerPos.z;

//     const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
//     const minDistance = ballRadius + playerRadius;

//     if (distance < minDistance && distance > 0) {
//       const nx = dx / distance;
//       const ny = dy / distance;
//       const nz = dz / distance;

//       // Resolve Overlap
//       const overlap = minDistance - distance;
//       const resolvedPos = {
//         x: pos.x + nx * overlap,
//         y: pos.y + ny * overlap,
//         z: pos.z + nz * overlap
//       };

//       // Deflect/Bounce velocity off player
//       const resolvedVel = {
//         x: nx * 8,
//         y: Math.max(vel.y, 2.5),
//         z: nz * 8
//       };

//       return { pos: resolvedPos, vel: resolvedVel, collided: true };
//     }

//     return { pos, vel, collided: false };
//   }

//   /**
//    * Checks collision inside the Net (AABB Box) and applies soft net damping.
//    */

//   /**
//  * Checks collision inside the Net (AABB Box), applies soft mesh damping,
//  * and preserves directional momentum for realistic net deformation and roll.
//  */
// /**
//  * Checks collision inside the Net (AABB Box).
//  * Dynamically scales vertical and horizontal velocity based on impact speed
//  * so high-speed shots bounce and slide more upon landing.
//  */
// public checkNetCollision(
//   pos: Vector3D,
//   vel: Vector3D,
//   netBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
// ): { vel: Vector3D; inNet: boolean } {
//   if (
//     pos.x >= netBounds.minX && pos.x <= netBounds.maxX &&
//     pos.y >= netBounds.minY && pos.y <= netBounds.maxY &&
//     pos.z >= netBounds.minZ && pos.z <= netBounds.maxZ
//   ) {
//     // Calculate total impact speed entering the net
//     const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

//     // Dynamic downward pull proportional to incoming shot speed
//     let newVelY = vel.y;
//     if (vel.y > 0) {
//       newVelY = -Math.min(speed * 0.15 + 1.2, 4.5); // Fast shots get pulled down faster
//     } else {
//       newVelY = vel.y * 1.1 - 0.5;
//     }

//     return {
//       vel: {
//         // High speed shots preserve more horizontal momentum (sliding effect)
//         x: vel.x * 0.45,
//         y: Math.max(newVelY, -9.0), // Cap max downward speed
//         z: vel.z * 0.55
//       },
//       inNet: true
//     };
//   }

//   return { vel, inNet: false };
// }
//   // ----------------------------------------------------
//   // 4. Main Simulation Loop
//   // ----------------------------------------------------

//   /**
//    * Advances the physical simulation by time step `dt`.
//    * Returns updated position, velocity, AND spin vector (with decay).
//    */
// public step(
//     pos: Vector3D,
//     vel: Vector3D,
//     dt: number,
//     spin: Vector3D = { x: 0, y: 0, z: 0 },
//     radius: number = 0.2 // Ground contact offset based on physical ball radius
//   ): { nextPos: Vector3D; nextVel: Vector3D; nextSpin: Vector3D } {
//     let nextVelX = vel.x;

//     // ----------------------------------------------------
//     // Formula 1: Uniform Acceleration (Gravity)
//     // Mathematical Form: v_y = v_y0 + g * dt
//     // ----------------------------------------------------
//     let nextVelY = vel.y + this.gravity * dt;
//     let nextVelZ = vel.z;

//     // Track active spin decay
//     let nextSpinX = spin.x;
//     let nextSpinY = spin.y;
//     let nextSpinZ = spin.z;

//     // ----------------------------------------------------
//     // Airborne Dynamics (Triggered when the ball center is above ground level)
//     // ----------------------------------------------------
//     if (pos.y > radius) {
//       // --------------------------------------------------
//       // Formula 9: Rotational Air Drag (Spin Decay in Air)
//       // Exponential decay relative to frame delta time
//       // --------------------------------------------------
//       const airDecayFactor = Math.pow(this.airSpinDecay, dt * 60);
//       nextSpinX *= airDecayFactor;
//       nextSpinY *= airDecayFactor;
//       nextSpinZ *= airDecayFactor;

//       // --------------------------------------------------
//       // Formula 3: Air Drag / Resistance Decay
//       // Mathematical Form: v_next = v_current * airDrag
//       // --------------------------------------------------
//       nextVelX *= this.airDrag;
//       nextVelY *= this.airDrag;
//       nextVelZ *= this.airDrag;

//       // --------------------------------------------------
//       // Formula 4: Magnus Effect - Side Curve (Y-Axis Spin)
//       // Mathematical Form: a_x = spin_y * k_magnus * |v_z|
//       // --------------------------------------------------
//       nextVelX += nextSpinY * this.magnusCoefficient * Math.abs(vel.z) * dt;

//       // --------------------------------------------------
//       // Formula 5: Magnus Effect - Topspin / Backspin (X-Axis Spin)
//       // Mathematical Form: a_y = -spin_x * k_magnus * |v_z|
//       // Note: Positive spin_x (Topspin) forces ball downward; Backspin lifts it up.
//       // --------------------------------------------------
//       nextVelY -= nextSpinX * this.magnusCoefficient * Math.abs(vel.z) * dt;

//       // --------------------------------------------------
//       // Formula 6: Environmental Wind Velocity Influence
//       // Mathematical Form: v_next = v_current + wind * dt
//       // --------------------------------------------------
//       nextVelX += this.wind.x * dt;
//       nextVelY += this.wind.y * dt;
//       nextVelZ += this.wind.z * dt;
//     }

//     // ----------------------------------------------------
//     // Formula 2: Linear Displacement Update
//     // Mathematical Form: pos_next = pos_current + v * dt
//     // ----------------------------------------------------
//     let nextPosY = pos.y + nextVelY * dt;
//     let nextPosX = pos.x + nextVelX * dt;
//     let nextPosZ = pos.z + nextVelZ * dt;

//     // ----------------------------------------------------
//     // Ground Collision & Surface Friction Dynamics
//     // ----------------------------------------------------
//     if (nextPosY <= radius) {
//       nextPosY = radius; // Constraint: Prevent falling beneath ground plane (Center rests at radius)

//       // --------------------------------------------------
//       // Formula 9: Ground Angular Friction (Spin Dissipation on Contact)
//       // Ground friction rapidly kills remaining angular momentum
//       // --------------------------------------------------
//       const groundDecayFactor = Math.pow(this.groundSpinDecay, dt * 80);
//       nextSpinX *= groundDecayFactor;
//       nextSpinY *= groundDecayFactor;
//       nextSpinZ *= groundDecayFactor;

//       // Threshold cleanup to zero out minuscule residual spin
//       if (Math.abs(nextSpinX) < 0.01) nextSpinX = 0;
//       if (Math.abs(nextSpinY) < 0.01) nextSpinY = 0;
//       if (Math.abs(nextSpinZ) < 0.01) nextSpinZ = 0;

//       // --------------------------------------------------
//       // Formula 7: Coefficient of Restitution (Dynamic Ground Bounce)
//       // Mathematical Form: v_bounce = -e * v_impact
//       // Threshold lowered to 0.6 m/s so faster impacts produce a soft bounce inside the net
//       // --------------------------------------------------
//       if (Math.abs(nextVelY) > 0.6) {
//         // High speed falling = noticeable light bounce; Low speed = zero bounce
//         nextVelY = -nextVelY * (this.bounceRestitution || 0.35);
//       } else {
//         nextVelY = 0; // Zero out low-energy residual velocity
//       }

//       // --------------------------------------------------
//       // Formula 8: Ground Kinetic Friction (Speed-Dependent Rolling)
//       // Mathematical Form: v_roll = v_current * groundFriction
//       // --------------------------------------------------
//       const rollingFrictionFactor = Math.pow(this.groundFriction || 0.90, dt * 60);
//       nextVelX *= rollingFrictionFactor;
//       nextVelZ *= rollingFrictionFactor;

//       // Floating point threshold cleanup to allow natural stopping
//       if (Math.abs(nextVelX) < 0.04) nextVelX = 0;
//       if (Math.abs(nextVelZ) < 0.04) nextVelZ = 0;
//     }

//     return {
//       nextPos: { x: nextPosX, y: nextPosY, z: nextPosZ },
//       nextVel: { x: nextVelX, y: nextVelY, z: nextVelZ },
//       nextSpin: { x: nextSpinX, y: nextSpinY, z: nextSpinZ }
//     };
//   }
// }

// Physics.ts
import { Vector3D } from './Vector3';

/**
 * ============================================================================
 * ⚽ COMPLETE PHYSICS FORMULAS USED IN THIS ENGINE
 * ============================================================================
 * 1. Gravity (Uniform Acceleration):
 *    v_y(t) = v_y0 + g * dt
 * 
 * 2. Linear Displacement (Position Update):
 *    pos_next = pos_current + velocity * dt
 * 
 * 3. Air Drag (Air Resistance Decay):
 *    v_next = v_current * airDrag_factor
 * 
 * 4. Magnus Effect - Side Curve (Y-Axis Spin):
 *    a_magnus_x = spin_y * magnus_coefficient * |v_z|
 *    v_x(t) = v_x0 + a_magnus_x * dt
 * 
 * 5. Magnus Effect - Topspin / Backspin (X-Axis Spin):
 *    a_magnus_y = -spin_x * magnus_coefficient * |v_z|
 *    v_y(t) = v_y0 + a_magnus_y * dt
 * 
 * 6. Environmental Wind Force:
 *    v_next = v_current + wind_vector * dt
 * 
 * 7. Ground Collision (Coefficient of Restitution):
 *    v_y_after = -e * v_y_before  (where e = bounceRestitution)
 * 
 * 8. Ground Kinetic Friction (Rolling Resistance):
 *    v_horizontal_next = v_horizontal_current * groundFriction_factor
 * 
 * 9. Angular Drag & Spin Decay (Air & Ground Friction on Rotation):
 *    spin_air_next = spin_current * airSpinDecay
 *    spin_ground_next = spin_current * groundSpinDecay
 * 
 * 10. Object Collision & Physics Reflection:
 *    v_reflect = v - (1 + e) * (v · n) * n
 * 
 * 11. Goalkeeper Projectile Trajectory (Parabolic Jump/Dive Dynamics):
 *    v_y_keeper(t) = v_y0 + g * dt
 *    pos_keeper_next = pos_keeper_current + v_keeper * dt
 * ============================================================================
 */

export class PhysicsEngine {
  private gravity: number;
  private bounceRestitution: number;
  private groundFriction: number;
  private airDrag: number;
  private magnusCoefficient: number;
  private wind: Vector3D;

  // Rotational Friction / Spin Decay Factors
  private airSpinDecay: number;    // Rotational air drag factor (e.g. 0.98)
  private groundSpinDecay: number; // Rotational ground friction factor upon contact (e.g. 0.82)

  /**
   * Initialize Physics Engine with full environmental and spin controls.
   */
  constructor(
    customGravity: number = -9.82,     // Formula 1: Earth Gravity Acceleration (g = -9.82 m/s²)
    bounceRestitution: number = 0.55,  // Formula 7: Energy Retained After Bounce (e)
    groundFriction: number = 0.98,     // Formula 8: Ground Rolling Resistance Coefficient
    airDrag: number = 0.995,           // Formula 3: Air Resistance Decay Factor
    magnusCoefficient: number = 0.05,  // Formula 4 & 5: Magnus Curve Lift/Side Scaling Factor
    wind: Vector3D = { x: 0, y: 0, z: 0 }, // Formula 6: Environmental Wind Velocity Vector (m/s)
    airSpinDecay: number = 0.98,       // Formula 9: Air Angular Friction (Spin Decay in Air)
    groundSpinDecay: number = 0.82     // Formula 9: Ground Angular Friction (Spin Decay on Bounce)
  ) {
    this.gravity = customGravity;
    this.bounceRestitution = bounceRestitution;
    this.groundFriction = groundFriction;
    this.airDrag = airDrag;
    this.magnusCoefficient = magnusCoefficient;
    this.wind = wind;
    this.airSpinDecay = airSpinDecay;
    this.groundSpinDecay = groundSpinDecay;
  }

  /**
   * Set dynamic wind velocity (e.g., crosswind or headwind)
   */
  public setWind(wind: Vector3D): void {
    this.wind = wind;
  }

  // ----------------------------------------------------
  // 1. Helper Methods (Individual Calculations)
  // ----------------------------------------------------

  /**
   * Calculates initial linear velocity vector from swipe input.
   * Concept: Impulse & Linear Speed (v = d / t)
   */
  public calculateKickVelocity(swipe: { deltaX: number; deltaY: number; duration: number }): Vector3D {
    const duration = Math.max(swipe.duration, 0.05);
    const absDeltaY = Math.abs(swipe.deltaY);
    const speed = Math.min(absDeltaY / duration, 1500);

    return {
      x: swipe.deltaX * 0.035,
      y: Math.min(absDeltaY * 0.035, 12),
      z: -Math.min(speed * 0.025, 28)
    };
  }

  /**
   * Calculates rotational spin vector from swipe offsets.
   * Concept: Angular Velocity Torque Vector (spin_x: Topspin/Backspin, spin_y: Curve)
   */
  public calculateSpin(swipe: { deltaX: number; deltaY: number; deltaTopspin?: number }): Vector3D {
    return {
      x: (swipe.deltaTopspin || 0) * 0.1, // Spin around X-axis: Topspin (+) / Backspin (-)
      y: swipe.deltaX * 0.1,               // Spin around Y-axis: Side curve Left (-)/ Right (+)
      z: 0
    };
  }

  // ----------------------------------------------------
  // 2. Combined Kick Method
  // ----------------------------------------------------

  /**
   * Returns both initial velocity and rotational spin in a single call.
   */
  public calculateKickForce(swipe: { deltaX: number; deltaY: number; duration: number; deltaTopspin?: number }): {
    velocity: Vector3D;
    spin: Vector3D;
  } {
    return {
      velocity: this.calculateKickVelocity(swipe),
      spin: this.calculateSpin(swipe)
    };
  }

  // ----------------------------------------------------
  // 3. Goalkeeper Dynamics & Projectile Motion (প্রাসের গতি)
  // ----------------------------------------------------

  /**
   * Calculates initial jump/dive velocity for the Goalkeeper (Projectile Motion).
   * Calculates required initial vector (v_x0, v_y0) to reach target within time-to-impact (timeToTarget).
   */
  public calculateKeeperVelocity(
    startPos: Vector3D,
    targetPos: Vector3D,
    timeToTarget: number
  ): Vector3D {
    const t = Math.max(timeToTarget, 0.1);

    // Horizontal linear velocity required: v_x = dx / t
    const velX = (targetPos.x - startPos.x) / t;

    // Vertical projectile velocity formula with gravity: v_y0 = (dy - 0.5 * g * t^2) / t
    const velY = (targetPos.y - startPos.y - 0.5 * this.gravity * (t * t)) / t;

    // Depth adjustment velocity
    const velZ = (targetPos.z - startPos.z) / t;

    return { x: velX, y: velY, z: velZ };
  }

  /**
   * Advances Goalkeeper's physical position per frame using parabolic projectile equations.
   */
  public stepKeeper(
    pos: Vector3D,
    vel: Vector3D,
    dt: number,
    groundY: number = 0
  ): { nextPos: Vector3D; nextVel: Vector3D } {
    // Apply Gravity to Vertical Velocity: v_y = v_y0 + g * dt
    const nextVelY = vel.y + this.gravity * dt;
    const nextVelX = vel.x;
    const nextVelZ = vel.z;

    // Displacement Integration: pos_next = pos + v * dt
    let nextPosX = pos.x + nextVelX * dt;
    let nextPosY = pos.y + nextVelY * dt;
    let nextPosZ = pos.z + nextVelZ * dt;

    // Ground Plane Constraint (kicking/landing on grass)
    if (nextPosY <= groundY) {
      nextPosY = groundY;
    }

    return {
      nextPos: { x: nextPosX, y: nextPosY, z: nextPosZ },
      nextVel: { x: nextVelX, y: nextVelY, z: nextVelZ }
    };
  }

  // ----------------------------------------------------
  // 4. Collision Detection & Response Helpers
  // ----------------------------------------------------

  /**
   * Calculates nearest point on a line segment to a 3D point.
   */
  private getClosestPointOnSegment(p: Vector3D, a: Vector3D, b: Vector3D): Vector3D {
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };

    const abLenSq = ab.x ** 2 + ab.y ** 2 + ab.z ** 2;
    if (abLenSq === 0) return { ...a };

    let t = (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    return {
      x: a.x + t * ab.x,
      y: a.y + t * ab.y,
      z: a.z + t * ab.z
    };
  }

  /**
   * Checks collision with a Goal Post or Crossbar (Line Segment) and updates Pos/Vel.
   */
  public checkPostCollision(
    pos: Vector3D,
    vel: Vector3D,
    ballRadius: number,
    postStart: Vector3D,
    postEnd: Vector3D,
    postRadius: number = 0.08
  ): { pos: Vector3D; vel: Vector3D; collided: boolean } {
    const closestPoint = this.getClosestPointOnSegment(pos, postStart, postEnd);

    const dx = pos.x - closestPoint.x;
    const dy = pos.y - closestPoint.y;
    const dz = pos.z - closestPoint.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const minDistance = ballRadius + postRadius;

    if (distance < minDistance && distance > 0) {
      const nx = dx / distance;
      const ny = dy / distance;
      const nz = dz / distance;

      // Resolve Penetration (Overlap)
      const overlap = minDistance - distance;
      const resolvedPos = {
        x: pos.x + nx * overlap,
        y: pos.y + ny * overlap,
        z: pos.z + nz * overlap
      };

      // Vector Reflection with Restitution
      const dotProduct = vel.x * nx + vel.y * ny + vel.z * nz;
      const bounceRestitution = 0.75; // Goal bar bounce factor

      const resolvedVel = {
        x: vel.x - (1 + bounceRestitution) * dotProduct * nx,
        y: vel.y - (1 + bounceRestitution) * dotProduct * ny,
        z: vel.z - (1 + bounceRestitution) * dotProduct * nz
      };

      return { pos: resolvedPos, vel: resolvedVel, collided: true };
    }

    return { pos, vel, collided: false };
  }

  /**
   * Checks collision with a Player or Goalkeeper (Sphere) and updates Pos/Vel.
   */
  public checkPlayerCollision(
    pos: Vector3D,
    vel: Vector3D,
    ballRadius: number,
    playerPos: Vector3D,
    playerRadius: number = 0.45
  ): { pos: Vector3D; vel: Vector3D; collided: boolean } {
    const dx = pos.x - playerPos.x;
    const dy = pos.y - playerPos.y;
    const dz = pos.z - playerPos.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const minDistance = ballRadius + playerRadius;

    if (distance < minDistance && distance > 0) {
      const nx = dx / distance;
      const ny = dy / distance;
      const nz = dz / distance;

      // Resolve Overlap
      const overlap = minDistance - distance;
      const resolvedPos = {
        x: pos.x + nx * overlap,
        y: pos.y + ny * overlap,
        z: pos.z + nz * overlap
      };

      // Deflect/Bounce velocity off player
      const resolvedVel = {
        x: nx * 8,
        y: Math.max(vel.y, 2.5),
        z: nz * 8
      };

      return { pos: resolvedPos, vel: resolvedVel, collided: true };
    }

    return { pos, vel, collided: false };
  }

  /**
   * Checks collision inside the Net (AABB Box).
   * Dynamically scales vertical and horizontal velocity based on impact speed
   * so high-speed shots bounce and slide more upon landing.
   */
  public checkNetCollision(
    pos: Vector3D,
    vel: Vector3D,
    netBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
  ): { vel: Vector3D; inNet: boolean } {
    if (
      pos.x >= netBounds.minX && pos.x <= netBounds.maxX &&
      pos.y >= netBounds.minY && pos.y <= netBounds.maxY &&
      pos.z >= netBounds.minZ && pos.z <= netBounds.maxZ
    ) {
      // Calculate total impact speed entering the net
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

      // Dynamic downward pull proportional to incoming shot speed
      let newVelY = vel.y;
      if (vel.y > 0) {
        newVelY = -Math.min(speed * 0.15 + 1.2, 4.5); // Fast shots get pulled down faster
      } else {
        newVelY = vel.y * 1.1 - 0.5;
      }

      return {
        vel: {
          // High speed shots preserve more horizontal momentum (sliding effect)
          x: vel.x * 0.45,
          y: Math.max(newVelY, -9.0), // Cap max downward speed
          z: vel.z * 0.55
        },
        inNet: true
      };
    }

    return { vel, inNet: false };
  }

  // ----------------------------------------------------
  // 5. Main Simulation Loop
  // ----------------------------------------------------

  /**
   * Advances the physical simulation by time step `dt`.
   * Returns updated position, velocity, AND spin vector (with decay).
   */
  public step(
    pos: Vector3D,
    vel: Vector3D,
    dt: number,
    spin: Vector3D = { x: 0, y: 0, z: 0 },
    radius: number = 0.2 // Ground contact offset based on physical ball radius
  ): { nextPos: Vector3D; nextVel: Vector3D; nextSpin: Vector3D } {
    let nextVelX = vel.x;

    // ----------------------------------------------------
    // Formula 1: Uniform Acceleration (Gravity)
    // Mathematical Form: v_y = v_y0 + g * dt
    // ----------------------------------------------------
    let nextVelY = vel.y + this.gravity * dt;
    let nextVelZ = vel.z;

    // Track active spin decay
    let nextSpinX = spin.x;
    let nextSpinY = spin.y;
    let nextSpinZ = spin.z;

    // ----------------------------------------------------
    // Airborne Dynamics (Triggered when the ball center is above ground level)
    // ----------------------------------------------------
    if (pos.y > radius) {
      // --------------------------------------------------
      // Formula 9: Rotational Air Drag (Spin Decay in Air)
      // Exponential decay relative to frame delta time
      // --------------------------------------------------
      const airDecayFactor = Math.pow(this.airSpinDecay, dt * 60);
      nextSpinX *= airDecayFactor;
      nextSpinY *= airDecayFactor;
      nextSpinZ *= airDecayFactor;

      // --------------------------------------------------
      // Formula 3: Air Drag / Resistance Decay
      // Mathematical Form: v_next = v_current * airDrag
      // --------------------------------------------------
      nextVelX *= this.airDrag;
      nextVelY *= this.airDrag;
      nextVelZ *= this.airDrag;

      // --------------------------------------------------
      // Formula 4: Magnus Effect - Side Curve (Y-Axis Spin)
      // Mathematical Form: a_x = spin_y * k_magnus * |v_z|
      // --------------------------------------------------
      nextVelX += nextSpinY * this.magnusCoefficient * Math.abs(vel.z) * dt;

      // --------------------------------------------------
      // Formula 5: Magnus Effect - Topspin / Backspin (X-Axis Spin)
      // Mathematical Form: a_y = -spin_x * k_magnus * |v_z|
      // Note: Positive spin_x (Topspin) forces ball downward; Backspin lifts it up.
      // --------------------------------------------------
      nextVelY -= nextSpinX * this.magnusCoefficient * Math.abs(vel.z) * dt;

      // --------------------------------------------------
      // Formula 6: Environmental Wind Velocity Influence
      // Mathematical Form: v_next = v_current + wind * dt
      // --------------------------------------------------
      nextVelX += this.wind.x * dt;
      nextVelY += this.wind.y * dt;
      nextVelZ += this.wind.z * dt;
    }

    // ----------------------------------------------------
    // Formula 2: Linear Displacement Update
    // Mathematical Form: pos_next = pos_current + v * dt
    // ----------------------------------------------------
    let nextPosY = pos.y + nextVelY * dt;
    let nextPosX = pos.x + nextVelX * dt;
    let nextPosZ = pos.z + nextVelZ * dt;

    // ----------------------------------------------------
    // Ground Collision & Surface Friction Dynamics
    // ----------------------------------------------------
    if (nextPosY <= radius) {
      nextPosY = radius; // Constraint: Prevent falling beneath ground plane (Center rests at radius)

      // --------------------------------------------------
      // Formula 9: Ground Angular Friction (Spin Dissipation on Contact)
      // Ground friction rapidly kills remaining angular momentum
      // --------------------------------------------------
      const groundDecayFactor = Math.pow(this.groundSpinDecay, dt * 80);
      nextSpinX *= groundDecayFactor;
      nextSpinY *= groundDecayFactor;
      nextSpinZ *= groundDecayFactor;

      // Threshold cleanup to zero out minuscule residual spin
      if (Math.abs(nextSpinX) < 0.01) nextSpinX = 0;
      if (Math.abs(nextSpinY) < 0.01) nextSpinY = 0;
      if (Math.abs(nextSpinZ) < 0.01) nextSpinZ = 0;

      // --------------------------------------------------
      // Formula 7: Coefficient of Restitution (Dynamic Ground Bounce)
      // Mathematical Form: v_bounce = -e * v_impact
      // Threshold lowered to 0.6 m/s so faster impacts produce a soft bounce inside the net
      // --------------------------------------------------
      if (Math.abs(nextVelY) > 0.6) {
        // High speed falling = noticeable light bounce; Low speed = zero bounce
        nextVelY = -nextVelY * (this.bounceRestitution || 0.35);
      } else {
        nextVelY = 0; // Zero out low-energy residual velocity
      }

      // --------------------------------------------------
      // Formula 8: Ground Kinetic Friction (Speed-Dependent Rolling)
      // Mathematical Form: v_roll = v_current * groundFriction
      // --------------------------------------------------
      const rollingFrictionFactor = Math.pow(this.groundFriction || 0.90, dt * 60);
      nextVelX *= rollingFrictionFactor;
      nextVelZ *= rollingFrictionFactor;

      // Floating point threshold cleanup to allow natural stopping
      if (Math.abs(nextVelX) < 0.04) nextVelX = 0;
      if (Math.abs(nextVelZ) < 0.04) nextVelZ = 0;
    }

    return {
      nextPos: { x: nextPosX, y: nextPosY, z: nextPosZ },
      nextVel: { x: nextVelX, y: nextVelY, z: nextVelZ },
      nextSpin: { x: nextSpinX, y: nextSpinY, z: nextSpinZ }
    };
  }
}