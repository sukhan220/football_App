import { Vector3D, Vector3Utils } from './Vector3';

export interface SwipeData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number; // সেকেন্ডে (e.g., 0.2s)
}

export interface ShotResult {
  velocity: Vector3D;
  spin: Vector3D; // Magnus Effect-এর জন্য স্পিন ভেক্টর
}

export class InputParser {
  private static maxSpeed = 35; // ম্যাক্সিমাম বল স্পিড (m/s)

  public static parseSwipe(swipe: SwipeData): ShotResult {
    const deltaX = swipe.endX - swipe.startX;
    // Y এক্সিস রিভার্স করা হয়েছে (স্ক্রিনের নিচ থেকে উপরে সোয়াইপ করলে পজিটিভ মান আসবে)
    const deltaY = swipe.startY - swipe.endY;

    // সময় যত কম লাগবে, শটের স্পিড তত বেশি হবে (Min duration limit 0.05s)
    const duration = Math.max(swipe.duration, 0.05);
    const speedMultiplier = Math.min(1 / duration, 3);

    // X, Y, Z ভেলোসিটি হিসাব
    const vx = deltaX * 0.05 * speedMultiplier;
    const vy = Math.max(deltaY * 0.04 * speedMultiplier, 1.5); // বল মাটিতে লেগে না থেকে সামান্য হাওয়ায় উঠবে
    const vz = -Math.min(Math.max(deltaY * 0.1 * speedMultiplier, 5), this.maxSpeed); // বল সামনের দিকে (-Z) যাবে

    // সুইপের ডিরেকশন থেকে স্পিন বের করা (Curve Shot-এর জন্য)
    const spinX = vy * 0.1;  // Topspin / Backspin
    const spinY = deltaX * 0.25; // Side Spin (In-swing / Out-swing)

    return {
      velocity: Vector3Utils.create(vx, vy, vz),
      spin: Vector3Utils.create(spinX, spinY, 0),
    };
  }
}