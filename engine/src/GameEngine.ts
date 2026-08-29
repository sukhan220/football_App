

// engine/src/GameEngine.ts
import { PhysicsEngine } from './core/Physics';
import { Ball } from './core/Ball';
import { Goalkeeper } from './core/Player';
import { MatchManager } from './core/Match';
import { ReplaySystem } from './core/Replay';
import { Vector3D } from './core/Vector3';
import { InputParser, SwipeData } from './core/InputParser';
import { EventSystem } from './core/EventSystem';
import { CameraManager, CameraMode, CameraState } from './core/CameraManager'; // 📸 ক্যামেরা সিস্টেম ইমপোর্ট

export type EngineCallback = (state: {
  ballPos: Vector3D;
  keeperPos: Vector3D;
  cameraState: CameraState; // 📸 ক্যামেরার স্টেট সাবস্ক্রাইবারদের পাঠানো হবে
  score: number;
  shotsLeft: number;
  isGameOver: boolean;
}) => void;

export class GameEngine {
  public physics = new PhysicsEngine();
  public ball = new Ball();
  public keeper = new Goalkeeper();
  public match = new MatchManager();
  public replay = new ReplaySystem();
  public events = new EventSystem();
  public camera = new CameraManager('SHOOTER'); // 📸 ১. ক্যামেরা সিস্টেম ইন্টিগ্রেশন

  private subscribers: EngineCallback[] = [];

  /**
   * ম্যানুয়ালি বা বাহ্যিক উৎস থেকে ক্যামেরা মোড পরিবর্তন করার জন্য
   */
  public setCameraMode(mode: CameraMode): void {
    this.camera.setMode(mode);
    this.events.emit('ON_CAMERA_CHANGE', { mode });
  }

  // ১. সরাসরি Swipe Data দিয়ে Kick করার জন্য প্রফেশনাল মেথড
  public kickWithSwipe(swipe: SwipeData): void {
    if (this.match.isGameOver) return;

    // শট শুরু হওয়ার সাথে সাথে নিশ্চিতভাবে SHOOTER ক্যামেরা মোড চালু করা
    this.setCameraMode('SHOOTER');

    // InputParser ব্যবহার করে ভেলোসিটি ও স্পিন বের করা
    const { velocity, spin } = InputParser.parseSwipe(swipe);
    
    this.ball.velocity = velocity;
    
    this.events.emit('ON_KICK', { velocity, spin });

    // Goalkeeper AI Prediction
    this.keeper.predictShot({
      ballPos: this.ball.position,
      ballVel: velocity,
      ballSpin: spin
    });

    this.replay.clear();
  }

  // ২. পুরনো মেথড ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য রাখা হলো
  public kick(deltaX: number, deltaY: number, duration: number): void {
    this.kickWithSwipe({
      startX: 0,
      startY: 0,
      endX: deltaX,
      endY: -deltaY, // Canvas vs Physics Y Direction Normalization
      duration
    });
  }

  public update(dt: number): void {
    // 📸 ২. ক্যামেরার অ্যানিমেশন ও ম্যাথ আপডেট করা
    const cameraState = this.camera.update(dt, this.ball.position);

    // 1. Replay Playback Mode
    if (this.replay.isPlaying) {
      const replayPos = this.replay.getNextFrame();
      if (replayPos) {
        this.ball.position = replayPos;
      } else {
        // রিপ্লে শেষ হলে সাধারণ ক্যামেরায় ফেরত
        this.setCameraMode('SHOOTER');
      }
      this.notify(cameraState);
      return;
    }

    // 2. Normal Dynamic Movement Physics
    if (this.ball.velocity.z !== 0) {
      const { nextPos, nextVel } = this.physics.step(this.ball.position, this.ball.velocity, dt);
      this.ball.position = nextPos;
      this.ball.velocity = nextVel;

      // 🚀 Goalkeeper AI Update
      this.keeper.updateAI(this.ball.position, this.ball.velocity, dt);
      
      this.replay.record(this.ball.position);

      // Goal Check on Goal Line Pass (Z <= -14)
      if (this.ball.position.z <= -14) {
        const result = this.match.evaluateShot(this.ball.position);
        this.ball.velocity = { x: 0, y: 0, z: 0 }; // Stop Motion

        // 🚀 Event Triggers for Renderer / Sound Manager
        if (result.isGoal) {
          this.events.emit('ON_GOAL', { score: this.match.score });
        } else {
          this.events.emit('ON_MISS');
        }

        if (this.match.isGameOver) {
          this.events.emit('ON_GAME_OVER', { finalScore: this.match.score });
        } else {
          // 📸 শট শেষ হলে অটোমেটিক রিপ্লে মোড চালু করে মুভিং ক্যামেরা শুরু করা
          this.setCameraMode('REPLAY');
          this.replay.start();
        }
      }
    }

    this.notify(cameraState);
  }

  // 🔄 Reset Round for Next Shot
  public resetShot(): void {
    this.ball.reset();
    this.keeper.reset();
    this.setCameraMode('SHOOTER'); // 📸 পরবর্তী শটের জন্য ক্যামেরা রিসেট
  }

  public subscribe(fn: EngineCallback): void {
    this.subscribers.push(fn);
  }

  private notify(cameraState: CameraState): void {
    this.subscribers.forEach((fn) =>
      fn({
        ballPos: this.ball.position,
        keeperPos: this.keeper.position,
        cameraState: cameraState, // 📸 ক্যানভাসে দেওয়ার জন্য প্রসেস করা ক্যামেরা ডাটা
        score: this.match.score,
        shotsLeft: this.match.shotsLeft,
        isGameOver: this.match.isGameOver
      })
    );
  }
}