# MiLAEDiA — placeholders and missing assets

Every interim stand-in in this codebase is listed here. Nothing is silently
invented. Each entry names what is missing, what is used instead, and the
one-line change that retires it.

Grep for `data-placeholder-asset` and `PLACEHOLDER` to find them in source.

---

## BLOCKING — discovered during implementation

### 1. There is no clean hero scene plate

**This was not known before Phase 3 and it changes the cover.**

The delivered hero (`01_hero_berlin_skyline.png` + `02_hero_persian_rug.png`,
stitched as `src/assets/scene/hero-reference.png`) has the **wordmark,
tagline, cities line and CTA baked into the pixels**. It is a crop of the
rendered design, not a scene plate.

Consequence: it cannot sit behind live text. The page's real `<h1>` ghosts
against the baked copy of itself. And **no text-free 2:1 crop of it exists** —
the baked type occupies the centre band (roughly x 27–69%, y 41–81%).

The same is true of the intro video: every frame carries baked-in type.

- **Needed:** `scene/hero-plate.png` — the same room, same camera, same light,
  **with no type**. Ideally at 2× (≥3400 × 1700) per spec §26.
- **Interim:** the cover uses `scene/window-triptych.png`, the largest
  verified *text-free* scene asset in the delivery (480 × 494, Berlin twilight
  through window frames with polished floor). It is correct in palette and
  lighting but it is **not the hero composition** and is low-resolution.
- **Retire with:** one import change in `src/components/Cover.astro`.
- **Also affected:** the measured three-zone composition (European left / type
  void centre / Persian craft right, spec §10) cannot be reproduced until the
  clean plate exists. The current cover satisfies every *token* rule but not
  the *compositional* one.

### 2. Hero stitch overlap — resolved, recorded

`01` and `02` are not edge-to-edge halves; they **overlap by 40px**. A naive
concatenation duplicates glyphs ("ENTER THE EX|EXPERIENCE", "TEHRANAN").

Overlap determined by text continuity across candidates, cross-checked
against the measured hero ratio:

| overlap | reads | ratio | measured target |
|---|---|---|---|
| 0px | `ENTER THE EXEXPERIENCE` | 2.023 | 1.986 |
| 32px | `ENTER THE IEXPERIENCE` | 1.986 | 1.986 |
| **40px** | **`ENTER THE EXPERIENCE`** | **1.977** | 1.986 |
| 48px | `ENTER THEEXPERIENCE` | 1.967 | 1.986 |

40px is the only value where the baked text reads correctly, and its ratio
sits within the ±2px (at 1×) tolerance of the gutter measurement. Applied.

---

## Missing assets (from spec §26, unchanged)

| Asset | Status | Blocks |
|---|---|---|
| `scene/gallery-hall` | never exported; exists only at 480×180 inside the composite JPEG (~33% of a 1440px plate) | `/gallery` |
| `objects/vase-table` | never exported | object triptych, right panel |
| 6 ornament glyphs | exist only at 42–53px inside the JPEG | see below |
| 4 trust-bar icons | exist only at 31px inside the JPEG | trust bar |
| 9 admin cartouche icons | exist only at 13–15px inside the JPEG | admin rail |
| 3 wordmark lockups (SVG) | exist only as rendered pixels | favicon, OG, small sizes |

### Ornament — interim vector

`src/components/primitives/Ornament.astro` carries
`data-placeholder-asset="ornament"`. The six reference glyphs were never
exported, so these are **geometrically derived** interim marks built from the
measured interlaced-lozenge construction. They are deliberately simple so they
read as provisional rather than as a finished ornament family.

**Do not treat these as the brand's ornament set.** The six real glyphs
(five Persian geometric/arabesque motifs plus a crown) must be redrawn as
vectors from a higher-resolution source.

---

## Deliberately absent — not placeholders

These are marked `null` in `src/data/site.ts` rather than filled with plausible
values, per the standing instruction not to invent business, legal or domain
information:

- `domain` — `astro.config.mjs` uses `https://example.invalid`
- `currencies`
- `paymentProvider`
- `reservationTtlMinutes` — a business policy for `one_of_one` holds
- `lowStockThreshold` — code falls back to a clearly-marked constant of 3

## Body typeface

`--font-body` currently aliases `--font-display`. No body-copy sample longer
than two 40-character lines exists in any reference, so the body face is
undefined by the source. Single token swap in `src/styles/tokens.css`.

## Header nav labels

The intro video's header labels are AI-garbled and unreadable — only
`CONTACT US` resolves; the rest render as `ARGSON`, `FRSUES`,
`BOHIINT RELASES`, `COINE TIWOKS`, `SOOIR`. `src/data/site.ts` uses the six
**legible** labels from the still composite. Correct them when the real
labels are supplied.

---

## Intro handoff — technique 1, not technique 2

The spec preferred **technique 2** for the intro→hero handoff (hold the
chrome, cross-fade only the scene), because the video demonstrates exactly
that architecture: its header and hero type stay pinned at `y=190` and
`x=200` across all 20 sampled frames while the environment moves.

**Technique 2 requires a text-free video.** Every frame of the delivered clip
carries baked-in type — the same defect as the hero plate. Holding our live
chrome over it would ghost against the video's own baked wordmark.

So the intro plays full-frame as the rendered page it is, and dissolves
through black into the real one — **technique 1**, which the spec named as
the fallback. The dissolve begins at 9.4s, where the measured motion
envelope settles (final half-second is the quietest in the clip at 40% of
plateau), so the handoff lands on a shot that has come to rest.

**Retire with:** a text-free intro clip. Then the gate can hold the chrome
and cross-fade only the scene layer, and the two heroes become one
continuous move.

---

## 3D cinematic — what is real and what is temporary

### The intro is no longer the reference video

The higher-quality `.mov` (HEVC, 1110×662, 7.8 Mbps) was decoded and the
**text-free region containing the weaver and her rug extracted**: crop
`x 845–1110, y 55–662`. Everything baked into the reference — wordmark,
tagline, sub-line, CTA, unrelated chrome — lies outside that crop and never
ships.

That clip is staged as ONE plane inside a layered perspective composition
(`AtelierScene.astro`), not played as a background. Result:

| | before | after |
|---|---|---|
| shipped video | 2,418 KB, baked text | **350 KB** desktop / **163 KB** mobile, text-free |
| role | full-frame background | one plane in a 4-layer 3D scene |

The old `public/media/intro.mp4` was deleted — it is no longer referenced.

### Why CSS 3D and not WebGL

There is no 3D geometry and no model to render. The scene is layered planes
with real `perspective`, `translateZ` and `rotateX`, which the compositor
draws on the GPU for free. A WebGL runtime would add ~600 KB to draw the
same planes. **When real rug models exist, they mount in the product viewer —
this scene does not change.** No Three.js and no Framer Motion are installed.

### Temporary in the 3D scene

- **`plane-wall`** uses `scene/contact-texture.png` (the rug medallion crop).
  It stands in for the atelier's back wall. Text-free and correct in palette,
  but it is a rug detail, not a wall.
- **`plane-floor`** uses `atelier/floor-rug.png`, extracted from the same
  `.mov` (`x 90–1000, y 430–662`). Genuine and text-free, but only 910 px wide.
- The weaving clip is **264×606** — its native text-free extent. It cannot be
  enlarged without a re-render at higher resolution.

### Collection card art — baked titles cropped out

The delivered card crops (`09`–`13`) are crops of the **rendered** cards and
carry their own titles and "Discover" links in the pixels. Measured: the baked
title sits at y 69–76% and the link at y 82–86%.

Card art is therefore cropped to the **top 63%**, which is texture only. The
titles on the site are live text. Without this the cards render every label
twice.

**Retire with:** product photography that is texture-only from the start,
following the measured rule — texture crop for rugs, full pictorial scene for
tapestries.
