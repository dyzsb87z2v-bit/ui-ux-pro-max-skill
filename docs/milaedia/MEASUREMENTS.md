# MiLAEDiA — Raw Reference Measurements

Machine-extracted values behind `visual-forensics.html`. All geometry is measured
on the master composite (`1143 x 1017`). Every asset in the delivered ZIP is a
**2x crop of that single composite** — nothing here is estimated by eye unless
marked.

## 1. Asset provenance

Normalized cross-correlation of each asset against its located region in the
composite (offset search, greyscale, 40x40 normalized):

| asset | file size | composite box | corr |
|---|---|---|---|
| `01_hero_berlin_skyline` | 860x860 | (13,13)–(443,443) | +0.996 |
| `05_folded_silk_rugs` | 480x494 | (160,457)–(400,704) | +0.989 |
| `09_antique_rug` | 260x360 | (15,720)–(145,900) | +0.979 |
| `03_hero_weaving_woman` | 720x290 | (505,298)–(865,443) | +0.947 |
| `04_workshop_weaving_woman` | 270x494 | (12,455)–(147,702) | +0.906 |
| `11_luxury_rug` | 260x360 | (279,718)–(409,898) | +0.733 |
| `14_luxury_lamp` | 350x354 | (571,466)–(746,643) | +0.622 |
| `15_luxury_armchair` | 420x354 | (702,456)–(912,633) | +0.559 |
| `13_luxury_silk_tapestry` | 260x360 | (527,718)–(657,898) | +0.501 |
| `06_gallery_luxury_rug_room` | 360x494 | (378,457)–(558,704) | +0.419 |

Geometry matches exactly in every case; the lower-correlation rows are
re-rendered/upscaled rather than plain crops.

### Filename/content mismatches

| file | filename claims | actual content |
|---|---|---|
| `04_workshop_weaving_woman.png` | workshop, weaver | Berlin skyline window pane |
| `05_folded_silk_rugs.png` | folded silk rugs | two window panes + rug edge |
| `06_gallery_luxury_rug_room.png` | gallery room | Persian rug medallion detail |
| `07_berlin_city_about.png` | Berlin city | gold lamp + two ornaments |
| `08_contact_rug_detail.png` | rug detail | **screenshot of the project brief text** |

`08` is not an asset. It carries the brief: multi-page site (Home, Workshop,
Collections, Gallery, About Us, Contact); Admin Dashboard behind login, separate
from the public site; hero with autoplay/muted/loop video background.

The footer panel of the composite renders AI-garbled text and must not be used
as a content source.

## 2. Panel geometry (composite 1143 x 1017)

Boundaries from row/column luminance profiles (a gutter = mean AND max below
threshold). Outer page padding ~10px (0.9% of canvas width).

| panel | box | size | aspect | %W | %H |
|---|---|---|---|---|---|
| Hero | (9,11)–(865,442) | 856x431 | 1.99 | 74.9 | 42.4 |
| Public nav column | (876,11)–(1027,442) | 151x431 | 0.35 | 13.2 | 42.4 |
| Admin sidebar | (1037,11)–(1143,442) | 106x431 | 0.25 | 9.3 | 42.4 |
| Window pane A | (12,455)–(150,702) | 138x247 | 0.56 | 12.1 | 24.3 |
| Window pane B | (158,455)–(255,702) | 97x247 | 0.39 | 8.5 | 24.3 |
| Window pane C | (263,455)–(351,702) | 88x247 | 0.36 | 7.7 | 24.3 |
| Rug plate | (364,455)–(556,702) | 192x247 | 0.78 | 16.8 | 24.3 |
| Object: lamp | (571,467)–(711,645) | 140x178 | 0.79 | 12.2 | 17.5 |
| Object: armchair | (711,467)–(967,645) | 256x178 | 1.44 | 22.4 | 17.5 |
| Object: vase | (967,467)–(1137,645) | 170x178 | 0.96 | 14.9 | 17.5 |
| Ornament chip | (571,650)–(640,699) | 69x49 | 1.41 | 6.0 | 4.8 |
| Ornament strip | (656,650)–(1137,699) | 481x49 | 9.82 | 42.1 | 4.8 |
| Collection card (x5) | x = 13/139/265/390/515, y 710–890 | 118x180 | 0.66 | 10.3 | 17.7 |
| Gallery | (658,710)–(1138,890) | 480x180 | 2.67 | 42.0 | 17.7 |
| Trust bar | (9,913)–(724,1014) | 715x101 | 7.08 | 62.6 | 9.9 |
| Footer | (740,913)–(1138,1014) | 398x101 | 3.94 | 34.8 | 9.9 |

Gutters: hero row columns 11 / 10px; band gaps 13 / 8 / 16px; card gaps 7–8px;
cards→gallery 24px. Panel radius 8–10px, border 1px hairline, no fill
differentiation from the page ground.

Locked vertical axes: x = 50.0% (object triptych + ornament chip),
x = 57.5% (ornament strip + gallery), x = 99.5% (right edge of most panels),
x ≈ 1.0% (left edge of everything).

Asymmetric width ratios: window panes 1.5 : 1.1 : 1; object triptych 1 : 1.8 : 1.2.
Only the 5 collection cards are uniform.

## 3. Hero anchoring (% of the 431px hero height)

| element | top % | bottom % | cap height | width % |
|---|---|---|---|---|
| medallion ornament | 12.5 | 28.5 | — | 7.7 |
| wordmark `MiLAEDiA` | 41.5 | 59.9 | 50px | ~42 |
| tagline | 60.1 | 61.9 | 8px | 34.1 |
| cities line | 65.9 | 67.7 | 9px | 16.9 |
| CTA | 71.9 | 81.2 | — | 24.9 |

Vertical gaps: wordmark baseline → tagline cap 21px; tagline → cities 17px;
cities → CTA 18px. Bottom 19% of the hero carries no type.

## 4. Lighting

Hero 8x6 luminance grid (0–255):

```
 49  82  41  19   9  12  30  24
 85 140  72  31  20  28  46  31
 59  94  47  22  29  29  37  26
 46  32  25  22  24  26  33  21
 21  21  20  17  16  26  38  25
 38  33  41  36  41  29  23  17
```

Key light peaks at (c1,r1) = 140 (window/sky). Text sits at L≈16–29, i.e. ~18% of
peak — no artificial scrim is used. Ceiling row mean L≈15; floor band L≈27–34
(brighter than the mid band, because the polished stone bounces).

Luminance deciles, share of pixels (decile 0 = darkest 10%):

| file | d0 | d1 | d2 | d3 | d4 | d5+ |
|---|---|---|---|---|---|---|
| `02_hero_persian_rug` | 63.0 | 20.4 | 9.2 | 4.1 | 1.9 | 1.4 |
| `01_hero_berlin_skyline` | 49.3 | 18.6 | 9.2 | 7.3 | 7.0 | 8.7 |
| `06_gallery_luxury_rug_room` | 25.4 | 27.6 | 20.5 | 13.6 | 7.7 | 5.1 |
| `14_luxury_lamp` | 74.0 | 9.2 | 5.0 | 3.2 | 2.6 | 6.0 |

Across all 15 files: 23–74% of pixels sit in the darkest decile; highlights above
70% luminance are under 1–2% everywhere.

Berlin twilight sky gradient, top → bottom:
`#292B39` → `#344E7D` → `#555780` → `#706181` → `#916F83` → `#BB8C83` →
`#C6856B` → `#8E4F39` → `#7E3D24`.

## 5. Colour

Dominant-hue clustering (median-cut, 9 high-quality assets): almost everything
falls in `H 24°–37°` (amber/bronze/gold) with an accent cluster at `H 4°–17°`
(crimson/rust). The only cool hue anywhere is the Berlin sky, at 0.5% of
saturated pixels.

| token | hex | role |
|---|---|---|
| page ground | `#000000` | canvas |
| panel ground | `#0A0806` | panel fill (warm near-black) |
| raised surface | `#120F0A` | nav panel |
| active pill | `#332C21` | admin sidebar active |
| hairline | `#4F4840` | 1px panel border |
| bronze | `#8D5E37` | mid-saturation gold |
| scene gold | `#A97342` | photographic gold |
| active text gold | `#B2A589` | interactive text |
| wordmark highlight | `#E7CA9C` | display peak |
| rug crimson | `#7B311D` | primary accent |
| neutral silver | `#A4A4A4` | inactive labels |
| tagline white | `#E0E0E0` | hero supporting text |
| twilight blue | `#344E7D` | the only cool hue |

Wordmark gradient (top→baseline): `#E7CA9C` → `#CEAC7E` → `#A4855D`.

Temperature encodes state throughout: **gold = interactive/brand,
silver = neutral/label.** No exceptions found.

### Contrast audit (WCAG AA)

| pair | ratio | AA normal |
|---|---|---|
| tagline `#E0E0E0` on `#191410` | 13.85 | pass |
| wordmark `#E7CA9C` on `#191410` | 11.60 | pass |
| CTA `#D3C5A8` on `#191410` | 10.72 | pass |
| card title `#B4B4B0` on `#050404` | 9.84 | pass |
| nav active `#B2A589` on `#0A0806` | 8.22 | pass |
| nav inactive `#A4A4A4` on `#0A0806` | 8.02 | pass |
| trust heading `#998F7F` on `#0A0806` | 6.27 | pass |
| trust body `#868480` on `#0A0806` | 5.36 | pass |
| sidebar active `#AA9D88` on `#332C21` | 5.18 | pass |
| nav caption `#7E7E7E` on `#0A0806` | 4.93 | pass |
| card link `#7D776C` on `#050404` | 4.61 | pass |
| **sidebar inactive `#595959` on `#070707`** | **2.88** | **fail** |

One fix needed: lift admin sidebar inactive labels to roughly `#7A7670`.

## 6. Type scale (cap heights on the 1143px canvas)

| role | cap | approx font-size | % of container width | case |
|---|---|---|---|---|
| hero wordmark | 50px | ~71–75px | 8.3 | UC + lowercase `i` |
| cities line | 9px | ~12–13px | 1.5 | UC, widest tracking |
| tagline | 8px | ~11–12px | 1.4 | UC |
| nav wordmark | ~13px | ~18–19px | 12.4 | UC + lowercase `i` |
| nav item, active | 11px | ~15px | 9.9 | UC |
| nav item, inactive | 9px | ~12px | 7.9 | UC |
| nav descriptor | 7px | ~9–10px | 6.0 | UC, leading 2.2x |
| card title | 10px | ~13px | 11.0 | UC |
| card link | 7px | ~10px | 8.5 | sentence + `›` |
| trust heading | 8px | ~11px | 4.5 | UC |
| trust body | ~7px | ~10px | — | sentence, 12px line pitch |

Display-to-support ratio **6.2 : 1**, with no intermediate level.

Tracking, visually estimated from 8–10x zooms: cities ~0.25–0.3em; CTA and
tagline ~0.15–0.2em; nav items ~0.12em; card titles ~0.06em. Wordmark is near
normal tracking.

Letterform evidence points at the **Cormorant / Cormorant Garamond** class:
splayed `M` with a pointed apex reaching the baseline, pointed `A` apex, very
high stroke contrast, fine flared serifs, vertical stress. Playfair Display's
upright `M` and heavier bracketed serifs do not match. The admin sidebar uses a
separate **geometric sans** (Poppins/Montserrat class, perfectly circular `O`)
that appears nowhere on the public site.

No body-copy sample longer than two 40-character lines exists anywhere in the
references, so the body face is undefined by the source. No Persian/Arabic
sample exists at all.

## 7. Component rhythm

Public nav column (151x431):

- padding-top 24px
- logo mark 55px tall, gap 14px
- wordmark block 18px, gap 20px
- descriptor: 3 lines, cap 7px, line pitch 15–16px
- ornamental divider block 17px (rule — lozenge — rule), gap 23px
- item pitch **30px**, constant across all six items
- active: gold text + full-width gradient underline (bright left, fading right)
- inactive: silver text + faint gold crescent under the numeral

Admin sidebar (106x431):

- item pitch **25px**, 9 items
- icon 13–15px, outline style, ~1.5px stroke, gold
- icon→label gap 8–10px
- active pill: full width minus ~4px, 17px tall, fill `#332C21`
- icons are bespoke Persian cartouche forms (scalloped/cusped contours), not a
  standard icon set

Collection card (118x180):

- 1px gold hairline, radius ~7px
- image 122px = ~70% of card height, then dissolves into black by gradient
- image→title 12px, title→link 14px, bottom padding 7–13px
- title block is **bottom-anchored**: a one-line title sits on the same baseline
  as the second line of a two-line title

Trust bar (715x101): 4 columns split by 3 vertical hairlines at x = 203 / 355 /
532. Per column: 31px icon, gap 9px, heading (cap 8px), gap 11px, 2 body lines
at 12px pitch.

Ornament strip: 6 gold line glyphs, 42–53px each in a 49px-tall band, centres at
x = 606 / 718 / 793 / 880 / 970 / 1063. Five are Persian geometric/arabesque
motifs; the sixth is a crown.

## 8. Collections taxonomy

| # | title | material | tier |
|---|---|---|---|
| 01 | ANTIQUE RUGS | rug | antique |
| 02 | HANDWOVEN SILK RUGS | silk rug | handwoven |
| 03 | LUXURY RUGS | rug | luxury |
| 04 | ANTIQUE SILK TAPESTRIES | silk tapestry | antique |
| 05 | LUXURY SILK TAPESTRIES | silk tapestry | luxury |

The five titles form an incomplete material x tier matrix — "Handwoven Silk
Tapestries" and "Antique Silk Rugs" are missing. A two-axis filter cannot
generate this set; the five categories are hand-authored.

## 9. Not present in the references

Nothing below can be extracted from the delivered files; each needs a separate
decision or a new reference:

- any page other than Home
- any mobile, tablet, or portrait view (all sources derive from one 1.12-ratio
  landscape composite)
- any motion: no transition frames, no storyboard, no timing
- body typeface; Persian/Arabic typography
- forms, inputs, the login screen
- hover states (only nav and sidebar active/inactive are shown)
- any interactive 3D — all depth in the references is photographic
  (one-point perspective, reflective floor, lit niches, 5 separable depth layers)

## Method

Panel boundaries: row/column luminance profiling with dual mean+max thresholds.
Type metrics: row profiling of the top-25 brightest pixels per row within the
glyph column. Colours: median-cut quantization plus bright-percentile averaging
over glyph regions. Asset attribution: normalized cross-correlation with an
offset search.

Accuracy: the composite is a compressed JPEG, so colour values carry roughly
±3–5 units of error; geometry from threshold profiles is accurate to about ±2px.
Colours taken from the 2x assets are the more reliable set.
