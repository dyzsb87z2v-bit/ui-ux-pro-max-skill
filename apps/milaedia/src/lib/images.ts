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
