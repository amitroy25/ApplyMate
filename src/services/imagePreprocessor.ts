/**
 * Preprocesses an image to dramatically improve OCR accuracy on mobile screenshots.
 * Grayscale conversion, contrast enhancement, and optimal downscaling.
 */
export async function preprocessImageForOcr(imageSource: File | Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale large phone screenshots (e.g., 1440x3200) to optimal OCR dimensions
        const MAX_DIMENSION = 1800;
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
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        // Draw original scaled image
        ctx.drawImage(img, 0, 0, width, height);

        // Get pixel data for contrast & grayscale optimization
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Contrast adjustment factor (+25%)
        const contrast = 30;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          // Standard luminance grayscale
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Apply contrast
          const contrasted = factor * (gray - 128) + 128;
          const finalVal = Math.min(255, Math.max(0, contrasted));

          data[i] = finalVal;     // R
          data[i + 1] = finalVal; // G
          data[i + 2] = finalVal; // B
          // Alpha remains untouched
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        // Fallback to original
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}
