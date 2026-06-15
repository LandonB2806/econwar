import { readFileSync } from "node:fs";
import { join } from "node:path";

type Check = {
  name: string;
  pass: boolean;
  fix: string;
};

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const files = {
  design: read("DESIGN.md"),
  css: read("apps/client/src/styles.css"),
  lobby: read("apps/client/src/game/LobbyBackdrop.tsx"),
  scene: read("apps/client/src/game/RegionMapScene.ts"),
  sprites: read("apps/client/src/art/sprites.ts"),
  palette: read("apps/client/src/art/palette.ts"),
};

function stripComments(body: string): string {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const productionSource = Object.entries({
  css: files.css,
  lobby: files.lobby,
  scene: files.scene,
  sprites: files.sprites,
  palette: files.palette,
})
  .map(([name, body]) => `\n/* ${name} */\n${body}`)
  .join("\n");

const productionCode = stripComments(productionSource);

const checks: Check[] = [];

function assertContains(name: string, body: string, needles: string[], fix: string) {
  const missing = needles.filter((needle) => !body.includes(needle));
  checks.push({
    name,
    pass: missing.length === 0,
    fix: missing.length === 0 ? fix : `${fix} Missing: ${missing.join(", ")}`,
  });
}

function assertAbsent(name: string, body: string, patterns: RegExp[], fix: string) {
  const hits = patterns
    .map((pattern) => body.match(pattern)?.[0])
    .filter((hit): hit is string => Boolean(hit));
  checks.push({
    name,
    pass: hits.length === 0,
    fix: hits.length === 0 ? fix : `${fix} Found: ${hits.join(", ")}`,
  });
}

assertContains(
  "DESIGN.md authority stack is present",
  files.design,
  ["Order of authority", "impeccable", "Figma", "Aseprite"],
  "Restore DESIGN.md §11 so agents know the required aesthetic tool order.",
);

assertContains(
  "Lobby encodes political economy and Thailand, not only sky",
  `${files.lobby}\n${files.css}`,
  [
    "lobby-bg__seal",
    "lobby-bg__ticker",
    "lobby-bg__map",
    "lobby-bg__market",
    "lobby-bg__district--central",
    "lobby-bg__district--north",
    "lobby-bg__district--south",
    "lobby-bg__district--northeast",
  ],
  "Add concrete ballot/seal, economic ticker, Thailand silhouette, market, and four region landmarks to LobbyBackdrop.",
);

assertContains(
  "Lobby CSS uses canvas purposefully",
  files.css,
  [
    ".lobby-bg__seal",
    ".lobby-bg__ticker",
    ".lobby-bg__map",
    ".lobby-bg__market",
    ".lobby-bg__district",
  ],
  "Style the lobby identity layers so the start screen has no unexplained empty dead zones.",
);

assertContains(
  "Region map has four distinct readable hero contexts",
  files.scene,
  [
    "skyline",
    "rolling green hills",
    "sea waves",
    "rice rows",
    "motif-${region.id}",
  ],
  "Keep each region visually distinct: Central skyline, North hills/temple, South coast/energy, Northeast rice/windmill.",
);

assertContains(
  "Region sprites name the required hero landmarks",
  files.sprites,
  [
    "glass tower",
    "temple",
    "offshore oil derrick",
    "windmill",
    "REGION_SPRITE",
  ],
  "Restore region landmark sprites with explicit hero silhouettes.",
);

assertContains(
  "Required region palettes remain vivid and distinct",
  files.palette,
  ["#FFB627", "#06AED5", "#3DA35D", "#E0A458", "#00B4D8", "#FF7F50", "#E9C46A", "#8AB17D"],
  "Keep DESIGN.md §2 region sub-palettes exact so panels can be recognized by color.",
);

assertAbsent(
  "DESIGN.md §0 banned visual defaults are absent",
  productionCode,
  [
    /\bInter\b/,
    /\bGeist\b/,
    /\bLucide\b/,
    /Unsplash/i,
    /violet\s*[-→>]\s*indigo/i,
    /repeating-linear-gradient/i,
    /background-clip:\s*text/i,
    /border-radius:\s*(3[2-9]|[4-9]\d)px/i,
  ],
  "Remove banned AI-default visual traits from production source.",
);

assertAbsent(
  "No glow vocabulary in production visual code",
  stripComments(files.css),
  [/box-shadow:\s*0\s+0\s+(?!0\b)[1-9]\d*px/i, /glow/i, /neon/i],
  "Use one-direction shadows and physical bevels; do not add random glows.",
);

const failures = checks.filter((check) => !check.pass);

for (const check of checks) {
  const marker = check.pass ? "PASS" : "FAIL";
  console.log(`${marker} ${check.name}`);
  if (!check.pass) {
    console.log(`  ${check.fix}`);
  }
}

if (failures.length > 0) {
  console.error(`\nAesthetic gate failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nAesthetic gate passed: identity, legibility, composition, and anti-slop checks are present.");
