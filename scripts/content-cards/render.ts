/**
 * SVG → PNG con @resvg/resvg-js. Carga solo nuestras fuentes (sin fuentes del
 * sistema, para que el render sea idéntico en cualquier máquina/CI).
 */
import { Resvg } from "@resvg/resvg-js";
import { CANVAS, FONTS } from "./brand";

export function svgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CANVAS },
    background: "#faf7f2",
    font: {
      fontFiles: [...FONTS.files],
      loadSystemFonts: false,
      defaultFontFamily: FONTS.sans,
    },
    shapeRendering: 2, // geometricPrecision
    textRendering: 2, // geometricPrecision
    imageRendering: 0, // optimizeQuality
  });
  return resvg.render().asPng();
}
