// // player.ts

// import { Vector3D } from './Vector3';
// import { PhysicsEngine } from './Physics'; // ⚽ PhysicsEngine Import

// // ==========================================
// // 1. GOALKEEPER TYPES & CLASS
// // ==========================================

// export interface ShotPredictionInput {
//   ballPos: Vector3D;
//   ballVel: Vector3D;
//   ballSpin?: Vector3D;
// }

// export type GoalkeeperState = 'standing' | 'diving' | 'celebrating' | 'lying_down';

// export class Goalkeeper {
//   public position: Vector3D = { x: 0, y: 0.9, z: -9.8 };
//   public velocity: Vector3D = { x: 0, y: 0, z: 0 };

//   public startPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };
//   public targetPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };

//   // Human Reach & Dive Limits 
//   public reachRadius: number = 1.25; 
//   public maxDiveX: number = 2.2; 
//   public maxDiveY: number = 1.8; 
//   public reactionTime: number = 0.10; 


//   // AI & State Management
//   public state: GoalkeeperState = 'standing';
//   public isDiving: boolean = false;
//   public hasReacted: boolean = false;
//   public hasSavedBall: boolean = false;
//   public diveDirection: 'left' | 'right' | 'center' = 'center';

//   public aiAccuracy: number = 0.85;

//   private reactionTimer: number = 0;
//   private diveProgress: number = 0;
//   private diveDuration: number = 0.55;
//   private peakHeight: number = 0.5;

//   private physicsEngine: PhysicsEngine; 

//   private readonly GOAL_LINE_Z: number = -10.0;
//   private readonly GOAL_MAX_Y: number = 2.44; 

//   constructor() {
//     this.physicsEngine = new PhysicsEngine(); 
//   }


// public predictShot(shotData: ShotPredictionInput): void {
//   const { ballPos, ballVel, ballSpin } = shotData;
//   if (ballVel.z >= 0) return;

//   this.startPos = { ...this.position };

//   const initialVelocityX = ballVel.x; 
//   const initialVelocityY = ballVel.y;
  
//   // 🎲 ১. কিপারের সাইড গেসিং চ্যান্স (৬০% সঠিক, ৪০% ভুল বা বিট খাওয়া)
//   const correctlyGuessedSide = Math.random() < 0.60; 

//   let chosenX = 0;
//   let chosenY = 0.9;

//   // 🎯 ২. সোজা বা মাঝখানের বলের হিসাব (কিপার সবসময় মাঝে দাঁড়াবে না)
//   if (Math.abs(initialVelocityX) < 1.2) {
//     // ২০% সময়ে সোজা শটেও কিপার সাইডে অনুমান করে লাফ দেবে (ফলে সোজা মারলেও গোল হবে!)
//     const isDeceivedByStraightShot = Math.random() < 0.20;

//     if (isDeceivedByStraightShot) {
//       // সোজা বল আসলেও কিপার ডানে বা বামে লাফ দিয়ে দেবে
//       this.diveDirection = Math.random() < 0.5 ? 'left' : 'right';
//       chosenX = (this.diveDirection === 'right' ? 1 : -1) * (1.0 + Math.random() * 0.8);
//       chosenY = 0.5 + Math.random() * 0.8;
//     } else {
//       // স্বাভাবিকভাবে সেন্টারে সেভ করার চেষ্টা
//       this.diveDirection = 'center';
//       chosenX = (Math.random() - 0.5) * 0.6; // সামান্য অফসেট
//       chosenY = 0.8 + Math.random() * 0.6;
//     }
//   } 
//   // 👉 ৩. ডানদিকের শট
//   else if (initialVelocityX > 0) {
//     if (correctlyGuessedSide) {
//       this.diveDirection = 'right';
//       chosenX = 0.8 + Math.random() * (this.maxDiveX - 0.8);
//     } else {
//       // ভুল অনুমান (Wrong-footed)
//       this.diveDirection = 'left';
//       chosenX = -(0.8 + Math.random() * 1.2);
//     }
//     chosenY = 0.4 + Math.random() * 1.2;
//   } 
//   // 👈 ৪. বামদিকের শট
//   else {
//     if (correctlyGuessedSide) {
//       this.diveDirection = 'left';
//       chosenX = -(0.8 + Math.random() * (this.maxDiveX - 0.8));
//     } else {
//       // ভুল অনুমান (Wrong-footed)
//       this.diveDirection = 'right';
//       chosenX = 0.8 + Math.random() * 1.2;
//     }
//     chosenY = 0.4 + Math.random() * 1.2;
//   }

//   // 🥅 📐 ৫. কর্নারের বল আটকানো কঠিন করা (Corner Penalty Logic)
//   // যদি কিকের গতি নির্দেশ করে বলটি টপ কর্নার বা সাইড কর্নারে যাচ্ছে:
//   const isCornerX = Math.abs(initialVelocityX) > 3.0; // সাইড কর্নার শট
//   const isTopCornerY = initialVelocityY > 2.5;         // টপ কর্নার শট

//   if (isCornerX || isTopCornerY) {
//     // কর্নারের বলে কিপারের লাফের দূরত্ব কম পড়বে (Undershoot Penalty)
//     // কিপার সর্বোচ্চ ২০-৩০% শর্ট পড়বে, ফলে কর্নারের বল সেভ করা অনেক কঠিন হবে
//     chosenX *= 0.75; 
    
//     if (isTopCornerY) {
//       chosenY = Math.min(this.GOAL_MAX_Y - 0.5, chosenY); // উঁচুতে পৌঁছাতে পারবে না
//     }
//   }

//   // 🌀 ৬. শটে অতিরিক্ত কার্ভ/স্পিন থাকলে বিট খাওয়া
//   const spinY = Math.abs(ballSpin?.y || 0);
//   if (spinY > 15) {
//     chosenX += (Math.random() - 0.5) * 1.5; 
//   }

//   // 🥅 সীমার মধ্যে রাখা
//   chosenY = Math.min(this.GOAL_MAX_Y - 0.2, Math.max(0.3, chosenY));

//   this.targetPos = {
//     x: chosenX,
//     y: chosenY,
//     z: this.GOAL_LINE_Z + 0.2
//   };

//   // ⏱️ ৭. কর্নার শটে কিপারের ডাইভিং টাইম একটু ধীরগতির করা (Unreachable feel)
//   const deltaX = Math.abs(this.targetPos.x - this.startPos.x);
//   let baseDuration = deltaX / 3.8 + 0.35;
  
//   if (isCornerX || isTopCornerY) {
//     baseDuration += 0.12; // কর্নারের বলে রিঅ্যাকশনে কিছুটা লেট হবে
//   }

//   this.diveDuration = Math.max(0.42, Math.min(0.75, baseDuration));
//   this.peakHeight = Math.max(0.1, chosenY - 0.8);

//   // ⚽ PhysicsEngine দিয়ে গতির হিসাব
//   this.velocity = this.physicsEngine.calculateKeeperVelocity(
//     this.startPos,
//     this.targetPos,
//     this.diveDuration
//   );
// }

//   public updateAI(ballPos: Vector3D, ballVel: Vector3D, dt: number): void {
//     if (this.state === 'celebrating') return;

//     if (this.state === 'lying_down') {
//       this.position.y = Math.max(0.2, this.position.y - dt * 3.0);
//       return;
//     }

//     if (ballVel.z < -1.5 && ballPos.z > this.GOAL_LINE_Z) {
//       if (!this.hasReacted) {
//         this.reactionTimer += dt;
//         if (this.reactionTimer >= this.reactionTime) {
//           this.hasReacted = true;
//           this.isDiving = true;
//           this.state = 'diving';
//           this.diveProgress = 0;
//         } else {
//           return;
//         }
//       }

//       if (this.isDiving && this.diveProgress < 1.0) {
//         this.diveProgress += dt / this.diveDuration;
//         const t = Math.min(1.0, this.diveProgress);

//         const stepResult = this.physicsEngine.stepKeeper(
//           this.position,
//           this.velocity,
//           dt,
//           0.2 
//         );

//         this.velocity = stepResult.nextVel;

//         const distanceX = this.targetPos.x - this.startPos.x;
//         this.position.x = this.startPos.x + distanceX * t;

//         const jumpArc = Math.sin(t * Math.PI) * this.peakHeight;
//         const rawY = 0.9 + jumpArc;
        
//         this.position.y = Math.min(this.GOAL_MAX_Y - 0.2, rawY);
//         this.position.z = (this.GOAL_LINE_Z + 0.2) + Math.sin(t * Math.PI) * 0.15;
//       } else if (this.diveProgress >= 1.0) {
//         this.isDiving = false;
//         this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
//       }
//     } else if (this.hasReacted && ballPos.z <= this.GOAL_LINE_Z) {
//       this.isDiving = false;
//       this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
//     }
//   }

//   /**
//    * ⚽ বল সেভ ডিটেকশন (Fix applied here for Dynamic Arm Reach)
//    */
//   public checkSave(ballPos: Vector3D, ballRadius: number = 0.2): boolean {
//     // 🧤 ১. ডাইভিং এর দিক অনুযায়ী হাতের অফসেট (Hand Offset) হিসাব করা
//     let effectiveX = this.position.x;
//     let effectiveY = this.position.y;

//     if (this.isDiving) {
//       // কিপার যখন ডানে ডাইভ দেয় হাত আরও ০.৭৫ ইউনিট ডানে বাড়িয়ে প্রসারিত হয়
//       if (this.diveDirection === 'right') {
//         effectiveX += 0.75;
//       } else if (this.diveDirection === 'left') {
//         effectiveX -= 0.75;
//       }
//     }

//     const dx = ballPos.x - effectiveX;
//     const dy = ballPos.y - effectiveY;
//     // Z-অক্ষের গতির কারণে সহনশীলতা (Tolerance Offset)
//     const dz = (ballPos.z - this.position.z) * 0.4; 

//     const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
//     const isSaved = distance <= (this.reachRadius + ballRadius);
    
//     if (isSaved) {
//       this.hasSavedBall = true;
//     }
//     return isSaved;
//   }

//   public reset(): void {
//     this.position = { x: 0, y: 0.9, z: -9.8 };
//     this.velocity = { x: 0, y: 0, z: 0 };
//     this.startPos = { x: 0, y: 0.9, z: -9.8 };
//     this.targetPos = { x: 0, y: 0.9, z: -9.8 };
//     this.isDiving = false;
//     this.hasReacted = false;
//     this.hasSavedBall = false;
//     this.reactionTimer = 0;
//     this.diveProgress = 0;
//     this.diveDirection = 'center';
//     this.state = 'standing';
//   }
// }



// // ==========================================
// // 2. FIELD PLAYER (KICKER / WALL PLAYER) CLASS
// // ==========================================

// export type PlayerRole = 'kicker' | 'wall' | 'idle';
// export type PlayerActionState = 'idle' | 'walking' | 'running' | 'kicking' | 'jumping';

// export class FieldPlayer {
//   public id: string;
//   public role: PlayerRole;
//   public position: Vector3D;
//   public targetPos: Vector3D;
//   public state: PlayerActionState = 'idle';

//   // Walk/Run Mechanics
//   public walkSpeed: number = 2.0;
//   public runSpeed: number = 4.5;
//   public walkCycle: number = 0; // Rendering এ হাত-পা নাড়ানোর জন্য

//   // Jump Mechanics (Free Kick Wall)
//   public isJumping: boolean = false;
//   private jumpProgress: number = 0;
//   private readonly jumpHeight: number = 0.55;

//   constructor(id: string, startPos: Vector3D, role: PlayerRole = 'idle') {
//     this.id = id;
//     this.role = role;
//     this.position = { ...startPos };
//     this.targetPos = { ...startPos };
//   }

//   // 🏃১. নির্দিষ্ট স্থানে হেঁটে/দৌড়ে যাওয়ার আদেশ
//   public moveTo(target: Vector3D, speedType: 'walk' | 'run' = 'walk'): void {
//     this.targetPos = { ...target };
//     this.state = speedType === 'run' ? 'running' : 'walking';
//   }

//   // 🦘 ২. লাফ দেওয়ার আদেশ (Wall Players)
//   public jump(): void {
//     if (!this.isJumping) {
//       this.isJumping = true;
//       this.state = 'jumping';
//       this.jumpProgress = 0;
//     }
//   }

//   // 🔄 ৩. প্লেয়ার আপডেট লুপ
//   public update(dt: number): void {
//     // Movement Handler
//     if (this.state === 'walking' || this.state === 'running') {
//       const dx = this.targetPos.x - this.position.x;
//       const dz = this.targetPos.z - this.position.z;
//       const distance = Math.sqrt(dx * dx + dz * dz);

//       const speed = this.state === 'running' ? this.runSpeed : this.walkSpeed;

//       if (distance > 0.05) {
//         this.position.x += (dx / distance) * speed * dt;
//         this.position.z += (dz / distance) * speed * dt;
//         this.walkCycle += dt * (this.state === 'running' ? 12.0 : 7.0);
//       } else {
//         this.position.x = this.targetPos.x;
//         this.position.z = this.targetPos.z;
//         this.state = 'idle';
//         this.walkCycle = 0;
//       }
//     }

//     // Jump Handler
//     if (this.isJumping) {
//       this.jumpProgress += dt * 3.5;
//       if (this.jumpProgress <= 1.0) {
//         this.position.y = Math.sin(this.jumpProgress * Math.PI) * this.jumpHeight;
//       } else {
//         this.position.y = 0;
//         this.isJumping = false;
//         this.state = 'idle';
//       }
//     }
//   }
// }

// // ==========================================
// // 3. DEFENSIVE WALL MANAGER CLASS
// // ==========================================

// export class WallManager {
//   public players: FieldPlayer[] = [];

//   constructor(count: number = 4) {
//     for (let i = 0; i < count; i++) {
//       this.players.push(new FieldPlayer(`wall_${i}`, { x: 0, y: 0, z: 0 }, 'wall'));
//     }
//   }

//   // 🧱 বলের অবস্থান অনুযায়ী দেওয়াল অটো-সেট করা
//   public alignWall(ballPos: Vector3D, distanceFromBall: number = 4.5): void {
//     const spacing = 0.55; 
//     const startX = -((this.players.length - 1) * spacing) / 2;
//     const wallZ = ballPos.z - distanceFromBall;

//     this.players.forEach((player, index) => {
//       const offsetX = startX + index * spacing;
//       player.position = { x: ballPos.x + offsetX, y: 0, z: wallZ };
//       player.targetPos = { ...player.position };
//     });
//   }

//   public triggerJump(): void {
//     this.players.forEach(p => p.jump());
//   }

//   public update(dt: number): void {
//     this.players.forEach(p => p.update(dt));
//   }
// }

// import { Vector3D } from './Vector3';
// import { PhysicsEngine } from './Physics'; // ⚽ PhysicsEngine Import

// // ==========================================
// // 1. GOALKEEPER TYPES & CLASS
// // ==========================================

// export interface ShotPredictionInput {
//   ballPos: Vector3D;
//   ballVel: Vector3D;
//   ballSpin?: Vector3D;
// }

// export type GoalkeeperState = 'standing' | 'diving' | 'celebrating' | 'lying_down';
// export type SwipeDirection = 'left' | 'right' | 'center';

// export class Goalkeeper {
//   public position: Vector3D = { x: 0, y: 0.9, z: -9.8 };
//   public velocity: Vector3D = { x: 0, y: 0, z: 0 };

//   public startPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };
//   public targetPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };

//   // Human Reach & Dive Limits 
//   public reachRadius: number = 1.25; 
//   public maxDiveX: number = 2.2; 
//   public maxDiveY: number = 1.8; 
//   public reactionTime: number = 0.10; 

//   // AI & State Management
//   public state: GoalkeeperState = 'standing';
//   public isDiving: boolean = false;
//   public hasReacted: boolean = false;
//   public hasSavedBall: boolean = false;
//   public diveDirection: 'left' | 'right' | 'center' = 'center';

//   public aiAccuracy: number = 0.85;

//   private reactionTimer: number = 0;
//   private diveProgress: number = 0;
//   private diveDuration: number = 0.55;
//   private peakHeight: number = 0.5;

//   private physicsEngine: PhysicsEngine; 

//   private readonly GOAL_LINE_Z: number = -10.0;
//   private readonly GOAL_MAX_Y: number = 2.44; 

//   constructor() {
//     this.physicsEngine = new PhysicsEngine(); 
//   }

//   // 🧤 ম্যানুয়াল কিপার সেভ (User Swipe Control)
//   public manualDive(direction: SwipeDirection): void {
//     if (this.isDiving || this.state === 'celebrating') return;

//     this.startPos = { ...this.position };
//     this.diveDirection = direction;
//     this.hasReacted = true;
//     this.isDiving = true;
//     this.state = 'diving';
//     this.diveProgress = 0;

//     let targetX = 0;
//     let targetY = 0.9;

//     if (direction === 'left') {
//       targetX = -(1.2 + Math.random() * (this.maxDiveX - 1.2));
//       targetY = 0.6 + Math.random() * 1.0;
//     } else if (direction === 'right') {
//       targetX = 1.2 + Math.random() * (this.maxDiveX - 1.2);
//       targetY = 0.6 + Math.random() * 1.0;
//     } else if (direction === 'center') {
//       // উপর থেকে নিচে স্বাইপ করলে সোজা দাঁড়িয়ে সেভ দেওয়া
//       targetX = (Math.random() - 0.5) * 0.4;
//       targetY = 0.9 + Math.random() * 0.4;
//     }

//     this.targetPos = {
//       x: targetX,
//       y: Math.min(this.GOAL_MAX_Y - 0.2, targetY),
//       z: this.GOAL_LINE_Z + 0.2
//     };

//     const deltaX = Math.abs(this.targetPos.x - this.startPos.x);
//     this.diveDuration = Math.max(0.40, Math.min(0.65, deltaX / 3.5 + 0.3));
//     this.peakHeight = Math.max(0.1, targetY - 0.7);

//     this.velocity = this.physicsEngine.calculateKeeperVelocity(
//       this.startPos,
//       this.targetPos,
//       this.diveDuration
//     );
//   }

//   public predictShot(shotData: ShotPredictionInput): void {
//     const { ballPos, ballVel, ballSpin } = shotData;
//     if (ballVel.z >= 0) return;

//     this.startPos = { ...this.position };

//     const initialVelocityX = ballVel.x; 
//     const initialVelocityY = ballVel.y;
    
//     // 🎲 ১. কিপারের সাইড গেসিং চ্যান্স (৬০% সঠিক, ৪০% ভুল বা বিট খাওয়া)
//     const correctlyGuessedSide = Math.random() < 0.60; 

//     let chosenX = 0;
//     let chosenY = 0.9;

//     // 🎯 ২. সোজা বা মাঝখানের বলের হিসাব (কিপার সবসময় মাঝে দাঁড়াবে না)
//     if (Math.abs(initialVelocityX) < 1.2) {
//       // ২০% সময়ে সোজা শটেও কিপার সাইডে অনুমান করে লাফ দেবে
//       const isDeceivedByStraightShot = Math.random() < 0.20;

//       if (isDeceivedByStraightShot) {
//         this.diveDirection = Math.random() < 0.5 ? 'left' : 'right';
//         chosenX = (this.diveDirection === 'right' ? 1 : -1) * (1.0 + Math.random() * 0.8);
//         chosenY = 0.5 + Math.random() * 0.8;
//       } else {
//         this.diveDirection = 'center';
//         chosenX = (Math.random() - 0.5) * 0.6; 
//         chosenY = 0.8 + Math.random() * 0.6;
//       }
//     } 
//     // 👉 ৩. ডানদিকের শট
//     else if (initialVelocityX > 0) {
//       if (correctlyGuessedSide) {
//         this.diveDirection = 'right';
//         chosenX = 0.8 + Math.random() * (this.maxDiveX - 0.8);
//       } else {
//         this.diveDirection = 'left';
//         chosenX = -(0.8 + Math.random() * 1.2);
//       }
//       chosenY = 0.4 + Math.random() * 1.2;
//     } 
//     // 👈 ৪. বামদিকের শট
//     else {
//       if (correctlyGuessedSide) {
//         this.diveDirection = 'left';
//         chosenX = -(0.8 + Math.random() * (this.maxDiveX - 0.8));
//       } else {
//         this.diveDirection = 'right';
//         chosenX = 0.8 + Math.random() * 1.2;
//       }
//       chosenY = 0.4 + Math.random() * 1.2;
//     }

//     // 🥅 📐 ৫. কর্নারের বল আটকানো কঠিন করা (Corner Penalty Logic)
//     const isCornerX = Math.abs(initialVelocityX) > 3.0; 
//     const isTopCornerY = initialVelocityY > 2.5;         

//     if (isCornerX || isTopCornerY) {
//       chosenX *= 0.75; 
      
//       if (isTopCornerY) {
//         chosenY = Math.min(this.GOAL_MAX_Y - 0.5, chosenY);
//       }
//     }

//     // 🌀 ৬. শটে অতিরিক্ত কার্ভ/স্পিন থাকলে বিট খাওয়া
//     const spinY = Math.abs(ballSpin?.y || 0);
//     if (spinY > 15) {
//       chosenX += (Math.random() - 0.5) * 1.5; 
//     }

//     // 🥅 সীমার মধ্যে রাখা
//     chosenY = Math.min(this.GOAL_MAX_Y - 0.2, Math.max(0.3, chosenY));

//     this.targetPos = {
//       x: chosenX,
//       y: chosenY,
//       z: this.GOAL_LINE_Z + 0.2
//     };

//     // ⏱️ ৭. কর্নার শটে কিপারের ডাইভিং টাইম ধীরগতির করা
//     const deltaX = Math.abs(this.targetPos.x - this.startPos.x);
//     let baseDuration = deltaX / 3.8 + 0.35;
    
//     if (isCornerX || isTopCornerY) {
//       baseDuration += 0.12; 
//     }

//     this.diveDuration = Math.max(0.42, Math.min(0.75, baseDuration));
//     this.peakHeight = Math.max(0.1, chosenY - 0.8);

//     this.velocity = this.physicsEngine.calculateKeeperVelocity(
//       this.startPos,
//       this.targetPos,
//       this.diveDuration
//     );
//   }

//   public updateAI(ballPos: Vector3D, ballVel: Vector3D, dt: number): void {
//     if (this.state === 'celebrating') return;

//     if (this.state === 'lying_down') {
//       this.position.y = Math.max(0.2, this.position.y - dt * 3.0);
//       return;
//     }

//     if (ballVel.z < -1.5 && ballPos.z > this.GOAL_LINE_Z) {
//       if (!this.hasReacted) {
//         this.reactionTimer += dt;
//         if (this.reactionTimer >= this.reactionTime) {
//           this.hasReacted = true;
//           this.isDiving = true;
//           this.state = 'diving';
//           this.diveProgress = 0;
//         } else {
//           return;
//         }
//       }

//       if (this.isDiving && this.diveProgress < 1.0) {
//         this.diveProgress += dt / this.diveDuration;
//         const t = Math.min(1.0, this.diveProgress);

//         const stepResult = this.physicsEngine.stepKeeper(
//           this.position,
//           this.velocity,
//           dt,
//           0.2 
//         );

//         this.velocity = stepResult.nextVel;

//         const distanceX = this.targetPos.x - this.startPos.x;
//         this.position.x = this.startPos.x + distanceX * t;

//         const jumpArc = Math.sin(t * Math.PI) * this.peakHeight;
//         const rawY = 0.9 + jumpArc;
        
//         this.position.y = Math.min(this.GOAL_MAX_Y - 0.2, rawY);
//         this.position.z = (this.GOAL_LINE_Z + 0.2) + Math.sin(t * Math.PI) * 0.15;
//       } else if (this.diveProgress >= 1.0) {
//         this.isDiving = false;
//         this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
//       }
//     } else if (this.hasReacted && ballPos.z <= this.GOAL_LINE_Z) {
//       this.isDiving = false;
//       this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
//     }
//   }

//   /**
//    * ⚽ বল সেভ ডিটেকশন
//    */
//   public checkSave(ballPos: Vector3D, ballRadius: number = 0.2): boolean {
//     let effectiveX = this.position.x;
//     let effectiveY = this.position.y;

//     if (this.isDiving) {
//       if (this.diveDirection === 'right') {
//         effectiveX += 0.75;
//       } else if (this.diveDirection === 'left') {
//         effectiveX -= 0.75;
//       }
//     }

//     const dx = ballPos.x - effectiveX;
//     const dy = ballPos.y - effectiveY;
//     const dz = (ballPos.z - this.position.z) * 0.4; 

//     const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
//     const isSaved = distance <= (this.reachRadius + ballRadius);
    
//     if (isSaved) {
//       this.hasSavedBall = true;
//     }
//     return isSaved;
//   }

//   public reset(): void {
//     this.position = { x: 0, y: 0.9, z: -9.8 };
//     this.velocity = { x: 0, y: 0, z: 0 };
//     this.startPos = { x: 0, y: 0.9, z: -9.8 };
//     this.targetPos = { x: 0, y: 0.9, z: -9.8 };
//     this.isDiving = false;
//     this.hasReacted = false;
//     this.hasSavedBall = false;
//     this.reactionTimer = 0;
//     this.diveProgress = 0;
//     this.diveDirection = 'center';
//     this.state = 'standing';
//   }
// }

// // ==========================================
// // 2. FIELD PLAYER (KICKER / WALL PLAYER) CLASS
// // ==========================================

// export type PlayerRole = 'kicker' | 'wall' | 'idle';
// export type PlayerActionState = 'idle' | 'walking' | 'running' | 'kicking' | 'jumping';

// export interface AIShotResult {
//   velocity: Vector3D;
//   spin: Vector3D;
// }

// export class FieldPlayer {
//   public id: string;
//   public role: PlayerRole;
//   public position: Vector3D;
//   public targetPos: Vector3D;
//   public state: PlayerActionState = 'idle';

//   // Walk/Run Mechanics
//   public walkSpeed: number = 2.0;
//   public runSpeed: number = 4.5;
//   public walkCycle: number = 0;

//   // Jump Mechanics (Free Kick Wall)
//   public isJumping: boolean = false;
//   private jumpProgress: number = 0;
//   private readonly jumpHeight: number = 0.55;

//   constructor(id: string, startPos: Vector3D, role: PlayerRole = 'idle') {
//     this.id = id;
//     this.role = role;
//     this.position = { ...startPos };
//     this.targetPos = { ...startPos };
//   }

//   // ⚽ ৩. প্লেয়ার AI শর্ট লজিক (AI Kicker Generates Shot Vector)
//   public generateAIShot(): AIShotResult {
//     this.state = 'kicking';

//     // ১. র‍্যান্ডম শট টাইপ নির্বাচন
//     const shotType = Math.random();
    
//     let velX = 0;
//     let velY = 0;
//     let velZ = -(18 + Math.random() * 8); // পিছনের দিকে পাওয়ারফুল শট Speed (Z Axis)
//     let spinY = 0;

//     if (shotType < 0.35) {
//       // 📐 Top/Bottom Side Corners (কঠিন শট)
//       const isRight = Math.random() > 0.5;
//       velX = isRight ? (3.0 + Math.random() * 1.5) : -(3.0 + Math.random() * 1.5);
//       velY = 1.5 + Math.random() * 2.0; // উঁচুতে
//     } else if (shotType < 0.70) {
//       // 🌀 Curved / Spin Shot (বাঁকানো শট)
//       const isRightCurve = Math.random() > 0.5;
//       velX = isRightCurve ? 1.8 : -1.8;
//       velY = 1.2 + Math.random() * 1.0;
//       spinY = isRightCurve ? -20 : 20; // কার্ভ স্পিন
//     } else {
//       // 🎯 Straight Power Shot (সোজা বা হালকা অ্যাঙ্গেলের বল)
//       velX = (Math.random() - 0.5) * 1.8;
//       velY = 0.8 + Math.random() * 1.2;
//     }

//     return {
//       velocity: { x: velX, y: velY, z: velZ },
//       spin: { x: 0, y: spinY, z: 0 }
//     };
//   }

//   // 🏃 ১. নির্দিষ্ট স্থানে হেঁটে/দৌড়ে যাওয়ার আদেশ
//   public moveTo(target: Vector3D, speedType: 'walk' | 'run' = 'walk'): void {
//     this.targetPos = { ...target };
//     this.state = speedType === 'run' ? 'running' : 'walking';
//   }

//   // 🦘 ২. লাফ দেওয়ার আদেশ (Wall Players)
//   public jump(): void {
//     if (!this.isJumping) {
//       this.isJumping = true;
//       this.state = 'jumping';
//       this.jumpProgress = 0;
//     }
//   }

//   // 🔄 ৩. প্লেয়ার আপডেট লুপ
//   public update(dt: number): void {
//     // Movement Handler
//     if (this.state === 'walking' || this.state === 'running') {
//       const dx = this.targetPos.x - this.position.x;
//       const dz = this.targetPos.z - this.position.z;
//       const distance = Math.sqrt(dx * dx + dz * dz);

//       const speed = this.state === 'running' ? this.runSpeed : this.walkSpeed;

//       if (distance > 0.05) {
//         this.position.x += (dx / distance) * speed * dt;
//         this.position.z += (dz / distance) * speed * dt;
//         this.walkCycle += dt * (this.state === 'running' ? 12.0 : 7.0);
//       } else {
//         this.position.x = this.targetPos.x;
//         this.position.z = this.targetPos.z;
//         this.state = 'idle';
//         this.walkCycle = 0;
//       }
//     }

//     // Jump Handler
//     if (this.isJumping) {
//       this.jumpProgress += dt * 3.5;
//       if (this.jumpProgress <= 1.0) {
//         this.position.y = Math.sin(this.jumpProgress * Math.PI) * this.jumpHeight;
//       } else {
//         this.position.y = 0;
//         this.isJumping = false;
//         this.state = 'idle';
//       }
//     }
//   }
// }

// // ==========================================
// // 3. DEFENSIVE WALL MANAGER CLASS
// // ==========================================

// export class WallManager {
//   public players: FieldPlayer[] = [];

//   constructor(count: number = 4) {
//     for (let i = 0; i < count; i++) {
//       this.players.push(new FieldPlayer(`wall_${i}`, { x: 0, y: 0, z: 0 }, 'wall'));
//     }
//   }

//   // 🧱 বলের অবস্থান অনুযায়ী দেওয়াল অটো-সেট করা
//   public alignWall(ballPos: Vector3D, distanceFromBall: number = 4.5): void {
//     const spacing = 0.55; 
//     const startX = -((this.players.length - 1) * spacing) / 2;
//     const wallZ = ballPos.z - distanceFromBall;

//     this.players.forEach((player, index) => {
//       const offsetX = startX + index * spacing;
//       player.position = { x: ballPos.x + offsetX, y: 0, z: wallZ };
//       player.targetPos = { ...player.position };
//     });
//   }

//   public triggerJump(): void {
//     this.players.forEach(p => p.jump());
//   }

//   public update(dt: number): void {
//     this.players.forEach(p => p.update(dt));
//   }
// }

import { Vector3D } from './Vector3';
import { PhysicsEngine } from './Physics';

// ==========================================
// 1. GOALKEEPER TYPES & CLASS
// ==========================================

export interface ShotPredictionInput {
  ballPos: Vector3D;
  ballVel: Vector3D;
  ballSpin?: Vector3D;
}

export type GoalkeeperState = 'standing' | 'diving' | 'celebrating' | 'lying_down';
export type SwipeDirection = 'left' | 'right' | 'center';

export class Goalkeeper {
  public position: Vector3D = { x: 0, y: 0.9, z: -9.8 };
  public velocity: Vector3D = { x: 0, y: 0, z: 0 };

  public startPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };
  public targetPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };

  // Human Reach & Dive Limits 
  public reachRadius: number = 1.25; 
  public maxDiveX: number = 2.2; 
  public maxDiveY: number = 1.8; 
  public reactionTime: number = 0.10; 

  // AI & State Management
  public state: GoalkeeperState = 'standing';
  public isDiving: boolean = false;
  public hasReacted: boolean = false;
  public hasSavedBall: boolean = false;
  public diveDirection: 'left' | 'right' | 'center' = 'center';

  public aiAccuracy: number = 0.85;

  private reactionTimer: number = 0;
  private diveProgress: number = 0;
  private diveDuration: number = 0.55;
  private peakHeight: number = 0.5;

  private physicsEngine: PhysicsEngine; 

  private readonly GOAL_LINE_Z: number = -10.0;
  private readonly GOAL_MAX_Y: number = 2.44; 

  constructor() {
    this.physicsEngine = new PhysicsEngine(); 
  }

  // 🧤 ম্যানুয়াল কিপার সেভ (User Swipe Control)
  public manualDive(direction: SwipeDirection): void {
    if (this.isDiving || this.state === 'celebrating') return;

    this.startPos = { ...this.position };
    this.diveDirection = direction;
    this.hasReacted = true;
    this.isDiving = true;
    this.state = 'diving';
    this.diveProgress = 0;

    let targetX = 0;
    let targetY = 0.9;

    if (direction === 'left') {
      targetX = -(1.2 + Math.random() * (this.maxDiveX - 1.2));
      targetY = 0.6 + Math.random() * 1.0;
    } else if (direction === 'right') {
      targetX = 1.2 + Math.random() * (this.maxDiveX - 1.2);
      targetY = 0.6 + Math.random() * 1.0;
    } else if (direction === 'center') {
      targetX = (Math.random() - 0.5) * 0.4;
      targetY = 0.9 + Math.random() * 0.4;
    }

    this.targetPos = {
      x: targetX,
      y: Math.min(this.GOAL_MAX_Y - 0.2, targetY),
      z: this.GOAL_LINE_Z + 0.2
    };

    const deltaX = Math.abs(this.targetPos.x - this.startPos.x);
    this.diveDuration = Math.max(0.40, Math.min(0.65, deltaX / 3.5 + 0.3));
    this.peakHeight = Math.max(0.1, targetY - 0.7);

    this.velocity = this.physicsEngine.calculateKeeperVelocity(
      this.startPos,
      this.targetPos,
      this.diveDuration
    );
  }

  public predictShot(shotData: ShotPredictionInput): void {
    const { ballPos, ballVel, ballSpin } = shotData;
    if (ballVel.z >= 0) return;

    this.startPos = { ...this.position };

    const initialVelocityX = ballVel.x; 
    const initialVelocityY = ballVel.y;
    
    const correctlyGuessedSide = Math.random() < 0.60; 

    let chosenX = 0;
    let chosenY = 0.9;

    if (Math.abs(initialVelocityX) < 1.2) {
      const isDeceivedByStraightShot = Math.random() < 0.20;

      if (isDeceivedByStraightShot) {
        this.diveDirection = Math.random() < 0.5 ? 'left' : 'right';
        chosenX = (this.diveDirection === 'right' ? 1 : -1) * (1.0 + Math.random() * 0.8);
        chosenY = 0.5 + Math.random() * 0.8;
      } else {
        this.diveDirection = 'center';
        chosenX = (Math.random() - 0.5) * 0.6; 
        chosenY = 0.8 + Math.random() * 0.6;
      }
    } 
    else if (initialVelocityX > 0) {
      if (correctlyGuessedSide) {
        this.diveDirection = 'right';
        chosenX = 0.8 + Math.random() * (this.maxDiveX - 0.8);
      } else {
        this.diveDirection = 'left';
        chosenX = -(0.8 + Math.random() * 1.2);
      }
      chosenY = 0.4 + Math.random() * 1.2;
    } 
    else {
      if (correctlyGuessedSide) {
        this.diveDirection = 'left';
        chosenX = -(0.8 + Math.random() * (this.maxDiveX - 0.8));
      } else {
        this.diveDirection = 'right';
        chosenX = 0.8 + Math.random() * 1.2;
      }
      chosenY = 0.4 + Math.random() * 1.2;
    }

    const isCornerX = Math.abs(initialVelocityX) > 3.0; 
    const isTopCornerY = initialVelocityY > 2.5;         

    if (isCornerX || isTopCornerY) {
      chosenX *= 0.75; 
      if (isTopCornerY) {
        chosenY = Math.min(this.GOAL_MAX_Y - 0.5, chosenY);
      }
    }

    const spinY = Math.abs(ballSpin?.y || 0);
    if (spinY > 15) {
      chosenX += (Math.random() - 0.5) * 1.5; 
    }

    chosenY = Math.min(this.GOAL_MAX_Y - 0.2, Math.max(0.3, chosenY));

    this.targetPos = {
      x: chosenX,
      y: chosenY,
      z: this.GOAL_LINE_Z + 0.2
    };

    const deltaX = Math.abs(this.targetPos.x - this.startPos.x);
    let baseDuration = deltaX / 3.8 + 0.35;
    
    if (isCornerX || isTopCornerY) {
      baseDuration += 0.12; 
    }

    this.diveDuration = Math.max(0.42, Math.min(0.75, baseDuration));
    this.peakHeight = Math.max(0.1, chosenY - 0.8);

    this.velocity = this.physicsEngine.calculateKeeperVelocity(
      this.startPos,
      this.targetPos,
      this.diveDuration
    );
  }

  // 🔄 সার্বজনীন পজিশন ও ডাইভ আপডেট হ্যান্ডলার (কিপার মোড ও AI উভয়ের জন্য)
  public update(dt: number): void {
    if (this.state === 'celebrating') return;

    if (this.state === 'lying_down') {
      this.position.y = Math.max(0.2, this.position.y - dt * 3.0);
      return;
    }

    if (this.isDiving && this.diveProgress < 1.0) {
      this.diveProgress += dt / this.diveDuration;
      const t = Math.min(1.0, this.diveProgress);

      const stepResult = this.physicsEngine.stepKeeper(
        this.position,
        this.velocity,
        dt,
        0.2 
      );

      this.velocity = stepResult.nextVel;

      const distanceX = this.targetPos.x - this.startPos.x;
      this.position.x = this.startPos.x + distanceX * t;

      const jumpArc = Math.sin(t * Math.PI) * this.peakHeight;
      const rawY = 0.9 + jumpArc;
      
      this.position.y = Math.min(this.GOAL_MAX_Y - 0.2, rawY);
      this.position.z = (this.GOAL_LINE_Z + 0.2) + Math.sin(t * Math.PI) * 0.15;
    } else if (this.diveProgress >= 1.0 && this.isDiving) {
      this.isDiving = false;
      this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
    }
  }

  // 🤖 AI Keeper Specific Update Loop
  public updateAI(ballPos: Vector3D, ballVel: Vector3D, dt: number): void {
    if (this.state === 'celebrating' || this.state === 'lying_down') {
      this.update(dt);
      return;
    }

    if (ballVel.z < -1.5 && ballPos.z > this.GOAL_LINE_Z) {
      if (!this.hasReacted) {
        this.reactionTimer += dt;
        if (this.reactionTimer >= this.reactionTime) {
          this.hasReacted = true;
          this.isDiving = true;
          this.state = 'diving';
          this.diveProgress = 0;
        } else {
          return;
        }
      }
    }

    this.update(dt);
  }

  /**
   * ⚽ বল সেভ ডিটেকশন
   */
  public checkSave(ballPos: Vector3D, ballRadius: number = 0.2): boolean {
    let effectiveX = this.position.x;
    let effectiveY = this.position.y;

    if (this.isDiving) {
      if (this.diveDirection === 'right') {
        effectiveX += 0.75;
      } else if (this.diveDirection === 'left') {
        effectiveX -= 0.75;
      }
    }

    const dx = ballPos.x - effectiveX;
    const dy = ballPos.y - effectiveY;
    const dz = (ballPos.z - this.position.z) * 0.4; 

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    const isSaved = distance <= (this.reachRadius + ballRadius);
    
    if (isSaved) {
      this.hasSavedBall = true;
    }
    return isSaved;
  }

  public reset(): void {
    this.position = { x: 0, y: 0.9, z: -9.8 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.startPos = { x: 0, y: 0.9, z: -9.8 };
    this.targetPos = { x: 0, y: 0.9, z: -9.8 };
    this.isDiving = false;
    this.hasReacted = false;
    this.hasSavedBall = false;
    this.reactionTimer = 0;
    this.diveProgress = 0;
    this.diveDirection = 'center';
    this.state = 'standing';
  }
}

// ==========================================
// 2. FIELD PLAYER & WALL MANAGER (Same as before)
// ==========================================

export type PlayerRole = 'kicker' | 'wall' | 'idle';
export type PlayerActionState = 'idle' | 'walking' | 'running' | 'kicking' | 'jumping';

export interface AIShotResult {
  velocity: Vector3D;
  spin: Vector3D;
}

export class FieldPlayer {
  public id: string;
  public role: PlayerRole;
  public position: Vector3D;
  public targetPos: Vector3D;
  public state: PlayerActionState = 'idle';

  public walkSpeed: number = 2.0;
  public runSpeed: number = 4.5;
  public walkCycle: number = 0;

  public isJumping: boolean = false;
  private jumpProgress: number = 0;
  private readonly jumpHeight: number = 0.55;

  constructor(id: string, startPos: Vector3D, role: PlayerRole = 'idle') {
    this.id = id;
    this.role = role;
    this.position = { ...startPos };
    this.targetPos = { ...startPos };
  }

  public generateAIShot(): AIShotResult & { vx: number; vy: number; vz: number; spinY: number } {
    console.log(`Player ${this.id} is generating HIGH-ENERGY AI shot...`);
    this.state = 'kicking';

    const shotType = Math.random();
    
    let velX = 0;
    let velY = 0;
    // ⚡ পাওয়ার বাড়ানোর জন্য Base Speed -22 থেকে -32 পর্যন্ত বাড়ানো হয়েছে
    let velZ = -(22 + Math.random() * 10); 
    let spinY = 0;

    if (shotType < 0.35) {
      // 🎯 corner shot (ডানে বা বামে তীব্র কোনাকুনি শট)
      const isRight = Math.random() > 0.5;
      velX = isRight ? (4.5 + Math.random() * 2.0) : -(4.5 + Math.random() * 2.0);
      velY = 2.0 + Math.random() * 2.5; // একটু উঁচুতে যাবে
    } else if (shotType < 0.70) {
      // 🌀 Curve Shot (ইন-সুইঙ্গার / আউট-সুইঙ্গার বাঁকানো শট)
      const isRightCurve = Math.random() > 0.5;
      velX = isRightCurve ? 2.5 : -2.5;
      velY = 1.8 + Math.random() * 1.5;
      // স্পিন বাড়িয়ে ৩৫-৪৫ করা হলো যাতে চোখে পড়ার মতো বাঁক নেয়
      spinY = isRightCurve ? -35 : 35; 
    } else {
      // 🚀 Top-Corner Power Strike (পাওয়ারফুল হাই শট)
      velX = (Math.random() - 0.5) * 3.0;
      velY = 2.5 + Math.random() * 2.0;
      velZ = -(26 + Math.random() * 8); // এক্সট্রা স্পিড
    }

    // 🛡️ সব ধরণের ইঞ্জিনের সাথে সামঞ্জস্য রাখার জন্য flat প্রপার্টি (vx, vy, vz) এবং nested অবজেক্ট দুটিই রিটার্ন করা হলো
    return {
      velocity: { x: velX, y: velY, z: velZ },
      spin: { x: 0, y: spinY, z: 0 },
      vx: velX,
      vy: velY,
      vz: velZ,
      spinY: spinY
    } as any;
  }

  public moveTo(target: Vector3D, speedType: 'walk' | 'run' = 'walk'): void {
    this.targetPos = { ...target };
    this.state = speedType === 'run' ? 'running' : 'walking';
  }

  public jump(): void {
    if (!this.isJumping) {
      this.isJumping = true;
      this.state = 'jumping';
      this.jumpProgress = 0;
    }
  }

  public update(dt: number): void {
    if (this.state === 'walking' || this.state === 'running') {
      const dx = this.targetPos.x - this.position.x;
      const dz = this.targetPos.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      const speed = this.state === 'running' ? this.runSpeed : this.walkSpeed;

      if (distance > 0.05) {
        this.position.x += (dx / distance) * speed * dt;
        this.position.z += (dz / distance) * speed * dt;
        this.walkCycle += dt * (this.state === 'running' ? 12.0 : 7.0);
      } else {
        this.position.x = this.targetPos.x;
        this.position.z = this.targetPos.z;
        this.state = 'idle';
        this.walkCycle = 0;
      }
    }

    if (this.isJumping) {
      this.jumpProgress += dt * 3.5;
      if (this.jumpProgress <= 1.0) {
        this.position.y = Math.sin(this.jumpProgress * Math.PI) * this.jumpHeight;
      } else {
        this.position.y = 0;
        this.isJumping = false;
        this.state = 'idle';
      }
    }
  }
}

export class WallManager {
  public players: FieldPlayer[] = [];

  constructor(count: number = 4) {
    for (let i = 0; i < count; i++) {
      this.players.push(new FieldPlayer(`wall_${i}`, { x: 0, y: 0, z: 0 }, 'wall'));
    }
  }

  public alignWall(ballPos: Vector3D, distanceFromBall: number = 4.5): void {
    const spacing = 0.55; 
    const startX = -((this.players.length - 1) * spacing) / 2;
    const wallZ = ballPos.z - distanceFromBall;

    this.players.forEach((player, index) => {
      const offsetX = startX + index * spacing;
      player.position = { x: ballPos.x + offsetX, y: 0, z: wallZ };
      player.targetPos = { ...player.position };
    });
  }

  public triggerJump(): void {
    this.players.forEach(p => p.jump());
  }

  public update(dt: number): void {
    this.players.forEach(p => p.update(dt));
  }
}