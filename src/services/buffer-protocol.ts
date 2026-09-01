// // src/services/buffer-protocol.ts


import type {
  SyncPacketData,
} from '@/types/multiplayer';

/* =========================================================
 * UDP BINARY PROTOCOL
 * =========================================================

   Packet:

   0 - 1       MAGIC
   2            VERSION
   3            PACKET TYPE

   4 - 7       TICK
   8 - 11      SEQUENCE
   12 - 15     ROUND

   16           SHOOTER

   17 - 28      BALL POSITION
   29 - 40      BALL VELOCITY

   41 - 52      KEEPER POSITION
   53 - 64      KEEPER VELOCITY

   65 - 68      SCORE
   69           SHOTS LEFT
   70           GAME OVER

   TOTAL = 71 BYTES

 * ========================================================= */

const MAGIC = 0x4642; // FB

const VERSION = 1;

const PACKET_TYPE_SYNC = 1;

const PACKET_SIZE = 71;

/* =========================================================
 * HELPERS
 * ========================================================= */

function finite(
  value: unknown,
  fallback = 0
): number {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : fallback;
}

/* =========================================================
 * SHOOTER -> NUMBER
 * ========================================================= */

function shooterToNumber(
  shooter: SyncPacketData['currentShooter']
): number {

  if (shooter === 'P1') {
    return 0;
  }

  if (shooter === 'P2') {
    return 1;
  }

  return 2;
}

/* =========================================================
 * NUMBER -> SHOOTER
 * ========================================================= */

function numberToShooter(
  value: number
): SyncPacketData['currentShooter'] {

  if (value === 0) {
    return 'P1';
  }

  if (value === 1) {
    return 'P2';
  }

  return 'AI';
}

/* =========================================================
 * WRITE VECTOR
 * ========================================================= */

function writeVec3(
  view: DataView,
  offset: number,
  value: any
): number {

  view.setFloat32(
    offset,
    finite(value?.x),
    true
  );

  view.setFloat32(
    offset + 4,
    finite(value?.y),
    true
  );

  view.setFloat32(
    offset + 8,
    finite(value?.z),
    true
  );

  return offset + 12;
}

/* =========================================================
 * READ VECTOR
 * ========================================================= */

function readVec3(
  view: DataView,
  offset: number
) {

  return {
    value: {
      x: view.getFloat32(
        offset,
        true
      ),

      y: view.getFloat32(
        offset + 4,
        true
      ),

      z: view.getFloat32(
        offset + 8,
        true
      ),
    },

    next: offset + 12,
  };
}

/* =========================================================
 * RAW -> UINT8ARRAY
 * ========================================================= */

function toUint8Array(
  raw: unknown
): Uint8Array {

  if (
    raw instanceof Uint8Array
  ) {
    return raw;
  }

  if (
    raw instanceof ArrayBuffer
  ) {
    return new Uint8Array(raw);
  }

  /**
   * Development compatibility.
   *
   * পুরোনো JSON packet test করা যাবে।
   */
  if (
    typeof raw === 'string'
  ) {

    const parsed =
      JSON.parse(raw.trim());

    const json =
      JSON.stringify(parsed);

    const encoded =
      new TextEncoder().encode(json);

    return encoded;
  }

  if (
    raw &&
    typeof (raw as any).length ===
      'number'
  ) {

    return new Uint8Array(
      raw as any
    );
  }

  throw new Error(
    'Unsupported UDP packet type.'
  );
}

/* =========================================================
 * UINT8ARRAY -> BUFFER
 * ========================================================= */

function toSendBuffer(
  bytes: Uint8Array
): any {

  try {

    // eslint-disable-next-line
    // @ts-ignore
    const bufferModule =
      require('buffer');

    if (
      bufferModule?.Buffer
    ) {

      return bufferModule.Buffer.from(
        bytes
      );
    }

  } catch {
    // Buffer unavailable.
  }

  return bytes;
}

/* =========================================================
 * BUFFER PROTOCOL
 * ========================================================= */

export class BufferProtocol {

  static readonly MAGIC =
    MAGIC;

  static readonly VERSION =
    VERSION;

  static readonly PACKET_SIZE =
    PACKET_SIZE;

  /* =======================================================
   * ENCODE
   * ======================================================= */

  static encodeSyncPacket(
    data: SyncPacketData
  ): any {

    const bytes =
      new Uint8Array(
        PACKET_SIZE
      );

    const view =
      new DataView(
        bytes.buffer
      );

    let offset = 0;

    /* -----------------------------------------------------
     * HEADER
     * --------------------------------------------------- */

    view.setUint16(
      offset,
      MAGIC,
      true
    );

    offset += 2;

    view.setUint8(
      offset,
      VERSION
    );

    offset += 1;

    view.setUint8(
      offset,
      PACKET_TYPE_SYNC
    );

    offset += 1;

    /* -----------------------------------------------------
     * TICK
     * --------------------------------------------------- */

    view.setUint32(
      offset,
      Math.max(
        0,
        data.tick >>> 0
      ),
      true
    );

    offset += 4;

    /* -----------------------------------------------------
     * SEQUENCE
     * --------------------------------------------------- */

    view.setUint32(
      offset,
      Math.max(
        0,
        (
          data.sequence ??
          data.tick
        ) >>> 0
      ),
      true
    );

    offset += 4;

    /* -----------------------------------------------------
     * ROUND
     * --------------------------------------------------- */

    view.setUint32(
      offset,
      Math.max(
        0,
        (
          data.round ??
          0
        ) >>> 0
      ),
      true
    );

    offset += 4;

    /* -----------------------------------------------------
     * SHOOTER
     * --------------------------------------------------- */

    view.setUint8(
      offset,
      shooterToNumber(
        data.currentShooter
      )
    );

    offset += 1;

    /* -----------------------------------------------------
     * BALL
     * --------------------------------------------------- */

    offset = writeVec3(
      view,
      offset,
      data.ball?.pos
    );

    offset = writeVec3(
      view,
      offset,
      data.ball?.vel
    );

    /* -----------------------------------------------------
     * KEEPER
     * --------------------------------------------------- */

    offset = writeVec3(
      view,
      offset,
      data.keeper?.pos
    );

    offset = writeVec3(
      view,
      offset,
      data.keeper?.vel
    );

    /* -----------------------------------------------------
     * SCORE
     * --------------------------------------------------- */

    view.setInt32(
      offset,
      Math.trunc(
        finite(
          data.matchInfo?.score
        )
      ),
      true
    );

    offset += 4;

    /* -----------------------------------------------------
     * SHOTS LEFT
     * --------------------------------------------------- */

    view.setUint8(
      offset,
      Math.max(
        0,
        Math.min(
          255,
          Math.trunc(
            finite(
              data.matchInfo
                ?.shotsLeft
            )
          )
        )
      )
    );

    offset += 1;

    /* -----------------------------------------------------
     * GAME OVER
     * --------------------------------------------------- */

    view.setUint8(
      offset,
      data.matchInfo
        ?.isGameOver
        ? 1
        : 0
    );

    return toSendBuffer(
      bytes
    );
  }

  /* =======================================================
   * DECODE
   * ======================================================= */

  static decodeSyncPacket(
    raw:
      | Uint8Array
      | ArrayBuffer
      | string
  ): SyncPacketData | null {

    try {

      /* ---------------------------------------------------
       * JSON DEVELOPMENT SUPPORT
       * ------------------------------------------------- */

      if (
        typeof raw === 'string'
      ) {

        return JSON.parse(
          raw.trim()
        ) as SyncPacketData;
      }

      const bytes =
        toUint8Array(raw);

      /* ---------------------------------------------------
       * OLD JSON BUFFER
       * ------------------------------------------------- */

      if (
        bytes.length > 0 &&
        (
          bytes[0] === 0x7b ||
          bytes[0] === 0x5b
        )
      ) {

        const text =
          new TextDecoder()
            .decode(bytes);

        return JSON.parse(
          text
        ) as SyncPacketData;
      }

      /* ---------------------------------------------------
       * SIZE CHECK
       * ------------------------------------------------- */

      if (
        bytes.byteLength <
        PACKET_SIZE
      ) {

        throw new Error(
          `Invalid sync packet size: ${bytes.byteLength}`
        );
      }

      const view =
        new DataView(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength
        );

      let offset = 0;

      /* ---------------------------------------------------
       * MAGIC
       * ------------------------------------------------- */

      const magic =
        view.getUint16(
          offset,
          true
        );

      offset += 2;

      if (
        magic !== MAGIC
      ) {

        throw new Error(
          'Invalid sync packet magic.'
        );
      }

      /* ---------------------------------------------------
       * VERSION
       * ------------------------------------------------- */

      const version =
        view.getUint8(
          offset
        );

      offset += 1;

      if (
        version !== VERSION
      ) {

        throw new Error(
          `Unsupported sync protocol version: ${version}`
        );
      }

      /* ---------------------------------------------------
       * TYPE
       * ------------------------------------------------- */

      const type =
        view.getUint8(
          offset
        );

      offset += 1;

      if (
        type !== PACKET_TYPE_SYNC
      ) {

        throw new Error(
          `Unsupported UDP packet type: ${type}`
        );
      }

      /* ---------------------------------------------------
       * TICK
       * ------------------------------------------------- */

      const tick =
        view.getUint32(
          offset,
          true
        );

      offset += 4;

      /* ---------------------------------------------------
       * SEQUENCE
       * ------------------------------------------------- */

      const sequence =
        view.getUint32(
          offset,
          true
        );

      offset += 4;

      /* ---------------------------------------------------
       * ROUND
       * ------------------------------------------------- */

      const round =
        view.getUint32(
          offset,
          true
        );

      offset += 4;

      /* ---------------------------------------------------
       * SHOOTER
       * ------------------------------------------------- */

      const shooter =
        numberToShooter(
          view.getUint8(
            offset
          )
        );

      offset += 1;

      /* ---------------------------------------------------
       * BALL POSITION
       * ------------------------------------------------- */

      const ballPos =
        readVec3(
          view,
          offset
        );

      offset =
        ballPos.next;

      /* ---------------------------------------------------
       * BALL VELOCITY
       * ------------------------------------------------- */

      const ballVel =
        readVec3(
          view,
          offset
        );

      offset =
        ballVel.next;

      /* ---------------------------------------------------
       * KEEPER POSITION
       * ------------------------------------------------- */

      const keeperPos =
        readVec3(
          view,
          offset
        );

      offset =
        keeperPos.next;

      /* ---------------------------------------------------
       * KEEPER VELOCITY
       * ------------------------------------------------- */

      const keeperVel =
        readVec3(
          view,
          offset
        );

      offset =
        keeperVel.next;

      /* ---------------------------------------------------
       * SCORE
       * ------------------------------------------------- */

      const score =
        view.getInt32(
          offset,
          true
        );

      offset += 4;

      /* ---------------------------------------------------
       * SHOTS LEFT
       * ------------------------------------------------- */

      const shotsLeft =
        view.getUint8(
          offset
        );

      offset += 1;

      /* ---------------------------------------------------
       * GAME OVER
       * ------------------------------------------------- */

      const isGameOver =
        view.getUint8(
          offset
        ) === 1;

      /* ---------------------------------------------------
       * RESULT
       * ------------------------------------------------- */

      return {

        tick,

        sequence,

        round,

        currentShooter:
          shooter,

        ball: {
          pos: ballPos.value,
          vel: ballVel.value,
        },

        keeper: {
          pos: keeperPos.value,
          vel: keeperVel.value,
        },

        matchInfo: {
          score,
          shotsLeft,
          isGameOver,
        },
      };

    } catch (error) {

      console.error(
        'Buffer Decoding Error:',
        error
      );

      return null;
    }
  }

  /* =======================================================
   * TEST HELPER
   * ======================================================= */

  static encodeToUint8Array(
    data: SyncPacketData
  ): Uint8Array {

    const encoded =
      this.encodeSyncPacket(
        data
      );

    if (
      encoded instanceof
      Uint8Array
    ) {

      return encoded;
    }

    return new Uint8Array(
      encoded
    );
  }
}