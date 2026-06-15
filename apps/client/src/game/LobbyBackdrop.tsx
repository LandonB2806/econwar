/**
 * LobbyBackdrop (CR-01 #2): a warm, sunlit parallax panorama that signals
 * EconWar's identity within seconds — a Thai economic town of four districts
 * under a bright DESIGN.md sky. Layers: sky → sun → drifting clouds → the four
 * district landmarks → foreground grass. Pure CSS parallax + the pixel motifs
 * (no heavy scene); honors prefers-reduced-motion via the shared CSS.
 */
import { RegionIcon } from "./PixelIcon.js";
import type { RegionId } from "@econwar/shared";

const CLOUDS = [
  { top: "8%", width: 60, duration: 34, delay: 0 },
  { top: "16%", width: 44, duration: 46, delay: -12 },
  { top: "26%", width: 72, duration: 40, delay: -24 },
  { top: "12%", width: 36, duration: 52, delay: -32 },
];

const DISTRICTS: RegionId[] = ["central", "north", "south", "northeast"];

export function LobbyBackdrop() {
  return (
    <div className="lobby-bg" aria-hidden="true">
      <div className="lobby-bg__sky" />
      <div className="lobby-bg__sun" />
      <div className="lobby-bg__seal">
        <span className="lobby-bg__seal-ring" />
        <span className="lobby-bg__seal-box" />
        <span className="lobby-bg__seal-slot" />
      </div>
      <div className="lobby-bg__ticker">
        <span>GDP +2.4</span>
        <span>PC +5</span>
        <span>RICE +8</span>
        <span>ENERGY -3</span>
        <span>VOTE</span>
      </div>
      <div className="lobby-bg__clouds">
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="lobby-bg__cloud"
            style={{
              top: c.top,
              width: c.width,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="lobby-bg__map">
        <span />
        <span />
        <span />
      </div>
      <div className="lobby-bg__districts">
        {DISTRICTS.map((r, i) => (
          <div key={r} className={`lobby-bg__district lobby-bg__district--${r}`}>
            <RegionIcon region={r} scale={i === 1 ? 8 : 7} />
          </div>
        ))}
      </div>
      <div className="lobby-bg__market">
        <span className="lobby-bg__stall lobby-bg__stall--gold" />
        <span className="lobby-bg__stall lobby-bg__stall--teal" />
        <span className="lobby-bg__coin" />
        <span className="lobby-bg__token" />
      </div>
      <div className="lobby-bg__ground" />
    </div>
  );
}
