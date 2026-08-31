/** Brand flyer template (QR slot on the right is replaced per station). */
export const WALLPAPAPER_TEMPLATE_SRC = "/station-wallpaper-template.png";

/** Export width; height follows the template aspect (~3:2). */
export const WALLPAPAPER_WIDTH = 1920;

/**
 * Placement on the 1024×682 template (fractions of width / height).
 * Tuned to the teal QR frame on the right panel.
 */
const QR_SLOT = {
  /** Cover plate that hides the printed placeholder QR (includes teal frame). */
  coverX: 690 / 1024,
  coverY: 104 / 682,
  coverW: 280 / 1024,
  coverH: 283 / 682,
  /** Inner square where the live station QR is drawn. */
  x: 700 / 1024,
  y: 119 / 682,
  size: 256 / 1024,
  cornerRadius: 18 / 1024,
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export type StationWallpaperInput = {
  qrDataUrl: string;
  stationName: string;
  stationMeta?: string;
};

/**
 * Builds a high-res wallpaper PNG data URL from the brand template + station QR.
 */
export async function composeStationWallpaper(
  input: StationWallpaperInput
): Promise<string> {
  const [template, qr] = await Promise.all([
    loadImage(WALLPAPAPER_TEMPLATE_SRC),
    loadImage(input.qrDataUrl),
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

  const coverX = QR_SLOT.coverX * width;
  const coverY = QR_SLOT.coverY * height;
  const coverW = QR_SLOT.coverW * width;
  const coverH = QR_SLOT.coverH * height;
  const radius = QR_SLOT.cornerRadius * width;

  // White plate over placeholder QR + frame
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, coverX, coverY, coverW, coverH, radius);
  ctx.fill();

  // Brand teal frame
  ctx.strokeStyle = "#1ecad3";
  ctx.lineWidth = Math.max(6, coverW * 0.045);
  roundRect(ctx, coverX, coverY, coverW, coverH, radius);
  ctx.stroke();

  const qrX = QR_SLOT.x * width;
  const qrY = QR_SLOT.y * height;
  const qrSize = QR_SLOT.size * width;
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  // Station badge above the QR frame (under “Scan to view”)
  const label = input.stationName.toUpperCase();
  const fontSize = Math.round(width * 0.016);
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textW = ctx.measureText(label).width;
  const badgeW = Math.min(coverW * 0.92, textW + width * 0.024);
  const badgeH = fontSize * 1.45;
  const badgeX = coverX + coverW / 2 - badgeW / 2;
  const badgeY = coverY - badgeH - height * 0.008;

  ctx.fillStyle = "#0a0a0a";
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH * 0.2);
  ctx.fill();
  ctx.fillStyle = "#1ecad3";
  ctx.fillText(label, coverX + coverW / 2, badgeY + badgeH / 2);

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
