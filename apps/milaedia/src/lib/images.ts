/** Central image registry. Swap these for real product photography. */
import antiqueRugs from '../assets/collections/antique-rugs.png';
import handwovenSilkRugs from '../assets/collections/handwoven-silk-rugs.png';
import luxuryRugs from '../assets/collections/luxury-rugs.png';
import antiqueSilkTapestries from '../assets/collections/antique-silk-tapestries.png';
import luxurySilkTapestries from '../assets/collections/luxury-silk-tapestries.png';
import weaver from '../assets/scene/workshop-weaver.png';
import berlin from '../assets/scene/about-berlin.png';
import windowTriptych from '../assets/scene/window-triptych.png';
import floorRug from '../assets/atelier/floor-rug.png';
import weaverStill from '../assets/atelier/weaver-still.png';
import rugDetail from '../assets/scene/contact-texture.png';
import lamp from '../assets/objects/lamp.png';
import armchair from '../assets/objects/armchair.png';

export const collectionImages: Record<string, ImageMetadata> = {
  'antique-rugs': antiqueRugs,
  'handwoven-silk-rugs': handwovenSilkRugs,
  'luxury-rugs': luxuryRugs,
  'antique-silk-tapestries': antiqueSilkTapestries,
  'luxury-silk-tapestries': luxurySilkTapestries,
};

export const scene = { weaver, berlin, windowTriptych, floorRug, weaverStill, rugDetail, lamp, armchair };

/**
 * Deterministic focal point for a product's art.
 *
 * The five collection crops are the ONLY rug imagery the references supply
 * (260 x 360 native, title band cropped off -- see PLACEHOLDERS.md). Several
 * pieces therefore share one source, and a fixed `object-position` made two
 * cards in a row render as visually identical tiles.
 *
 * Panning the cover window to a per-product point keeps every piece visibly
 * distinct without upscaling further and without inventing an asset: each
 * card shows a different region of the same verified weave. Replace this
 * whole mechanism with real per-product photography at launch.
 */
export function focal(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  // 22-78% keeps the window inside the crop on both axes.
  const x = 22 + (h % 57);
  const y = 22 + ((h >>> 8) % 57);
  return `${x}% ${y}%`;
}
