import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSharedImage } from '../src/services/sharedImageService';

test('validateSharedImage accepts supported formats up to 15 MB', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
    assert.doesNotThrow(() => validateSharedImage({ type, size: 15 * 1024 * 1024 }));
  }
});

test('validateSharedImage rejects unsupported formats', () => {
  assert.throws(
    () => validateSharedImage({ type: 'image/gif', size: 100 }),
    /Choose a PNG, JPEG, or WebP screenshot/
  );
});

test('validateSharedImage rejects empty and oversized images', () => {
  assert.throws(
    () => validateSharedImage({ type: 'image/png', size: 0 }),
    /smaller than 15 MB/
  );
  assert.throws(
    () => validateSharedImage({ type: 'image/png', size: 15 * 1024 * 1024 + 1 }),
    /smaller than 15 MB/
  );
});
