/** Quick end-to-end demo: play a full 4-phase solo game and print the winner. */
import { createSoloGame } from "@econwar/solo";

const game = createSoloGame({
  seed: 42,
  human: { nickname: "You", department: "politics_global" },
});

let guard = 0;
while (!game.isOver() && guard++ < 100) game.step();

const fmt = (satang: bigint) =>
  "฿" + (Number(satang) / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });

console.log(`Game over after phase ${game.getPhaseIndex() + 1}. Final standings:\n`);
for (const row of game.getLeaderboard()) {
  const p = game.getPlayers().find((pl) => pl.id === row.playerId)!;
  console.log(
    `  #${row.rank}  ${p.nickname.padEnd(8)} ${p.department.padEnd(16)} ${fmt(p.money)}`,
  );
}
console.log(`\nWinner: ${game.getWinner()?.nickname} (${game.getWinner()?.department})`);
