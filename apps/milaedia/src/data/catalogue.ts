/**
 * MiLAEDiA — demo catalogue.
 *
 * ============================================================
 * THIS IS DEMO DATA. Every record here is clearly replaceable.
 * Replace this file (or swap it for a D1 query / CMS fetch) with the real
 * catalogue. The shape is the production shape — see src/lib/inventory.ts
 * for the availability rules these fields drive.
 *
 * Prices are in MINOR UNITS (cents). Currency is per-record so multi-market
 * pricing can be added later without a schema change.
 * ============================================================
 */
import type { InventoryMode } from './site';

export interface Product {
  id: string;
  slug: string;
  title: string;
  collection: string;              // collection slug
  /** Minor units. */
  priceMinor: number;
  currency: 'EUR';
  inventoryMode: InventoryMode;
  stockQty: number | null;
  reservedQty: number;
  soldAt: string | null;
  leadTimeDays: number | null;
  lowThreshold: number | null;

  origin: string;
  material: string;
  weave: string;
  knotDensity: string;
  dimensionsCm: [number, number];
  ageNote: string | null;

  summary: string;
  description: string;
  care: string;

  /** Asset key into src/assets/collections — DEMO: every product currently
   *  reuses its collection's verified texture. Replace with real product
   *  photography (texture crop for rugs, full scene for tapestries). */
  image: string;
  /** Path to a GLB/GLTF model. null => the viewer uses its fallback mode. */
  model: string | null;
}

const eur = (n: number) => Math.round(n * 100);

export const products: Product[] = [
  {
    id: 'p-001', slug: 'kashan-medallion-antique', title: 'Kashan Medallion',
    collection: 'antique-rugs',
    priceMinor: eur(18500), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Kashan, Iran', material: 'Hand-spun wool, cotton foundation',
    weave: 'Persian asymmetric knot', knotDensity: '≈ 480,000 knots / m²',
    dimensionsCm: [312, 214], ageNote: 'Early twentieth century',
    summary: 'A central medallion in madder red, framed by a palmette border.',
    description:
      'A single piece, woven on a cotton foundation with hand-spun wool. The central medallion is worked in madder red against an indigo field, with a palmette-and-vine border. Natural dyes have settled unevenly over a century of light, giving the abrash that collectors look for.',
    care: 'Rotate annually. Professional cleaning only. Keep out of prolonged direct sun.',
    image: 'antique-rugs', model: null,
  },
  {
    id: 'p-002', slug: 'tabriz-garden-antique', title: 'Tabriz Garden',
    collection: 'antique-rugs',
    priceMinor: eur(24900), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Tabriz, Iran', material: 'Wool pile, silk highlights',
    weave: 'Persian asymmetric knot', knotDensity: '≈ 640,000 knots / m²',
    dimensionsCm: [366, 267], ageNote: 'Circa 1920s',
    summary: 'A garden plan in wool with silk highlights, unusually finely knotted.',
    description:
      'A garden carpet: the field divided into water channels and planted compartments, each worked as its own small composition. Silk highlights in the blossoms catch light differently from the wool ground, so the piece changes considerably as you move around it.',
    care: 'Rotate annually. Professional cleaning only. Silk highlights should not be wet-cleaned at home.',
    image: 'antique-rugs', model: null,
  },
  {
    id: 'p-003', slug: 'qum-silk-handwoven', title: 'Qum Silk',
    collection: 'handwoven-silk-rugs',
    priceMinor: eur(32000), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Qum, Iran', material: 'Pure silk pile on silk foundation',
    weave: 'Hand-knotted, Persian asymmetric', knotDensity: '≈ 1,000,000 knots / m²',
    dimensionsCm: [200, 137], ageNote: null,
    summary: 'Pure silk on a silk foundation, at the density the technique allows.',
    description:
      'Silk on silk, knotted at roughly a million knots per square metre. At that density the pile behaves like a single surface: the piece reads as two entirely different colourways depending on which end you view it from.',
    care: 'Never wet-clean at home. Professional silk cleaning only. Avoid direct sun.',
    image: 'handwoven-silk-rugs', model: null,
  },
  {
    id: 'p-004', slug: 'nain-silk-inlay', title: 'Nain Silk Inlay',
    collection: 'handwoven-silk-rugs',
    priceMinor: eur(21400), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Nain, Iran', material: 'Wool pile with silk inlay',
    weave: 'Hand-knotted, Persian asymmetric', knotDensity: '≈ 700,000 knots / m²',
    dimensionsCm: [244, 168], ageNote: null,
    summary: 'Ivory ground with silk-outlined arabesques.',
    description:
      'An ivory field with arabesques outlined in silk, so the drawing sits slightly proud of the wool ground. Nain weaving is unusually restrained in palette; the effect depends on the line, not the colour.',
    care: 'Rotate annually. Professional cleaning only.',
    image: 'handwoven-silk-rugs', model: null,
  },
  {
    id: 'p-005', slug: 'isfahan-signature', title: 'Isfahan Signature',
    collection: 'luxury-rugs',
    priceMinor: eur(48000), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Isfahan, Iran', material: 'Kork wool and silk on silk foundation',
    weave: 'Hand-knotted, Persian asymmetric', knotDensity: '≈ 900,000 knots / m²',
    dimensionsCm: [305, 203], ageNote: null,
    summary: 'A signed workshop piece in kork wool and silk.',
    description:
      'A signed piece from a named Isfahan workshop, woven in kork wool — the fine underbelly fleece — with silk in the medallion and spandrels. The signature cartouche is woven, not applied.',
    care: 'Rotate annually. Professional cleaning only. Keep out of prolonged direct sun.',
    image: 'luxury-rugs', model: null,
  },
  {
    id: 'p-006', slug: 'bakhtiari-panel', title: 'Bakhtiari Panel',
    collection: 'luxury-rugs',
    priceMinor: eur(12600), currency: 'EUR',
    inventoryMode: 'stocked', stockQty: 4, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: 2,
    origin: 'Chahar Mahal, Iran', material: 'Hand-spun wool',
    weave: 'Hand-knotted', knotDensity: '≈ 260,000 knots / m²',
    dimensionsCm: [290, 200], ageNote: null,
    summary: 'A garden-panel grid in hand-spun wool.',
    description:
      'The Bakhtiari garden-panel format: a grid of compartments, each with its own motif. Woven in hand-spun wool with a heavier handle than the city workshops, and made to be walked on.',
    care: 'Rotate annually. Vacuum without a beater bar. Professional cleaning.',
    image: 'luxury-rugs', model: null,
  },
  {
    id: 'p-007', slug: 'pastoral-silk-tapestry-antique', title: 'Pastoral Scene',
    collection: 'antique-silk-tapestries',
    priceMinor: eur(28800), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Iran, after a European cartoon', material: 'Silk pile on cotton foundation',
    weave: 'Hand-knotted pictorial', knotDensity: '≈ 850,000 knots / m²',
    dimensionsCm: [152, 107], ageNote: 'Early twentieth century',
    summary: 'A pictorial silk tapestry after a European pastoral cartoon.',
    description:
      'A pictorial piece woven after a European pastoral cartoon — the exchange that runs through this house in both directions. Intended for the wall: the knot count carries facial modelling that a floor weave could not hold.',
    care: 'Hang on a full-width sleeve, never from corners. Professional silk cleaning only.',
    image: 'antique-silk-tapestries', model: null,
  },
  {
    id: 'p-008', slug: 'hunting-silk-tapestry-antique', title: 'Hunting Ground',
    collection: 'antique-silk-tapestries',
    priceMinor: eur(34500), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0,
    soldAt: '2026-05-14T00:00:00Z',      // sold — archive piece, stays published
    leadTimeDays: null, lowThreshold: null,
    origin: 'Isfahan, Iran', material: 'Silk pile on silk foundation',
    weave: 'Hand-knotted pictorial', knotDensity: '≈ 950,000 knots / m²',
    dimensionsCm: [168, 119], ageNote: 'Circa 1930s',
    summary: 'A hunting ground in silk. Sold — retained in the archive.',
    description:
      'A hunting composition worked entirely in silk, with the riders and quarry drawn at a density that reads as brushwork at arm’s length. This piece has been sold; it remains published as part of the house archive.',
    care: 'Hang on a full-width sleeve. Professional silk cleaning only.',
    image: 'antique-silk-tapestries', model: null,
  },
  {
    id: 'p-009', slug: 'floral-still-life-tapestry', title: 'Floral Still Life',
    collection: 'luxury-silk-tapestries',
    priceMinor: eur(19900), currency: 'EUR',
    inventoryMode: 'one_of_one', stockQty: 1, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: null,
    origin: 'Qum, Iran', material: 'Pure silk',
    weave: 'Hand-knotted pictorial', knotDensity: '≈ 900,000 knots / m²',
    dimensionsCm: [122, 91], ageNote: null,
    summary: 'A still life in pure silk, drawn at painterly density.',
    description:
      'A still life of blossom and fruit against a dark ground, worked in pure silk. The dark field is not one colour but four, shifting through the composition so the flowers appear lit rather than placed.',
    care: 'Hang on a full-width sleeve. Professional silk cleaning only.',
    image: 'luxury-silk-tapestries', model: null,
  },
  {
    id: 'p-010', slug: 'garden-arch-tapestry', title: 'Garden Arch',
    collection: 'luxury-silk-tapestries',
    priceMinor: eur(23400), currency: 'EUR',
    inventoryMode: 'stocked', stockQty: 2, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: 2,
    origin: 'Qum, Iran', material: 'Pure silk',
    weave: 'Hand-knotted pictorial', knotDensity: '≈ 880,000 knots / m²',
    dimensionsCm: [137, 99], ageNote: null,
    summary: 'An arched garden view in pure silk.',
    description:
      'An arched garden view — the mihrab format turned to landscape. Woven in pure silk with a deliberately narrow palette, so the depth comes from drawing rather than from colour contrast.',
    care: 'Hang on a full-width sleeve. Professional silk cleaning only.',
    image: 'luxury-silk-tapestries', model: null,
  },
  {
    id: 'p-011', slug: 'bespoke-medallion', title: 'Bespoke Medallion',
    collection: 'luxury-rugs',
    priceMinor: eur(26000), currency: 'EUR',
    inventoryMode: 'made_to_order', stockQty: null, reservedQty: 0, soldAt: null,
    leadTimeDays: 270, lowThreshold: null,
    origin: 'Woven to order, Iran', material: 'Kork wool, silk optional',
    weave: 'Hand-knotted, Persian asymmetric', knotDensity: 'Specified at commission',
    dimensionsCm: [300, 200], ageNote: null,
    summary: 'Commissioned to your dimensions, palette and density.',
    description:
      'A commission. Dimensions, palette, knot density and material are set with the atelier before the loom is dressed. The indicative price is for the size shown; the final quotation follows the specification.',
    care: 'As specified on delivery.',
    image: 'luxury-rugs', model: null,
  },
  {
    id: 'p-012', slug: 'heriz-serapi', title: 'Heriz Serapi',
    collection: 'antique-rugs',
    priceMinor: eur(15800), currency: 'EUR',
    inventoryMode: 'stocked', stockQty: 0, reservedQty: 0, soldAt: null,
    leadTimeDays: null, lowThreshold: 2,
    origin: 'Heriz, Iran', material: 'Hand-spun wool',
    weave: 'Hand-knotted', knotDensity: '≈ 200,000 knots / m²',
    dimensionsCm: [340, 250], ageNote: 'Circa 1940s',
    summary: 'A geometric Heriz medallion in rust and indigo.',
    description:
      'The Heriz drawing: a large angular medallion, geometric spandrels, and a palette built on rust and indigo. Heavier and more robust than the city weaves, and made for rooms that are used.',
    care: 'Rotate annually. Vacuum without a beater bar. Professional cleaning.',
    image: 'antique-rugs', model: null,
  },
];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const byCollection = (c: string) => products.filter((p) => p.collection === c);

export function formatPrice(minor: number, currency: string, locale = 'en-DE') {
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(minor / 100);
}

/** Collection editorial copy. Neutral and editable — no historical claims. */
export const collectionCopy: Record<string, string> = {
  'antique-rugs':
    'Pieces carrying a century or more of use. Each is singular: what has faded, and how, is part of what is being bought.',
  'handwoven-silk-rugs':
    'Silk knotted at the density the fibre allows. These pieces read as two colourways depending on where you stand.',
  'luxury-rugs':
    'Contemporary weaving from named workshops, in kork wool and silk. Made now, to the standards of the archive.',
  'antique-silk-tapestries':
    'Pictorial silk intended for the wall. Knot counts high enough to carry modelling a floor weave cannot hold.',
  'luxury-silk-tapestries':
    'Contemporary pictorial silk. Composition drawn first, palette held deliberately narrow.',
};
