import { Vector3D } from './Vector3';

export class ReplaySystem {
  private frames: Vector3D[] = [];
  public isPlaying: boolean = false;
  private currentIndex: number = 0;

  public record(pos: Vector3D): void {
    if (!this.isPlaying) {
      this.frames.push({ ...pos });
    }
  }

  public start(): void {
    this.isPlaying = true;
    this.currentIndex = 0;
  }

  public getNextFrame(): Vector3D | null {
    if (!this.isPlaying || this.currentIndex >= this.frames.length) {
      this.isPlaying = false;
      return null;
    }
    const frame = this.frames[this.currentIndex];
    this.currentIndex++;
    return frame;
  }

  public clear(): void {
    this.frames = [];
    this.isPlaying = false;
    this.currentIndex = 0;
  }
}