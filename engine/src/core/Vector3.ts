export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export class Vector3Utils {
  // ১. ভেক্টর তৈরি
  public static create(x = 0, y = 0, z = 0): Vector3D {
    return { x, y, z };
  }

  // ২. ভেক্টর যোগ (Addition)
  public static add(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  // ৩. ভেক্টর বিয়োগ (Subtraction)
  public static sub(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  // ৪. স্কেলার গুণন (Multiply by Scalar / Speed Scale)
  public static multiplyScalar(v: Vector3D, scalar: number): Vector3D {
    return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
  }

  // ৫. ভেক্টরের দৈর্ঘ্য/ম্যাগনিটিউড (Magnitude / Speed)
  public static magnitude(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  // ৬. ভেক্টর নরমাললাইজ (Direction Vector - 1 unit length)
  public static normalize(v: Vector3D): Vector3D {
    const mag = this.magnitude(v);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    return this.multiplyScalar(v, 1 / mag);
  }

  // ৭. দুটি বিন্দুর ভেতরের দূরত্ব (Distance - Collision Detection-এর জন্য)
  public static distance(a: Vector3D, b: Vector3D): number {
    return this.magnitude(this.sub(a, b));
  }

  // ৮. লিনিয়ার ইন্টারপোলেশন (Linear Interpolation)
  public static lerp(start: Vector3D, end: Vector3D, alpha: number): Vector3D {
    return {
      x: start.x + (end.x - start.x) * alpha,
      y: start.y + (end.y - start.y) * alpha,
      z: start.z + (end.z - start.z) * alpha,
    };
  }

  // ৯. ভেক্টর ক্লোন (Copying vector without reference mutation)
  public static clone(v: Vector3D): Vector3D {
    return { x: v.x, y: v.y, z: v.z };
  }

  // ============================================================================
  // Advanced Physics Math & High-Performance Utilities (Updated)
  // ============================================================================

  /** ১০. ডট প্রোডাক্ট (Dot Product): এলাইনমেন্ট এবং অ্যাঙ্গেল বের করার জন্য */
  public static dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /** ১১. ক্রস প্রোডাক্ট (Cross Product): স্পিন এবং কার্ভ শট (Magnus Force) হিসাবের জন্য */
  public static cross(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  /** ১২. ক্ল্যাম্প লেন্থ (Clamp Length): বলের লিমিটের চেয়ে অতিরিক্ত স্পিড আটকে দেওয়ার জন্য */
  public static clampLength(v: Vector3D, min: number, max: number): Vector3D {
    const mag = this.magnitude(v);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    const clampedMag = Math.max(min, Math.min(max, mag));
    return this.multiplyScalar(this.normalize(v), clampedMag);
  }

  /** ১৩. ইন-প্লেস সেট (In-place Set): নতুন অবজেক্ট তৈরি না করে সরাসরি মান আপডেট করতে (Garbage Reduction) */
  public static set(v: Vector3D, x: number, y: number, z: number): Vector3D {
    v.x = x;
    v.y = y;
    v.z = z;
    return v;
  }

  /** ১৪. ইন-প্লেস যোগ (In-place Addition): মেমরি অ্যালোকেশন ছাড়া ভেক্টর যোগ করার জন্য */
  public static addInPlace(out: Vector3D, b: Vector3D): Vector3D {
    out.x += b.x;
    out.y += b.y;
    out.z += b.z;
    return out;
  }
}