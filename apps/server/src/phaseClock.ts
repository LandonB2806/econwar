/**
 * The phase clock — the always-on driver that closes a Room's current step when
 * its deadline passes (CLAUDE.md: a small Node worker owns the countdown and
 * calls settlement at window close). It only reads `room.getDeadline()` and
 * calls `room.closeStep()`; all authority lives in the Room/engine.
 *
 * Tests drive `room.closeStep()` directly and never start a clock, keeping them
 * deterministic and wall-clock-free.
 */
import type { Room } from "./Room.js";

export class PhaseClock {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly room: Room,
    private readonly tickMs = 250,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (this.room.isOver()) {
      this.stop();
      return;
    }
    const deadline = this.room.getDeadline();
    if (deadline !== null && Date.now() >= deadline) {
      this.room.closeStep();
    }
  }
}
