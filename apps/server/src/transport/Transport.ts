/**
 * Transport abstraction — decouples the authoritative Room from the wire.
 *
 * The Room only knows "send a ServerMsg to a clientId" and "a clientId sent a
 * raw payload". Concrete transports:
 *   - InMemoryTransport — deterministic, for tests + the solo-as-multi harness.
 *   - WebSocketTransport — real local multiplayer (Node `ws`).
 *   - (future) SupabaseRealtimeTransport — drop-in for the hosted event; the
 *     Room code does not change. See apps/server/db + docs/MULTIPLAYER_ARCHITECTURE.md.
 *
 * `clientId` is a connection-level id (one per socket). The Room maps it to a
 * game-level `playerId` on join.
 */
import type { ServerMsg } from "../protocol.js";

export type ClientId = string;

export interface Transport {
  /** Register the handler for inbound raw messages from a client. */
  onMessage(handler: (clientId: ClientId, raw: unknown) => void): void;
  /** Register connect / disconnect handlers. */
  onConnect(handler: (clientId: ClientId) => void): void;
  onDisconnect(handler: (clientId: ClientId) => void): void;
  /** Send to a single client. No-op if the client is gone. */
  send(clientId: ClientId, msg: ServerMsg): void;
  /** Send to every connected client. */
  broadcast(msg: ServerMsg): void;
  /** Tear down. */
  close(): void;
}
