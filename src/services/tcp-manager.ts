 // src/services/tcp-manager.ts


import * as Network from 'expo-network';

import TcpSocket from
  'react-native-tcp-socket';

import type {
  MultiplayerMessage,
} from '@/types/multiplayer';

const PORT = 12345;

const MAX_TCP_BUFFER_SIZE =
  1024 * 1024;

type DataCallback =
  (
    data: MultiplayerMessage
  ) => void;

type ConnectedCallback =
  () => void;

type DisconnectCallback =
  () => void;

export class NetworkManager {

  private server: any = null;

  private client: any = null;

  private connected = false;

  private onDataCallback:
    | DataCallback
    | null = null;

  private onDisconnectCallback:
    | DisconnectCallback
    | null = null;

  private messageListeners:
    DataCallback[] = [];

  /**
   * TCP stream buffer.
   *
   * TCP message-based না।
   * তাই এখানে chunk জমিয়ে
   * newline দেখে message বের করবো।
   */
  private receiveBuffer = '';

  /**
   * Local device host/client.
   */
  public isHost = false;

  /* =======================================================
   * LISTENER
   * ======================================================= */

  public onMessage(
    callback: DataCallback
  ) {

    this.messageListeners.push(
      callback
    );

    return () => {

      this.messageListeners =
        this.messageListeners.filter(
          cb =>
            cb !== callback
        );
    };
  }

  public setOnDisconnect(
    callback:
      | DisconnectCallback
      | null
  ) {

    this.onDisconnectCallback =
      callback;
  }

  public setOnData(
    callback:
      | DataCallback
      | null
  ) {

    this.onDataCallback =
      callback;
  }

  /* =======================================================
   * GETTERS
   * ======================================================= */

  public get getIsHost(): boolean {
    return this.isHost;
  }

  public checkIsHost(): boolean {
    return this.isHost;
  }

  /* =======================================================
   * LOCAL IP
   * ======================================================= */

  static async getLocalIP():
    Promise<string> {

    try {

      const ip =
        await Network
          .getIpAddressAsync();

      if (
        !ip ||
        ip === '0.0.0.0'
      ) {

        throw new Error(
          'Could not get Wi-Fi IP address. Make sure the phone is connected to Wi-Fi.'
        );
      }

      return ip;

    } catch (error) {

      console.error(
        'FAILED TO GET LOCAL IP:',
        error
      );

      throw error;
    }
  }

  /* =======================================================
   * STOP SERVER / CLEANUP
   * ======================================================= */

  public async stopServer():
    Promise<void> {

    this.connected = false;

    /* -----------------------------------------------------
     * CLIENT
     * --------------------------------------------------- */

    if (this.client) {

      try {

        this.client.destroy();

      } catch (error) {

        console.log(
          'Client destroy error during cleanup:',
          error
        );
      }

      this.client = null;
    }

    /* -----------------------------------------------------
     * SERVER
     * --------------------------------------------------- */

    if (this.server) {

      await new Promise<void>(
        resolve => {

          let resolved = false;

          const finish =
            () => {

              if (resolved) {
                return;
              }

              resolved = true;

              resolve();
            };

          try {

            this.server.close(
              () => {

                console.log(
                  'Server closed successfully.'
                );

                finish();
              }
            );

            /**
             * Native socket implementation
             * মাঝে মাঝে close event দেয় না।
             */
            setTimeout(
              finish,
              300
            );

          } catch (error) {

            console.log(
              'Error closing server:',
              error
            );

            finish();
          }
        }
      );

      this.server = null;
    }

    this.receiveBuffer = '';
  }

  /* =======================================================
   * START HOST
   * ======================================================= */

  async startHost(
    onClientConnected:
      ConnectedCallback,

    onDataReceived?:
      DataCallback
  ) {

    this.isHost = true;

    this.connected = false;

    if (onDataReceived) {

      this.onDataCallback =
        onDataReceived;
    }

    this.receiveBuffer = '';

    try {

      await this.stopServer();

      this.isHost = true;

      this.server =
        TcpSocket.createServer(
          (socket: any) => {

            console.log(
              'CLIENT CONNECTED:',
              socket.remoteAddress
            );

            /* ---------------------------------------------
             * ONLY TWO PLAYER
             * ------------------------------------------- */

            if (
              this.client &&
              this.client !== socket
            ) {

              console.warn(
                'Second client rejected.'
              );

              try {
                socket.destroy();
              } catch {}

              return;
            }

            /* ---------------------------------------------
             * STORE CLIENT
             * ------------------------------------------- */

            this.client =
              socket;

            this.connected =
              true;

            this.receiveBuffer =
              '';

            /* ---------------------------------------------
             * CONNECT CALLBACK
             * ------------------------------------------- */

            try {

              onClientConnected();

            } catch (error) {

              console.error(
                'onClientConnected callback error:',
                error
              );
            }

            /* ---------------------------------------------
             * DATA
             * ------------------------------------------- */

            socket.on(
              'data',
              (data: any) => {

                this.handleIncomingData(
                  data
                );
              }
            );

            /* ---------------------------------------------
             * ERROR
             * ------------------------------------------- */

            socket.on(
              'error',
              (error: any) => {

                console.error(
                  'CLIENT SOCKET ERROR:',
                  error
                );
              }
            );

            /* ---------------------------------------------
             * CLOSE
             * ------------------------------------------- */

            socket.on(
              'close',
              () => {

                console.log(
                  'CLIENT DISCONNECTED'
                );

                if (
                  this.client ===
                  socket
                ) {

                  this.client =
                    null;

                  this.connected =
                    false;
                }

                this.receiveBuffer =
                  '';

                this.onDisconnectCallback
                  ?.();
              }
            );
          }
        );

      /* ---------------------------------------------------
       * SERVER ERROR
       * ------------------------------------------------- */

      this.server.on(
        'error',
        (error: any) => {

          console.error(
            'SERVER ERROR:',
            error
          );
        }
      );

      this.server.on(
        'close',
        () => {

          console.log(
            'SERVER CLOSED'
          );
        }
      );

      /* ---------------------------------------------------
       * LISTEN
       * ------------------------------------------------- */

      this.server.listen(
        {
          port: PORT,

          host: '0.0.0.0',

          reuseAddress: true,
        },

        () => {

          console.log(
            'TCP SERVER STARTED:',
            PORT
          );
        }
      );

    } catch (error) {

      console.error(
        'FAILED TO START HOST:',
        error
      );

      this.connected =
        false;
    }
  }

  /* =======================================================
   * CONNECT TO HOST
   * ======================================================= */

  async connectToHost(
    hostIp: string,

    onConnected:
      ConnectedCallback,

    onDataReceived?:
      DataCallback
  ) {

    this.isHost = false;

    this.connected = false;

    if (onDataReceived) {

      this.onDataCallback =
        onDataReceived;
    }

    this.receiveBuffer =
      '';

    const cleanIp =
      hostIp.trim();

    if (!cleanIp) {

      console.error(
        'HOST IP IS EMPTY'
      );

      return;
    }

    try {

      await this.stopServer();

      this.isHost = false;

      this.client =
        TcpSocket.createConnection(
          {
            host: cleanIp,

            port: PORT,

            reuseAddress: true,

            connectTimeout: 5000,

            interface: 'wifi',
          },

          () => {

            console.log(
              'CONNECTED TO HOST:',
              cleanIp
            );

            this.connected =
              true;

            try {

              onConnected();

            } catch (error) {

              console.error(
                'onConnected callback error:',
                error
              );
            }
          }
        );

      /* ---------------------------------------------------
       * DATA
       * ------------------------------------------------- */

      this.client.on(
        'data',
        (data: any) => {

          this.handleIncomingData(
            data
          );
        }
      );

      /* ---------------------------------------------------
       * ERROR
       * ------------------------------------------------- */

      this.client.on(
        'error',
        (error: any) => {

          console.error(
            'CONNECTION ERROR:',
            error
          );
        }
      );

      /* ---------------------------------------------------
       * CLOSE
       * ------------------------------------------------- */

      this.client.on(
        'close',
        () => {

          console.log(
            'CONNECTION CLOSED BY HOST'
          );

          this.client =
            null;

          this.connected =
            false;

          this.receiveBuffer =
            '';

          this.onDisconnectCallback
            ?.();
        }
      );

    } catch (error) {

      console.error(
        'FAILED TO CONNECT:',
        error
      );

      this.connected =
        false;
    }
  }

  /* =======================================================
   * RECEIVE TCP DATA
   * ======================================================= */

  private handleIncomingData(
    data: any
  ) {

    try {

      const chunk =
        data?.toString?.() ??
        '';

      if (!chunk) {
        return;
      }

      this.receiveBuffer +=
        chunk;

      /* ---------------------------------------------------
       * PROTECTION
       * ------------------------------------------------- */

      if (
        this.receiveBuffer.length >
        MAX_TCP_BUFFER_SIZE
      ) {

        console.error(
          'TCP RECEIVE BUFFER TOO LARGE.'
        );

        this.receiveBuffer =
          '';

        return;
      }

      /* ---------------------------------------------------
       * SPLIT MESSAGE
       *
       * প্রতিটি TCP message-এর
       * শেষে \n থাকবে।
       * ------------------------------------------------- */

      const messages =
        this.receiveBuffer
          .split('\n');

      /**
       * শেষ অংশ incomplete হতে পারে।
       */
      this.receiveBuffer =
        messages.pop() || '';

      /* ---------------------------------------------------
       * PARSE
       * ------------------------------------------------- */

      for (
        const message of messages
      ) {

        const trimmed =
          message.trim();

        if (!trimmed) {
          continue;
        }

        try {

          const parsed =
            JSON.parse(
              trimmed
            ) as MultiplayerMessage;

          /* Main callback */

          this.onDataCallback
            ?.(
              parsed
            );

          /* Other listeners */

          [
            ...this.messageListeners
          ].forEach(
            listener => {

              try {

                listener(
                  parsed
                );

              } catch (error) {

                console.error(
                  'Message listener error:',
                  error
                );
              }
            }
          );

        } catch (error) {

          console.error(
            'JSON PARSE ERROR:',
            trimmed,
            error
          );
        }
      }

    } catch (error) {

      console.error(
        'HANDLE TCP DATA ERROR:',
        error
      );
    }
  }

  /* =======================================================
   * SEND
   * ======================================================= */

  send(
    data: MultiplayerMessage
  ): boolean {

    if (
      !this.client ||
      !this.connected
    ) {
      console.warn( this.client, this.connected );

      console.warn(
        'SEND FAILED: NO TCP CONNECTION'
      );

      return false;
    }

    try {

      const message =
        JSON.stringify(data) +
        '\n';

      this.client.write(
        message
      );

      return true;

    } catch (error) {

      console.error(
        'SEND ERROR:',
        error
      );

      return false;
    }
  }

  /* =======================================================
   * GAME ACTION HELPERS
   * ======================================================= */

  sendKick(data: {
    tick?: number;

    shotId?: number;

    flickData: any;
  }) {

    return this.send({
      type:
        'REMOTE_ACTION',

      action:
        'KICK',

      ...data,
    });
  }

  sendDive(data: {
    tick?: number;

    direction:
      | 'left'
      | 'right'
      | 'center';
  }) {

    return this.send({
      type:
        'REMOTE_ACTION',

      action:
        'DIVE',

      ...data,
    });
  }

  /* =======================================================
   * TURN CHANGE
   * ======================================================= */

  sendTurnChange(
    data: {

      round: number;

      hostRole:
        | 'SHOOTER'
        | 'KEEPER';

      clientRole:
        | 'SHOOTER'
        | 'KEEPER';

      nextShooter:
        | 'P1'
        | 'P2'
        | 'AI';

      tick: number;
    }
  ) {

    return this.send({
      type:
        'TURN_CHANGE',

      ...data,
    });
  }

  /* =======================================================
   * SHOT RESULT
   * ======================================================= */

  sendShotResult(
    data: {

      shotId: number;

      tick: number;

      isGoal: boolean;

      isSaved: boolean;

      score: number;

      shotsLeft: number;

      isGameOver: boolean;

      winner?:
        | 'P1'
        | 'P2'
        | 'DRAW';
    }
  ) {

    return this.send({
      type:
        'SHOT_RESULT',

      ...data,
    });
  }

  /* =======================================================
   * STATUS
   * ======================================================= */

  isConnected(): boolean {

    return (
      this.connected &&
      this.client !== null
    );
  }

  isRunningAsHost(): boolean {

    return this.isHost;
  }

  /* =======================================================
   * DISCONNECT
   * ======================================================= */

  async disconnect() {

    await this.stopServer();

    this.receiveBuffer =
      '';

    this.onDataCallback =
      null;

    this.onDisconnectCallback =
      null;

    this.messageListeners =
      [];

    this.isHost =
      false;

    this.connected =
      false;

    console.log(
      'NETWORK DISCONNECTED SUCCESSFULLY'
    );
  }
}

/* =========================================================
 * SINGLETON
 * ========================================================= */

export const tcpNetwork =
  new NetworkManager();

export const network =
  tcpNetwork;