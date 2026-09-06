/** Brand flyer template (menu + payment QR slots on the right). */
export const WALLPAPAPER_TEMPLATE_SRC = "/station-wallpaper-template.png";

/** Export width; height follows the template aspect (~3:2). */
export const WALLPAPAPER_WIDTH = 1920;

/**
 * Placement on the 1024×682 dual-QR template (fractions of width / height).
 * Measured from the SCAN FOR MENU / SCAN FOR PAYMENT white cards.
 */
const MENU_QR = {
  x: 558 / 1024,
  y: 174 / 682,
  size: 178 / 1024,
};

const PAYMENT_QR = {
  x: 804 / 1024,
  y: 172 / 682,
  size: 182 / 1024,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement,
  slot: { x: number; y: number; size: number },
  width: number,
  height: number
) {
  const x = slot.x * width;
  const y = slot.y * height;
  const size = slot.size * width;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
  ctx.drawImage(qr, x, y, size, size);
}

export type StationWallpaperInput = {
  menuQrDataUrl: string;
  paymentQrDataUrl: string;
  stationName: string;
};

/**
 * Builds a high-res wallpaper PNG: station menu QR + PhonePe merchant payment QR.
 */
export async function composeStationWallpaper(
  input: StationWallpaperInput
): Promise<string> {
  const [template, menuQr, paymentQr] = await Promise.all([
    loadImage(WALLPAPAPER_TEMPLATE_SRC),
    loadImage(input.menuQrDataUrl),
    loadImage(input.paymentQrDataUrl),
  ]);

  const scale = WALLPAPAPER_WIDTH / template.naturalWidth;
  const width = WALLPAPAPER_WIDTH;
  const height = Math.round(template.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(template, 0, 0, width, height);
  drawQr(ctx, menuQr, MENU_QR, width, height);
  drawQr(ctx, paymentQr, PAYMENT_QR, width, height);

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
