/** Smoke test: boot the real WebSocket server, connect a real client, join,
 * start the game, and confirm a projected view arrives over the socket. */
import { WebSocket } from "ws";
import { Room, WebSocketTransport } from "@econwar/server";

const port = 8799;
const transport = new WebSocketTransport(port);
const room = new Room(transport, { joinCode: "SMOKE", seed: 123 });

const got: string[] = [];
const ws = new WebSocket(`ws://localhost:${port}`);

const fail = (why: string) => {
  console.error("SMOKE FAIL:", why, got);
  process.exit(1);
};

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      t: "join",
      joinCode: "SMOKE",
      nickname: "Smoke",
      department: "government",
    }),
  );
});

ws.on("message", (data: Buffer) => {
  const m = JSON.parse(data.toString()) as { t: string; [k: string]: unknown };
  got.push(m.t);
  if (m.t === "joined") room.start(); // server-side start (same process)
  if (m.t === "view") {
    const view = m as unknown as {
      step: string;
      view: { players: unknown[] };
      leaderboard: unknown[];
    };
    console.log(
      `received view over socket — step=${view.step}, players=${view.view.players.length}, leaderboard=${view.leaderboard.length}`,
    );
    ws.close();
    transport.close();
    console.log("SMOKE OK:", got.join(" → "));
    process.exit(0);
  }
});

ws.on("error", (e) => fail(String(e)));
setTimeout(() => fail("timeout"), 5000);
