// Image compression and WebP conversion utilities
// All processing happens client-side via Canvas API

export interface ProcessedImage {
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
}

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.8;

function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

export async function processImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize to max 1200px on longest side
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const useWebP = supportsWebP();
        const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
        const quality = useWebP ? WEBP_QUALITY : JPEG_QUALITY;
        const format = useWebP ? 'webp' : 'jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image conversion failed'));
              return;
            }
            const dataUrl = canvas.toDataURL(mimeType, quality);
            resolve({
              dataUrl,
              blob,
              originalSize: file.size,
              compressedSize: blob.size,
              width,
              height,
              format,
            });
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function processImages(files: File[]): Promise<ProcessedImage[]> {
  const results = await Promise.all(files.map(processImage));
  return results;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
