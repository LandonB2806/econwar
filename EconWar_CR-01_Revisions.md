# EconWar — Change Request CR-01

> Six revisions from playtest feedback, written for Claude Code. Each item: **problem → fix →
> implementation → owner → acceptance**. Ties into `CLAUDE.md`, `DESIGN.md`, and the design agents.

---

## 1. Bilingual support — Thai + English (i18n)

**Problem.** The game needs both a Thai and an English version.

**Fix.** Add a localization layer with two locales: `en` and `th`. **Not every word must be Thai** —
headings, proper nouns, and labels may stay in English where that reads naturally. Mixed TH/EN is
intentional and acceptable, not a bug.

**Implementation.**
- Use **react-i18next** (or a lightweight `key → string` map). No hardcoded user-facing text anywhere.
- Locale files: `apps/client/src/i18n/en.json`, `th.json`. Every string resolves by key.
- Region/department names are already bilingual in the spec (e.g. `Central / กลาง`) — keep both.
- Detect locale on first load; allow live switching (see CR-5).

**Owner:** UI/UX Designer (string externalization) + Gameplay Programmer (i18n wiring).
**Acceptance:** every visible string comes from a locale file; switching locale updates the UI live
without reload; leaving some headings in English is allowed.

---

## 2. Start-screen background — give it identity

**Problem.** The opening/lobby background is flat and dull. Stardew opens on a sky + farm that instantly
says what the game is; EconWar's start screen says nothing.

**Fix.** Replace the flat background with a **warm, sunlit panorama that signals EconWar's identity** —
a Thai economic world of four regions. Suggested composition: a stylized skyline/landscape blending the
four districts (Central startup cranes, North hills + temple, South coast + oil rigs, Northeast rice
fields) under a bright `DESIGN.md` sky (#57C4E5) with parallax clouds, golden-hour light, and the title
+ department banners on top.

**Implementation.**
- Built as **parallax layers** in the lobby (sky → distant districts → foreground), `DESIGN.md` palette
  (bright, saturated — never the desaturated old look).
- Pixel art in Aseprite; integer-scaled.

**Owner:** Art Director (the panorama art) + UI/UX Designer (composition/title placement).
**Acceptance:** within 2 seconds, a new player reads the start screen as "a colorful Thai economic
town," not a solid color or generic gradient.

---

## 3. The four region panels — make them readable

**Problem.** The **animation is good (keep it)**, but the four district images themselves are so unclear
that the player can't tell what they're looking at.

**Fix.** Each of the four districts must be **identifiable at a glance** by a clear focal landmark +
distinct silhouette + its own sub-palette (`DESIGN.md` §2/§9):

| Region | Must read as | Focal landmark |
|--------|--------------|----------------|
| Central / กลาง | modern startup town | cranes / glass stalls (gold + teal) |
| North / เหนือ | hills & temples | a temple roofline on green hills |
| South / ใต้ | coast & energy | oil rig + fishing docks on turquoise sea |
| Northeast / อีสาน | farmland | rice fields + a windmill (ochre + green) |

**Implementation.**
- One **clear hero landmark** per district; raise contrast; remove noisy pixel clutter that muddies the
  silhouette. Each district keeps its bilingual label.
- Keep the existing motion (idle bob, weather overlay) — only the legibility of the art changes.

**Owner:** Art Director.
**Acceptance:** a first-time player can correctly name each of the four districts **without reading the
label**.

---

## 4. Background music

**Problem.** No background music.

**Fix.** Add the uploaded **`background_song.mp3`** as the looping background track.

**Implementation.**
- Place the file at **`apps/client/assets/audio/background_song.mp3`**.
- Play via the **Web Audio API / a light JS lib (Howler.js)** — consistent with the web stack
  (**not** FMOD/Wwise).
- **Loop seamlessly.** Start on the **first user interaction** (browsers block autoplay until then) —
  e.g. the moment the player taps "enter" on the lobby.
- Volume is driven by the setting in CR-5; respect mute.

> Note: the mp3 was not present in the planning chat — make sure it is dropped into the path above in
> the repo before building this item.

**Owner:** Audio Director (audio system) + Gameplay Programmer (integration).
**Acceptance:** music loops quietly from the lobby onward, starts after first interaction, and obeys the
volume/mute setting.

---

## 5. Player settings — music volume, language, light/dark theme

**Problem.** The player can't adjust audio, language, or visual tone.

**Fix.** Add a **Settings panel** (pixel gear icon) reachable from the lobby *and* in-game, with three
controls:

1. **Background-music volume** — slider 0–100% + mute toggle (drives CR-4).
2. **Language** — TH / EN switch, applied live (drives CR-1).
3. **Theme** — **Light / Dark** toggle.

**Dark theme rule (important — must not become AI slop).** Dark mode is a **warm cozy night/dusk town**,
NOT the banned neon-on-near-black SaaS look (`DESIGN.md` §0). Define a dark token set as warm night:
deep indigo/brown background, warm lamplight accents, parchment panels darkened to aged-wood — and
**keep the currency rule**: Money = gold (#FFC23C), Political Capital = teal (#16C2B0) in both themes.

**Implementation.**
- Theme via CSS variables / a token set; `DESIGN.md` light tokens stay default, add a parallel
  `dark` token block. Phaser scene tint shifts to the dusk palette in dark mode.
- **Persist** all three settings across reloads (localStorage is fine — this is the real app, not a
  sandboxed artifact).

**Owner:** UI/UX Designer (panel + theme tokens), Audio Director (volume), with i18n from CR-1.
**Acceptance:** all three controls work live and persist after reload; dark mode reads as a warm night
town, not a dark dashboard.

---

## 6. Fonts — Thai uses Bai Jamjuree

**Problem.** Thai text needs a proper Thai font.

**Fix.** **Thai → Bai Jamjuree** (Google Fonts, Thai + Latin, by Cadson Demak). **English → unchanged**
(`DESIGN.md` §3: Pixelify Sans display / VT323 data / Nunito body).

**Implementation.**
- Route font by **script**, not by locale: Latin glyphs keep their `DESIGN.md` fonts; Thai glyphs render
  in **Bai Jamjuree**, so mixed TH/EN strings render each script correctly.
- The pixel display font (Pixelify Sans) has **no Thai glyphs** — so **Thai headings fall back to Bai
  Jamjuree** (a heavier weight for headings). This is consistent with CR-1: some headings can simply
  stay English where the pixel look matters.
- Add Bai Jamjuree as the Thai entry in every font-family stack.
- **Update `DESIGN.md` §3** to add the Thai font role.

**Owner:** UI/UX Designer (+ Art Director for any in-canvas Thai labels).
**Acceptance:** Thai renders in Bai Jamjuree; English is visually unchanged; a mixed string shows Latin
in Nunito/Pixelify and Thai in Bai Jamjuree side by side cleanly.

---

## Files to update (summary for Claude Code)

| Item | Touches |
|------|---------|
| 1 i18n | new `i18n/en.json`, `th.json`; externalize all strings; `CLAUDE.md` note |
| 2 start bg | Art Director assets; lobby scene composition |
| 3 region art | Art Director district assets (re-art, keep motion) |
| 4 music | `assets/audio/background_song.mp3`; Howler/Web Audio system |
| 5 settings | Settings panel; theme token block in `DESIGN.md`; persistence |
| 6 fonts | `DESIGN.md` §3 (+Bai Jamjuree); font stacks routed by script |

**Suggested order:** 6 (fonts) → 1 (i18n) → 5 (settings shell) → 4 (music) → 2 (start bg) → 3 (region
art). Fonts + i18n + the settings shell are the plumbing the rest plug into; the two art items (2, 3)
are independent and can run in parallel with the Art Director.
