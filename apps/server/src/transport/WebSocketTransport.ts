/**
 * WebSocket transport (Node `ws`) for real local multiplayer. Each socket is a
 * client; we assign it a uuid-ish id. Outbound ServerMsgs are JSON-serialized
 * with a bigint→number replacer (satang/bp are all within Number.MAX_SAFE_INTEGER),
 * so clients receive plain JSON.
 *
 * This is one concrete Transport; swapping in Supabase Realtime later does not
 * touch the Room (see docs/MULTIPLAYER_ARCHITECTURE.md).
 */
import { WebSocketServer, type WebSocket } from "ws";
import type { ServerMsg } from "../protocol.js";
import type { ClientId, Transport } from "./Transport.js";

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? Number(value) : value;
}

export class WebSocketTransport implements Transport {
  private readonly wss: WebSocketServer;
  private readonly sockets = new Map<ClientId, WebSocket>();
  private msgHandler: ((c: ClientId, raw: unknown) => void) | null = null;
  private connectHandler: ((c: ClientId) => void) | null = null;
  private disconnectHandler: ((c: ClientId) => void) | null = null;
  private nextId = 1;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on("connection", (socket) => {
      const id: ClientId = `c${this.nextId++}`;
      this.sockets.set(id, socket);
      this.connectHandler?.(id);
      socket.on("message", (data) => {
        this.msgHandler?.(id, data.toString());
      });
      socket.on("close", () => {
        this.sockets.delete(id);
        this.disconnectHandler?.(id);
      });
      socket.on("error", () => {
        // swallow per-socket errors; close handler does cleanup
      });
    });
  }

  onMessage(handler: (clientId: ClientId, raw: unknown) => void): void {
    this.msgHandler = handler;
  }
  onConnect(handler: (clientId: ClientId) => void): void {
    this.connectHandler = handler;
  }
  onDisconnect(handler: (clientId: ClientId) => void): void {
    this.disconnectHandler = handler;
  }

  send(clientId: ClientId, msg: ServerMsg): void {
    const socket = this.sockets.get(clientId);
    if (!socket || socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify(msg, bigintReplacer));
  }

  broadcast(msg: ServerMsg): void {
    const payload = JSON.stringify(msg, bigintReplacer);
    for (const socket of this.sockets.values()) {
      if (socket.readyState === socket.OPEN) socket.send(payload);
    }
  }

  close(): void {
    for (const socket of this.sockets.values()) socket.close();
    this.sockets.clear();
    this.wss.close();
  }
}
