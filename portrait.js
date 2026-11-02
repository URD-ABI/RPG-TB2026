export async function cropPortrait(file, square) {
  if (!file || !file.type?.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    throw new Error('Choisissez une image de moins de 5 Mo.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const maxSize = Math.min(bitmap.width, bitmap.height);
    const size = Math.max(1, Math.min(Number(square?.size) || maxSize, maxSize));
    const x = Math.max(0, Math.min(Number(square?.x ?? (bitmap.width - size) / 2), bitmap.width - size));
    const y = Math.max(0, Math.min(Number(square?.y ?? (bitmap.height - size) / 2), bitmap.height - size));
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Recadrage indisponible sur cet appareil.');
    context.drawImage(bitmap, x, y, size, size, 0, 0, 256, 256);
    return canvas.toDataURL('image/png');
  } finally {
    bitmap.close();
  }
}
