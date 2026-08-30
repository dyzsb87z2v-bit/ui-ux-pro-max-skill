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
