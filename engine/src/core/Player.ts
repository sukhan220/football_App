

import { Vector3D } from './Vector3';

export interface ShotPredictionInput {
  ballPos: Vector3D;
  ballVel: Vector3D;
  ballSpin?: Vector3D;
}

export type GoalkeeperState = 'standing' | 'diving' | 'celebrating' | 'lying_down';

export class Goalkeeper {
  public position: Vector3D = { x: 0, y: 0.9, z: -9.8 };
  public velocity: Vector3D = { x: 0, y: 0, z: 0 };

  public startPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };
  public targetPos: Vector3D = { x: 0, y: 0.9, z: -9.8 };

  // Human Reach & Dive Limits 
  public reachRadius: number = 0.85;
  public maxDiveX: number = 2.2; // সর্বোচ্চ কতদূর পাশে লাফাবে
  public maxDiveY: number = 1.8; // সর্বোচ্চ কত উঁচুতে লাফাবে
  public reactionTime: number = 0.10; // রিঅ্যাকশন টাইম

  // AI & State Management
  public state: GoalkeeperState = 'standing';
  public isDiving: boolean = false;
  public hasReacted: boolean = false;
  public hasSavedBall: boolean = false;
  public diveDirection: 'left' | 'right' | 'center' = 'center';

  private reactionTimer: number = 0;
  private diveProgress: number = 0;
  private diveDuration: number = 0.55;
  private peakHeight: number = 0.5;

  private readonly GOAL_LINE_Z: number = -10.0;
  private readonly GOAL_MAX_Y: number = 2.44; // 🥅 গোলপোস্টের উচ্চতা

  /**
   * 🧠 AI সিদ্ধান্ত মেথড: 
   * বল ট্রেক করবে না! কিপার নিজ থেকে একটা অনুমান (Guess/Prediction) করে ডাইভ দেবে।
   */
  public predictShot(shotData: ShotPredictionInput): void {
    const { ballVel } = shotData;
    if (ballVel.z >= 0) return; // বল ব্যাকওয়ার্ড গেলে কাজ করবে না

    this.startPos = { ...this.position };

    // 🎲 ১. কিপার সিদ্ধান্ত নেবে সে কোন দিকে লাফ দেবে (র্যান্ডম বা সম্ভাবনাভিত্তিক)
    // ৫০% চান্স শটের দিকে যাওয়ার, ৫০% চান্স অন্য ভুল দিকে ডাইভ দেওয়ার/অপেক্ষা করার
    const randomChoice = Math.random();
    
    let chosenX = 0;
    let chosenY = 0.9;

    if (randomChoice < 0.4) {
      // 👈 বামে ডাইভ দেওয়ার সিদ্ধান্ত
      this.diveDirection = 'left';
      chosenX = -(0.8 + Math.random() * (this.maxDiveX - 0.8));
      chosenY = 0.4 + Math.random() * (this.maxDiveY - 0.4);
    } else if (randomChoice < 0.8) {
      // 👉 ডানে ডাইভ দেওয়ার সিদ্ধান্ত
      this.diveDirection = 'right';
      chosenX = 0.8 + Math.random() * (this.maxDiveX - 0.8);
      chosenY = 0.4 + Math.random() * (this.maxDiveY - 0.4);
    } else {
      // 🧍 মাঝে থাকার সিদ্ধান্ত
      this.diveDirection = 'center';
      chosenX = (Math.random() - 0.5) * 0.8;
      chosenY = 0.9 + Math.random() * 0.5;
    }

    // 🚫 সর্বোচ্চ ক্লিপিং চেক (পোস্টের ওপরে বা অতিরিক্ত উঁচুতে যেন না যায়)
    chosenY = Math.min(this.GOAL_MAX_Y - 0.2, chosenY);

    this.targetPos = {
      x: chosenX,
      y: chosenY,
      z: this.GOAL_LINE_Z + 0.2
    };

    // ডাইভিং সময় এবং উচ্চতার বক্ররেখা (Arc) সেটআপ
    const deltaX = Math.abs(this.targetPos.x - this.startPos.x);
    this.diveDuration = Math.max(0.4, Math.min(0.65, deltaX / 3.5 + 0.35));
    this.peakHeight = Math.max(0.1, chosenY - 0.9);
  }

  public updateAI(ballPos: Vector3D, ballVel: Vector3D, dt: number): void {
    if (this.state === 'celebrating') return;

    // 🛌 মাটিতে পড়ে যাওয়ার লজিক
    if (this.state === 'lying_down') {
      this.position.y = Math.max(0.2, this.position.y - dt * 3.0);
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

      // 🏃 ডাইভিং অ্যানিমেশন মুভমেন্ট
      if (this.isDiving && this.diveProgress < 1.0) {
        this.diveProgress += dt / this.diveDuration;
        const t = Math.min(1.0, this.diveProgress);

        // X অক্ষ বরাবর মুভমেন্ট (সিদ্ধান্ত অনুযায়ী)
        const distanceX = this.targetPos.x - this.startPos.x;
        this.position.x = this.startPos.x + distanceX * t;

        // Y অক্ষের প্যারাবোলিক লাফের কার্ভ (Jump Arc)
        const jumpArc = Math.sin(t * Math.PI) * this.peakHeight;
        const rawY = 0.9 + jumpArc;
        
        // 🚨 পোস্টের উপরে ওঠার রোধ
        this.position.y = Math.min(this.GOAL_MAX_Y - 0.2, rawY);
        this.position.z = (this.GOAL_LINE_Z + 0.2) + Math.sin(t * Math.PI) * 0.15;
      } else if (this.diveProgress >= 1.0) {
        // ডাইভ শেষ হলে মাটিতে পড়বে
        this.isDiving = false;
        this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
      }
    } else if (this.hasReacted && ballPos.z <= this.GOAL_LINE_Z) {
      this.isDiving = false;
      this.state = this.hasSavedBall ? 'celebrating' : 'lying_down';
    }
  }

  /**
   * ⚽ বল সেভ ডিটেকশন:
   * কিপার যে জায়গায় ডাইভ দিয়েছে, বল যদি কাকতালীয়ভাবে সেই রিচ জোনের (Reach Radius) মধ্যে দিয়ে যায় তবেই সেভ হবে।
   */
  public checkSave(ballPos: Vector3D, ballRadius: number = 0.2): boolean {
    const dx = ballPos.x - this.position.x;
    const dy = ballPos.y - this.position.y;
    const dz = ballPos.z - this.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const isSaved = distance <= (this.reachRadius + ballRadius);
    
    if (isSaved) {
      this.hasSavedBall = true;
    }
    return isSaved;
  }

  public reset(): void {
    this.position = { x: 0, y: 0.9, z: -9.8 };
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