"use client";

// Cheap, low-risk preprocessing before OCR: grayscale + a histogram
// contrast stretch. Real phone photos of glossy/plastic packaging often
// come out low-contrast or unevenly lit (dim light, glare), which hurts
// Tesseract's raw character recognition far more than which line it
// picks afterward. A stretch just spreads whatever range of brightness
// the photo actually used back out to the full 0-255 span — unlike a
// hard black/white threshold, it can't wash out real text under glare,
// it can only ever help or do nothing.
export async function preprocessForOcr(file: File): Promise<File | Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    const gray = new Float32Array(data.length / 4);
    let min = 255;
    let max = 0;
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[j] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }

    const range = max - min || 1;
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const stretched = ((gray[j] - min) / range) * 255;
      data[i] = data[i + 1] = data[i + 2] = stretched;
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return blob ?? file;
  } catch {
    // Preprocessing is a best-effort improvement — if the browser can't
    // do it (or anything above throws), just OCR the original photo.
    return file;
  }
}
