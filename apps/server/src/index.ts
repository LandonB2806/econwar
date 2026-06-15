/**
 * Public surface of @econwar/server. The authoritative multiplayer room, its
 * phase clock, the transport abstraction, and the wire protocol. All game truth
 * is computed by the pure @econwar/engine; this package only coordinates rooms,
 * timing, and the network boundary.
 */
export { Room, type RoomConfig } from "./Room.js";
export { PhaseClock } from "./phaseClock.js";
export { parseClientMessage } from "./intake.js";
export type { Transport, ClientId } from "./transport/Transport.js";
export { InMemoryTransport } from "./transport/InMemoryTransport.js";
export { WebSocketTransport } from "./transport/WebSocketTransport.js";
export * from "./protocol.js";
