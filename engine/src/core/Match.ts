import { Vector3D } from './Vector3';

export class MatchManager {
  public score: number = 0;
  public shotsLeft: number = 5;
  public isGameOver: boolean = false;

  private goalWidth = 7.32;
  private goalHeight = 2.44;
  private goalZ = -14;

  public evaluateShot(pos: Vector3D): { isGoal: boolean; points: number } {
    this.shotsLeft--;

    const isInsideX = pos.x > -this.goalWidth / 2 && pos.x < this.goalWidth / 2;
    const isInsideY = pos.y > 0 && pos.y < this.goalHeight;
    const isPastLine = pos.z < this.goalZ + 0.5;

    if (isInsideX && isInsideY && isPastLine) {
      this.score += 10;
      if (this.shotsLeft <= 0) this.isGameOver = true;
      return { isGoal: true, points: 10 };
    }

    if (this.shotsLeft <= 0) this.isGameOver = true;
    return { isGoal: false, points: 0 };
  }

  public reset(): void {
    this.score = 0;
    this.shotsLeft = 5;
    this.isGameOver = false;
  }
}