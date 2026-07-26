// packages/engine/src/GameEngine.ts
import { PhysicsEngine } from './core/Physics';
import { Ball } from './core/Ball';
import { Goalkeeper } from './core/Player';
import { MatchManager } from './core/Match';
import { ReplaySystem } from './core/Replay';
import { Vector3D } from './core/Vector3';
import { InputParser, SwipeData } from './core/InputParser';
import { EventSystem } from './core/EventSystem';

export type EngineCallback = (state: {
  ballPos: Vector3D;
  keeperPos: Vector3D;
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
  public events = new EventSystem(); // 🚀 New Event System Integration

  private subscribers: EngineCallback[] = [];

  // ১. সরাসরি Swipe Data দিয়ে Kick করার জন্য প্রফেশনাল মেথড
  public kickWithSwipe(swipe: SwipeData): void {
    if (this.match.isGameOver) return;

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

  // ২. পুরনো মেথড ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য রাখা হলো
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
    // 1. Replay Playback Mode
    if (this.replay.isPlaying) {
      const replayPos = this.replay.getNextFrame();
      if (replayPos) {
        this.ball.position = replayPos;
      }
      this.notify();
      return;
    }

    // 2. Normal Dynamic Movement Physics
    if (this.ball.velocity.z !== 0) {
      const { nextPos, nextVel } = this.physics.step(this.ball.position, this.ball.velocity, dt);
      this.ball.position = nextPos;
      this.ball.velocity = nextVel;

      // 🚀 Goalkeeper AI Update (Fixed Arguments Here)
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
        }
      }
    }

    this.notify();
  }

  // 🔄 Reset Round for Next Shot
  public resetShot(): void {
    this.ball.reset();
    this.keeper.reset();
  }

  public subscribe(fn: EngineCallback): void {
    this.subscribers.push(fn);
  }

  private notify(): void {
    this.subscribers.forEach((fn) =>
      fn({
        ballPos: this.ball.position,
        keeperPos: this.keeper.position,
        score: this.match.score,
        shotsLeft: this.match.shotsLeft,
        isGameOver: this.match.isGameOver
      })
    );
  }
}