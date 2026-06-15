import { beforeEach, describe, expect, it } from "vitest";
import type { DepartmentId, PlayerId } from "@econwar/shared";
import { Room } from "../src/Room.js";
import { InMemoryTransport } from "../src/transport/InMemoryTransport.js";

const CODE = "TEST";

function makeRoom(seed: number, aiFill = true) {
  const t = new InMemoryTransport();
  const room = new Room(t, {
    joinCode: CODE,
    seed,
    aiFillEmptyDepartments: aiFill,
  });
  return { t, room };
}

function join(
  t: InMemoryTransport,
  clientId: string,
  nickname: string,
  department: DepartmentId,
): PlayerId {
  t.connect(clientId);
  t.recv(clientId, { t: "join", joinCode: CODE, nickname, department });
  return t.latest(clientId, "joined")!.playerId;
}

/** Drive the room to game over with no human intents (defaults + bots). */
function runToEnd(room: Room): void {
  let guard = 0;
  while (!room.isOver() && guard++ < 200) room.closeStep();
}

/** Advance from a freshly-started room to the allocation step. */
function toAllocation(room: Room): void {
  // indicator_reveal → vote → controller_action → allocation
  room.closeStep();
  room.closeStep();
  room.closeStep();
}

describe("Room — lobby + start", () => {
  it("seats joined humans and fills empty departments with bots", () => {
    const { t, room } = makeRoom(1);
    join(t, "c1", "Alice", "government");
    join(t, "c2", "Bob", "ir");
    expect(room.humanCount()).toBe(2);
    room.start();
    // 2 humans + 3 bot-filled departments = all 5 departments seated
    const players = room.getState()!.players;
    expect(players).toHaveLength(5);
    expect(new Set(players.map((p) => p.department)).size).toBe(5);
  });

  it("rejects joining after the game has started", () => {
    const { t, room } = makeRoom(1);
    join(t, "c1", "Alice", "government");
    room.start();
    t.connect("c2");
    t.recv("c2", { t: "join", joinCode: CODE, nickname: "Late", department: "ir" });
    expect(t.latest("c2", "error")).toBeDefined();
  });
});

describe("Room — full multiplayer game", () => {
  it("runs all 4 phases to a single winner", () => {
    const { t, room } = makeRoom(2024);
    join(t, "c1", "Alice", "government");
    join(t, "c2", "Bob", "sociology");
    room.start();
    runToEnd(room);

    expect(room.isOver()).toBe(true);
    const view = room.debugViewFor(t.latest("c1", "joined")!.playerId);
    expect(view.over).toBe(true);
    expect(view.leaderboard).toHaveLength(5);
    expect(view.leaderboard[0]!.rank).toBe(1);
    expect(view.leaderboard.filter((r) => r.rank === 1)).toHaveLength(1);
  });

  it("scales to 12 players across the 5 departments", () => {
    const { t, room } = makeRoom(99);
    const depts: DepartmentId[] = [
      "government",
      "ir",
      "sociology",
      "public_admin",
      "politics_global",
    ];
    for (let i = 0; i < 12; i++) {
      join(t, `c${i}`, `P${i}`, depts[i % depts.length]!);
    }
    expect(room.humanCount()).toBe(12);
    room.start();
    // all 5 departments already covered → no bots added
    expect(room.getState()!.players).toHaveLength(12);
    runToEnd(room);
    expect(room.isOver()).toBe(true);
    expect(room.getLastSettlement()).not.toBeNull();
  });
});

describe("Room — server authority + anti-leak (golden rules #4/#5)", () => {
  let t: InMemoryTransport;
  let room: Room;
  let a: PlayerId;
  let b: PlayerId;

  beforeEach(() => {
    ({ t, room } = makeRoom(7));
    a = join(t, "ca", "Alice", "government");
    b = join(t, "cb", "Bob", "ir");
    room.start();
    toAllocation(room);
  });

  it("hides rivals' allocations + hidden phase/tilt before settlement", () => {
    // Alice allocates; Bob has not → not all ready, so no auto-settle yet.
    t.recv("ca", {
      t: "allocate",
      amounts: { central: 500000, north: 0, south: 0, northeast: 0 },
    });
    const view = t.latest("ca", "view")!;
    expect(view.step).toBe("allocation");
    expect(view.view.settled).toBe(false);
    // Own allocation visible…
    expect(view.view.ownAllocation?.central).toBe(500000n);
    // …rivals' and hidden truth are NOT.
    expect(view.view.allAllocations).toBeNull();
    expect(view.view.phaseType).toBeNull();
    expect(view.view.controllerTilt).toBeNull();
    expect(view.settlement).toBeNull();
    // The leak guard: Bob's allocation must not appear anywhere in Alice's payload.
    const serialized = JSON.stringify(view, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    );
    expect(serialized).not.toContain('"cb"');
  });

  it("reveals hidden truth only after settlement", () => {
    t.recv("ca", {
      t: "allocate",
      amounts: { central: 500000, north: 0, south: 0, northeast: 0 },
    });
    t.recv("cb", {
      t: "allocate",
      amounts: { central: 0, north: 400000, south: 0, northeast: 0 },
    }); // both ready → auto-close → settle
    const view = t.latest("ca", "view")!;
    expect(view.view.settled).toBe(true);
    expect(view.view.phaseType).not.toBeNull();
    expect(view.view.controllerTilt).not.toBeNull();
    expect(view.view.allAllocations).not.toBeNull();
    expect(view.settlement).not.toBeNull();
  });

  it("ignores intents that aren't valid for the current step / player", () => {
    // Bad allocation: exceeds available money.
    t.recv("ca", {
      t: "allocate",
      amounts: {
        central: 999999999,
        north: 999999999,
        south: 0,
        northeast: 0,
      },
    });
    expect(t.latest("ca", "error")).toBeDefined();

    // Voting outside the vote step is rejected.
    t.recv("cb", { t: "vote", candidatePlayerId: a });
    expect(t.latest("cb", "error")).toBeDefined();
  });

  it("rejects a malformed message without crashing the room", () => {
    t.recv("ca", { t: "allocate", amounts: { central: -5 } });
    expect(t.latest("ca", "error")).toBeDefined();
    expect(() => room.closeStep()).not.toThrow();
  });
});

describe("Room — determinism", () => {
  it("same seed + same (default) play → identical final standings", () => {
    const play = (seed: number) => {
      const { t, room } = makeRoom(seed);
      join(t, "c1", "Alice", "government");
      join(t, "c2", "Bob", "sociology");
      room.start();
      runToEnd(room);
      return room
        .getState()!
        .players.map((p) => ({ id: p.id, money: p.money.toString(), pc: p.pc }));
    };
    expect(play(31415)).toEqual(play(31415));
  });
});
