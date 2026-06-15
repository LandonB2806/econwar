/**
 * @econwar/solo — the single-player game orchestrator (Milestone 1).
 *
 * One human seat + AI bots (from @econwar/ai) play a full 4-phase EconWar game
 * with no networking. Drives the engine's pure FSM through the five-step round
 * loop and yields exactly one winner. See {@link SoloGame} for the full API.
 */
import { SoloGame } from "./SoloGame.js";
import type { SoloGameOptions } from "./types.js";

export { SoloGame } from "./SoloGame.js";
export type { SoloGameOptions, LeaderboardRow } from "./types.js";

/**
 * Create and return a ready-to-play solo game. The FSM starts in `lobby`; call
 * `game.step()` to open phase 0 (`indicator_reveal`) and then repeatedly to run
 * the game to completion.
 *
 * @example
 * const game = createSoloGame({
 *   seed: 42,
 *   human: { nickname: "You", department: "government" },
 * });
 * while (!game.isOver()) game.step();
 * console.log(game.getWinner()?.nickname);
 */
export function createSoloGame(opts: SoloGameOptions): SoloGame {
  return new SoloGame(opts);
}
