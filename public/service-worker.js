const SHARE_DATABASE = 'applymate-shares';
const SHARE_STORE = 'images';
const SHARE_MAX_BYTES = 15 * 1024 * 1024;
const SHARE_MAX_AGE = 24 * 60 * 60 * 1000;
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const sharePath = new URL('share-target', self.registration.scope).pathname;

  if (event.request.method === 'POST' && requestUrl.pathname === sharePath) {
    event.respondWith(receiveSharedImage(event.request));
  }
});

async function receiveSharedImage(request) {
  try {
    const formData = await request.formData();
    const entries = Array.from(formData.entries());
    const imageEntry = entries.find(([name, value]) =>
      name === 'shared_image' && value instanceof Blob && value.type.startsWith('image/')
    ) || entries.find(([, value]) =>
      value instanceof Blob && value.type.startsWith('image/')
    );
    const imageValue = imageEntry?.[1];

    if (!imageValue) return redirectWithError('missing-image');
    const imageType = imageValue.type.toLowerCase() === 'image/jpg'
      ? 'image/jpeg'
      : imageValue.type.toLowerCase();
    if (!SUPPORTED_IMAGE_TYPES.has(imageType)) return redirectWithError('unsupported-image');
    if (imageValue.size === 0 || imageValue.size > SHARE_MAX_BYTES) return redirectWithError('image-too-large');

    const id = crypto.randomUUID();
    const imageName = typeof imageValue.name === 'string' && imageValue.name
      ? imageValue.name
      : `shared-screenshot.${extensionForType(imageType)}`;
    const image = new File([imageValue], imageName, { type: imageType });
    await saveSharedImage({
      id,
      file: image,
      fileName: imageName,
      type: imageType,
      size: image.size,
      receivedAt: Date.now()
    });

    return Response.redirect(`${self.registration.scope}?sharedImage=${encodeURIComponent(id)}`, 303);
  } catch {
    return redirectWithError('share-unavailable');
  }
}

function extensionForType(type) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

function redirectWithError(code) {
  return Response.redirect(`${self.registration.scope}?shareError=${encodeURIComponent(code)}`, 303);
}

function saveSharedImage(image) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(SHARE_DATABASE, 1);

    openRequest.onupgradeneeded = () => {
      if (!openRequest.result.objectStoreNames.contains(SHARE_STORE)) {
        openRequest.result.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      }
    };

    openRequest.onerror = () => reject(openRequest.error || new Error('Could not open screenshot storage.'));
    openRequest.onsuccess = () => {
      const database = openRequest.result;
      const transaction = database.transaction(SHARE_STORE, 'readwrite');
      const store = transaction.objectStore(SHARE_STORE);
      const allRequest = store.getAll();

      allRequest.onsuccess = () => {
        for (const existing of allRequest.result) {
          if (Date.now() - existing.receivedAt > SHARE_MAX_AGE) store.delete(existing.id);
        }
        store.put(image);
      };

      allRequest.onerror = () => transaction.abort();
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error('Could not save the shared screenshot.'));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error('Could not save the shared screenshot.'));
      };
    };
  });
}
