/**
 * Live multiplayer server entry. Boots a WebSocket transport, hosts one Room
 * with a fixed join code, and runs the phase clock. The game auto-starts a few
 * seconds after the first human joins (empty departments are filled by AI bots).
 *
 * Run: npm --workspace @econwar/server run start   (or `run dev` to watch)
 * Env: PORT (default 8787), SEED (default random), JOIN_CODE (default "ECONWAR").
 */
import { Room } from "./Room.js";
import { PhaseClock } from "./phaseClock.js";
import { WebSocketTransport } from "./transport/WebSocketTransport.js";

const PORT = Number(process.env.PORT ?? 8787);
const JOIN_CODE = process.env.JOIN_CODE ?? "ECONWAR";
const SEED = Number(process.env.SEED ?? Math.floor(Math.random() * 0xffffffff));
const LOBBY_GRACE_MS = Number(process.env.LOBBY_GRACE_MS ?? 8000);

const transport = new WebSocketTransport(PORT);
const room = new Room(transport, { joinCode: JOIN_CODE, seed: SEED });
const clock = new PhaseClock(room);

console.log(
  `EconWar server on ws://localhost:${PORT}  join code "${JOIN_CODE}"  seed ${SEED}`,
);

// Auto-start the game shortly after the first player joins.
let startTimer: ReturnType<typeof setTimeout> | null = null;
const poll = setInterval(() => {
  if (room.started()) {
    clearInterval(poll);
    return;
  }
  if (room.humanCount() >= 1 && !startTimer) {
    console.log(`First player joined — starting in ${LOBBY_GRACE_MS}ms…`);
    startTimer = setTimeout(() => {
      room.start();
      clock.start();
      console.log("Game started.");
    }, LOBBY_GRACE_MS);
  }
}, 500);
