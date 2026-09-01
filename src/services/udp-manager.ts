// src/services/udp-manager.ts


import dgram from 'react-native-udp';

import type { SyncPacketData} from '@/types/multiplayer';

import { BufferProtocol} from './buffer-protocol';

const UDP_PORT = 12346;

/**
 * Network প্রতি second-এ
 * 20টি snapshot পাঠাবে।
 */
const DEFAULT_SYNC_RATE = 20;

/**
 * এখনকার architecture-এ
 * maximum 30Hz রাখছি।
 */
const MAX_SYNC_RATE = 30;

type SyncCallback =
  (
    packet: SyncPacketData
  ) => void;

/* =========================================================
 * CUSTOM SNAPSHOT
 * ========================================================= */

export interface CustomSnapshotInput {

  tick?: number;
  sequence?: number;
  round?: number;
  currentShooter?:
  | 'P1'
  | 'P2'
  | 'AI';

  /* -------------------------------------------------------
   * BALL
   * ----------------------------------------------------- */

  ball?: {
    pos?: any;
    position?: any;
    vel?: any;
    velocity?: any;
  };

  /* -------------------------------------------------------
   * KEEPER
   * ----------------------------------------------------- */

  keeper?: {
    pos?: any;
    position?: any;
    vel?: any;
    velocity?: any;
  };

  /* -------------------------------------------------------
   * MATCH
   * ----------------------------------------------------- */

  match?: {
    currentShooter?: any;
    score?: any;
    shotsLeft?: any;
    isGameOver?: any;
  };

  matchInfo?: {
    score?: any;
    shotsLeft?: any;
    isGameOver?: any;
  };
}

/* =========================================================
 * SNAPSHOT PROVIDER
 * ========================================================= */

type SnapshotProvider =
  () =>
    | SyncPacketData
    | CustomSnapshotInput
    | null
    | undefined;

/* =========================================================
 * UDP MANAGER
 * ========================================================= */

export class NetworkManagerUDP {

  private udpSocket: any = null;
  private onSyncCallback:
    | SyncCallback
    | null = null;

  private targetIp: string | null = null;

  /**
   * Last received tick.
   *
   * পুরোনো UDP packet এলে
   * ignore করবো।
   */
  private lastReceivedTick = -1;

  /**
   * Local outgoing packet sequence.
   */
  private sendSequence = 0;

  /**
   * Low frequency sync timer.
   */
  private syncTimer:
    | ReturnType<typeof setInterval>
    | null = null;

  private syncRate = DEFAULT_SYNC_RATE;

  /* =======================================================
   * INIT UDP
   * ======================================================= */

  public initUDP(
    localPort:number = UDP_PORT ) {
    if (this.udpSocket) {
      return;
    }

    try {
      this.udpSocket = dgram.createSocket({ type: 'udp4', });
      this.udpSocket.bind({ port: localPort, reusePort: true, });

      /* ---------------------------------------------------
       * RECEIVE
       * ------------------------------------------------- */

      this.udpSocket.on(
        'message',
        (msg: any) => {

          const decoded =
            BufferProtocol
              .decodeSyncPacket(
                msg
              );

          if (!decoded) {
            return;
          }

          /* -----------------------------------------------
           * OUT OF ORDER PROTECTION
           * --------------------------------------------- */

          if (decoded.tick <this.lastReceivedTick) {

            return;
          }

          this.lastReceivedTick = decoded.tick;

          /* -----------------------------------------------
           * CALLBACK
           * --------------------------------------------- */

          this.onSyncCallback?.(decoded);
        }
      );

      /* ---------------------------------------------------
       * ERROR
       * ------------------------------------------------- */

      this.udpSocket.on(
        'error',
        (error: any) => {

          console.error(
            'UDP SOCKET ERROR:',
            error
          );
        }
      );

      console.log(`UDP READY ON PORT ${localPort}`);

    } catch (error) {

      console.error('FAILED TO INITIALIZE UDP:', error);
      this.udpSocket =null;
    }
  }

  /* =======================================================
   * TARGET IP
   * ======================================================= */

  public setTargetIp(targetIp: string | null) {

    this.targetIp =targetIp?.trim() || null;
  }

  public getTargetIp() {

    return this.targetIp;
  }

  /* =======================================================
   * NORMALIZE SNAPSHOT
   * ======================================================= */

  private normalizeSnapshot(
    engineOrData:
      | SyncPacketData
      | CustomSnapshotInput,

    tick?: number
  ): SyncPacketData {

    const data = engineOrData as any;

    const resolvedTick = Math.max(0,Math.trunc(tick ??data.tick ??0 ));

    return {

      tick:resolvedTick,
      sequence: data.sequence ?? resolvedTick,
      round: data.round ?? 0,
      currentShooter: data.currentShooter ?? data.match?.currentShooter ?? 'AI',

      /* -----------------------------------------------
       * BALL
       * --------------------------------------------- */

      ball: {

        pos:
          data.ball?.pos ??
          data.ball?.position ??
          {
            x: 0,
            y: 0,
            z: 0,
          },

        vel:
          data.ball?.vel ??
          data.ball?.velocity ??
          {
            x: 0,
            y: 0,
            z: 0,
          },
      },

      /* -----------------------------------------------
       * KEEPER
       * --------------------------------------------- */

      keeper: {

        pos:
          data.keeper?.pos ??
          data.keeper?.position ??
          {
            x: 0,
            y: 0,
            z: 0,
          },

        vel:
          data.keeper?.vel ??
          data.keeper?.velocity ??
          {
            x: 0,
            y: 0,
            z: 0,
          },
      },

      /* -----------------------------------------------
       * MATCH
       * --------------------------------------------- */

      matchInfo: {

        score:
          data.matchInfo?.score ??
          data.match?.score ??
          0,

        shotsLeft:
          data.matchInfo
            ?.shotsLeft ??
          data.match?.shotsLeft ??
          0,

        isGameOver:
          data.matchInfo
            ?.isGameOver ??
          data.match?.isGameOver ??
          false,
      },
    };
  }

  /* =======================================================
   * SEND SNAPSHOT
   * ======================================================= */

  public sendEngineSnapshot(
    targetIp: string,

    engineOrData:
      | SyncPacketData
      | CustomSnapshotInput,

    tick?: number
  ): boolean {

    /* -----------------------------------------------------
     * INIT
     * --------------------------------------------------- */

    if (!this.udpSocket) {
      this.initUDP();
    }

    if (!this.udpSocket) {

      return false;
    }

    const cleanIp = targetIp?.trim();

    if (!cleanIp) {

      console.warn( 'UDP SEND FAILED: TARGET IP IS EMPTY');

      return false;
    }

    /* -----------------------------------------------------
     * SNAPSHOT
     * --------------------------------------------------- */

    const snapshot = this.normalizeSnapshot(engineOrData,tick);

    /* -----------------------------------------------------
     * SEQUENCE
     * --------------------------------------------------- */

    snapshot.sequence = this.sendSequence++;

    /* -----------------------------------------------------
     * BINARY ENCODE
     * --------------------------------------------------- */

    const payload =
      BufferProtocol
        .encodeSyncPacket(
          snapshot
        );

    /* -----------------------------------------------------
     * SEND
     * --------------------------------------------------- */

    try {

      this.udpSocket.send(
        payload,

        0,

        payload.length,

        UDP_PORT,

        cleanIp,

        (error: any) => {

          if (error) {

            console.error(
              'UDP SEND ERROR:',
              error
            );
          }
        }
      );

      return true;

    } catch (error) {

      console.error(
        'UDP SEND EXCEPTION:',
        error
      );

      return false;
    }
  }

  /* =======================================================
   * START SYNC LOOP
   * ======================================================= */

  /**
   * IMPORTANT:
   *
   * Engine 60 FPS চলবে।
   *
   * Network 20 FPS চলবে।
   *
   * অর্থাৎ:
   *
   * Engine:
   *
   * 1 2 3 4 5 6 7 8 9 ...
   *
   * Network:
   *
   * 20, 23, 26, 29...
   *
   * =====================================================
   */

  public startSyncLoop(
    targetIp: string,

    getSnapshot:
      SnapshotProvider,

    syncRate:
      number = DEFAULT_SYNC_RATE
  ) {

    /* -----------------------------------------------------
     * PREVIOUS LOOP STOP
     * --------------------------------------------------- */

    this.stopSyncLoop();

    this.setTargetIp(targetIp);

    /* -----------------------------------------------------
     * RATE
     * --------------------------------------------------- */

    const rate = Math.max(1,Math.min(MAX_SYNC_RATE,Math.round(syncRate)));

    this.syncRate = rate;

    const interval = 1000 / rate;

    /* -----------------------------------------------------
     * TIMER
     * --------------------------------------------------- */

    this.syncTimer =
      setInterval(
        () => {

          if (!this.targetIp) {

            return;
          }

          try {

            const snapshot = getSnapshot();
            if (!snapshot) {
              return;
            }

            this.sendEngineSnapshot(this.targetIp,snapshot,(snapshot as any).tick);

          } catch (error) {

            console.error('UDP SYNC LOOP ERROR:',error );
          }

        },

        interval
      );

    console.log(
      `UDP SYNC STARTED: ${rate}Hz`
    );
  }

  /* =======================================================
   * STOP SYNC
   * ======================================================= */

  public stopSyncLoop() {

    if (this.syncTimer) {

      clearInterval(this.syncTimer );

      this.syncTimer = null;
    }
  }

  /* =======================================================
   * STATUS
   * ======================================================= */

  public isSyncLoopRunning() {

    return (
      this.syncTimer !== null
    );
  }

  public getSyncRate() {

    return this.syncRate;
  }

  /* =======================================================
   * RECEIVE CALLBACK
   * ======================================================= */

  public onSyncReceived(
    callback:
      | SyncCallback
      | null
  ) {

    this.onSyncCallback =
      callback;
  }

  public getLastReceivedTick() {

    return this.lastReceivedTick;
  }

  /* =======================================================
   * RESET
   * ======================================================= */

  public resetSyncState() {

    this.lastReceivedTick = -1;
    this.sendSequence =0;
  }

  /* =======================================================
   * CLOSE
   * ======================================================= */

  public closeUDP() {

    this.stopSyncLoop();

    if (
      this.udpSocket
    ) {

      try {

        this.udpSocket.close();

      } catch (error) {

        console.log('UDP CLOSE ERROR:',error);
      }

      this.udpSocket = null;
    }

    this.targetIp = null;
    this.onSyncCallback = null;

    this.resetSyncState();
  }
}

/* =========================================================
 * SINGLETON
 * ========================================================= */

export const udpNetwork =
  new NetworkManagerUDP();