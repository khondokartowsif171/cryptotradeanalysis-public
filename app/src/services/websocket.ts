/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */

type WSCallback = (data: any) => void;

class BinanceWebSocketManager {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<WSCallback>>();
  private streamList: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private connecting = false;

  private get url() {
    const streams = this.streamList.join('/');
    return `wss://stream.binance.com:9443/stream?streams=${streams}`;
  }

  subscribe(stream: string, callback: WSCallback) {
    if (!this.subscribers.has(stream)) {
      this.subscribers.set(stream, new Set());
    }
    this.subscribers.get(stream)!.add(callback);
    this.addStream(stream);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptions();
    } else if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => this.unsubscribe(stream, callback);
  }

  private unsubscribe(stream: string, callback: WSCallback) {
    const cbs = this.subscribers.get(stream);
    if (!cbs) return;
    cbs.delete(callback);
    if (cbs.size === 0) {
      this.subscribers.delete(stream);
      this.removeStream(stream);
      this.sendUnsubscriptions();
    }
  }

  private addStream(stream: string) {
    if (!this.streamList.includes(stream)) {
      this.streamList.push(stream);
    }
  }

  private removeStream(stream: string) {
    this.streamList = this.streamList.filter((s) => s !== stream);
  }

  private sendSubscriptions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params: this.streamList,
        id: Date.now(),
      })
    );
  }

  private sendUnsubscriptions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: this.streamList,
        id: Date.now(),
      })
    );
  }

  connect() {
    if (this.connecting || this.destroyed) return;
    if (this.streamList.length === 0) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.connecting = true;

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.stream && msg.data) {
          const cbs = this.subscribers.get(msg.stream);
          if (cbs) {
            cbs.forEach((cb) => {
              try {
                cb(msg.data);
              } catch {}
            });
          }
        }
      } catch {}
    };

    this.ws.onclose = () => {
      this.connecting = false;
      this.stopPing();
      if (!this.destroyed) this.reconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private reconnect() {
    if (this.destroyed) return;
    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) return;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    setTimeout(() => this.connect(), delay);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping', id: Date.now() }));
      }
    }, 180000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect() {
    this.destroyed = true;
    this.stopPing();
    this.subscribers.clear();
    this.streamList = [];
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

export const binanceWS = new BinanceWebSocketManager();
