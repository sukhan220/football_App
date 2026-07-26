export type GameEventType = 
  | 'ON_KICK' 
  | 'ON_GOAL' 
  | 'ON_SAVE' 
  | 'ON_POST_HIT' 
  | 'ON_MISS' 
  | 'ON_GAME_OVER';

export type EventCallback = (data?: any) => void;

export class EventSystem {
  private listeners: Map<GameEventType, EventCallback[]> = new Map();

  // ইভেন্ট লিসেনার রেজিস্টার করা
  public on(event: GameEventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  // ইভেন্ট রিমুভ করা
  public off(event: GameEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback)
      );
    }
  }

  // ইভেন্ট ট্রিগার করা
  public emit(event: GameEventType, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}