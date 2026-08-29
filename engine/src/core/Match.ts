// import { Vector3D } from './Vector3';

// export type GameMode = 'VS_AI' | 'VS_PLAYER';
// export type ShotOutcome = 'GOAL' | 'SAVED' | 'MISS' | 'POST_HIT';
// export type PlayerRole = 'PLAYER_1' | 'PLAYER_2' | 'AI';

// export interface ShotResult {
//   shooter: PlayerRole;
//   goalkeeper: PlayerRole;
//   outcome: ShotOutcome;
//   points: number;
//   isGoal: boolean;
//   isTopBin?: boolean;
// }

// export class MatchManager {
//   // 🎮 গেম মোড
//   public gameMode: GameMode = 'VS_AI';

//   // 👥 প্লেয়ার স্কোর ও গোল ট্র্যাকিং
//   public p1Score: number = 0;
//   public p2Score: number = 0; // VS_PLAYER মোডের জন্য
//   public p1Goals: number = 0;
//   public p2Goals: number = 0;

//   public p1Shots: boolean[] = [];
//   public p2Shots: boolean[] = [];

//   // 🔄 বর্তমান টার্ন ও রোল ট্র্যাকিং
//   public currentShooter: PlayerRole = 'PLAYER_1';
//   public currentKeeper: PlayerRole = 'AI';

//   // 🏆 রাউন্ড ও গেম স্টেট
//   public currentRound: number = 1;
//   public totalRounds: number = 5;
//   public isSuddenDeath: boolean = false;
//   public isGameOver: boolean = false;
//   public winner: PlayerRole | 'DRAW' | null = null;

//   // 📝 শট হিস্ট্রি
//   public p1History: ShotOutcome[] = [];
//   public p2History: ShotOutcome[] = [];

//   // 🥅 গোলপোস্ট ডাইমেনশন (UI ও Goalkeeper ক্লাসের সাথে সিঙ্কড)
//   private readonly goalWidth: number = 7.32;
//   private readonly goalHeight: number = 2.44;
//   private readonly goalZ: number = -10.0;
//   private readonly postRadius: number = 0.08;

//   constructor(gameMode: GameMode = 'VS_AI', totalRounds: number = 5) {
//     this.setGameMode(gameMode, totalRounds);
//   }


//   // 🎯 ১. বর্তমান মোট স্কোর পাওয়ার জন্য getter
//   public get score(): number {
//     return this.p1Score + this.p2Score;
//   }

//   // 🎯 ২. কতগুলো শট বাকি আছে তা পাওয়ার জন্য getter
//   public get shotsLeft(): number {
//     const totalShotsAllowed = this.totalRounds * (this.gameMode === 'VS_PLAYER' ? 2 : 1);
//     const totalShotsTaken = this.p1History.length + this.p2History.length;
//     return Math.max(0, totalShotsAllowed - totalShotsTaken);
//   }

//   // 🎯 ৩. বর্তমান রাউন্ড বা টার্ন অনুযায়ী গেট শটস
//   public get currentRoundShotsLeft(): number {
//     return Math.max(0, this.totalRounds - this.currentRound + 1);
//   }

//   /**
//    * ⚙️ গেম মোড সেট করার মেথড
//    */
//   public setGameMode(mode: GameMode, totalRounds: number = 5): void {
//     this.gameMode = mode;
//     this.totalRounds = totalRounds;
//     this.reset(mode, totalRounds);
//   }

//   /**
//    * ⚽ শটের ফলাফল মূল্যায়ন করা
//    */
//   public evaluateShot(
//     ballPos: Vector3D, 
//     isKeeperSaved: boolean = false
//   ): ShotResult {
//     if (this.isGameOver) {
//       return this.createEmptyResult('MISS');
//     }

//     const shooter = this.currentShooter;
//     const goalkeeper = this.currentKeeper;

//     let outcome: ShotOutcome = 'MISS';
//     let points = 0;
//     let isGoal = false;
//     let isTopBin = false;

//     // ১. গোলকিপার সেভ করেছে কি না
//     if (isKeeperSaved) {
//       outcome = 'SAVED';
//     } else {
//       // ২. গোলের স্থানাঙ্ক পরীক্ষা
//       const halfWidth = this.goalWidth / 2;
//       const isInsideX = ballPos.x > -halfWidth && ballPos.x < halfWidth;
//       const isInsideY = ballPos.y > 0 && ballPos.y < this.goalHeight;
//       const isPastGoalLine = ballPos.z <= this.goalZ;

//       if (isInsideX && isInsideY && isPastGoalLine) {
//         outcome = 'GOAL';
//         isGoal = true;
//         points = 10;

//         // 🔥 Top Corner (Top Bin) বোনাস পয়েন্ট (১৫ পয়েন্ট)
//         const isTopCornerX = Math.abs(ballPos.x) > halfWidth * 0.7;
//         const isTopCornerY = ballPos.y > this.goalHeight * 0.7;

//         if (isTopCornerX && isTopCornerY) {
//           points = 15;
//           isTopBin = true;
//         }
//       } else {
//         // ৩. গোলপোস্ট হিট (Post / Bar)
//         const isNearLeftPost = Math.abs(ballPos.x - (-halfWidth)) <= this.postRadius * 2;
//         const isNearRightPost = Math.abs(ballPos.x - halfWidth) <= this.postRadius * 2;
//         const isNearCrossbar = Math.abs(ballPos.y - this.goalHeight) <= this.postRadius * 2;

//         if ((isNearLeftPost || isNearRightPost || isNearCrossbar) && ballPos.z <= this.goalZ + 0.2) {
//           outcome = 'POST_HIT';
//           points = 2;
//         }
//       }
//     }

//     // ৪. স্কোর ও হিস্ট্রি আপডেট
//     if (shooter === 'PLAYER_1') {
//       this.p1Score += points;
//       if (isGoal) this.p1Goals++;
//       this.p1History.push(outcome);
//     } else if (shooter === 'PLAYER_2') {
//       this.p2Score += points;
//       if (isGoal) this.p2Goals++;
//       this.p2History.push(outcome);
//     }

//     // 🔄 ৫. রোল অ্যান্ড টার্ন সুইচিং
//     this.switchTurns();

//     return {
//       shooter,
//       goalkeeper,
//       outcome,
//       points,
//       isGoal,
//       isTopBin
//     };
//   }

//   /**
//    * 🔄 গেম মোড অনুযায়ী রোল বদলানো
//    */
//   private switchTurns(): void {
//     if (this.gameMode === 'VS_AI') {
//       // 🤖 VS AI মোডে সবসময় Player 1 কিক করবে এবং AI কিপিং করবে
//       this.currentRound++;
//       if (this.currentRound > this.totalRounds) {
//         this.isGameOver = true;
//         this.winner = 'PLAYER_1'; // অথবা নিদির্ষ্ট টার্গেট স্কোরের ভিত্তিতে জয় নির্ধারণ
//       }
//     } else {
//       // 👥 VS PLAYER (2-Player Local PvP) মোডে সোয়াপ হবে
//       if (this.currentShooter === 'PLAYER_1') {
//         this.currentShooter = 'PLAYER_2';
//         this.currentKeeper = 'PLAYER_1';
//       } else {
//         this.currentShooter = 'PLAYER_1';
//         this.currentKeeper = 'PLAYER_2';
//         this.currentRound++;
//       }

//       // বিজয়ী নির্ধারণ চেক
//       this.checkWinner();
//     }
//   }

//   /**
//    * 🏆 VS_PLAYER মোডের ফলাফল ও Sudden Death চেক
//    */
//   private checkWinner(): void {
//     if (this.gameMode !== 'VS_PLAYER') return;

//     if (this.p1History.length === this.p2History.length) {
//       const shotsTaken = this.p1History.length;

//       if (shotsTaken >= this.totalRounds) {
//         if (this.p1Goals > this.p2Goals) {
//           this.winner = 'PLAYER_1';
//           this.isGameOver = true;
//         } else if (this.p2Goals > this.p1Goals) {
//           this.winner = 'PLAYER_2';
//           this.isGameOver = true;
//         } else {
//           // ড্র হলে Sudden Death অন হবে
//           this.isSuddenDeath = true;
//         }
//       }
//     }
//   }

//   private createEmptyResult(outcome: ShotOutcome): ShotResult {
//     return {
//       shooter: this.currentShooter,
//       goalkeeper: this.currentKeeper,
//       outcome,
//       points: 0,
//       isGoal: false,
//     };
//   }

//   /**
//    * 🔄 ম্যাচ রিসেট মেথড
//    */
//   public reset(mode: GameMode = this.gameMode, totalRounds: number = this.totalRounds): void {
//     this.gameMode = mode;
//     this.totalRounds = totalRounds;
    
//     this.p1Score = 0;
//     this.p2Score = 0;
//     this.p1Goals = 0;
//     this.p2Goals = 0;

//     this.currentRound = 1;
//     this.isSuddenDeath = false;
//     this.isGameOver = false;
//     this.winner = null;

//     this.p1History = [];
//     this.p2History = [];

//     if (mode === 'VS_AI') {
//       this.currentShooter = 'PLAYER_1';
//       this.currentKeeper = 'AI';
//     } else {
//       this.currentShooter = 'PLAYER_1';
//       this.currentKeeper = 'PLAYER_2';
//     }
//   }
// }

import { Vector3D } from './Vector3';

export type GameMode = 'VS_AI' | 'VS_PLAYER' | 'GOALKEEPER';
export type ShotOutcome = 'GOAL' | 'SAVED' | 'MISS' | 'POST_HIT';
export type PlayerRole = 'PLAYER_1' | 'PLAYER_2' | 'AI';

export interface ShotResult {
  shooter: PlayerRole;
  goalkeeper: PlayerRole;
  outcome: ShotOutcome;
  points: number;
  isGoal: boolean;
  isTopBin?: boolean;
}

export class MatchManager {
  // 🎮 গেম মোড
  public gameMode: GameMode = 'VS_AI';

  // 👥 প্লেয়ার স্কোর ও গোল ট্র্যাকিং
  public p1Score: number = 0;
  public p2Score: number = 0; // VS_PLAYER বা GOALKEEPER (AI) মোডের জন্য
  public p1Goals: number = 0;
  public p2Goals: number = 0;

  public p1Shots: boolean[] = [];
  public p2Shots: boolean[] = [];

  // 🔄 বর্তমান টার্ন ও রোল ট্র্যাকিং
  public currentShooter: PlayerRole = 'PLAYER_1';
  public currentKeeper: PlayerRole = 'AI';

  // 🏆 রাউন্ড ও গেম স্টেট
  public currentRound: number = 1;
  public totalRounds: number = 5;
  public isSuddenDeath: boolean = false;
  public isGameOver: boolean = false;
  public winner: PlayerRole | 'DRAW' | null = null;

  // 📝 শট হিস্ট্রি
  public p1History: ShotOutcome[] = [];
  public p2History: ShotOutcome[] = [];

  // 🥅 গোলপোস্ট ডাইমেনশন (UI ও Goalkeeper ক্লাসের সাথে সিঙ্কড)
  private readonly goalWidth: number = 7.32;
  private readonly goalHeight: number = 2.44;
  private readonly goalZ: number = -10.0;
  private readonly postRadius: number = 0.08;

  constructor(gameMode: GameMode = 'VS_AI', totalRounds: number = 5) {
    this.setGameMode(gameMode, totalRounds);
  }

  // 🎯 ১. বর্তমান মোট স্কোর পাওয়ার জন্য getter
  public get score(): number {
    return this.p1Score + this.p2Score;
  }

  // 🎯 ২. কতগুলো শট বাকি আছে তা পাওয়ার জন্য getter
  public get shotsLeft(): number {
    const totalShotsAllowed = this.totalRounds * (this.gameMode === 'VS_PLAYER' ? 2 : 1);
    const totalShotsTaken = this.p1History.length + this.p2History.length;
    return Math.max(0, totalShotsAllowed - totalShotsTaken);
  }

  // 🎯 ৩. বর্তমান রাউন্ড বা টার্ন অনুযায়ী গেট শটস
  public get currentRoundShotsLeft(): number {
    return Math.max(0, this.totalRounds - this.currentRound + 1);
  }

  /**
   * ⚙️ গেম মোড সেট করার মেথড
   */
  public setGameMode(mode: GameMode, totalRounds: number = 5): void {
    this.gameMode = mode;
    this.totalRounds = totalRounds;
    this.reset(mode, totalRounds);
  }

  /**
   * ⚽ শটের ফলাফল মূল্যায়ন করা
   */
  public evaluateShot(
    ballPos: Vector3D, 
    isKeeperSaved: boolean = false
  ): ShotResult {
    if (this.isGameOver) {
      return this.createEmptyResult('MISS');
    }

    const shooter = this.currentShooter;
    const goalkeeper = this.currentKeeper;

    let outcome: ShotOutcome = 'MISS';
    let points = 0;
    let isGoal = false;
    let isTopBin = false;

    // ১. গোলকিপার সেভ করেছে কি না
    if (isKeeperSaved) {
      outcome = 'SAVED';
    } else {
      // ২. গোলের স্থানাঙ্ক পরীক্ষা
      const halfWidth = this.goalWidth / 2;
      const isInsideX = ballPos.x > -halfWidth && ballPos.x < halfWidth;
      const isInsideY = ballPos.y > 0 && ballPos.y < this.goalHeight;
      const isPastGoalLine = ballPos.z <= this.goalZ;

      if (isInsideX && isInsideY && isPastGoalLine) {
        outcome = 'GOAL';
        isGoal = true;
        points = 10;

        // 🔥 Top Corner (Top Bin) বোনাস পয়েন্ট (১৫ পয়েন্ট)
        const isTopCornerX = Math.abs(ballPos.x) > halfWidth * 0.7;
        const isTopCornerY = ballPos.y > this.goalHeight * 0.7;

        if (isTopCornerX && isTopCornerY) {
          points = 15;
          isTopBin = true;
        }
      } else {
        // ৩. গোলপোস্ট হিট (Post / Bar)
        const isNearLeftPost = Math.abs(ballPos.x - (-halfWidth)) <= this.postRadius * 2;
        const isNearRightPost = Math.abs(ballPos.x - halfWidth) <= this.postRadius * 2;
        const isNearCrossbar = Math.abs(ballPos.y - this.goalHeight) <= this.postRadius * 2;

        if ((isNearLeftPost || isNearRightPost || isNearCrossbar) && ballPos.z <= this.goalZ + 0.2) {
          outcome = 'POST_HIT';
          points = 2;
        }
      }
    }

    // ৪. স্কোর ও হিস্ট্রি আপডেট
    if (shooter === 'PLAYER_1') {
      this.p1Score += points;
      if (isGoal) this.p1Goals++;
      this.p1History.push(outcome);
    } else if (shooter === 'PLAYER_2' || shooter === 'AI') {
      this.p2Score += points;
      if (isGoal) this.p2Goals++;
      this.p2History.push(outcome);
    }

    // 🔄 ৫. রোল অ্যান্ড টার্ন সুইচিং
    this.switchTurns();

    return {
      shooter,
      goalkeeper,
      outcome,
      points,
      isGoal,
      isTopBin
    };
  }

  /**
   * 🔄 গেম মোড অনুযায়ী রোল বদলানো
   */
  private switchTurns(): void {
    if (this.gameMode === 'VS_AI') {
      // 🤖 VS AI মোডে সবসময় Player 1 কিক করবে এবং AI কিপিং করবে
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.isGameOver = true;
        this.winner = 'PLAYER_1';
      }
    } else if (this.gameMode === 'GOALKEEPER') {
      // 🧤 GOALKEEPER মোডে AI কিক করবে এবং Player 1 সেভ করবে
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.isGameOver = true;
        this.winner = this.p1Goals < this.p2Goals ? 'AI' : 'PLAYER_1';
      }
    } else {
      // 👥 VS PLAYER (2-Player Local PvP) মোডে সোয়াপ হবে
      if (this.currentShooter === 'PLAYER_1') {
        this.currentShooter = 'PLAYER_2';
        this.currentKeeper = 'PLAYER_1';
      } else {
        this.currentShooter = 'PLAYER_1';
        this.currentKeeper = 'PLAYER_2';
        this.currentRound++;
      }

      // বিজয়ী নির্ধারণ চেক
      this.checkWinner();
    }
  }

  /**
   * 🏆 VS_PLAYER মোডের ফলাফল ও Sudden Death চেক
   */
  private checkWinner(): void {
    if (this.gameMode !== 'VS_PLAYER') return;

    if (this.p1History.length === this.p2History.length) {
      const shotsTaken = this.p1History.length;

      if (shotsTaken >= this.totalRounds) {
        if (this.p1Goals > this.p2Goals) {
          this.winner = 'PLAYER_1';
          this.isGameOver = true;
        } else if (this.p2Goals > this.p1Goals) {
          this.winner = 'PLAYER_2';
          this.isGameOver = true;
        } else {
          // ড্র হলে Sudden Death অন হবে
          this.isSuddenDeath = true;
        }
      }
    }
  }

  private createEmptyResult(outcome: ShotOutcome): ShotResult {
    return {
      shooter: this.currentShooter,
      goalkeeper: this.currentKeeper,
      outcome,
      points: 0,
      isGoal: false,
    };
  }

  /**
   * 🔄 ম্যাচ রিসেট মেথড
   */
  public reset(mode: GameMode = this.gameMode, totalRounds: number = this.totalRounds): void {
    this.gameMode = mode;
    this.totalRounds = totalRounds;
    
    this.p1Score = 0;
    this.p2Score = 0;
    this.p1Goals = 0;
    this.p2Goals = 0;

    this.currentRound = 1;
    this.isSuddenDeath = false;
    this.isGameOver = false;
    this.winner = null;

    this.p1History = [];
    this.p2History = [];

    if (mode === 'VS_AI') {
      this.currentShooter = 'PLAYER_1';
      this.currentKeeper = 'AI';
    } else if (mode === 'GOALKEEPER') {
      this.currentShooter = 'AI';
      this.currentKeeper = 'PLAYER_1';
    } else {
      this.currentShooter = 'PLAYER_1';
      this.currentKeeper = 'PLAYER_2';
    }
  }
}