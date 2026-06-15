/**
 * The living coin-ledger — EconWar's signature element (DESIGN.md §8).
 *
 * A player's wealth is shown as PHYSICAL stacks of pixel coins (gold = Money)
 * and tokens (teal = Political Capital), not cold numbers. This is the page's
 * memorable identity and the home of the two-currency rule: gold vs teal, read
 * at a glance.
 */
import { CoinIcon, PcTokenIcon } from "./PixelIcon.js";
import { formatBaht } from "../format.js";
import type { Satang } from "@econwar/shared";

/** ฿5,000 of capital per drawn coin; capped so the stack stays readable. */
const SATANG_PER_COIN = 50_000_00n; // ฿50,000
const MAX_COINS = 20;
const MAX_TOKENS = 16;

function coinCount(money: Satang): number {
  if (money <= 0n) return 0;
  const n = Number(money / SATANG_PER_COIN);
  return Math.max(1, Math.min(MAX_COINS, n));
}

interface CoinLedgerProps {
  money: Satang;
  pc: number;
  /** show the two-row stacked ledger (default) or the compact wallet. */
  compact?: boolean;
}

/** Full two-row ledger: a stack of gold coins + a stack of teal tokens. */
export function CoinLedger({ money, pc }: CoinLedgerProps) {
  const coins = coinCount(money);
  const tokens = Math.max(0, Math.min(MAX_TOKENS, pc));
  return (
    <div className="ledger">
      <div className="ledger__row">
        <span className="ledger__label">Wealth</span>
        <span className="coin-stack" aria-hidden="true">
          {Array.from({ length: coins }, (_, i) => (
            <CoinIcon key={i} scale={2} />
          ))}
        </span>
        <span className="money">{formatBaht(money)}</span>
      </div>
      <div className="ledger__row">
        <span className="ledger__label">Influence</span>
        <span className="coin-stack" aria-hidden="true">
          {Array.from({ length: tokens }, (_, i) => (
            <PcTokenIcon key={i} scale={2} />
          ))}
        </span>
        <span className="pc">{pc} PC</span>
      </div>
    </div>
  );
}

/** Compact HUD wallet: one coin + figure, one token + figure. */
export function Wallet({ money, pc }: { money: Satang; pc: number }) {
  return (
    <div className="hud">
      <span className="hud__cell">
        <CoinIcon scale={2} />
        <span className="money">{formatBaht(money)}</span>
      </span>
      <span className="hud__cell">
        <PcTokenIcon scale={2} />
        <span className="pc">{pc} PC</span>
      </span>
    </div>
  );
}
