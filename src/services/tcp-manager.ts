// TCP ম্যানেজার সার্ভিস

import * as Network from 'expo-network';
import TcpSocket from 'react-native-tcp-socket';

const PORT = 12345;

type DataCallback = (data: any) => void;
type ConnectedCallback = () => void;
type DisconnectCallback = () => void;

export class NetworkManager {
  private server: any = null;
  private client: any = null;

  private onDataCallback: DataCallback | null = null;
  private onDisconnectCallback: DisconnectCallback | null = null;
  private messageListeners: DataCallback[] = [];

  // TCP data buffer
  private receiveBuffer = '';

  // Current role
  public isHost = false;

  // =========================================================
  // 0. EVENT LISTENERS MANAGEMENT & GETTERS
  // =========================================================

  /**
   * Register a message listener for incoming network events
   */
  onMessage(callback: DataCallback) {
    this.messageListeners.push(callback);

    // Unsubscribe function
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Set callback for when connection drops or opponent leaves
   */
  public setOnDisconnect(callback: DisconnectCallback | null) {
    this.onDisconnectCallback = callback;
  }

  public get getIsHost(): boolean {
    return this.isHost;
  }

  public checkIsHost(): boolean {
    return this.isHost;
  }

  // =========================================================
  // 1. GET LOCAL IP
  // =========================================================

  static async getLocalIP(): Promise<string> {
    try {
      console.log('=================================');
      console.log('GETTING LOCAL IP...');
      console.log('=================================');

      const ip = await Network.getIpAddressAsync();

      console.log('=================================');
      console.log('LOCAL IP:', ip);
      console.log('=================================');

      if (!ip || ip === '0.0.0.0') {
        throw new Error(
          'Could not get Wi-Fi IP address. Make sure the phone is connected to Wi-Fi.'
        );
      }

      return ip;
    } catch (error) {
      console.error('=================================');
      console.error('FAILED TO GET LOCAL IP');
      console.error(error);
      console.error('=================================');

      throw error;
    }
  }

  // =========================================================
  // 2. STOP SERVER / CLEANUP (FIX FOR EADDRINUSE)
  // =========================================================

  public async stopServer(): Promise<void> {
    // 1. Destroy active client socket
    if (this.client) {
      try {
        this.client.destroy();
      } catch (error) {
        console.log('Client destroy error during cleanup:', error);
      }
      this.client = null;
    }

    // 2. Close active server safely
    if (this.server) {
      await new Promise<void>((resolve) => {
        try {
          this.server.close(() => {
            console.log('Server closed successfully.');
            resolve();
          });
        } catch (error) {
          console.log('Error closing server:', error);
          resolve();
        }
      });
      this.server = null;
    }
  }

  // =========================================================
  // 3. START HOST
  // =========================================================

  async startHost(
    onClientConnected: ConnectedCallback,
    onDataReceived?: DataCallback
  ) {
    this.isHost = true;
    if (onDataReceived) {
      this.onDataCallback = onDataReceived;
    }
    this.receiveBuffer = '';

    console.log('=================================');
    console.log('STARTING HOST...');
    console.log('PORT:', PORT);
    console.log('=================================');

    try {
      // স্টার্ট করার আগে পুরোনো সার্ভার ও কানেকশন সম্পূর্ণ বন্ধ করা আবশ্যক
      await this.stopServer();

      // CREATE TCP SERVER
      this.server = TcpSocket.createServer((socket: any) => {
        console.log('=================================');
        console.log('CLIENT CONNECTED!');
        console.log('REMOTE ADDRESS:', socket.remoteAddress);
        console.log('=================================');

        if (this.client && this.client !== socket) {
          try {
            this.client.destroy();
          } catch (error) {
            console.error('Previous client destroy error:', error);
          }
        }

        this.client = socket;
        this.receiveBuffer = '';

        try {
          onClientConnected();
        } catch (error) {
          console.error('onClientConnected callback error:', error);
        }

        socket.on('data', (data: any) => {
          this.handleIncomingData(data);
        });

        socket.on('error', (error: any) => {
          console.error('CLIENT SOCKET ERROR:', error);
        });

        socket.on('close', () => {
          console.log('CLIENT DISCONNECTED');
          if (this.client === socket) {
            this.client = null;
          }
          this.receiveBuffer = '';

          // 🛑 প্রতিপক্ষ ক্লায়েন্ট ডিসকানেক্ট করলে হুক/UI জানানো
          if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
          }
        });
      });

      this.server.on('error', (error: any) => {
        console.error('=================================');
        console.error('SERVER ERROR:', error);
        console.error('=================================');
      });

      this.server.on('close', () => {
        console.log('SERVER CLOSED');
      });

      // LISTEN
      this.server.listen(
        {
          port: PORT,
          host: '0.0.0.0',
          reuseAddress: true,
        },
        () => {
          console.log('=================================');
          console.log('TCP SERVER STARTED SUCCESSFULLY ON PORT:', PORT);
          console.log('=================================');
        }
      );
    } catch (error) {
      console.error('FAILED TO START HOST:', error);
    }
  }

  // =========================================================
  // 4. CONNECT TO HOST
  // =========================================================

  async connectToHost(
    hostIp: string,
    onConnected: ConnectedCallback,
    onDataReceived?: DataCallback
  ) {
    this.isHost = false;
    if (onDataReceived) {
      this.onDataCallback = onDataReceived;
    }
    this.receiveBuffer = '';

    const cleanIp = hostIp.trim();

    if (!cleanIp) {
      console.error('HOST IP IS EMPTY');
      return;
    }

    console.log('=================================');
    console.log('CONNECTING TO HOST...');
    console.log('HOST IP:', cleanIp);
    console.log('PORT:', PORT);
    console.log('=================================');

    try {
      await this.stopServer();

      // CREATE TCP CONNECTION
      this.client = TcpSocket.createConnection(
        {
          host: cleanIp,
          port: PORT,
          reuseAddress: true,
          connectTimeout: 5000,
          interface: 'wifi',
        },
        () => {
          console.log('=================================');
          console.log('CONNECTED TO HOST!');
          console.log('HOST:', cleanIp);
          console.log('PORT:', PORT);
          console.log('=================================');

          try {
            onConnected();
          } catch (error) {
            console.error('onConnected callback error:', error);
          }
        }
      );

      this.client.on('data', (data: any) => {
        this.handleIncomingData(data);
      });

      this.client.on('error', (error: any) => {
        console.error('=================================');
        console.error('CONNECTION ERROR:', error);
        console.error('=================================');
      });

      this.client.on('close', () => {
        console.log('=================================');
        console.log('CONNECTION CLOSED BY HOST');
        console.log('=================================');

        this.client = null;
        this.receiveBuffer = '';

        // 🛑 হোস্ট ডিসকানেক্ট করলে ক্লায়েন্টকে জানানো
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      });
    } catch (error) {
      console.error('FAILED TO CONNECT:', error);
    }
  }

  // =========================================================
  // 5. HANDLE TCP DATA
  // =========================================================

  private handleIncomingData(data: any) {
    try {
      const chunk = data.toString();

      console.log('=================================');
      console.log('TCP DATA RECEIVED:', chunk);
      console.log('=================================');

      this.receiveBuffer += chunk;
      const messages = this.receiveBuffer.split('\n');

      this.receiveBuffer = messages.pop() || '';

      for (const message of messages) {
        const trimmed = message.trim();

        if (!trimmed) {
          continue;
        }

        try {
          const parsed = JSON.parse(trimmed);

          console.log('=================================');
          console.log('PARSED MESSAGE:', parsed);
          console.log('=================================');

          if (this.onDataCallback) {
            this.onDataCallback(parsed);
          }

          this.messageListeners.forEach((listener) => {
            try {
              listener(parsed);
            } catch (err) {
              console.error('Error executing message listener:', err);
            }
          });
        } catch (error) {
          console.error('JSON PARSE ERROR FOR MESSAGE:', trimmed, error);
        }
      }
    } catch (error) {
      console.error('HANDLE DATA ERROR:', error);
    }
  }

  // =========================================================
  // 6. SEND DATA
  // =========================================================

  send(data: object) {
    if (!this.client) {
      console.warn('=================================');
      console.warn('SEND FAILED: NO CLIENT CONNECTED');
      console.warn('=================================');
      return;
    }

    try {
      const message = JSON.stringify(data) + '\n';

      console.log('=================================');
      console.log('SENDING DATA:', data);
      console.log('=================================');

      this.client.write(message);
    } catch (error) {
      console.error('SEND ERROR:', error);
    }
  }

  // =========================================================
  // 7. CHECK STATUS
  // =========================================================

  isConnected(): boolean {
    return this.client !== null;
  }

  isRunningAsHost(): boolean {
    return this.isHost;
  }

  // =========================================================
  // 8. DISCONNECT
  // =========================================================

  async disconnect() {
    console.log('=================================');
    console.log('DISCONNECTING NETWORK...');
    console.log('=================================');

    await this.stopServer();

    this.receiveBuffer = '';
    this.onDataCallback = null;
    this.onDisconnectCallback = null;
    this.messageListeners = [];
    this.isHost = false;

    console.log('=================================');
    console.log('NETWORK DISCONNECTED SUCCESSFULLY');
    console.log('=================================');
  }
}

// ===========================================================
// SINGLETON
// ===========================================================

export const network = new NetworkManager();