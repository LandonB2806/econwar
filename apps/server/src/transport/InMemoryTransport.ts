/**
 * In-memory transport for deterministic tests and local simulation. Messages
 * are delivered synchronously; each "client" is just an id with an inbox the
 * test can read. No sockets, no timers.
 */
import type { ServerMsg } from "../protocol.js";
import type { ClientId, Transport } from "./Transport.js";

export class InMemoryTransport implements Transport {
  private msgHandler: ((c: ClientId, raw: unknown) => void) | null = null;
  private connectHandler: ((c: ClientId) => void) | null = null;
  private disconnectHandler: ((c: ClientId) => void) | null = null;
  private readonly clients = new Set<ClientId>();
  /** Per-client inbox of everything the server has sent (for assertions). */
  readonly inbox = new Map<ClientId, ServerMsg[]>();

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
    if (!this.clients.has(clientId)) return;
    const box = this.inbox.get(clientId) ?? [];
    box.push(msg);
    this.inbox.set(clientId, box);
  }

  broadcast(msg: ServerMsg): void {
    for (const c of this.clients) this.send(c, msg);
  }

  close(): void {
    this.clients.clear();
  }

  /* ---- test-side simulation helpers ---- */

  /** Simulate a client connecting. */
  connect(clientId: ClientId): void {
    this.clients.add(clientId);
    if (!this.inbox.has(clientId)) this.inbox.set(clientId, []);
    this.connectHandler?.(clientId);
  }

  /** Simulate a client sending a raw payload to the server. */
  recv(clientId: ClientId, raw: unknown): void {
    this.msgHandler?.(clientId, raw);
  }

  /** Simulate a client disconnecting. */
  disconnect(clientId: ClientId): void {
    if (!this.clients.delete(clientId)) return;
    this.disconnectHandler?.(clientId);
  }

  /** The latest message of a given type sent to a client (for assertions). */
  latest<T extends ServerMsg["t"]>(
    clientId: ClientId,
    type: T,
  ): Extract<ServerMsg, { t: T }> | undefined {
    const box = this.inbox.get(clientId) ?? [];
    for (let i = box.length - 1; i >= 0; i--) {
      const m = box[i];
      if (m && m.t === type) return m as Extract<ServerMsg, { t: T }>;
    }
    return undefined;
  }
}
