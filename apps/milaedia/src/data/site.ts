/**
 * MiLAEDiA — measured site constants.
 *
 * Everything in this file is transcribed from the reference composite or the
 * recovered brief. Nothing here is invented. Where a value could not be read
 * from a reference it is marked MISSING and left null rather than guessed.
 */

export const brand = {
  /**
   * The wordmark is literal text with lowercase `i` at positions 2 and 7.
   * NEVER apply text-transform: uppercase to this string — it destroys the
   * brand signature. (Forensics §04, §06)
   */
  wordmark: 'MiLAEDiA',
  tagline: 'Persian Heritage. European Vision. Worldwide.',
  cities: ['Berlin', 'Tehran', 'Budapest'] as const,
  /** Measured in the composite hero and the nav plate. */
  descriptor: ['Persian Heritage', 'European Vision', 'Worldwide'] as const,
} as const;

/**
 * Public navigation. Six items, numbered 01–06 in the reference.
 * The numbering matches the brief's six-page set, so it encodes real
 * sequence — it is information, not decoration. (Forensics §03)
 *
 * NOTE: the intro video's header labels are AI-garbled and unreadable
 * (only "CONTACT US" resolves). These six legible labels come from the
 * still composite and stand until corrected. (Spec §C, "Real header nav labels")
 */
export const nav = [
  { n: '01', label: 'Home',        href: '/' },
  { n: '02', label: 'Workshop',    href: '/workshop' },
  { n: '03', label: 'Collections', href: '/collections' },
  { n: '04', label: 'Gallery',     href: '/gallery' },
  { n: '05', label: 'About Us',    href: '/about' },
  { n: '06', label: 'Contact',     href: '/contact' },
] as const;

/**
 * Collections — five evidenced, hand-authored, explicitly ordered.
 *
 * The material x tier matrix has 9 cells; only 5 are evidenced. A two-axis
 * filter must NOT drive this index or four routes render empty. `material`
 * and `tier` are carried as attributes so filtering becomes possible if the
 * matrix ever fills. (Spec §12)
 *
 * `treatment` is load-bearing and measured: rugs are introduced by tight
 * knot-texture crops, tapestries by full pictorial scenes. All future
 * product imagery must follow the same rule per material. (Forensics §15)
 */
export type Material = 'rug' | 'silk_rug' | 'silk_tapestry';
export type Tier = 'antique' | 'handwoven' | 'luxury';
export type Treatment = 'texture_crop' | 'full_scene';

export interface Collection {
  slug: string;
  title: string;
  material: Material;
  tier: Tier;
  treatment: Treatment;
  /** Source asset. Filenames in the delivered ZIP do NOT describe content;
   *  these were verified by cross-correlation against the composite. */
  asset: string;
  sort: number;
}

export const collections: Collection[] = [
  { slug: 'antique-rugs',            title: 'Antique Rugs',            material: 'rug',           tier: 'antique',   treatment: 'texture_crop', asset: '09_antique_rug',         sort: 1 },
  { slug: 'handwoven-silk-rugs',     title: 'Handwoven Silk Rugs',     material: 'silk_rug',      tier: 'handwoven', treatment: 'texture_crop', asset: '10_handwoven_silk_rug',  sort: 2 },
  { slug: 'luxury-rugs',             title: 'Luxury Rugs',             material: 'rug',           tier: 'luxury',    treatment: 'texture_crop', asset: '11_luxury_rug',          sort: 3 },
  { slug: 'antique-silk-tapestries', title: 'Antique Silk Tapestries', material: 'silk_tapestry', tier: 'antique',   treatment: 'full_scene',   asset: '12_antique_silk_tapestry', sort: 4 },
  { slug: 'luxury-silk-tapestries',  title: 'Luxury Silk Tapestries',  material: 'silk_tapestry', tier: 'luxury',    treatment: 'full_scene',   asset: '13_luxury_silk_tapestry',  sort: 5 },
];

/**
 * The four matrix cells with no title and no asset. Kept explicit so the gap
 * stays visible rather than being quietly forgotten. (Spec §12)
 */
export const collectionsMissing = [
  { material: 'rug' as Material,           tier: 'handwoven' as Tier },
  { material: 'silk_rug' as Material,      tier: 'antique' as Tier },
  { material: 'silk_rug' as Material,      tier: 'luxury' as Tier },
  { material: 'silk_tapestry' as Material, tier: 'handwoven' as Tier },
];

/** Trust bar — four columns, measured from the composite. (Forensics §01) */
export const trust = [
  { heading: 'Authentic & Original',    body: 'Carefully sourced,\n100% authentic pieces' },
  { heading: 'Handwoven Excellence',    body: 'Masterpieces woven\nby skilled artisans' },
  { heading: 'Timeless Luxury',         body: 'Rugs & tapestries that enrich\nyour life and space' },
  { heading: 'Exclusive Collections',   body: 'Rare pieces for\ndiscerning collectors' },
] as const;

/** Inventory modes — hybrid model, three modes. (Spec §13) */
export type InventoryMode = 'one_of_one' | 'stocked' | 'made_to_order';

export type Availability =
  | 'InStock'
  | 'Reserved'
  | 'LimitedAvailability'
  | 'OutOfStock'
  | 'SoldOut'
  | 'PreOrder';

/** MISSING / launch inputs — deliberately null, never invented. */
export const launchInputs = {
  domain: null,           // §22 class C
  currencies: null,       // §13 class C
  paymentProvider: null,  // §13 class B
  reservationTtlMinutes: null, // §13 class B — a business policy
  lowStockThreshold: null,     // §13 class B
} as const;
