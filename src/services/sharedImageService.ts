const SHARE_DATABASE = 'applymate-shares';
const SHARE_STORE = 'images';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

interface StoredSharedImage {
  id: string;
  file: Blob;
  fileName: string;
  type: string;
  size: number;
  receivedAt: number;
}

export function validateSharedImage(file: Pick<File, 'type' | 'size'>): void {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error('Choose a PNG, JPEG, or WebP screenshot.');
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('The screenshot must be smaller than 15 MB.');
  }
}

function openShareDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('This browser does not support receiving shared screenshots.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SHARE_STORE)) {
        request.result.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open screenshot storage.'));
  });
}

export async function loadSharedImage(id: string): Promise<File | null> {
  const database = await openShareDatabase();

  try {
    const record = await new Promise<StoredSharedImage | undefined>((resolve, reject) => {
      const transaction = database.transaction(SHARE_STORE, 'readonly');
      const request = transaction.objectStore(SHARE_STORE).get(id);
      request.onsuccess = () => resolve(request.result as StoredSharedImage | undefined);
      request.onerror = () => reject(request.error || new Error('Could not read the shared screenshot.'));
    });

    if (!record) return null;
    if (Date.now() - record.receivedAt > 24 * 60 * 60 * 1000) {
      await deleteSharedImage(id);
      return null;
    }

    const file = new File([record.file], record.fileName, {
      type: record.type,
      lastModified: record.receivedAt
    });
    validateSharedImage(file);
    return file;
  } finally {
    database.close();
  }
}

export async function deleteSharedImage(id: string): Promise<void> {
  const database = await openShareDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SHARE_STORE, 'readwrite');
      transaction.objectStore(SHARE_STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not remove the shared screenshot.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not remove the shared screenshot.'));
    });
  } finally {
    database.close();
  }
}
