// src/services/buffer-protocol.ts
import { SyncPacketData } from '@/types/multiplayer';

export class BufferProtocol {
  /**
   * Serialize SyncPacket object to JSON String
   */
  static encodeSyncPacket(data: SyncPacketData): string {
    return JSON.stringify(data);
  }

  /**
   * Deserialize Raw String back to SyncPacket object
   */
  static decodeSyncPacket(raw: string): SyncPacketData | null {
    try {
      return JSON.parse(raw.trim()) as SyncPacketData;
    } catch (e) {
      console.error('Buffer Decoding Error:', e);
      return null;
    }
  }
}