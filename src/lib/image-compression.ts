import imageCompression from "browser-image-compression";

const COMPRESSIBLE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.has(file.type)) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1, // Target 1MB max file size
      maxWidthOrHeight: undefined, // Keep original resolution
      useWebWorker: true,
      fileType: file.type,
      initialQuality: 0.8, // Start with 80% quality
      alwaysKeepResolution: true, // CRITICAL: preserve exact dimensions
      preserveExif: false, // Strip EXIF to save bytes (we don't need camera metadata for AI analysis)
    });

    // Only return compressed if it's actually smaller
    if (compressed.size < file.size) {
      console.log(
        `[image-compression] ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB (${Math.round((1 - compressed.size / file.size) * 100)}% reduction)`
      );

      // Ensure we return a proper File with the original filename preserved
      if (compressed instanceof File && compressed.name === file.name) {
        return compressed;
      }
      return new File([compressed], file.name, { type: compressed.type });
    }

    console.log(
      `[image-compression] ${file.name}: compression didn't reduce size, using original`
    );
    return file;
  } catch (err) {
    console.error(`[image-compression] Failed to compress ${file.name}:`, err);
    return file; // Fallback to original on error
  }
}
