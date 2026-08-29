// src/services/udp-manager.ts
import dgram from 'react-native-udp';
import { BufferProtocol } from './buffer-protocol';
import { SyncPacketData } from '@/types/multiplayer';
import { GameEngine } from '../../engine/src/GameEngine';

const UDP_PORT = 12346;
type SyncCallback = (packet: SyncPacketData) => void;

export class NetworkManagerUDP {
  private udpSocket: any = null;
  private onSyncCallback: SyncCallback | null = null;

  public initUDP(localPort: number = UDP_PORT) {
    if (this.udpSocket) return;

    try {
      this.udpSocket = dgram.createSocket({ type: 'udp4' });
      
      this.udpSocket.bind({
        port: localPort,
        reusePort: true,
      });

      this.udpSocket.on('message', (msg: any) => {
        const rawStr = msg.toString();
        const decoded = BufferProtocol.decodeSyncPacket(rawStr);

        if (decoded && this.onSyncCallback) {
          this.onSyncCallback(decoded);
        }
      });

      this.udpSocket.on('error', (err: any) => {
        console.error('UDP Socket Error:', err);
      });
    } catch (error) {
      console.error('Failed to initialize UDP socket:', error);
    }
  }

  /**
   * 🚀 ইঞ্জিনের কারেন্ট স্টেট সরাসরি ধরে UDP প্যাকেটে এনকোড করে ব্রডকাস্ট করা
   */
  public sendEngineSnapshot(targetIp: string, engine: GameEngine, tick: number) {
    if (!this.udpSocket) this.initUDP();

    const snapshot: SyncPacketData = {
      tick,
      ball: {
        pos: engine.ball.position,
        vel: engine.ball.velocity,
      },
      keeper: {
        pos: engine.keeper.position,
      },
      matchInfo: {
        score: engine.match.score,
        shotsLeft: engine.match.shotsLeft,
        isGameOver: engine.match.isGameOver,
      },
    };

    const payload = BufferProtocol.encodeSyncPacket(snapshot);

    this.udpSocket.send(
      payload,
      0,
      payload.length,
      UDP_PORT,
      targetIp,
      (err: any) => {
        if (err) console.error('UDP Send Error:', err);
      }
    );
  }

  public onSyncReceived(callback: SyncCallback) {
    this.onSyncCallback = callback;
  }

  public closeUDP() {
    if (this.udpSocket) {
      try {
        this.udpSocket.close();
      } catch (e) {
        console.log('UDP Close Error:', e);
      }
      this.udpSocket = null;
    }
    this.onSyncCallback = null;
  }
}

export const udpNetwork = new NetworkManagerUDP();