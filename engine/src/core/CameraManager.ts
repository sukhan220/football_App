// //CameraManager.ts
// import { Vector3D, Vector3Utils } from './Vector3'; // আপনার ফাইলের ইমপোর্ট path অনুযায়ী দিন
// export type CameraMode =
//     | 'SHOOTER'
//     | 'KEEPER'
//     | 'KEEPER_FROM_SHOOTER'
//     | 'KEEPER_HIGH'
//     | 'KEEPER_LEFT'
//     | 'KEEPER_RIGHT'
//     | 'BALL_FOLLOW'
//     | 'PENALTY_PREVIEW'
//     | 'SIDE_VIEW'
//     | 'TACTICAL'
//     | 'REPLAY'
//     | 'BEHIND_GOAL_POST';

// export interface CameraState {
//     position: Vector3D;
//     target: Vector3D;
//     fov: number;
// }

// export class CameraManager {
//     private currentPosition: Vector3D;
//     private currentTarget: Vector3D;
//     private currentFov: number;

//     private activeMode: CameraMode = 'SHOOTER';

//     // ক্যামেরা প্রি-সেট ডাটা
//     private presets: Record<CameraMode, CameraState> = {
//         SHOOTER: {
//             position: Vector3Utils.create(0, 4.2, 9.5),
//             target: Vector3Utils.create(0, 1.0, -10),
//             fov: 55,
//         },

//         KEEPER: {
//             position: Vector3Utils.create(0, 1.75, -9.5),
//             target: Vector3Utils.create(0, 1.2, 4.0),
//             fov: 110,
//         },

//         KEEPER_FROM_SHOOTER: {
//             position: Vector3Utils.create(2, 5.5, 19.5),
//             target: Vector3Utils.create(0, 4, 2.5),
//             fov: 55,
//         },

//         BEHIND_GOAL_POST: {
//             position: Vector3Utils.create(0, 2, -29.5),
//             target: Vector3Utils.create(0, 1.0, 2.5),
//             fov: 65,
//         },


//         // 🧤 Keeper-এর একটু উপরের POV
//         // Goal + Shooter দুটোই পরিষ্কার দেখা যাবে
//         KEEPER_HIGH: {
//             position: Vector3Utils.create(0, 4.0, -13.0),
//             target: Vector3Utils.create(0, 0.8, 2.5),
//             fov: 65,
//         },

//         // 🧤 Keeper-এর বাম পাশ থেকে
//         KEEPER_LEFT: {
//             position: Vector3Utils.create(-5.0, 2.8, -11.5),
//             target: Vector3Utils.create(0, 1.0, 1.5),
//             fov: 60,
//         },

//         // 🧤 Keeper-এর ডান পাশ থেকে
//         KEEPER_RIGHT: {
//             position: Vector3Utils.create(5.0, 2.8, -11.5),
//             target: Vector3Utils.create(0, 1.0, 1.5),
//             fov: 60,
//         },

//         // ⚽ Ball-এর কাছাকাছি
//         BALL_FOLLOW: {
//             position: Vector3Utils.create(2.5, 2.0, 3.5),
//             target: Vector3Utils.create(0, 0.5, -5),
//             fov: 60,
//         },

//         // 🎥 Penalty শুরু হওয়ার cinematic view
//         PENALTY_PREVIEW: {
//             position: Vector3Utils.create(4.5, 2.8, 5.0),
//             target: Vector3Utils.create(0, 0.3, 0),
//             fov: 50,
//         },

//         // 🎬 Goal-এর side থেকে
//         SIDE_VIEW: {
//             position: Vector3Utils.create(9.0, 3.5, -4.0),
//             target: Vector3Utils.create(0, 1.0, -5),
//             fov: 55,
//         },

//         // 🏟️ উপর থেকে tactical view
//         TACTICAL: {
//             position: Vector3Utils.create(0, 12.0, 2.0),
//             target: Vector3Utils.create(0, 0, -5),
//             fov: 55,
//         },

//         // 🎞️ Replay angle
//         REPLAY: {
//             position: Vector3Utils.create(-3.0, 3.0, 4.0),
//             target: Vector3Utils.create(0, 0, 0),
//             fov: 50,
//         },
//     };

//     constructor(initialMode: CameraMode = 'SHOOTER') {
//         this.activeMode = initialMode;
//         const initialPreset = this.presets[initialMode];

//         // রেফারেন্স মিউটেশন এড়াতে ক্লোন করে নেওয়া হচ্ছে
//         this.currentPosition = Vector3Utils.clone(initialPreset.position);
//         this.currentTarget = Vector3Utils.clone(initialPreset.target);
//         this.currentFov = initialPreset.fov;
//     }

//     /**
//      * ক্যামেরা মোড সেট করা
//      */
//     public setMode(mode: CameraMode): void {
//         this.activeMode = mode;
//     }

//     public getMode(): CameraMode {
//         return this.activeMode;
//     }

//     /**
//      * ম্যানুয়ালি প্রি-সেটের পজিশন বা টার্গেট কাস্টমাইজ করার জন্য (যদি লাগে)
//      */
//     public setPreset(mode: CameraMode, state: Partial<CameraState>): void {
//         if (state.position) this.presets[mode].position = Vector3Utils.clone(state.position);
//         if (state.target) this.presets[mode].target = Vector3Utils.clone(state.target);
//         if (state.fov) this.presets[mode].fov = state.fov;
//     }

//     /**
//      * প্রতি ফ্রেমে ক্যামেরার ট্রানজিশন আপডেট করার মেইন মেথড
//      * @param dt Delta Time
//      * @param ballPos বলের বর্তমান পজিশন (REPLAY মোডের জন্য লাগবে)
//      */
//     public update(dt: number, ballPos?: Vector3D): CameraState {
//         let desiredPos: Vector3D;
//         let desiredTarget: Vector3D;
//         let desiredFov = this.presets[this.activeMode].fov;

//         // ১. ডায়নামিক বা প্রি-সেট অনুযায়ী পজিশন নির্ধারণ
//         if (this.activeMode === 'REPLAY' && ballPos) {
//             // রিপ্লে মোডে বলকে অনুসরণ করা (অফসেট রাখা হচ্ছে)
//             desiredPos = Vector3Utils.add(ballPos, Vector3Utils.create(-2, 2, 5));
//             desiredTarget = ballPos;
//         } else {
//             desiredPos = this.presets[this.activeMode].position;
//             desiredTarget = this.presets[this.activeMode].target;
//         }

//         // ২. স্মুথ ট্রানজিশনের জন্য Lerp আলফা (Speed Scaling)
//         const lerpAlpha = Math.min(dt * 5.0, 1.0);

//         // ৩. আপনার Vector3Utils.lerp ব্যবহার করে স্মুথ ট্রানজিশন করা
//         const nextPos = Vector3Utils.lerp(this.currentPosition, desiredPos, lerpAlpha);
//         const nextTarget = Vector3Utils.lerp(this.currentTarget, desiredTarget, lerpAlpha);

//         // ইন-প্লেস সেট করে পজিশন আপডেট (মেমরি লিক বা মেমরি অ্যালোকেশন কমানোর জন্য)
//         Vector3Utils.set(this.currentPosition, nextPos.x, nextPos.y, nextPos.z);
//         Vector3Utils.set(this.currentTarget, nextTarget.x, nextTarget.y, nextTarget.z);

//         // FOV লিনিয়ার ইন্টারপোলেশন
//         this.currentFov += (desiredFov - this.currentFov) * lerpAlpha;

//         return {
//             position: this.currentPosition,
//             target: this.currentTarget,
//             fov: this.currentFov,
//         };
//     }
// }

// CameraManager.ts
import { Vector3D, Vector3Utils } from './Vector3';

export type CameraMode =
    | 'SHOOTER'
    | 'KEEPER'
    | 'KEEPER_FROM_SHOOTER'
    | 'KEEPER_HIGH'
    | 'KEEPER_LEFT'
    | 'KEEPER_RIGHT'
    | 'BALL_FOLLOW'
    | 'PENALTY_PREVIEW'
    | 'SIDE_VIEW'
    | 'TACTICAL'
    | 'REPLAY'
    | 'BEHIND_GOAL_POST';

export interface CameraState {
    position: Vector3D;
    target: Vector3D;
    fov: number;
}

export class CameraManager {
    private currentPosition: Vector3D;
    private currentTarget: Vector3D;
    private currentFov: number;

    private activeMode: CameraMode = 'SHOOTER';

    // ক্যামেরা প্রি-সেট ডাটা
    private presets: Record<CameraMode, CameraState> = {
        SHOOTER: {
            position: Vector3Utils.create(0, 4.2, 9.5),
            target: Vector3Utils.create(0, 1.0, -10),
            fov: 55,
        },
        KEEPER: {
            position: Vector3Utils.create(0, 1.75, -9.5),
            target: Vector3Utils.create(0, 1.2, 4.0),
            fov: 110,
        },
        KEEPER_FROM_SHOOTER: {
            position: Vector3Utils.create(2, 5.5, 19.5),
            target: Vector3Utils.create(0, 4, 2.5),
            fov: 55,
        },
        BEHIND_GOAL_POST: {
            position: Vector3Utils.create(0, 2, -29.5),
            target: Vector3Utils.create(0, 1.0, 2.5),
            fov: 65,
        },
        KEEPER_HIGH: {
            position: Vector3Utils.create(0, 4.0, -13.0),
            target: Vector3Utils.create(0, 0.8, 2.5),
            fov: 65,
        },
        KEEPER_LEFT: {
            position: Vector3Utils.create(-5.0, 2.8, -11.5),
            target: Vector3Utils.create(0, 1.0, 1.5),
            fov: 60,
        },
        KEEPER_RIGHT: {
            position: Vector3Utils.create(5.0, 2.8, -11.5),
            target: Vector3Utils.create(0, 1.0, 1.5),
            fov: 60,
        },
        BALL_FOLLOW: {
            position: Vector3Utils.create(2.5, 2.0, 3.5),
            target: Vector3Utils.create(0, 0.5, -5),
            fov: 60,
        },
        PENALTY_PREVIEW: {
            position: Vector3Utils.create(4.5, 2.8, 5.0),
            target: Vector3Utils.create(0, 0.3, 0),
            fov: 50,
        },
        SIDE_VIEW: {
            position: Vector3Utils.create(9.0, 3.5, -4.0),
            target: Vector3Utils.create(0, 1.0, -5),
            fov: 55,
        },
        TACTICAL: {
            position: Vector3Utils.create(0, 12.0, 2.0),
            target: Vector3Utils.create(0, 0, -5),
            fov: 55,
        },
        REPLAY: {
            position: Vector3Utils.create(-3.0, 3.0, 4.0),
            target: Vector3Utils.create(0, 0, 0),
            fov: 50,
        },
    };

    constructor(initialMode: CameraMode = 'SHOOTER') {
        // ১. Fallback Handling: যদি ভুল বা undefined মোড আসে তবে 'SHOOTER' ডিফল্ট হিসেবে কাজ করবে
        const modeKey = (initialMode && this.presets[initialMode]) ? initialMode : 'SHOOTER';
        this.activeMode = modeKey;

        const initialPreset = this.presets[modeKey];

        // রেফারেন্স মিউটেশন এড়াতে ক্লোন
        this.currentPosition = Vector3Utils.clone(initialPreset.position);
        this.currentTarget = Vector3Utils.clone(initialPreset.target);
        this.currentFov = initialPreset.fov;
    }

    public setMode(mode: CameraMode): void {
        if (this.presets[mode]) {
            this.activeMode = mode;
        }
    }

    public getMode(): CameraMode {
        return this.activeMode;
    }

    public setPreset(mode: CameraMode, state: Partial<CameraState>): void {
        if (!this.presets[mode]) return;

        if (state.position) this.presets[mode].position = Vector3Utils.clone(state.position);
        if (state.target) this.presets[mode].target = Vector3Utils.clone(state.target);
        if (state.fov) this.presets[mode].fov = state.fov;
    }

    public update(dt: number, ballPos?: Vector3D): CameraState {
        // Safe Key fallback
        const currentMode = this.presets[this.activeMode] ? this.activeMode : 'SHOOTER';
        
        let desiredPos: Vector3D;
        let desiredTarget: Vector3D;
        let desiredFov = this.presets[currentMode].fov;

        // ১. ডায়নামিক বা প্রি-সেট নির্ধারণ
        if (currentMode === 'REPLAY' && ballPos) {
            desiredPos = Vector3Utils.add(ballPos, Vector3Utils.create(-2, 2, 5));
            // ২. ballPos সরাসরি অ্যাসাইন না করে ক্লোন করা হয়েছে রেফারেন্স সেফটির জন্য
            desiredTarget = Vector3Utils.clone(ballPos); 
        } else {
            desiredPos = this.presets[currentMode].position;
            desiredTarget = this.presets[currentMode].target;
        }

        // ২. Smooth Lerp Alpha Calculation
        const lerpAlpha = Math.min(dt * 5.0, 1.0);

        // ৩. Lerp calculation
        const nextPos = Vector3Utils.lerp(this.currentPosition, desiredPos, lerpAlpha);
        const nextTarget = Vector3Utils.lerp(this.currentTarget, desiredTarget, lerpAlpha);

        // ইন-প্লেস পজিশন আপডেট
        Vector3Utils.set(this.currentPosition, nextPos.x, nextPos.y, nextPos.z);
        Vector3Utils.set(this.currentTarget, nextTarget.x, nextTarget.y, nextTarget.z);

        // FOV লিনিয়ার ইন্টারপোলেশন
        this.currentFov += (desiredFov - this.currentFov) * lerpAlpha;

        return {
            position: this.currentPosition,
            target: this.currentTarget,
            fov: this.currentFov,
        };
    }
}